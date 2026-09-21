import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { quitarDeLista } from '@/lib/brevo'
import { filaProspectoLanding } from '@/lib/prospects/desdeLanding'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook de Cal.com. Lo único que nos importa es saber **quién agendó**.
 *
 * Hace dos cosas con ese dato. La primera: pasar el prospecto a
 * `demo_agendada`, que es el estado desde el que se trabaja la beta. La
 * segunda, y sin ella la primera no alcanza: sacar el contacto de la lista de
 * Brevo. La secuencia opt-in son tres recordatorios de agendar, y al que ya
 * agendó hay que dejar de mandárselos — es la forma más rápida de que se dé
 * de baja o nos marque como spam.
 *
 * Configuración del lado de Cal.com: Settings → Webhooks → Add, evento
 * `BOOKING_CREATED`, URL `https://onconcilia.com/api/cal/webhook`, con un
 * secreto que se carga acá como `CAL_WEBHOOK_SECRET`.
 */
export async function POST(req: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) {
    // Sin secreto configurado se rechaza, no se deja pasar. Es el mismo
    // criterio que se corrigió en los crons: un `if (secret && ...)` deja el
    // endpoint abierto justo cuando falta la protección.
    return Response.json({ error: 'Webhook sin configurar' }, { status: 503 })
  }

  const raw = await req.text()
  const firma = req.headers.get('x-cal-signature-256') ?? ''
  const esperada = crypto.createHmac('sha256', secret).update(raw).digest('hex')

  // timingSafeEqual tira si los largos difieren, que es un caso normal acá
  // (header ausente o basura), no una excepción.
  const ok =
    firma.length === esperada.length &&
    crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))
  if (!ok) return Response.json({ error: 'Firma inválida' }, { status: 401 })

  let evento: {
    triggerEvent?: string
    payload?: {
      startTime?: string
      attendees?: Array<{ email?: string; name?: string; phoneNumber?: string }>
      responses?: { email?: { value?: string } }
    }
  }
  try {
    evento = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (evento.triggerEvent !== 'BOOKING_CREATED') {
    return Response.json({ ok: true, ignorado: evento.triggerEvent ?? null })
  }

  const asistente = evento.payload?.attendees?.[0]
  const email = (asistente?.email ?? evento.payload?.responses?.email?.value ?? '')
    .toLowerCase()
    .trim()

  if (!email) {
    // Una reserva sin correo no es un error del webhook, pero tampoco hay
    // nada que hacer con ella. Se responde 200 para que Cal.com no reintente.
    return Response.json({ ok: true, sin_email: true })
  }

  const cuando = evento.payload?.startTime ?? new Date().toISOString()

  // Se busca sin filtrar por estado: incluso uno descartado es un prospecto
  // existente, y crear otro al lado sería duplicarlo.
  const { data: existente } = await supabase
    .from('prospectos')
    .select('id, estado')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  let prospectoId: string | null = existente?.id ?? null
  let creado = false

  if (existente) {
    if (existente.estado !== 'descartado') {
      await supabase
        .from('prospectos')
        .update({
          estado: 'demo_agendada',
          proxima_accion: `Reunión de 15 minutos — ${cuando.slice(0, 16).replace('T', ' ')}`,
          fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
        })
        .eq('id', existente.id)
      await supabase.from('interacciones').insert({
        prospecto_id: existente.id,
        tipo: 'cambio_estado',
        estado_anterior: existente.estado,
        estado_nuevo: 'demo_agendada',
        canal: 'cal.com',
      })
    }
  } else {
    // El camino normal ya dejó el prospecto creado al completar el formulario.
    // Se llega acá cuando alguien reserva directo desde el link de Cal.com sin
    // pasar por la landing — un reenvío del link, por ejemplo. Vale la pena
    // registrarlo igual: agendó una reunión, es un prospecto.
    const fila = {
      ...filaProspectoLanding({ email, nombre: asistente?.name, telefono: asistente?.phoneNumber }),
      estado: 'demo_agendada',
      proxima_accion: `Reunión de 15 minutos — ${cuando.slice(0, 16).replace('T', ' ')}`,
      notas: 'Reservó directo desde el link de Cal.com, sin pasar por el formulario.',
    }
    const { data: nuevo } = await supabase.from('prospectos').insert(fila).select('id').maybeSingle()
    if (nuevo?.id) {
      prospectoId = nuevo.id
      creado = true
      await supabase.from('interacciones').insert({
        prospecto_id: nuevo.id,
        tipo: 'cambio_estado',
        estado_nuevo: 'demo_agendada',
        canal: 'cal.com',
      })
    }
  }

  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  if (listId) await quitarDeLista(email, listId)

  return Response.json({ ok: true, prospecto: prospectoId, creado })
}
