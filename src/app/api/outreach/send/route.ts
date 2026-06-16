import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { prospecto_id, canal, mensaje } = await req.json()

  if (!prospecto_id || !canal || !mensaje) {
    return Response.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { data: p, error: fetchError } = await supabase
    .from('prospectos')
    .select('*')
    .eq('id', prospecto_id)
    .single()

  if (fetchError || !p) {
    return Response.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  }

  if (canal === 'email') {
    if (!p.email) return Response.json({ error: 'Sin email' }, { status: 400 })

    const { error: sendError } = await resend.emails.send({
      from: 'Guillermo de OnConcilia <guillermo@onconcilia.com>',
      to: [p.email],
      subject: 'OnConcilia — Conciliación bancaria automática para tu estudio',
      text: mensaje,
    })

    if (sendError) {
      return Response.json({ error: sendError.message }, { status: 500 })
    }
  }

  // Para LinkedIn, el "envío" es manual — solo registramos
  await supabase
    .from('prospectos')
    .update({
      estado: 'solicitud_enviada',
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
    })
    .eq('id', prospecto_id)

  await supabase.from('interacciones').insert({
    prospecto_id,
    tipo: 'mensaje',
    contenido: mensaje,
    canal,
    estado_anterior: 'por_contactar',
    estado_nuevo: 'solicitud_enviada',
  })

  return Response.json({ ok: true })
}
