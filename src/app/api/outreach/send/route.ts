import { createClient } from '@supabase/supabase-js'
import { upsertContacto, enviarTransaccional } from '@/lib/brevo'
import { ASUNTOS_COMERCIO, ASUNTO_GENERICO } from '@/lib/mensajes'

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
        htmlContent: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${mensaje.replace(/</g, '&lt;')}</div>`,
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
