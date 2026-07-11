import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, nombre, empresa, sector, cargo } = await req.json()

  if (!email || !nombre || !empresa || !sector) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('prospectos')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return Response.json({ error: 'Ya existe un prospecto con ese email' }, { status: 409 })
  }

  const { error } = await supabase.from('prospectos').insert({
    nombre,
    empresa,
    sector,
    cargo: cargo || null,
    email,
    canal: 'otro',
    notas: 'Calificado desde la landing — completó formulario de solicitud beta',
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
