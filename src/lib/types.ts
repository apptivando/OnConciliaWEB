export type Sector = 'pyme' | 'estudio' | 'franquicia'
export type Canal = 'linkedin' | 'email' | 'referido' | 'otro'
export type TipoInteraccion = 'mensaje' | 'email' | 'llamada' | 'demo' | 'nota' | 'cambio_estado'

export type EstadoProspecto =
  | 'por_contactar'
  | 'solicitud_enviada'
  | 'conexion_aceptada'
  | 'mensaje_enviado'
  | 'respondio_positivo'
  | 'demo_agendada'
  | 'demo_realizada'
  | 'beta_activo'
  | 'feedback_recopilado'
  | 'descartado'

export interface Prospecto {
  id: string
  nombre: string
  empresa: string
  sector: Sector
  cargo: string | null
  canal: Canal
  linkedin_url: string | null
  email: string | null
  estado: EstadoProspecto
  proxima_accion: string | null
  fecha_proxima_accion: string | null
  notas: string | null
  fecha_primer_contacto: string | null
  fecha_ultimo_contacto: string | null
  created_at: string
  updated_at: string
}

export interface Interaccion {
  id: string
  prospecto_id: string
  tipo: TipoInteraccion
  contenido: string | null
  canal: string | null
  estado_anterior: string | null
  estado_nuevo: string | null
  created_at: string
}

export const ESTADOS: Record<EstadoProspecto, { label: string; color: string }> = {
  por_contactar:      { label: 'Por contactar',       color: 'bg-slate-100 text-slate-700' },
  solicitud_enviada:  { label: 'Solicitud enviada',    color: 'bg-blue-100 text-blue-700' },
  conexion_aceptada:  { label: 'Conexión aceptada',    color: 'bg-indigo-100 text-indigo-700' },
  mensaje_enviado:    { label: 'Mensaje enviado',      color: 'bg-violet-100 text-violet-700' },
  respondio_positivo: { label: 'Respondió positivo',  color: 'bg-yellow-100 text-yellow-700' },
  demo_agendada:      { label: 'Demo agendada',        color: 'bg-orange-100 text-orange-700' },
  demo_realizada:     { label: 'Demo realizada',       color: 'bg-emerald-100 text-emerald-700' },
  beta_activo:        { label: 'Beta activo',          color: 'bg-green-100 text-green-700' },
  feedback_recopilado:{ label: 'Feedback recopilado',  color: 'bg-teal-100 text-teal-700' },
  descartado:         { label: 'Descartado',           color: 'bg-red-100 text-red-700' },
}

export const SECTORES: Record<Sector, string> = {
  pyme:       'Pyme',
  estudio:    'Estudio contable',
  franquicia: 'Franquicia',
}

export const ESTADOS_ORDEN: EstadoProspecto[] = [
  'por_contactar',
  'solicitud_enviada',
  'conexion_aceptada',
  'mensaje_enviado',
  'respondio_positivo',
  'demo_agendada',
  'demo_realizada',
  'beta_activo',
  'feedback_recopilado',
  'descartado',
]
