import { createClient } from '@supabase/supabase-js'
import { upsertContacto } from '@/lib/brevo'
import { toE164Ar } from '@/lib/phone'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Alta de un lead desde la landing (`BetaForm`). Reemplazó al insert directo
 * que hacía el viejo `LeadForm` desde el navegador con la anon key: pasa por
 * acá para poder sincronizar el contacto en Brevo del lado del servidor.
 *
 * Recibe nombre y teléfono además del correo, porque el formulario de la
 * landing es ahora el mismo de la reunión — se piden los datos, se guardan, y
 * recién después se muestra el calendario. Si la persona cierra la pestaña
 * antes de elegir horario, el contacto ya quedó.
 *
 * La secuencia de 3 correos no la dispara este código: es un Automation en
 * el dashboard de Brevo, activado por entrar a la lista
 * `BREVO_LIST_ID_LEADS`. Quien después agenda sale de esa lista por
 * `/api/cal/webhook`, para que no le sigan llegando recordatorios de hacer
 * algo que ya hizo.
 */
export async function POST(req: Request) {
  const { email, nombre, telefono, nota, fuente } = await req.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Falta el email' }, { status: 400 })
  }

  const limpio = email.toLowerCase().trim()
  const tel = typeof telefono === 'string' ? telefono.trim() : null

  const fila = {
    email: limpio,
    nombre: typeof nombre === 'string' ? nombre.trim() || null : null,
    telefono: tel || null,
    nota: typeof nota === 'string' ? nota.trim() || null : null,
    fuente: fuente ?? 'landing',
  }

  const { error } = await supabase.from('leads').insert(fila)

  if (error) {
    if (error.code === '23505') {
      // Email duplicado. Se trata como éxito —igual que antes— y gana lo
      // último que la persona escribió: si vuelve a mandar el formulario es
      // porque está corrigiendo algo, típicamente un teléfono mal tipeado.
      // Sólo se pisan los campos que vinieron con valor, así un reenvío
      // incompleto no borra lo que ya había.
      const cambios = Object.fromEntries(
        Object.entries({ nombre: fila.nombre, telefono: fila.telefono, nota: fila.nota }).filter(
          ([, v]) => v !== null
        )
      )
      if (Object.keys(cambios).length > 0) {
        await supabase.from('leads').update(cambios).eq('email', limpio)
      }
    } else {
      return Response.json({ error: 'Error al guardar' }, { status: 500 })
    }
  }

  // `NOMBRE`, no `FIRSTNAME`: **Brevo nombra sus atributos de fábrica en el
  // idioma de la cuenta**, y ésta está en español, así que son `NOMBRE` y
  // `APELLIDOS`. Verificado contra `GET /v3/contacts/attributes` el
  // 20/09/2026 — `FIRSTNAME` no existe en esta cuenta. Importa porque Brevo
  // **ignora en silencio** un atributo que no existe: no devuelve error, el
  // dato simplemente no se guarda y el `{% if %}` de la plantilla nunca da
  // verdadero.
  //
  // Brevo rechaza SMS si no viene en E.164, así que un teléfono que no se
  // pueda normalizar se omite en vez de invalidar todo el upsert.
  const e164 = tel ? toE164Ar(tel)?.e164 ?? null : null
  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  if (listId) {
    const brevoId = await upsertContacto({
      email: limpio,
      attributes: {
        ...(fila.nombre ? { NOMBRE: fila.nombre } : {}),
        ...(e164 ? { SMS: e164 } : {}),
      },
      listIds: [listId],
    })
    if (brevoId) {
      await supabase.from('leads').update({ brevo_contact_id: brevoId }).eq('email', limpio)
    }
  }

  return Response.json({ ok: true })
}
