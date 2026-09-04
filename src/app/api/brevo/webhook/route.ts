import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Eventos de Brevo. Se normaliza el string (minúsculas, sin espacios ni
 * guiones bajos) porque la documentación de Brevo no es consistente entre
 * sí sobre el formato exacto ("hardBounce" en la referencia de la API,
 * "hard bounce" en la guía) — así matchea cualquiera de las dos variantes.
 */
function normalizar(event: string): string {
  return event.toLowerCase().replace(/[\s_-]/g, '')
}

const EVENTOS_BAJA: Record<string, { estado: string; motivo: string }> = {
  hardbounce: { estado: 'rebotado', motivo: 'hard_bounce' },
  invalid: { estado: 'rebotado', motivo: 'invalid_email' },
  spam: { estado: 'spam', motivo: 'spam' },
  unsubscribed: { estado: 'baja', motivo: 'unsubscribed' },
}

interface BrevoEvent {
  event?: string
  email?: string
  ['message-id']?: string
  date?: string
}

async function procesarEvento(payload: BrevoEvent) {
  const event = payload.event ? normalizar(payload.event) : ''
  const email = payload.email
  if (!event || !email) return

  const { data: p } = await supabase
    .from('prospectos')
    .select('id, estado')
    .eq('email', email)
    .maybeSingle()
  if (!p) return

  // Se registra la interacción para cualquier evento reconocido — abierto,
  // clickeado, rebotado, spam o baja — todos son señal útil en la ficha.
  await supabase.from('interacciones').insert({
    prospecto_id: p.id,
    tipo: 'nota',
    contenido: `Brevo: ${payload.event}${payload['message-id'] ? ` (${payload['message-id']})` : ''}`,
    canal: 'email',
  })

  const baja = EVENTOS_BAJA[event]
  if (!baja) return // opened/clicked/delivered: solo queda la interacción de arriba

  await supabase
    .from('prospectos')
    .update({
      email_estado: baja.estado,
      baja_en: new Date().toISOString(),
      baja_motivo: baja.motivo,
    })
    .eq('id', p.id)
}

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (process.env.BREVO_WEBHOOK_SECRET && secret !== process.env.BREVO_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  // Brevo manda un objeto por request según su documentación, pero se
  // acepta también un array por las dudas — no cuesta nada cubrir el caso.
  const eventos: BrevoEvent[] = Array.isArray(body) ? body : [body]

  for (const evento of eventos) {
    try {
      await procesarEvento(evento)
    } catch (err) {
      console.error('Brevo webhook', err)
    }
  }

  return Response.json({ ok: true })
}
