import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Público — sin login. Lo llama /coordinar/[id], el link del email frío a
 * comercios. Actualiza el prospecto existente, no crea uno nuevo (a
 * diferencia de /api/leads/qualify, que sí es alta nueva).
 *
 * Guarda el contacto acá y recién después se muestra el embed de Cal.com
 * para elegir el turno — así el teléfono/nota quedan en el CRM aunque la
 * persona cierre la pestaña antes de terminar de agendar.
 */
export async function POST(req: Request) {
  const { prospecto_id, nombre, telefono, nota } = await req.json()

  if (!prospecto_id || !nombre || !telefono) {
    return Response.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { data: p, error: fetchError } = await supabase
    .from('prospectos')
    .select('id, estado, telefono, notas, fecha_primer_contacto')
    .eq('id', prospecto_id)
    .single()

  if (fetchError || !p) {
    return Response.json({ error: 'Prospecto no encontrado' }, { status: 404 })
  }

  const hoy = new Date().toISOString().split('T')[0]

  await supabase
    .from('prospectos')
    .update({
      // No se pisa un teléfono que ya teníamos con uno distinto sin querer —
      // el que deja la persona en el formulario es el que vale.
      telefono: telefono || p.telefono,
      estado: 'respondio_positivo',
      proxima_accion: `Llamar a ${nombre} — turno a coordinar por Cal.com`,
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
    contenido: `Dejó sus datos para coordinar llamada — nombre: ${nombre}, teléfono: ${telefono}${nota ? `, nota: ${nota}` : ''}. Turno a confirmar por Cal.com.`,
  })

  return Response.json({ ok: true })
}
