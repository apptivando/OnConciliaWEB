import { createClient } from '@supabase/supabase-js'
import { upsertContacto, enviarTransaccional } from '@/lib/brevo'
import { ASUNTOS_COMERCIO, ASUNTO_GENERICO, appUrl } from '@/lib/mensajes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// El dominio autenticado en Brevo es onconcilia.com (la raíz), no
// mkt.onconcilia.com — autenticar uno no autentica el otro. Se resignó el
// aislamiento de reputación entre marketing y producto (opción B, intentada
// y descartada el 04/09/2026: autenticar el subdominio aparte no terminó de
// validar en Brevo).
const REMITENTE = { email: 'guillermo@onconcilia.com', name: 'Guillermo de OnConcilia' }

/**
 * Envuelve el mensaje (texto plano, el mismo que se manda en `textContent`)
 * en una versión HTML con identidad de marca — misma barra de header que
 * los templates de la secuencia opt-in (`emails-automation-optin/paso-*.html`
 * en el repo del plan), pero sin CTA de botón grande: sigue siendo un email
 * 1:1 personal, no una pieza de marketing. Cualquier URL del texto se
 * convierte en un link con texto fijo — evita mostrar la URL cruda (fea y,
 * en clientes que no renderizan HTML, la sola URL rompe el tono personal).
 */
function mensajeAHtml(mensaje: string): string {
  const textoLink = 'coordinemos acá'
  const escapado = mensaje.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const conLinks = escapado.replace(/(https?:\/\/\S+)/g, (match) => {
    // La URL puede venir seguida de puntuación de la oración ("...id.") —
    // eso no es parte del link.
    const cola = match.match(/[).,;:!?]+$/)?.[0] ?? ''
    const url = cola ? match.slice(0, -cola.length) : match
    return `<a href="${url}" style="color:#2563EB;font-weight:600;text-decoration:underline;">${textoLink}</a>${cola}`
  })
  const parrafos = conLinks
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<div style="background:#F5F6F8;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
    <tr>
      <td style="background:#0F1F3D;padding:18px 32px;">
        <span style="color:#ffffff;font-size:16px;font-weight:800;letter-spacing:-0.3px;">On<span style="color:#34D399;">Concilia</span></span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        ${parrafos}
      </td>
    </tr>
    <tr>
      <td style="background:#F8FAFC;padding:16px 32px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;font-size:12px;color:#94A3B8;">
          <a href="${appUrl()}" style="color:#94A3B8;text-decoration:underline;">${appUrl().replace(/^https?:\/\//, '')}</a>
        </p>
      </td>
    </tr>
  </table>
</div>`
}

function inicioDeHoyAR(): string {
  // Mismo criterio que /saldos en el proyecto de la app: evita el bug UTC
  // de "hoy" cruzando la medianoche en Argentina (UTC-3).
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
  return `${hoy}T00:00:00-03:00`
}

async function enviosHoy(): Promise<number> {
  const { count } = await supabase
    .from('interacciones')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'mensaje')
    .eq('canal', 'email')
    .gte('created_at', inicioDeHoyAR())
  return count ?? 0
}

export async function POST(req: Request) {
  const { prospecto_id, canal, mensaje } = await req.json()

  if (!prospecto_id || !canal || !mensaje) {
    return Response.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { data: p, error: fetchError } = await supabase
    .from('prospectos')
    .select('*')
    .eq('id', prospecto_id)
    .single()

  if (fetchError || !p) {
    return Response.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  }

  let brevoContactId: string | null = p.brevo_contact_id ?? null

  if (canal === 'email') {
    if (!p.email) return Response.json({ error: 'Sin email' }, { status: 400 })

    if (p.email_estado && p.email_estado !== 'activo') {
      return Response.json(
        { error: `Este prospecto está marcado como "${p.email_estado}" — no se le puede volver a escribir.` },
        { status: 400 }
      )
    }

    const limite = Number(process.env.OUTREACH_DAILY_LIMIT) || 50
    const yaEnviados = await enviosHoy()
    if (yaEnviados >= limite) {
      return Response.json(
        { error: `Tope diario alcanzado (${yaEnviados}/${limite}). Se reinicia mañana.` },
        { status: 429 }
      )
    }

    // Solo los prospectos que salieron de una búsqueda de Places entran a
    // "OnConcilia - Leads Search" — los de LinkedIn (pyme/estudio/franquicia)
    // no pasan por acá, ese carril no tiene lista propia en Brevo todavía.
    const listIdSearch = Number(process.env.BREVO_LIST_ID_SEARCH) || undefined

    const nuevoId = await upsertContacto({
      email: p.email,
      attributes: {
        EMPRESA: p.empresa,
        LOCALIDAD: p.localidad ?? '',
        SECTOR: p.sector,
        // PRIORIDAD es numérico en Brevo — null, no '', cuando no hay valor.
        PRIORIDAD: p.prioridad_contacto ?? null,
      },
      listIds: p.origen === 'busqueda' && listIdSearch ? [listIdSearch] : undefined,
    })
    if (nuevoId && !brevoContactId) brevoContactId = nuevoId

    // Autoritativo del lado del servidor — no se confía en un asunto que
    // mande el cliente, aunque /cola ya lo muestre calculado igual para
    // revisión. Único origen de verdad: prospecto.variante_asunto.
    const subject =
      p.sector === 'comercio' && p.variante_asunto
        ? ASUNTOS_COMERCIO[p.variante_asunto as 'A' | 'B' | 'C'](p.empresa)
        : ASUNTO_GENERICO(p.nombre.split(' ')[0])

    try {
      await enviarTransaccional({
        to: { email: p.email, name: p.nombre },
        sender: REMITENTE,
        subject,
        htmlContent: mensajeAHtml(mensaje),
        textContent: mensaje,
        tags: p.variante_asunto ? ['outreach-frio', `variante-${p.variante_asunto}`] : ['outreach-frio'],
      })
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : 'Error al enviar' }, { status: 500 })
    }
  }

  // Para LinkedIn, el "envío" es manual — solo registramos
  await supabase
    .from('prospectos')
    .update({
      estado: 'solicitud_enviada',
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
      ultimo_envio_en: new Date().toISOString(),
      ...(brevoContactId ? { brevo_contact_id: brevoContactId } : {}),
    })
    .eq('id', prospecto_id)

  await supabase.from('interacciones').insert({
    prospecto_id,
    tipo: 'mensaje',
    contenido: mensaje,
    canal,
    estado_anterior: 'por_contactar',
    estado_nuevo: 'solicitud_enviada',
  })

  return Response.json({ ok: true })
}
