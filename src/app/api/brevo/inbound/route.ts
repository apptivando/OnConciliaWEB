import { createClient } from '@supabase/supabase-js'
import { enviarTransaccional } from '@/lib/brevo'
import { appUrl } from '@/lib/mensajes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Respuestas al correo frío. Brevo recibe lo que llega a
 * `*@respuestas.onconcilia.com` (MX delegado en DonWeb), lo parsea y lo
 * postea acá.
 *
 * Existe para que una respuesta no se pierda en la casilla sin que el CRM se
 * entere: sin esto, a quien contestaba el correo le llegaba igual el
 * recordatorio de los 15 días, como si nunca hubiera dicho nada.
 *
 * **El orden importa.** Mientras el correo frío tenga como dirección de
 * respuesta la de este subdominio, la respuesta ya no va directo a la
 * casilla: pasa por acá. Por eso lo primero que se hace es reenviarla, y
 * recién después se toca la base. Si el reenvío falla se devuelve error para
 * que Brevo reintente; si falla la base, la respuesta ya llegó igual.
 *
 * Brevo no firma estas llamadas: se protege con el mismo secreto en la URL
 * que el webhook de eventos.
 */

/** A dónde se reenvían. La casilla de siempre, donde se contesta. */
function casilla(): string {
  return process.env.OUTREACH_REPLIES_INBOX || 'guillermo@onconcilia.com'
}

interface Direccion {
  Name?: string | null
  Address?: string | null
}

interface ItemEntrante {
  MessageId?: string
  From?: Direccion | string
  Subject?: string
  RawTextBody?: string
  RawHtmlBody?: string
  ExtractedMarkdownMessage?: string
  Headers?: Record<string, string | string[]>
  SpamScore?: number
}

function remitente(from: ItemEntrante['From']): { email: string; nombre: string | null } {
  if (!from) return { email: '', nombre: null }
  if (typeof from === 'string') {
    const m = from.match(/<([^>]+)>/)
    return { email: (m ? m[1] : from).trim().toLowerCase(), nombre: null }
  }
  return { email: (from.Address ?? '').trim().toLowerCase(), nombre: from.Name ?? null }
}

function header(item: ItemEntrante, nombre: string): string {
  const h = item.Headers ?? {}
  const clave = Object.keys(h).find((k) => k.toLowerCase() === nombre.toLowerCase())
  if (!clave) return ''
  const v = h[clave]
  return (Array.isArray(v) ? v.join(' ') : v ?? '').toLowerCase()
}

/**
 * Las respuestas automáticas son habituales en frío y no son una persona
 * contestando: si contaran, un "fuera de la oficina" sacaría al prospecto
 * del recordatorio. Se reconocen por las cabeceras estándar y, de respaldo,
 * por el asunto. Igual se reenvían: ante la duda, que la vea una persona.
 */
