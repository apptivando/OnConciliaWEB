/**
 * Envío del carril frío. Server-only.
 *
 * Vive acá y no dentro de la ruta porque lo usan dos lugares: el cron diario
 * (`/api/cron/daily-outreach`), que es el que manda de verdad, y la ruta
 * `/api/outreach/send`, que quedó para un envío puntual desde la ficha.
 *
 * **El tope diario se controla acá, en cada envío.** No en el que llama: así
 * un bucle del cron no puede pasarse ni aunque alguien le suba el lote.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { upsertContacto, enviarTransaccional } from '@/lib/brevo'
import { ASUNTOS_COMERCIO, ASUNTO_GENERICO, appUrl, generarMensaje } from '@/lib/mensajes'
import { ESTADOS_ORDEN, type EstadoProspecto, type Prospecto } from '@/lib/types'

// El dominio autenticado en Brevo es onconcilia.com (la raíz), no
// mkt.onconcilia.com — autenticar uno no autentica el otro. Se resignó el
// aislamiento de reputación entre marketing y producto (opción B, intentada y
// descartada el 04/09/2026: autenticar el subdominio aparte nunca validó).
const REMITENTE = { email: 'guillermo@onconcilia.com', name: 'Guillermo de OnConcilia' }

export function topeDiario(): number {
  return Number(process.env.OUTREACH_DAILY_LIMIT) || 50
}

function inicioDeHoyAR(): string {
  // Evita el bug UTC de "hoy" cruzando la medianoche en Argentina (UTC-3).
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
  return `${hoy}T00:00:00-03:00`
}

/** Correos fríos ya enviados hoy. Se cuentan de `interacciones`, que es el registro real. */
export async function enviadosHoy(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from('interacciones')
    .select('id', { count: 'exact', head: true })
    .eq('tipo', 'mensaje')
    .eq('canal', 'email')
    .gte('created_at', inicioDeHoyAR())
  return count ?? 0
}

/**
 * Qué paso de la secuencia le toca a un prospecto: 1 si nunca se le escribió,
 * 2 o 3 según cuántos correos ya se le mandaron. Se deduce contando
 * `interacciones`, en vez de guardar un contador aparte que se puede
 * desincronizar del registro real.
 */
export async function pasoQueSigue(supabase: SupabaseClient, prospectoId: string): Promise<1 | 2 | 3 | null> {
  const { count } = await supabase
    .from('interacciones')
    .select('id', { count: 'exact', head: true })
    .eq('prospecto_id', prospectoId)
    .eq('tipo', 'mensaje')
    .eq('canal', 'email')
  const ya = count ?? 0
  if (ya >= 3) return null
  return (ya + 1) as 1 | 2 | 3
}

/**
 * Envuelve el texto plano en HTML con identidad de marca — misma barra que la
 * secuencia opt-in, pero sin botón grande: sigue siendo un correo 1:1
 * personal, no una pieza de marketing. Las URLs del texto se convierten en un
 * link con texto fijo: mostrar la URL cruda queda feo y rompe el tono.
 */
function mensajeAHtml(mensaje: string): string {
  const textoLink = 'coordinemos acá'
  const escapado = mensaje.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const conLinks = escapado.replace(/(https?:\/\/\S+)/g, (match) => {
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

/** Texto del paso que corresponda, con el link a /coordinar/[id]. */
export function textoDelPaso(p: Prospecto, paso: 1 | 2 | 3, cupoLleno: boolean): string {
  return generarMensaje(p.sector, paso, {
    // Para comercios `nombre === empresa` (Places no da el nombre de una
    // persona): pasarlo rompería el saludo — "Hola La," para "La Tienda".
    nombre: p.sector === 'comercio' ? '' : p.nombre.split(' ')[0],
    empresa: p.empresa,
    cargo: p.cargo ?? undefined,
    id: p.id,
    cupoLleno,
  })
}

export interface ResultadoEnvio {
  ok: boolean
  error?: string
  /** Para que la ruta HTTP devuelva el status que corresponde. */
  status?: number
}

/**
 * Manda un correo frío y deja el rastro: actualiza el prospecto y registra la
 * interacción. Nunca tira: devuelve el motivo para que el llamador lo muestre
 * o lo cuente.
 */
export async function enviarCorreoFrio(
  supabase: SupabaseClient,
  p: Prospecto,
  mensaje: string
): Promise<ResultadoEnvio> {
  if (!p.email) return { ok: false, error: 'Sin email', status: 400 }

  if (p.email_estado && p.email_estado !== 'activo') {
    return {
      ok: false,
      error: `Está marcado como "${p.email_estado}" — no se le puede volver a escribir.`,
      status: 400,
    }
  }

  const limite = topeDiario()
  const ya = await enviadosHoy(supabase)
  if (ya >= limite) {
    return { ok: false, error: `Tope diario alcanzado (${ya}/${limite}). Se reinicia mañana.`, status: 429 }
  }

  // Sólo los que salieron de una búsqueda entran a "OnConcilia - Leads
  // Search" — el carril de LinkedIn no tiene lista propia en Brevo.
  const listIdSearch = Number(process.env.BREVO_LIST_ID_SEARCH) || undefined
  const brevoId = await upsertContacto({
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

  // Autoritativo del lado del servidor: el asunto nunca se toma de quien
  // llama. Único origen de verdad, `prospecto.variante_asunto`.
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
    return { ok: false, error: err instanceof Error ? err.message : 'Error al enviar', status: 500 }
  }

  // El estado nunca retrocede: un prospecto que ya agendó no vuelve a
  // "solicitud enviada" por recibir un seguimiento.
  const anterior = p.estado as EstadoProspecto
  const avanza = ESTADOS_ORDEN.indexOf('solicitud_enviada') > ESTADOS_ORDEN.indexOf(anterior)
  const nuevo = avanza ? 'solicitud_enviada' : anterior

  await supabase
    .from('prospectos')
    .update({
      estado: nuevo,
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
      ultimo_envio_en: new Date().toISOString(),
      ...(brevoId && !p.brevo_contact_id ? { brevo_contact_id: brevoId } : {}),
    })
    .eq('id', p.id)

  await supabase.from('interacciones').insert({
    prospecto_id: p.id,
    tipo: 'mensaje',
    contenido: mensaje,
    canal: 'email',
    estado_anterior: anterior,
    estado_nuevo: nuevo,
  })

  return { ok: true }
}
