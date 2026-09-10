import { createClient } from '@supabase/supabase-js'
import { upsertContacto } from '@/lib/brevo'

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
  if (listId) {
    await upsertContacto({ email: limpio, listIds: [listId] })
  }

  return Response.json({ ok: true })
}
