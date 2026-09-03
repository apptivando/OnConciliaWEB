// Cron que corre cada mañana: busca comercios en una ciudad + rubro distinto por día.
// Schedule en vercel.json: 0 11 * * 1-5 (8am AR = 11am UTC, lunes a viernes)

import { createClient } from '@supabase/supabase-js'
import { buscarProspectos } from '@/lib/prospects/buscar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CIUDADES = [
  'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata',
  'Salta', 'Santa Fe', 'San Juan', 'Resistencia', 'Santiago del Estero',
  'Corrientes', 'Posadas', 'Neuquén', 'Bahía Blanca', 'Paraná', 'Formosa',
  'San Luis', 'Río Cuarto', 'Comodoro Rivadavia', 'San Salvador de Jujuy',
  'San Rafael', 'Concordia', 'General Roca', 'Tandil', 'Zárate',
  'Villa María', 'Pergamino', 'San Nicolás de los Arroyos',
  'San Fernando del Valle de Catamarca',
]

// Rubros de comercios y pymes con volumen bancario — mismo criterio que
// INCLUDED_TYPES en src/lib/prospects/config.ts, pero en texto libre para
// que la búsqueda de Places lo entienda mejor que un tipo de la Tabla A.
const RUBROS = [
  'ferretería', 'supermercado', 'farmacia', 'corralón', 'indumentaria',
  'restaurante', 'estación de servicio', 'concesionaria de autos',
]

const COMBOS = CIUDADES.flatMap((ciudad) => RUBROS.map((rubro) => ({ ciudad, rubro })))

export async function GET(req: Request) {
  const secret = req.headers.get('x-vercel-cron') ?? new URL(req.url).searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startOfYear = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86400000)
  const target = COMBOS[dayOfYear % COMBOS.length]

  try {
    const resultado = await buscarProspectos(supabase, { rubro: target.rubro, ciudad: target.ciudad })
    return Response.json({
      ciudad: target.ciudad,
      rubro: target.rubro,
      fecha: new Date().toISOString().split('T')[0],
      prospectos_guardados: resultado.nuevos,
      fusionados: resultado.fusionados,
      resumen: resultado.resumen,
    })
  } catch (err) {
    return Response.json(
      { ciudad: target.ciudad, rubro: target.rubro, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
