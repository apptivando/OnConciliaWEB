import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { quitarDeLista } from '@/lib/brevo'
import { toE164Ar } from '@/lib/phone'
import { registrableDomain } from '@/lib/prospects/urls'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Webhook de Cal.com. Lo único que nos importa es saber **quién agendó**.
 *
 * La secuencia opt-in son tres recordatorios de agendar la reunión. Sin este
 * webhook no hay forma de distinguir al que dejó sus datos y agendó del que
 * dejó sus datos y no: los dos entran igual a la lista, y al primero le
 * llegarían tres correos pidiéndole que haga algo que ya hizo.
 *
 * Marca el lead, marca el prospecto si el correo coincide con uno del carril
 * frío, y saca el contacto de la lista de Brevo.
 *
 * Configuración del lado de Cal.com (tarea manual, ver plan Etapa 1.5):
 * Settings → Webhooks → Add, evento `BOOKING_CREATED`, URL
 * `https://onconcilia.com/api/cal/webhook`, con un secret que se carga acá
 * como `CAL_WEBHOOK_SECRET`.
 */
export async function POST(req: Request) {
  const secret = process.env.CAL_WEBHOOK_SECRET
  if (!secret) {
    // Sin secreto configurado se rechaza, no se deja pasar. Es el mismo
    // criterio que se corrigió en los crons: un `if (secret && ...)` deja el
    // endpoint abierto justo cuando falta la variable.
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
      attendees?: Array<{ email?: string; name?: string }>
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

  const email = (
    evento.payload?.attendees?.[0]?.email ??
    evento.payload?.responses?.email?.value ??
    ''
  )
    .toLowerCase()
    .trim()

  if (!email) {
    // Una reserva sin correo no es un error del webhook, pero tampoco hay
    // nada que hacer con ella. Se responde 200 para que Cal.com no reintente.
    return Response.json({ ok: true, sin_email: true })
  }

  const cuando = evento.payload?.startTime ?? new Date().toISOString()

  const { data: lead } = await supabase
    .from('leads')
    .update({ reunion_agendada_en: cuando, estado: 'reunion_agendada' })
    .eq('email', email)
    .select('id, nombre, telefono, nota')
    .maybeSingle()

  // El mismo correo puede estar del otro lado: un prospecto del carril frío
  // que agendó desde /coordinar/[id]. Se busca sin filtrar por estado —
  // incluso uno descartado es un prospecto existente, y crear otro al lado
  // sería duplicarlo.
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
        .update({ estado: 'demo_agendada', proxima_accion: 'Reunión de 15 minutos agendada' })
        .eq('id', existente.id)
      await supabase.from('interacciones').insert({
        prospecto_id: existente.id,
        tipo: 'cambio_estado',
        estado_nuevo: 'demo_agendada',
        canal: 'cal.com',
      })
    }
  } else if (lead) {
    // Agendar la reunión es lo que convierte a un lead en prospecto: recién
    // ahí hay con quién hablar y un embudo que seguir (demo agendada → demo
    // realizada → beta activo → feedback). La tabla `leads` no tiene estados
    // ni historial, y los 20 betas hay que seguirlos en algún lado.
    const nombre = (lead.nombre as string | null)?.trim() || email.split('@')[0]
    const fila = {
      nombre,
      empresa: empresaDesde(email, nombre),
      sector: 'pyme', // No lo pregunta la landing. Se confirma en la reunión.
      email,
      telefono: lead.telefono ? toE164Ar(lead.telefono as string)?.e164 ?? (lead.telefono as string) : null,
      canal: 'otro',
      origen: 'landing',
      estado: 'demo_agendada',
      proxima_accion: 'Reunión de 15 minutos agendada',
      fecha_primer_contacto: new Date().toISOString().split('T')[0],
      notas: 'Vino de la landing y agendó la reunión. Falta confirmar empresa y rubro.',
    }
    const { data: nuevo } = await supabase.from('prospectos').insert(fila).select('id').maybeSingle()
    if (nuevo?.id) {
      prospectoId = nuevo.id
      creado = true
      if (lead.nota) {
        await supabase.from('interacciones').insert({
          prospecto_id: nuevo.id,
          tipo: 'nota',
          canal: 'formulario',
          contenido: `Con qué bancos trabaja: ${lead.nota}`,
        })
      }
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

  return Response.json({ ok: true, lead: Boolean(lead), prospecto: prospectoId, creado })
}

/**
 * `empresa` es `not null` y la landing no la pregunta — sumarle un campo más
 * al formulario que lleva a la reunión cuesta conversiones.
 *
 * El dominio del correo la resuelve gratis cuando es corporativo
 * (`juan@ferreteriasur.com.ar` → `ferreteriasur.com.ar`). Con un correo de
 * Gmail no hay nada que deducir, y poner el nombre de la persona en la
 * columna "empresa" del CRM confunde más de lo que ayuda: se deja explícito
 * que falta completarlo.
 */
const CORREOS_PERSONALES = new Set([
  'gmail.com', 'hotmail.com', 'hotmail.com.ar', 'outlook.com', 'outlook.com.ar',
  'yahoo.com', 'yahoo.com.ar', 'live.com', 'live.com.ar', 'icloud.com', 'me.com',
  'protonmail.com', 'proton.me', 'fibertel.com.ar', 'speedy.com.ar',
  'arnet.com.ar', 'ciudad.com.ar',
])

function empresaDesde(email: string, nombre: string): string {
  const dominio = email.split('@')[1]?.toLowerCase() ?? ''
  if (!dominio || CORREOS_PERSONALES.has(dominio)) return `(completar) ${nombre}`
  return registrableDomain(dominio) || `(completar) ${nombre}`
}
