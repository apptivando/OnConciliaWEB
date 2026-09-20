// Cron de búsqueda: agota una ciudad rubro por rubro antes de pasar a la
// siguiente, en vez de rotar todos los días por un combo ciudad×rubro
// distinto sin terminar ninguna.
//
// **El avance no se guarda en ninguna tabla nueva: se deduce.** Los rubros ya
// buscados de una ciudad salen de `prospect_searches` (que ya registraba
// ciudad y rubro de cada búsqueda, para control de gasto de Places) y los
// correos acumulados salen de contar `prospectos`. Una tabla de progreso
// aparte sería un segundo registro de la misma verdad, y el día que se
// desincronice —una búsqueda a mano desde /prospectos, una fila borrada— el
// motor se saltea ciudades sin que nadie se entere.
//
// Schedule real en .github/workflows/prospeccion.yml; vercel.json queda como
// respaldo del cron nativo (una corrida diaria).

import { createClient } from '@supabase/supabase-js'
import { buscarProspectos } from '@/lib/prospects/buscar'
import { CIUDADES, RUBROS } from '@/lib/prospects/ciudades'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Correos acumulados a partir de los cuales una ciudad se considera cubierta. */
const META = Number(process.env.BUSQUEDA_META_CORREOS) || 35

// Sin `export`: Next.js sólo admite un puñado de nombres exportados en un
// archivo de ruta (los verbos HTTP, `maxDuration`, `runtime`…) y falla el
// build con cualquier otro.
interface Objetivo {
  ciudad: string
  rubro: string
  indice: number
  correos: number
  rubrosBuscados: number
}

/** Cuántos prospectos con correo dio una ciudad. Es la medida de "cubierta". */
async function correosDe(ciudad: string): Promise<number> {
  const { count } = await supabase
    .from('prospectos')
    .select('id', { count: 'exact', head: true })
    .eq('localidad', ciudad)
    .not('email', 'is', null)
    .neq('estado', 'descartado')
  return count ?? 0
}

/**
 * Primera ciudad de la lista que todavía no está cubierta, con el primer
 * rubro que le falta. Recorre en orden: capitales primero, después el ranking
 * por peso económico.
 */
async function proximoObjetivo(): Promise<Objetivo | null> {
  // Una sola consulta para todo el historial de búsquedas. Son decenas de
  // filas, no vale la pena una por ciudad.
  const { data: busquedas } = await supabase
    .from('prospect_searches')
    .select('ciudad, rubro')
    .not('ciudad', 'is', null)

  const buscadosPorCiudad = new Map<string, Set<string>>()
  for (const b of (busquedas ?? []) as Array<{ ciudad: string; rubro: string | null }>) {
    if (!b.rubro) continue
    const set = buscadosPorCiudad.get(b.ciudad) ?? new Set<string>()
    set.add(b.rubro)
    buscadosPorCiudad.set(b.ciudad, set)
  }

  for (let i = 0; i < CIUDADES.length; i++) {
    const { ciudad } = CIUDADES[i]
    const buscados = buscadosPorCiudad.get(ciudad) ?? new Set<string>()
    const rubro = RUBROS.find((r) => !buscados.has(r))

    // Sin rubros por buscar, la ciudad está agotada: dio lo que tenía para
    // dar. No hace falta contarle los correos para saberlo.
    if (!rubro) continue

    const correos = await correosDe(ciudad)
    if (correos >= META) continue

    return { ciudad, rubro, indice: i, correos, rubrosBuscados: buscados.size }
  }

  return null
}

export async function GET(req: Request) {
  const esVercelCron = Boolean(req.headers.get('x-vercel-cron'))
  const secret = new URL(req.url).searchParams.get('secret')
  // Sin `&&` contra la variable: si CRON_SECRET no está seteada, un
  // `if (process.env.CRON_SECRET && ...)` deja el endpoint abierto justo
  // cuando falta la protección. Era el agujero que tenía este archivo.
  if (!esVercelCron && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const objetivo = await proximoObjetivo()
  if (!objetivo) {
    return Response.json({
      fecha: new Date().toISOString().split('T')[0],
      mensaje: 'Todas las ciudades de la lista están cubiertas o agotadas.',
      ciudades_pendientes: 0,
    })
  }

  const { ciudad, rubro, indice, rubrosBuscados } = objetivo

  try {
    const resultado = await buscarProspectos(supabase, { rubro, ciudad })

    // Se recuentan después de la búsqueda, pero los correos nuevos todavía no
    // están: el enriquecimiento corre aparte y es el que completa el email.
    // Este número es el de la corrida anterior más lo que haya enriquecido el
    // worker mientras tanto, y así se informa.
    const correosAhora = await correosDe(ciudad)
    const rubrosRestantes = RUBROS.length - (rubrosBuscados + 1)

    return Response.json({
      fecha: new Date().toISOString().split('T')[0],
      ciudad,
      rubro,
      nuevos: resultado.nuevos,
      fusionados: resultado.fusionados,
      correos: correosAhora,
      meta: META,
      rubros_restantes_en_ciudad: rubrosRestantes,
      ciudad_cubierta: correosAhora >= META || rubrosRestantes === 0,
      ciudades_pendientes: CIUDADES.length - indice - 1,
      resumen: resultado.resumen,
    })
  } catch (err) {
    return Response.json(
      { ciudad, rubro, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
