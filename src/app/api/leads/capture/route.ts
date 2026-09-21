import { createClient } from '@supabase/supabase-js'
import { upsertContacto } from '@/lib/brevo'
import { toE164Ar } from '@/lib/phone'
import { filaProspectoLanding } from '@/lib/prospects/desdeLanding'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Alta desde el formulario de la landing (`BetaForm`).
 *
 * **Escribe en `prospectos`, no en `leads`.** Los dos carriles —búsqueda en
 * Places y formulario— viven en la misma tabla y se distinguen por `origen`.
 * `leads` quedó como archivo histórico: mantener el mismo contacto en dos
 * tablas obligaba a sincronizar "si agendó" en los dos lados, y `prospectos`
 * ya tiene todo lo que hacía falta (estados, historial de interacciones y las
 * columnas de Brevo).
 *
 * Los datos se guardan **antes** de mostrar el calendario, así que quien
 * abandona ahí queda igual registrado y entra a la secuencia de recordatorios.
 * Quien después agenda sale de la lista por `/api/cal/webhook`, para que no le
 * sigan llegando recordatorios de hacer algo que ya hizo.
 */
export async function POST(req: Request) {
  const { email, nombre, telefono, nota } = await req.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Falta el email' }, { status: 400 })
  }

  const limpio = email.toLowerCase().trim()
  const fila = filaProspectoLanding({ email: limpio, nombre, telefono, nota })

  const { data: existente } = await supabase
    .from('prospectos')
    .select('id, estado')
    .eq('email', limpio)
    .limit(1)
    .maybeSingle()

  if (existente) {
    // Puede ser un prospecto del carril frío que decidió anotarse por la
    // landing, o alguien corrigiendo un dato. Gana lo último que escribió,
    // pero sólo en los campos que vinieron con valor: un reenvío incompleto
    // no debe borrar lo que ya había. `origen` y `estado` no se tocan —
    // alguien que viene de la búsqueda sigue siendo de la búsqueda, y el
    // estado lo maneja el CRM.
    const cambios = Object.fromEntries(
      Object.entries({
        nombre: fila.nombre,
        telefono: fila.telefono,
        notas: fila.notas,
      }).filter(([, v]) => v !== null && v !== undefined)
    )
    if (Object.keys(cambios).length > 0) {
      await supabase.from('prospectos').update(cambios).eq('id', existente.id)
    }
  } else {
    const { error } = await supabase.from('prospectos').insert(fila)
    if (error) {
      console.error('[leads/capture]', error.message)
      return Response.json({ error: 'Error al guardar' }, { status: 500 })
    }
  }

  // `NOMBRE`, no `FIRSTNAME`: Brevo nombra sus atributos de fábrica en el
  // idioma de la cuenta, y ésta está en español. Importa porque Brevo ignora
  // en silencio un atributo inexistente — no da error, el dato simplemente no
  // se guarda. Brevo rechaza SMS si no viene en E.164, así que un teléfono
  // que no se pueda normalizar se omite en vez de invalidar todo el upsert.
  const e164 = typeof telefono === 'string' ? toE164Ar(telefono)?.e164 ?? null : null
  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  if (listId) {
    const brevoId = await upsertContacto({
      email: limpio,
      attributes: {
        ...(fila.nombre ? { NOMBRE: fila.nombre as string } : {}),
        ...(e164 ? { SMS: e164 } : {}),
      },
      listIds: [listId],
    })
    if (brevoId) {
      await supabase.from('prospectos').update({ brevo_contact_id: brevoId }).eq('email', limpio)
    }
  }

  return Response.json({ ok: true })
}
