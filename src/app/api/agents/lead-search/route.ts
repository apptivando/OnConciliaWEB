import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function searchWeb(query: string): Promise<string> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, gl: 'ar', hl: 'es', num: 20 }),
  })
  const data = await res.json()
  return JSON.stringify(
    (data.organic ?? []).slice(0, 15).map((r: { title: string; snippet: string; link: string }) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
    }))
  )
}

async function searchMaps(query: string): Promise<string> {
  const res = await fetch('https://google.serper.dev/maps', {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, gl: 'ar', hl: 'es' }),
  })
  const data = await res.json()
  return JSON.stringify(
    (data.places ?? []).slice(0, 20).map((r: { title: string; address: string; phoneNumber?: string; website?: string }) => ({
      nombre: r.title,
      direccion: r.address,
      telefono: r.phoneNumber ?? null,
      sitio_web: r.website ?? null,
    }))
  )
}

async function saveProspecto(p: {
  nombre: string
  empresa: string
  sector: string
  cargo?: string
  email?: string
  telefono?: string
  linkedin_url?: string
  sitio_web?: string
  notas?: string
}): Promise<string> {
  const { data: existing } = await supabase
    .from('prospectos')
    .select('id')
    .ilike('empresa', `%${p.empresa}%`)
    .maybeSingle()
  if (existing) return `YA_EXISTE: ${p.empresa}`

  const { error } = await supabase.from('prospectos').insert({
    nombre: p.nombre,
    empresa: p.empresa,
    sector: p.sector,
    cargo: p.cargo || null,
    email: p.email || null,
    telefono: p.telefono || null,
    linkedin_url: p.linkedin_url || null,
    sitio_web: p.sitio_web || null,
    canal: 'otro',
    notas: p.notas || 'Encontrado por agente IA',
  })
  if (error) return `ERROR: ${error.message}`
  return `GUARDADO: ${p.nombre} — ${p.empresa}`
}

async function updateContacto(p: {
  empresa: string
  linkedin_url?: string
  email?: string
  telefono?: string
  sitio_web?: string
}): Promise<string> {
  const update: Record<string, string> = {}
  if (p.linkedin_url) update.linkedin_url = p.linkedin_url
  if (p.email) update.email = p.email
  if (p.telefono) update.telefono = p.telefono
  if (p.sitio_web) update.sitio_web = p.sitio_web

  if (Object.keys(update).length === 0) return 'Nada que actualizar'

  const { error } = await supabase
    .from('prospectos')
    .update(update)
    .ilike('empresa', `%${p.empresa}%`)

  return error ? `ERROR: ${error.message}` : `ACTUALIZADO: ${p.empresa}`
}

export async function POST(req: Request) {
  try {
  const { sector, ciudad } = await req.json()

  const SECTOR_LABELS: Record<string, string> = {
    estudio: 'estudios contables y contadores públicos',
    pyme: 'pymes y empresas de servicios',
    franquicia: 'franquicias y cadenas de locales',
  }

  const tools: Anthropic.Tool[] = [
    {
      name: 'web_search',
      description: 'Búsqueda en Google — usá queries variados para maximizar resultados',
      input_schema: {
        type: 'object' as const,
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'maps_search',
      description: 'Búsqueda en Google Maps — retorna negocios locales con teléfono y dirección',
      input_schema: {
        type: 'object' as const,
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
    {
      name: 'save_prospecto',
      description: 'Guarda un prospecto en el CRM. Guardá TODOS los que encuentres aunque no tengan email.',
      input_schema: {
        type: 'object' as const,
        properties: {
          nombre: { type: 'string', description: 'Nombre del contacto principal (si no hay persona, usá el nombre del estudio)' },
          empresa: { type: 'string' },
          sector: { type: 'string', enum: ['pyme', 'estudio', 'franquicia'] },
          cargo: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string' },
          linkedin_url: { type: 'string' },
          sitio_web: { type: 'string' },
          notas: { type: 'string' },
        },
        required: ['nombre', 'empresa', 'sector'],
      },
    },
    {
      name: 'update_contacto',
      description: 'Agrega email, LinkedIn, teléfono o sitio web a un prospecto ya guardado',
      input_schema: {
        type: 'object' as const,
        properties: {
          empresa: { type: 'string' },
          linkedin_url: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string' },
          sitio_web: { type: 'string' },
        },
        required: ['empresa'],
      },
    },
  ]

  const systemPrompt = `Sos un agente de prospección para OnConcilia (SaaS de conciliación bancaria, Argentina).

OBJETIVO: encontrar ${SECTOR_LABELS[sector] ?? sector} en ${ciudad}. Meta: 15-20 prospectos. Esta corrida tiene un tiempo límite corto, así que priorizá volumen de guardado por sobre profundidad de investigación por prospecto.

FASE 1 — BÚSQUEDA (hacé estas búsquedas, una por una, sin repetir):
Maps (maps_search) — priorizalas primero, traen teléfono y dirección directo:
1. "estudio contable ${ciudad}"
2. "contador público ${ciudad}"

Google (web_search):
3. "estudios contables ${ciudad}"
4. "contador público ${ciudad}"
5. "asesor impositivo ${ciudad}"
6. "contador ${ciudad}" site:linkedin.com

FASE 2 — GUARDAR TODO:
- Guardá CADA resultado encontrado, aunque solo tengas nombre y empresa
- Si el resultado de Maps tiene teléfono, incluilo en el campo telefono
- Si encontrás email o LinkedIn en el sitio web o snippet, incluilo
- No hagas búsquedas adicionales de contacto por prospecto — guardá lo que haya y seguí con el próximo

REGLAS:
- No guardes duplicados (si ya existe la empresa, el sistema lo rechaza)
- Usá save_prospecto con nombre = nombre del contador/responsable si lo sabés, o el nombre del estudio si no
- Cuando termines las 6 búsquedas de la Fase 1, cerrá con un resumen breve — no seguí buscando más`

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Buscá ${SECTOR_LABELS[sector] ?? sector} en ${ciudad}. Hacé las 6 búsquedas listadas en el sistema. Meta: 15-20 prospectos.`,
    },
  ]

  let response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    system: systemPrompt,
    tools,
    messages,
  })

  const guardados: string[] = []
  let iteraciones = 0

  while (response.stop_reason === 'tool_use' && iteraciones < 10) {
    iteraciones++
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUses) {
      let result: string
      const input = toolUse.input as Record<string, string>

      switch (toolUse.name) {
        case 'web_search':
          result = await searchWeb(input.query)
          break
        case 'maps_search':
          result = await searchMaps(input.query)
          break
        case 'save_prospecto':
          result = await saveProspecto(input as unknown as Parameters<typeof saveProspecto>[0])
          if (result.startsWith('GUARDADO:')) guardados.push(result)
          break
        case 'update_contacto':
          result = await updateContacto(input as unknown as Parameters<typeof updateContacto>[0])
          break
        default:
          result = 'Tool no reconocida'
      }

      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: systemPrompt,
      tools,
      messages,
    })
  }

  const resumen =
    response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''

  return Response.json({ prospectos_guardados: guardados.length, guardados, resumen })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[lead-search]', err)
    return Response.json({ error: message }, { status: 500 })
  }
}
