import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) return Response.json({ error: 'Email requerido' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://onconcilia.com'
  const token = Buffer.from(email).toString('base64url')
  const solicitudUrl = `${appUrl}/solicitud?t=${token}`

  const { error } = await resend.emails.send({
    from: 'Guillermo de OnConcilia <guillermo@onconcilia.com>',
    to: email,
    subject: '¿Te reservo un lugar en la beta de OnConcilia?',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <p style="font-size: 16px; margin-bottom: 16px;">Hola,</p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Vi que te anotaste en la lista de espera de OnConcilia — gracias por el interés.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Estamos seleccionando los primeros 20 usuarios beta. El acceso es gratuito por 60 días
          y a cambio pedimos 30 minutos de feedback honesto sobre la herramienta.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Para reservarte el lugar, necesito saber un poco más de tu contexto:
        </p>

        <a href="${solicitudUrl}"
           style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Completar mi solicitud →
        </a>

        <p style="font-size: 14px; color: #64748b; margin-top: 32px; line-height: 1.6;">
          Son 4 preguntas, menos de 2 minutos.<br>
          Si ya no te interesa, ignorá este mensaje.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

        <p style="font-size: 13px; color: #94a3b8;">
          Guillermo Reula<br>
          OnConcilia · guillermo@onconcilia.com
        </p>
      </div>
    `,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
