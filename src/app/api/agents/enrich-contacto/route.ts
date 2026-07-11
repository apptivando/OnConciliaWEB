import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DIRECTORIOS = ['linkedin.com', 'facebook.com', 'instagram.com', 'paginasamarillas', 'guiatelefonica', 'cylex', 'maps.google', 'yelp.com']

// Rutas típicas de guías/directorios de negocios (hay decenas en Argentina,
// mantener una lista de dominios es una carrera perdida — esto generaliza mejor).
const RUTAS_DIRECTORIO = ['/pagina/', '/paginas/', '/listado/', '/directorio/', '/empresa/', '/empresas/', '/negocio/', '/negocios/', '/ficha/', '/fichas/', '/detalle/', '/local/', '/comercio/', '/comercios/', '/guia/', '/perfil/']

const STOPWORDS = new Set([
  'estudio', 'estudios', 'contable', 'contables', 'contador', 'contadores', 'publico', 'publica',
  'asociados', 'asociado', 'asesoria', 'asesoramiento', 'impositiva', 'impositivo', 'auditoria',
  'auditor', 'auditores', 'sociedad', 'anonima', 'compania', 'consultora', 'profesional',
  'ciencias', 'economicas', 'consejo', 'cpce', 'sa', 'srl', 'cia', 'and', 'the',
])

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Palabras que realmente identifican a ESTA empresa (típicamente apellidos),
// descartando términos genéricos del rubro que matchean con cualquier resultado.
function tokensDistintivos(empresa: string): string[] {
  return normalizar(empresa)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
}

// Un sitio "propio" es uno donde el dominio mismo lleva el nombre de la
// empresa (fuerte), o que es la portada del sitio sin sub-rutas de listado
// (débil pero razonable). Cualquier otra cosa suele ser una guía de negocios
// que repite los mismos datos que ya tenemos y no aporta nada al scrapear.
function esSitioPropio(link: string, tokens: string[]): boolean {
  try {
    const u = new URL(link)
    const host = normalizar(u.hostname.replace(/^www\./, ''))
    if (DIRECTORIOS.some((d) => host.includes(d))) return false
    if (RUTAS_DIRECTORIO.some((r) => u.pathname.toLowerCase().includes(r))) return false

    if (tokens.some((t) => host.includes(t))) return true

    const segmentos = u.pathname.split('/').filter(Boolean)
    return segmentos.length === 0
  } catch {
    return false
  }
}

async function buscarContacto(empresa: string): Promise<{
  email?: string
  linkedin_url?: string
  sitio_web?: string
}> {
  const tokens = tokensDistintivos(empresa)
  // Sin apellido/nombre distintivo (ej. "Estudio Contable S.A." a secas) no hay
  // forma confiable de verificar que un resultado sea de esta empresa puntual.
  if (tokens.length === 0) return {}

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: `${empresa} contacto`, gl: 'ar', hl: 'es', num: 10 }),
  })
  const data = await res.json()
  const organic: Array<{ title: string; snippet: string; link: string }> = data.organic ?? []

  const coincide = (r: { title: string; snippet: string; link: string }) => {
    const texto = normalizar(`${r.title} ${r.snippet} ${r.link}`)
    return tokens.some((t) => texto.includes(t))
  }
  const relevantes = organic.filter(coincide)

  const texto = relevantes.map((r) => `${r.title} ${r.snippet}`).join(' ')
  const emailMatch = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)

  const linkedin = relevantes.find((r) => r.link.includes('linkedin.com'))
  const sitio = relevantes.find((r) => esSitioPropio(r.link, tokens))

  return {
    email: emailMatch?.[0],
    linkedin_url: linkedin?.link,
    sitio_web: sitio?.link,
  }
}

export async function POST() {
  try {
    const { data: prospectos } = await supabase
      .from('prospectos')
      .select('id, empresa')
      .not('telefono', 'is', null)
      .is('email', null)
      .is('linkedin_url', null)
      .is('sitio_web', null)
      .neq('estado', 'descartado')
      .limit(12)

    const resultados = { enriquecidos: 0, descartados: 0, procesados: 0 }

    for (const p of prospectos ?? []) {
      resultados.procesados++
      const encontrado = await buscarContacto(p.empresa)

      if (encontrado.email || encontrado.linkedin_url || encontrado.sitio_web) {
        await supabase
          .from('prospectos')
          .update({
            email: encontrado.email ?? null,
            linkedin_url: encontrado.linkedin_url ?? null,
            sitio_web: encontrado.sitio_web ?? null,
          })
          .eq('id', p.id)
        resultados.enriquecidos++
      } else {
        await supabase
          .from('prospectos')
          .update({ estado: 'descartado', notas: 'Descartado — solo teléfono, no se encontró más información de contacto' })
          .eq('id', p.id)
        resultados.descartados++
      }
    }

    return Response.json(resultados)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[enrich-contacto]', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
