import { createClient } from '@supabase/supabase-js'
import { buscarProspectos } from '@/lib/prospects/buscar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const rubro = typeof body.rubro === 'string' ? body.rubro.trim() : ''
  const ciudad = typeof body.ciudad === 'string' ? body.ciudad.trim() : ''
  const tipo = typeof body.tipo === 'string' && body.tipo ? body.tipo : undefined
  const cantidad = typeof body.cantidad === 'number' ? body.cantidad : undefined

  if (!rubro || !ciudad) {
    return Response.json({ error: 'Faltan rubro y/o ciudad' }, { status: 400 })
  }

  try {
    const resultado = await buscarProspectos(supabase, { rubro, ciudad, tipo, cantidad })
    return Response.json({
      prospectos_guardados: resultado.nuevos,
      fusionados: resultado.fusionados,
      descartados: resultado.descartados,
      resumen: resultado.resumen,
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error desconocido' }, { status: 500 })
  }
}
