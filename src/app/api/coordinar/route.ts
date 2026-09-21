import { createClient } from '@supabase/supabase-js'
import { upsertContacto } from '@/lib/brevo'
import { toE164Ar } from '@/lib/phone'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Público — sin login. Lo llama /coordinar/[id], el link del correo frío a
 * comercios. Actualiza el prospecto existente, no crea uno nuevo (a
 * diferencia de /api/leads/capture, que sí es alta nueva).
 *
 * Guarda el contacto acá y recién después se muestra el embed de Cal.com
 * para elegir el turno — así el teléfono y la nota quedan en el CRM aunque la
 * persona cierre la pestaña antes de terminar de agendar.
 *
 * **Y acá se cruzan los dos carriles, que es el punto de este endpoint.**
 * Brevo prohíbe mandar campañas a listas armadas por scraping, y por eso el
 * correo frío sale uno por uno como transaccional, nunca como campaña. Pero
 * alguien que completa este formulario dejó de ser un dato scrapeado: se dio
 * de alta solo. Ahí sí corresponde sumarlo a la lista opt-in y que le corra
 * la secuencia de recordatorios, igual que a los que vienen de la landing. Si
 * después elige horario, el webhook de Cal.com lo saca de la lista.
 */
export async function POST(req: Request) {
  const { prospecto_id, nombre, telefono, nota } = await req.json()

  if (!prospecto_id || !nombre || !telefono) {
    return Response.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { data: p, error: fetchError } = await supabase
    .from('prospectos')
    .select('id, estado, telefono, notas, fecha_primer_contacto, email, email_estado')
    .eq('id', prospecto_id)
    .single()

  if (fetchError || !p) {
    return Response.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  }

  const hoy = new Date().toISOString().split('T')[0]
  const bancos = typeof nota === 'string' && nota.trim() ? nota.trim() : null

  await supabase
    .from('prospectos')
    .update({
      // El nombre que deja la persona pasa a ser el nombre de la ficha. En
      // los comercios de Places `nombre` venía igual a la empresa, porque
      // Google no da el nombre de nadie: hasta ahora el formulario lo
      // guardaba sólo como texto en una nota del Timeline y la ficha seguía
      // mostrando el comercio como si fuera la persona. La empresa no se
      // toca, y la tabla muestra las dos.
      nombre,
      // No se pisa un teléfono que ya teníamos con uno distinto sin querer —
      // el que deja la persona en el formulario es el que vale.
      telefono: telefono || p.telefono,
      // Lo que contestó en "¿con qué bancos trabajan?" va a las notas de la
      // ficha y no sólo al Timeline: es el dato que define si hay que
      // desarrollar un lector antes de activarle la cuenta, y tiene que
      // verse sin tener que ir a buscarlo.
      ...(bancos ? { notas: [p.notas, `Trabaja con: ${bancos}`].filter(Boolean).join('\n') } : {}),
      estado: 'respondio_positivo',
      // Explícito, porque el formulario se completa ANTES de ver el
      // calendario: en este momento todavía no eligió horario. Si lo elige,
      // el webhook de Cal.com pisa esto con la fecha de la reunión; si no,
      // queda así y dice la verdad.
      proxima_accion: `${nombre} dejó sus datos pero todavía no eligió horario — le llegan los recordatorios de agendar`,
      fecha_ultimo_contacto: hoy,
      fecha_primer_contacto: p.fecha_primer_contacto ?? hoy,
    })
    .eq('id', prospecto_id)

  // Dos filas separadas, no una combinada — es como ya lo hace TabAcciones:
  // el timeline solo pinta la vista de "cambió de estado" cuando
  // tipo='cambio_estado', y ese tipo no muestra `contenido`.
  await supabase.from('interacciones').insert({
    prospecto_id,
    tipo: 'cambio_estado',
    estado_anterior: p.estado,
    estado_nuevo: 'respondio_positivo',
  })
  await supabase.from('interacciones').insert({
    prospecto_id,
    tipo: 'nota',
    canal: 'formulario',
    contenido:
      `Completó el formulario: ${nombre}, ${telefono}${bancos ? `, trabaja con ${bancos}` : ''}. ` +
      `Todavía no eligió horario: entra a los recordatorios de agendar.`,
  })

  // Sólo si tenemos correo y sigue siendo enviable: sumar a la lista a
  // alguien que rebotó o se dio de baja sería justo lo contrario de lo que
  // el webhook de bajas viene a proteger.
  const listId = Number(process.env.BREVO_LIST_ID_LEADS)
  if (listId && p.email && (p.email_estado ?? 'activo') === 'activo') {
    const e164 = toE164Ar(telefono)?.e164 ?? null
    await upsertContacto({
      email: p.email,
      attributes: {
        NOMBRE: nombre,
        ...(e164 ? { SMS: e164 } : {}),
      },
      listIds: [listId],
    })
  }

  return Response.json({ ok: true })
}
