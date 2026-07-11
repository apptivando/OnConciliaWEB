import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function scrapear(url: string): Promise<{ email?: string; whatsapp?: string }> {
  const target = url.startsWith('http') ? url : `https://${url}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnConciliaBot/1.0)' },
    })
    const html = await res.text()

    const mailtoMatch = html.match(/mailto:([^"'\s?<>]+)/i)
    const waMatch = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d{7,15})/i)

    return {
      email: mailtoMatch?.[1],
      whatsapp: waMatch?.[1],
    }
  } catch {
    return {}
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST() {
  try {
    const { data: prospectos } = await supabase
      .from('prospectos')
      .select('id, sitio_web')
      .not('sitio_web', 'is', null)
      .is('email', null)
      .is('whatsapp', null)
      .neq('estado', 'descartado')
      .limit(15)

    const resultados = { procesados: 0, con_datos_nuevos: 0 }

    for (const p of prospectos ?? []) {
      resultados.procesados++
      const encontrado = await scrapear(p.sitio_web!)

      if (encontrado.email || encontrado.whatsapp) {
        await supabase
          .from('prospectos')
          .update({
            ...(encontrado.email ? { email: encontrado.email } : {}),
            ...(encontrado.whatsapp ? { whatsapp: encontrado.whatsapp } : {}),
          })
          .eq('id', p.id)
        resultados.con_datos_nuevos++
      }
    }

    return Response.json(resultados)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[scrape-sitios]', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
