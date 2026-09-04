import { createClient } from '@supabase/supabase-js'
import { upsertContacto, enviarTransaccional } from '@/lib/brevo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REMITENTE = { email: 'guillermo@mkt.onconcilia.com', name: 'Guillermo de OnConcilia' }
const REPLY_TO = { email: 'guillermo@onconcilia.com' }

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

    const nuevoId = await upsertContacto({
      email: p.email,
      attributes: {
        EMPRESA: p.empresa,
        LOCALIDAD: p.localidad ?? '',
        SECTOR: p.sector,
        PRIORIDAD: p.prioridad_contacto ?? '',
      },
    })
    if (nuevoId && !brevoContactId) brevoContactId = nuevoId

    try {
      await enviarTransaccional({
        to: { email: p.email, name: p.nombre },
        sender: REMITENTE,
        replyTo: REPLY_TO,
        subject: `${p.nombre.split(' ')[0]}, ¿conversamos sobre OnConcilia?`,
        htmlContent: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.7;color:#1e293b;white-space:pre-wrap">${mensaje.replace(/</g, '&lt;')}</div>`,
        textContent: mensaje,
        tags: ['outreach-frio'],
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
