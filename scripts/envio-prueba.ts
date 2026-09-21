/**
 * Envío de prueba del correo frío, por el mismo camino de código que usa el
 * cron (`enviarCorreoFrio` + `textoDelPaso`). Sirve para ver cómo llega de
 * verdad a una casilla: asunto, texto, el enlace a /coordinar y el pie.
 *
 * Uso:  npx tsx scripts/envio-prueba.ts tu@correo.com [A|B|C]
 *
 * Crea un prospecto de prueba en estado 'descartado' —así ningún cron lo
 * toma mientras exista— y lo deja creado para poder abrir /coordinar/<id>
 * desde el correo. Hay que borrarlo después con `--borrar`.
 *
 * El tope diario se sube sólo en este proceso: la prueba no tiene que
 * depender de cuánto se mandó hoy, y no toca las variables del deploy.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

for (const linea of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = linea.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}
// En `.env.local` esta variable apunta a localhost, para el desarrollo. La
// prueba tiene que mostrar el enlace que manda producción, no ése.
process.env.NEXT_PUBLIC_APP_URL = 'https://www.onconcilia.com'
process.env.OUTREACH_DAILY_LIMIT = '100000'
process.env.OUTREACH_DAILY_MIN = '100000'
process.env.OUTREACH_DAILY_MAX = '100000'

const EMPRESA = 'Prueba de envío OnConcilia'

async function main() {
  const { enviarCorreoFrio, textoDelPaso } = await import('../src/lib/outreach')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (process.argv[2] === '--borrar') {
    const { data } = await supabase.from('prospectos').select('id').eq('empresa', EMPRESA)
    for (const p of data ?? []) await supabase.from('interacciones').delete().eq('prospecto_id', p.id)
    await supabase.from('prospectos').delete().eq('empresa', EMPRESA)
    console.log(`borrados: ${data?.length ?? 0}`)
    return
  }

  const email = process.argv[2]
  const variante = (process.argv[3] ?? 'A').toUpperCase()
  if (!email) throw new Error('Falta el correo de destino')

  const { data: p, error } = await supabase
    .from('prospectos')
    .insert({
      nombre: EMPRESA,
      empresa: EMPRESA,
      sector: 'comercio',
      origen: 'busqueda',
      canal: 'otro',
      estado: 'descartado',
      email,
      localidad: 'Prueba',
      variante_asunto: variante,
      notas: 'Prospecto de prueba del envío frío. Borrar con scripts/envio-prueba.ts --borrar.',
    })
    .select('*')
    .single()
  if (error || !p) throw new Error(error?.message ?? 'no se creó el prospecto')

  const mensaje = textoDelPaso(p, 1, false)
  const r = await enviarCorreoFrio(supabase, p, mensaje)
  console.log(r.ok ? `enviado a ${email} (asunto ${variante}) — prospecto ${p.id}` : `falló: ${r.error}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
