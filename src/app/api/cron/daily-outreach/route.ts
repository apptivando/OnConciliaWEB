import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { generarMensaje } from '@/lib/mensajes'
import { Sector } from '@/lib/types'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  // En producción Vercel valida el cron automáticamente.
  // Para testing manual, aceptar ?secret=
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  const cronHeader = req.headers.get('x-vercel-cron')
  if (!cronHeader && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Prospectos con email en estado "por_contactar"
  const { data: prospectos } = await supabase
    .from('prospectos')
    .select('*')
    .eq('estado', 'por_contactar')
    .not('email', 'is', null)
    .limit(20)

  const enviados: string[] = []
  const errores: string[] = []

  for (const p of prospectos ?? []) {
    const nombre = p.nombre.split(' ')[0]
    const mensaje = generarMensaje(p.sector as Sector, 1, {
      nombre,
      empresa: p.empresa,
      cargo: p.cargo ?? undefined,
    })

    const { error } = await resend.emails.send({
      from: 'Guillermo de OnConcilia <guillermo@onconcilia.com>',
      to: p.email,
      subject: `Hola ${nombre}, ¿te cuento sobre OnConcilia?`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; font-size: 15px; line-height: 1.7;">
          ${mensaje.replace(/\n/g, '<br>')}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
          <p style="font-size: 13px; color: #94a3b8;">
            Guillermo Reula<br>
            OnConcilia · guillermo@onconcilia.com
          </p>
        </div>
      `,
    })

    if (!error) {
      await supabase
        .from('prospectos')
        .update({ estado: 'solicitud_enviada', fecha_ultimo_contacto: new Date().toISOString().split('T')[0] })
        .eq('id', p.id)

      await supabase.from('interacciones').insert({
        prospecto_id: p.id,
        tipo: 'email',
        contenido: mensaje,
        canal: 'email',
        estado_anterior: 'por_contactar',
        estado_nuevo: 'solicitud_enviada',
      })

      enviados.push(p.email)
    } else {
      errores.push(`${p.email}: ${error.message}`)
    }
  }

  return Response.json({
    enviados: enviados.length,
    emails: enviados,
    errores,
    timestamp: new Date().toISOString(),
  })
}
