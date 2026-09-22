// Tanda diaria del carril frío: manda solo, sin que nadie apriete nada.
//
// Revierte la decisión del 04/09/2026 ("el carril frío queda solo-manual").
// El motivo del cambio: el buscador junta 30 o 40 prospectos con correo por
// día, y un paso que depende de que alguien se acuerde de apretar un botón no
// corre — ya pasó con el enriquecimiento, que estuvo dos semanas sin
// ejecutarse y dejó la base con un solo correo.
//
// **El riesgo que hay que tener presente:** nadie mira la lista antes de que
// salga. En julio eso fue un problema con los 41 prospectos que tenían el
// correo de otra empresa. Hoy es bastante menor porque el correo sale del
// sitio propio del comercio —no de una búsqueda web, que es de donde venían
// los datos cruzados— y lo que aparece en un directorio comercial se
// descarta. Aun así conviene arrancar con `OUTREACH_DAILY_LIMIT` bajo.
//
// Los seguimientos van primero que las aperturas: quien ya recibió el primer
// correo está esperando, y postergarle el paso 2 rompe la secuencia. Una
// apertura menos hoy se recupera mañana.

import { createClient } from '@supabase/supabase-js'
import { CUPO_BETA } from '@/lib/mensajes'
import {
  DIAS_RECORDATORIO,
  contestoElCorreo,
  enviarCorreoFrio,
  enviadosHoy,
  pasoQueSigue,
  textoDelPaso,
  topeDiario,
} from '@/lib/outreach'
import type { Prospecto } from '@/lib/types'

export const maxDuration = 60

/**
 * Horas (Argentina) en que corre el workflow — tienen que coincidir con el
 * `cron` de `.github/workflows/prospeccion.yml` (11, 14 y 17 UTC).
 *
 * Sirven para repartir el tope del día entre las corridas en vez de
 * gastarlo entero en la primera. Quince correos en el mismo minuto a las 8
 * de la mañana es un patrón mucho más de robot que la cantidad diaria en sí.
 */
const HORAS_CORRIDA = [8, 11, 14]

function corridasQueQuedan(): number {
  const hora = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', hour12: false }).format(new Date())
  )
  // La corrida actual cuenta. Una manual a otra hora toma lo que le toca a
  // la siguiente programada; después de la última, puede usar todo lo que
  // quede del día.
  return Math.max(HORAS_CORRIDA.filter((h) => h >= hora - 1).length, 1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function haceDias(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const esVercelCron = Boolean(req.headers.get('x-vercel-cron'))
  if (!esVercelCron && url.searchParams.get('secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // `?dry=1` lista a quién le escribiría sin mandar nada. La primera corrida
  // conviene hacerla así y mirar la lista.
  const simulacro = url.searchParams.get('dry') === '1'

  const limite = topeDiario()
  const ya = await enviadosHoy(supabase)
  const quedaHoy = Math.max(limite - ya, 0)
  if (quedaHoy === 0) {
    return Response.json({ mensaje: `Tope diario alcanzado (${ya}/${limite}).`, enviados: 0 })
  }
  // Lo que queda del día se reparte parejo entre las corridas que faltan.
  let cupo = Math.ceil(quedaHoy / corridasQueQuedan())

  const { count: betas } = await supabase
    .from('prospectos')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'beta_activo')
  const cupoLleno = (betas ?? 0) >= CUPO_BETA

  const base = () =>
    supabase
      .from('prospectos')
      .select('*')
      .eq('origen', 'busqueda')
      .not('email', 'is', null)
      .eq('email_estado', 'activo')

  // 1) Recordatorios: recibieron la apertura hace 15 días o más y no
  //    contestaron (si hubieran completado el formulario, su estado ya no
  //    sería 'solicitud_enviada').
  const { data: enCurso } = await base()
    .eq('estado', 'solicitud_enviada')
    .lte('ultimo_envio_en', haceDias(DIAS_RECORDATORIO))
    .order('ultimo_envio_en', { ascending: true })
    .limit(cupo)

  // 2) Aperturas: nunca contactados.
  const { data: nuevos } = await base()
    .eq('estado', 'por_contactar')
    .is('ultimo_envio_en', null)
    .order('created_at', { ascending: true })
    .limit(cupo)

  const candidatos = [...((enCurso ?? []) as Prospecto[]), ...((nuevos ?? []) as Prospecto[])]

  // Dos fichas pueden compartir el mismo correo: el buscador crea una por
  // local y una cadena publica el mismo `ventas@`. Sin esto le llegan dos
  // correos idénticos el mismo día, que es peor que no escribirle.
  // Encontrado en la corrida en seco del 21/09/2026 con `ventas@lto.com.ar`.
  const correosDelLote = [...new Set(candidatos.map((c) => c.email!))]
  const { data: yaEscritos } = await supabase
    .from('prospectos')
    .select('email')
    .in('email', correosDelLote)
    .not('ultimo_envio_en', 'is', null)
  const yaUsados = new Set((yaEscritos ?? []).map((r) => (r as { email: string }).email))

  const enviados: Array<{ empresa: string; email: string; paso: number }> = []
  const omitidos: Array<{ empresa: string; motivo: string }> = []

  for (const fila of candidatos) {
    if (cupo <= 0) break

    // El seguimiento de una ficha ya contactada sí corresponde; lo que se
    // evita es escribirle a la misma dirección por una ficha distinta.
    if (yaUsados.has(fila.email!) && !fila.ultimo_envio_en) {
      omitidos.push({ empresa: fila.empresa, motivo: `ya se le escribió a ${fila.email} por otra ficha` })
      continue
    }

    const paso = await pasoQueSigue(supabase, fila.id)
    if (!paso) {
      // Ya recibió la apertura y el recordatorio: no se le escribe más.
      omitidos.push({ empresa: fila.empresa, motivo: 'ya recibió los 2 correos de la secuencia' })
      continue
    }

    // Quien contestó el correo no recibe el recordatorio. El estado no sirve
    // para saberlo, porque una respuesta no lo cambia sola —un "no me
    // interesa" también es una respuesta, y la clasifica una persona al
    // leerla—, así que se mira el registro de respuestas.
    if (paso === 2 && (await contestoElCorreo(supabase, fila.id))) {
      omitidos.push({ empresa: fila.empresa, motivo: 'contestó el correo' })
      continue
    }

    const mensaje = textoDelPaso(fila, paso, cupoLleno)

    if (simulacro) {
      enviados.push({ empresa: fila.empresa, email: fila.email!, paso })
      yaUsados.add(fila.email!)
      cupo--
      continue
    }

    const r = await enviarCorreoFrio(supabase, fila, mensaje)
    if (r.ok) {
      enviados.push({ empresa: fila.empresa, email: fila.email!, paso })
      yaUsados.add(fila.email!)
      cupo--
    } else {
      omitidos.push({ empresa: fila.empresa, motivo: r.error ?? 'error' })
      // El tope se agotó a mitad de la tanda: no tiene sentido seguir.
      if (r.status === 429) break
    }
  }

  return Response.json({
    fecha: new Date().toISOString().split('T')[0],
    simulacro,
    tope: limite,
    enviados_antes: ya,
    enviados: enviados.length,
    detalle: enviados,
    omitidos,
  })
}
