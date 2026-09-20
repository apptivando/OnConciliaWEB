// Worker de enriquecimiento. Visita el sitio propio de cada prospecto que
// todavía no se enriqueció y completa email / WhatsApp / redes.
//
// Por qué existe como ruta de cron y no solo como el botón de /prospectos:
// el botón corre lotes de 12 a mano y nadie lo apretó desde que se construyó
// — medido el 19/09/2026, los 81 prospectos de búsqueda tenían
// `intentos_enriquecimiento = 0` y un solo email en toda la tabla. El
// enriquecimiento tiene que correr solo, igual que la búsqueda.
//
// Corre en tandas con presupuesto de tiempo: `enrichProspecto` se toma hasta
// 20s por sitio, así que un lote grande se pasaría del maxDuration. El bucle
// corta por reloj, no por cantidad, y lo que queda pendiente lo toma la
// corrida siguiente.

import { createClient } from '@supabase/supabase-js'
import { enrichBatch } from '@/lib/prospects/enrich'

export const maxDuration = 60

/** Margen contra el maxDuration: se corta antes de que Vercel corte. */
const PRESUPUESTO_MS = 50_000
/**
 * Prospectos por vuelta. **Dos, no más**: medido el 19/09/2026 contra sitios
 * reales, un prospecto puede llevar ~40s (robots.txt + hasta 4 páginas + la
 * espera entre cada una), bastante por encima del `SITE_BUDGET_MS` de 20s,
 * que sólo se chequea *entre* páginas. El reloj del bucle se mira al
 * terminar la vuelta, así que un lote de 4 se pasaba del maxDuration y
 * Vercel lo cortaba con el trabajo a medio guardar.
 */
const LOTE = 2

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = req.headers.get('x-vercel-cron') ?? url.searchParams.get('secret')
  // Sin `&&`: si CRON_SECRET no está seteada el endpoint queda abierto, que es
  // justo el agujero que tenía daily-search.
  if (secret !== process.env.CRON_SECRET && !req.headers.get('x-vercel-cron')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const presupuesto = Number(url.searchParams.get('ms')) || PRESUPUESTO_MS
  const limite = new Date(Date.now() + presupuesto)

  let procesados = 0
  let email = 0
  let whatsapp = 0
  let telefono = 0
  let vueltas = 0

  try {
    while (Date.now() < limite.getTime()) {
      const r = await enrichBatch(supabase, { limit: LOTE })
      vueltas++
      procesados += r.procesados
      email += r.encontrados.email
      whatsapp += r.encontrados.whatsapp
      telefono += r.encontrados.telefono
      // Sin pendientes: no tiene sentido seguir girando hasta agotar el reloj.
      if (r.procesados < LOTE) break
    }
  } catch (err) {
    return Response.json(
      { procesados, email, whatsapp, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }

  // Cuántos quedan para la próxima corrida — es el dato que dice si una
  // corrida diaria alcanza o si hay que disparar a mano.
  const { count: pendientes } = await supabase
    .from('prospectos')
    .select('id', { count: 'exact', head: true })
    .not('sitio_web', 'is', null)
    .is('enriquecido_en', null)
    .neq('estado', 'descartado')

  return Response.json({
    fecha: new Date().toISOString().split('T')[0],
    vueltas,
    procesados,
    con_email: email,
    con_whatsapp: whatsapp,
    con_telefono: telefono,
    pendientes: pendientes ?? 0,
  })
}
