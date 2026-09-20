// Cron que corre cada mañana: agota una ciudad rubro por rubro antes de
// pasar a la siguiente (ver `prospect_ciudades`), en vez de rotar todos los
// días por un combo ciudad×rubro distinto sin terminar ninguna.
// Schedule real en .github/workflows/prospeccion.yml — vercel.json solo
// queda como respaldo del cron nativo de Vercel (una corrida diaria).

import { createClient } from '@supabase/supabase-js'
import { buscarProspectos } from '@/lib/prospects/buscar'
import { RUBROS } from '@/lib/prospects/ciudades'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Correos acumulados a partir de los cuales una ciudad se considera cubierta. */
const META = Number(process.env.BUSQUEDA_META_CORREOS) || 35

interface CiudadRow {
  ciudad: string
  rubros_buscados: string[]
  correos: number
}

/** Trae la primera ciudad abierta con al menos un rubro sin buscar, cerrando de paso las que ya agotaron RUBROS. */
async function proximaCiudadConRubro(): Promise<{ ciudad: CiudadRow; rubro: string } | null> {
  const { data: abiertas } = await supabase
    .from('prospect_ciudades')
    .select('ciudad, rubros_buscados, correos')
    .eq('cerrada', false)
    .order('orden', { ascending: true })

  for (const fila of (abiertas ?? []) as CiudadRow[]) {
    const rubro = RUBROS.find((r) => !fila.rubros_buscados.includes(r))
    if (rubro) return { ciudad: fila, rubro }

    // Todos los rubros ya se buscaron pero por algún motivo no se cerró antes.
    await supabase
      .from('prospect_ciudades')
      .update({ cerrada: true, cerrada_motivo: 'sin rubros', actualizada_en: new Date().toISOString() })
      .eq('ciudad', fila.ciudad)
  }
  return null
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-vercel-cron') ?? new URL(req.url).searchParams.get('secret')
  // Sin `&&`: si CRON_SECRET no está seteada el endpoint quedaba abierto.
  if (secret !== process.env.CRON_SECRET && !req.headers.get('x-vercel-cron')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const proximo = await proximaCiudadConRubro()
  if (!proximo) {
    return Response.json({
      fecha: new Date().toISOString().split('T')[0],
      mensaje: 'No quedan ciudades abiertas para prospectar.',
      ciudades_restantes: 0,
    })
  }

  const { ciudad, rubro } = proximo

  try {
    const resultado = await buscarProspectos(supabase, { rubro, ciudad: ciudad.ciudad })

    const rubrosBuscados = [...ciudad.rubros_buscados, rubro]

    const { count: correos } = await supabase
      .from('prospectos')
      .select('id', { count: 'exact', head: true })
      .eq('localidad', ciudad.ciudad)
      .not('email', 'is', null)
      .neq('estado', 'descartado')

    const correosAcumulados = correos ?? 0
    const alcanzoMeta = correosAcumulados >= META
    const agotoRubros = rubrosBuscados.length >= RUBROS.length
    const cierra = alcanzoMeta || agotoRubros

    await supabase
      .from('prospect_ciudades')
      .update({
        rubros_buscados: rubrosBuscados,
        correos: correosAcumulados,
        cerrada: cierra,
        cerrada_motivo: cierra ? (alcanzoMeta ? 'meta' : 'sin rubros') : null,
        actualizada_en: new Date().toISOString(),
      })
      .eq('ciudad', ciudad.ciudad)

    const { count: restantes } = await supabase
      .from('prospect_ciudades')
      .select('ciudad', { count: 'exact', head: true })
      .eq('cerrada', false)

    return Response.json({
      fecha: new Date().toISOString().split('T')[0],
      ciudad: ciudad.ciudad,
      rubro,
      nuevos: resultado.nuevos,
      fusionados: resultado.fusionados,
      correos: correosAcumulados,
      ciudad_cerrada: cierra,
      ciudades_restantes: restantes ?? 0,
      resumen: resultado.resumen,
    })
  } catch (err) {
    return Response.json(
      { ciudad: ciudad.ciudad, rubro, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
