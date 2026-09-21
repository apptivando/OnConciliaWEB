import { createClient } from '@supabase/supabase-js'
import { CUPO_BETA } from '@/lib/mensajes'
import { enviarCorreoFrio, pasoQueSigue, textoDelPaso } from '@/lib/outreach'
import type { Prospecto } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Envío puntual a un prospecto. La tanda diaria la manda sola
 * `/api/cron/daily-outreach`; esto queda para el caso suelto — adelantarle el
 * correo a alguien que interesa, o reintentar uno que falló.
 *
 * El texto y el paso los decide el servidor, no quien llama: si el cliente
 * pudiera mandar el cuerpo, el asunto A/B/C y el mensaje podrían no
 * corresponderse y el test de asuntos mediría cualquier cosa.
 */
export async function POST(req: Request) {
  const { prospecto_id } = await req.json()
  if (!prospecto_id) return Response.json({ error: 'Falta prospecto_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('prospectos')
    .select('*')
    .eq('id', prospecto_id)
    .single()

  if (error || !data) return Response.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  const p = data as Prospecto

  const paso = await pasoQueSigue(supabase, p.id)
  if (!paso) {
    return Response.json({ error: 'Ya recibió los 3 pasos de la secuencia.' }, { status: 400 })
  }

  const { count: betas } = await supabase
    .from('prospectos')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'beta_activo')

  const mensaje = textoDelPaso(p, paso, (betas ?? 0) >= CUPO_BETA)
  const r = await enviarCorreoFrio(supabase, p, mensaje)

  if (!r.ok) return Response.json({ error: r.error }, { status: r.status ?? 500 })
  return Response.json({ ok: true, paso })
}
