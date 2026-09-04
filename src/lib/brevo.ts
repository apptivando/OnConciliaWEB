/**
 * Cliente de Brevo. `fetch` pelado, sin SDK — mismo criterio que
 * `src/lib/prospects/places.ts`. Server-only: nunca importar desde un
 * componente cliente (expondría la API key).
 *
 * Dos usos, dos remitentes distintos:
 *   - Carril frío (1:1, `/api/outreach/send`): `enviarTransaccional()`,
 *     remitente personal (Guillermo).
 *   - Carril opt-in (`leads` → lista → Automation de Brevo): solo
 *     `upsertContacto()` para sincronizar el contacto y agregarlo a la
 *     lista. El envío en sí lo hace el Automation, configurado en el
 *     dashboard de Brevo — no hay código acá para eso.
 *
 * IMPORTANTE — atributos personalizados: Brevo exige que `attributes` esté
 * en MAYÚSCULAS y que cada campo ya exista como atributo definido en la
 * cuenta (Contacts → Settings → Contact Attributes). Si un campo no está
 * creado ahí, Brevo lo ignora en silencio — no tira error. Ver plan,
 * Bloque 4, "Tareas tuyas".
 */

const BASE = 'https://api.brevo.com/v3'

function apiKey(): string {
  const key = process.env.BREVO_API_KEY
  if (!key) throw new Error('Falta BREVO_API_KEY')
  return key
}

async function brevoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'api-key': apiKey(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
}

export interface UpsertContactoOpts {
  email: string
  attributes?: Record<string, string | number | null>
  listIds?: number[]
}

/**
 * Crea o actualiza un contacto (`updateEnabled: true`). Devuelve el id de
 * Brevo como string, o `null` si falló — nunca tira, la sincronización con
 * Brevo no debe bloquear un envío ni un alta de lead.
 */
export async function upsertContacto(opts: UpsertContactoOpts): Promise<string | null> {
  try {
    const res = await brevoFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        email: opts.email,
        attributes: opts.attributes,
        listIds: opts.listIds,
        updateEnabled: true,
      }),
    })

    // 204: ya existía y se actualizó, sin body — no da el id.
    if (res.status === 204) return null
    if (!res.ok) {
      console.error('Brevo upsertContacto', res.status, await res.text())
      return null
    }
    const data = (await res.json()) as { id?: number }
    return data.id != null ? String(data.id) : null
  } catch (err) {
    console.error('Brevo upsertContacto', err)
    return null
  }
}

export interface EnviarTransaccionalOpts {
  to: { email: string; name?: string }
  sender: { email: string; name: string }
  replyTo?: { email: string; name?: string }
  subject: string
  htmlContent: string
  textContent?: string
  tags?: string[]
}

/** Envía un email transaccional 1:1. Tira si Brevo lo rechaza. */
export async function enviarTransaccional(opts: EnviarTransaccionalOpts): Promise<string> {
  const res = await brevoFetch('/smtp/email', {
    method: 'POST',
    body: JSON.stringify({
      sender: opts.sender,
      to: [opts.to],
      replyTo: opts.replyTo,
      subject: opts.subject,
      htmlContent: opts.htmlContent,
      textContent: opts.textContent,
      tags: opts.tags,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`)
  }
  const data = (await res.json()) as { messageId?: string }
  return data.messageId ?? ''
}
