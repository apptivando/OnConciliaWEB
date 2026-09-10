import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Reemplaza el insert directo que hacía `LeadForm.tsx` desde el navegador
 * (cliente anon → tabla `leads`). Pasa por acá para poder sincronizar el
 * contacto en Brevo del lado del servidor — el insert directo no tenía
 * ningún punto donde enganchar eso.
 *
 * La secuencia de 3 pasos no la dispara este código: se configura como un
 * Automation en el dashboard de Brevo, activado por entrar a la lista
 * `BREVO_LIST_ID_LEADS`.
 */
export async function POST(req: Request) {
  const { email, fuente } = await req.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Falta el email' }, { status: 400 })
  }

  const limpio = email.toLowerCase().trim()

  const { error } = await supabase
    .from('leads')
    .insert({ email: limpio, fuente: fuente ?? 'landing' })

  if (error && error.code !== '23505') {
    // 23505 = email duplicado — lo tratamos como éxito, igual que antes.
    return Response.json({ error: 'Error al guardar' }, { status: 500 })
  }

  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  // DEBUG TEMPORAL — diagnosticando por qué el contacto no llega a Brevo en
  // dev. Saca esto en cuanto se confirme la causa (ver historial.md).
  const debug: Record<string, unknown> = { hasApiKey: !!process.env.BREVO_API_KEY, listId }
  if (listId) {
    try {
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY ?? '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: limpio, listIds: [listId], updateEnabled: true }),
      })
      debug.status = res.status
      debug.body = await res.text()
    } catch (err) {
      debug.err = String(err)
    }
  }

  return Response.json({ ok: true, debug })
}
