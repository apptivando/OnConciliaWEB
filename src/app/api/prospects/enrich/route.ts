import { createClient } from '@supabase/supabase-js'
import { enrichBatch } from '@/lib/prospects/enrich'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const resultado = await enrichBatch(supabase, { limit: 12 })
    return Response.json({
      procesados: resultado.procesados,
      con_email: resultado.encontrados.email,
      con_whatsapp: resultado.encontrados.whatsapp,
      con_telefono: resultado.encontrados.telefono,
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error desconocido' }, { status: 500 })
  }
}
