import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { quitarDeLista } from '@/lib/brevo'

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
    .select('id')
    .maybeSingle()

  // El mismo correo puede estar del otro lado: un prospecto del carril frío
  // que agendó desde /coordinar/[id]. Ahí el estado lo lleva el CRM.
  const { data: prospecto } = await supabase
    .from('prospectos')
    .update({ estado: 'demo_agendada', proxima_accion: 'Reunión de 15 minutos agendada' })
    .eq('email', email)
    .neq('estado', 'descartado')
    .select('id')
    .maybeSingle()

  if (prospecto?.id) {
    await supabase.from('interacciones').insert({
      prospecto_id: prospecto.id,
      tipo: 'cambio_estado',
      estado_nuevo: 'demo_agendada',
      canal: 'cal.com',
    })
  }

  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  if (listId) await quitarDeLista(email, listId)

  return Response.json({ ok: true, lead: Boolean(lead), prospecto: Boolean(prospecto) })
}
