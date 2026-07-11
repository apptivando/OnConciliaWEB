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
    linkedin_url: p.linkedin_url || null,
    canal: 'otro',
    notas: p.notas
      ? `${p.notas}${p.telefono ? ` | Tel: ${p.telefono}` : ''}`
      : p.telefono
        ? `Tel: ${p.telefono}`
        : 'Encontrado por agente IA',
  })
  if (error) return `ERROR: ${error.message}`
  return `GUARDADO: ${p.nombre} — ${p.empresa}`
}

async function updateContacto(p: {
  empresa: string
  linkedin_url?: string
  email?: string
  telefono?: string
}): Promise<string> {
  const update: Record<string, string> = {}
  if (p.linkedin_url) update.linkedin_url = p.linkedin_url
  if (p.email) update.email = p.email

  if (Object.keys(update).length === 0 && !p.telefono) return 'Nada que actualizar'

  // Teléfono va en notas si no hay campo dedicado
  if (p.telefono) {
    const { data: existing } = await supabase
      .from('prospectos')
      .select('notas')
      .ilike('empresa', `%${p.empresa}%`)
      .maybeSingle()
    if (existing) {
      update.notas = existing.notas
        ? `${existing.notas} | Tel: ${p.telefono}`
        : `Tel: ${p.telefono}`
    }
  }

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
          notas: { type: 'string' },
        },
        required: ['nombre', 'empresa', 'sector'],
      },
    },
    {
      name: 'update_contacto',
      description: 'Agrega email, LinkedIn o teléfono a un prospecto ya guardado',
      input_schema: {
        type: 'object' as const,
        properties: {
          empresa: { type: 'string' },
          linkedin_url: { type: 'string' },
          email: { type: 'string' },
          telefono: { type: 'string' },
        },
        required: ['empresa'],
      },
    },
  ]

  const systemPrompt = `Sos un agente de prospección para OnConcilia (SaaS de conciliación bancaria, Argentina).

OBJETIVO: encontrar la mayor cantidad posible de ${SECTOR_LABELS[sector] ?? sector} en ${ciudad}. Meta mínima: 40 prospectos. No te detengas hasta agotar las fuentes.

FASE 1 — BÚSQUEDA MASIVA (hacé TODAS estas búsquedas, una por una):
Búsquedas en Google (web_search):
1. "estudios contables ${ciudad}"
2. "contador público ${ciudad}"
3. "estudio contable ${ciudad} Entre Ríos" (o la provincia que corresponda)
4. "asesor impositivo ${ciudad}"
5. "auditor contable ${ciudad}"
6. "CPCE ${ciudad}" y "consejo profesional ciencias económicas ${ciudad}"
7. site:cpce-er.org.ar (o el consejo profesional de la provincia)
8. "contador ${ciudad}" site:linkedin.com
9. "estudio contable ${ciudad}" site:facebook.com
10. "contador público matrícula ${ciudad}"
11. páginas amarillas contador ${ciudad}
12. Infobae / La Nación / diarios locales con listados de profesionales

Búsquedas en Maps (maps_search) — MUY IMPORTANTES, traen teléfonos:
13. "estudio contable ${ciudad}"
14. "contador público ${ciudad}"
15. "asesoría impositiva ${ciudad}"
16. "auditoría ${ciudad}"

FASE 2 — GUARDAR TODO:
- Guardá CADA resultado encontrado, aunque solo tengas nombre y empresa
- Si el resultado de Maps tiene teléfono, incluilo en el campo telefono
- Si encontrás email en el sitio web o snippet, incluilo
- No te preocupes si falta información — guardá lo que haya

FASE 3 — SEGUNDA PASADA DE CONTACTO:
Para cada prospecto guardado sin email ni LinkedIn, hacé una búsqueda específica:
- web_search: "[nombre empresa] LinkedIn"
- web_search: "[nombre empresa] contacto email ${ciudad}"
- Si encontrás algo, actualizalo con update_contacto

REGLAS:
- No guardes duplicados (si ya existe la empresa, el sistema lo rechaza)
- Usá save_prospecto con nombre = nombre del contador/responsable si lo sabés, o el nombre del estudio si no
- Continuá hasta haber agotado todas las fuentes listadas arriba`

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Buscá ${SECTOR_LABELS[sector] ?? sector} en ${ciudad}. Hacé TODAS las búsquedas listadas en el sistema. Meta: 40+ prospectos.`,
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

  while (response.stop_reason === 'tool_use' && iteraciones < 40) {
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