function esAutomatica(item: ItemEntrante): boolean {
  const auto = header(item, 'Auto-Submitted')
  if (auto && auto !== 'no') return true
  if (header(item, 'X-Autoreply') || header(item, 'X-Autorespond')) return true
  if (/auto_reply|bulk|junk/.test(header(item, 'Precedence'))) return true
  return /^(respuesta autom|automatic reply|auto(matic)?[- ]?reply|out of (the )?office|fuera de (la )?oficina|ausente)/i.test(
    (item.Subject ?? '').trim()
  )
}

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret')
  if (!process.env.BREVO_WEBHOOK_SECRET || secret !== process.env.BREVO_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { items?: ItemEntrante[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  const resultados: Array<{ de: string; prospecto: string | null; automatica: boolean }> = []

  for (const item of body.items ?? []) {
    const { email, nombre } = remitente(item.From)
    const asunto = item.Subject?.trim() || '(sin asunto)'
    const texto = (item.ExtractedMarkdownMessage || item.RawTextBody || '').trim()
    const automatica = esAutomatica(item)

    // La búsqueda va antes del reenvío sólo para sumarle al correo el nombre
    // de la empresa y el enlace a la ficha. Si falla, se reenvía igual.
    let prospecto: { id: string; empresa: string; nombre: string } | null = null
    try {
      if (email) {
        const { data } = await supabase
          .from('prospectos')
          .select('id, empresa, nombre')
          .eq('email', email)
          .limit(1)
          .maybeSingle()
        prospecto = data
      }
    } catch {
      prospecto = null
    }

    // ── 1. Reenviar. Lo único que no puede fallar. ──────────────────────────
    const quien = prospecto?.empresa ?? nombre ?? email ?? 'alguien'
    const ficha = prospecto ? `${appUrl()}/prospectos?cliente=${prospecto.id}` : null
    const aviso = automatica
      ? `Respuesta automática de ${quien} (fuera de la oficina o similar). No lo saca del recordatorio.`
      : `${quien} contestó el correo frío. Tocá Responder y le escribís directo.`

    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px">
  <div style="background:#F1F5F9;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#334155">
    <b>${escapar(aviso)}</b><br>
    De: ${escapar(nombre ? `${nombre} <${email}>` : email)}
    ${ficha ? `<br><a href="${ficha}" style="color:#2563EB">Abrir la ficha en el CRM</a>` : '<br>No encontré a qué prospecto corresponde este correo.'}
  </div>
  <div style="font-size:15px;line-height:1.6;color:#0F172A;white-space:pre-wrap">${escapar(texto || '(respuesta vacía)')}</div>
</div>`

    try {
      await enviarTransaccional({
        to: { email: casilla() },
        sender: { email: 'guillermo@onconcilia.com', name: 'Respuestas OnConcilia' },
        // "Responder" desde la casilla le escribe directo al prospecto.
        replyTo: email ? { email, name: nombre ?? undefined } : undefined,
        subject: automatica ? `[Automática] ${asunto}` : asunto,
        htmlContent: html,
        textContent: `${aviso}\nDe: ${email}\n${ficha ?? ''}\n\n${texto}`,
        tags: ['respuesta-frio'],
      })
    } catch (err) {
      console.error('[brevo/inbound] no se pudo reenviar', err)
      // Error hacia Brevo para que reintente: es la única copia de la respuesta.
      return Response.json({ error: 'No se pudo reenviar' }, { status: 500 })
    }

    // ── 2. Registrar en el CRM. Si falla, la respuesta ya llegó igual. ─────
    try {
      if (prospecto) {
        const contenido = `${automatica ? 'Respuesta automática' : 'Contestó el correo'} — "${asunto}":\n\n${texto}`.slice(0, 4000)

        // Brevo reintenta si algo sale mal a mitad de camino: no registrar
        // dos veces la misma respuesta.
        const { count } = await supabase
          .from('interacciones')
          .select('id', { count: 'exact', head: true })
          .eq('prospecto_id', prospecto.id)
          .eq('contenido', contenido)

        if (!count) {
          await supabase.from('interacciones').insert({
            prospecto_id: prospecto.id,
            tipo: 'email',
            // 'respuesta' es lo que mira el cron para no mandarle el
            // recordatorio. Las automáticas van aparte y no lo frenan.
            canal: automatica ? 'respuesta_automatica' : 'respuesta',
            contenido,
          })

          if (!automatica) {
            // El estado no se toca: un "no me interesa" también es una
            // respuesta, y la clasifica una persona al leerla. Sí se marca
            // qué hay que hacer, con fecha de hoy, para que aparezca en la
            // tarjeta de follow-ups vencidos hasta que alguien la atienda.
            const hoy = new Date().toISOString().split('T')[0]
            await supabase
              .from('prospectos')
              .update({
                proxima_accion: 'Contestó el correo — leer la respuesta y contestarle',
                fecha_proxima_accion: hoy,
                fecha_ultimo_contacto: hoy,
              })
              .eq('id', prospecto.id)
          }
        }
      }
    } catch (err) {
      console.error('[brevo/inbound] no se pudo registrar en el CRM', err)
    }

    resultados.push({ de: email, prospecto: prospecto?.id ?? null, automatica })
  }

  return Response.json({ ok: true, resultados })
}
