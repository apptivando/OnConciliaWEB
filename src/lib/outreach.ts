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
export const REMITENTE = { email: 'guillermo@onconcilia.com', name: 'Guillermo de OnConcilia' }

/**
 * A dónde van las respuestas al correo frío.
 *
 * Con `OUTREACH_REPLY_TO=guillermo@respuestas.onconcilia.com`, la respuesta
 * la recibe Brevo, que la pasa a `/api/brevo/inbound`: ahí se registra en el
 * CRM (y el prospecto sale del recordatorio de los 15 días) y se reenvía a
 * la casilla de siempre para contestar.
 *
 * Sin la variable, las respuestas llegan directo a la casilla, como antes.
 * Está detrás de una variable a propósito: mientras la respuesta pasa por
 * nuestra ruta, si la ruta falla la respuesta no llega. Se activa recién
 * después de probar el circuito entero con un correo real.
 */
function responderA(): { email: string; name: string } {
  return { email: process.env.OUTREACH_REPLY_TO || REMITENTE.email, name: REMITENTE.name }
}

/**
 * Si el prospecto contestó el correo. Lo registra `/api/brevo/inbound` como
 * una interacción con canal 'respuesta'; las respuestas automáticas (fuera de
 * la oficina) van con otro canal y no cuentan: no son una persona contestando.
 */
export async function contestoElCorreo(supabase: SupabaseClient, prospectoId: string): Promise<boolean> {
  const { count } = await supabase
    .from('interacciones')
    .select('id', { count: 'exact', head: true })
    .eq('prospecto_id', prospectoId)
    .eq('canal', 'respuesta')
  return (count ?? 0) > 0
}

function hoyAR(): string {
  // Evita el bug UTC de "hoy" cruzando la medianoche en Argentina (UTC-3).
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

function inicioDeHoyAR(): string {
  return `${hoyAR()}T00:00:00-03:00`
}

/**
 * Tope del día, **distinto cada día** dentro de un rango.
 *
 * Mandar siempre la misma cantidad exacta es un patrón de robot. Se toma un
 * número al azar entre `OUTREACH_DAILY_MIN` y `OUTREACH_DAILY_MAX`, pero
 * sembrado con la fecha: las tres corridas del mismo día tienen que ver el
 * mismo tope, o la tercera podría sortear uno más bajo que lo ya enviado y la
 * suma del día no respondería a ningún número.
 *
 * Si sólo está `OUTREACH_DAILY_LIMIT` (la variable de antes), se usa como
 * tope fijo, así un deploy sin las variables nuevas no cambia de golpe.
 */
export function topeDiario(): number {
  const fijo = Number(process.env.OUTREACH_DAILY_LIMIT) || 50
  const min = Number(process.env.OUTREACH_DAILY_MIN) || fijo
  const max = Math.max(Number(process.env.OUTREACH_DAILY_MAX) || fijo, min)
  if (min === max) return min

  // FNV-1a sobre la fecha: sin dependencias, determinístico, y alcanza para
  // repartir parejo un rango chico.
  let h = 0x811c9dc5
  for (const c of hoyAR()) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return min + ((h >>> 0) % (max - min + 1))
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
 * Cuántos correos tiene la secuencia fría: la apertura y **un solo
 * recordatorio a los 15 días**, con texto parecido. Decidido el 21/09/2026.
 *
 * No confundir con la automatización de Brevo, que son los 3 recordatorios
 * de agendar para quien sí completó el formulario. Esta secuencia es para
 * quien nunca respondió, y a esa persona no se le escribe más de dos veces.
 */
export const PASOS_FRIO = 2

/** Días entre la apertura y el recordatorio. */
export const DIAS_RECORDATORIO = 15

/**
 * Qué paso le toca a un prospecto: 1 si nunca se le escribió, 2 si ya recibió
 * la apertura, `null` si ya recibió los dos. Se deduce contando
 * `interacciones`, en vez de guardar un contador aparte que se puede
 * desincronizar del registro real.
 */
export async function pasoQueSigue(supabase: SupabaseClient, prospectoId: string): Promise<1 | 2 | null> {
  const { count } = await supabase
    .from('interacciones')
    .select('id', { count: 'exact', head: true })
    .eq('prospecto_id', prospectoId)
    .eq('tipo', 'mensaje')
    .eq('canal', 'email')
  const ya = count ?? 0
  if (ya >= PASOS_FRIO) return null
  return (ya + 1) as 1 | 2
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
export function textoDelPaso(p: Prospecto, paso: 1 | 2, cupoLleno: boolean): string {
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

  // El contacto se crea en Brevo, pero **no se suma a ninguna lista**. Entrar
  // a "OnConcilia - Leads Search" disparaba la Automatización #2, que mandaba
  // el mismo correo frío por su cuenta: el 21/09/2026 eso produjo envíos
  // duplicados con este cron. Queda apagada, y sin nadie entrando a la lista
  // no puede volver a disparar aunque alguien la reactive por error.
  const brevoId = await upsertContacto({
    email: p.email,
    attributes: {
      EMPRESA: p.empresa,
      LOCALIDAD: p.localidad ?? '',
      SECTOR: p.sector,
      // PRIORIDAD es numérico en Brevo — null, no '', cuando no hay valor.
      PRIORIDAD: p.prioridad_contacto ?? null,
    },
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
      replyTo: responderA(),
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
