export type Sector = 'pyme' | 'estudio' | 'franquicia' | 'comercio'
export type Canal = 'linkedin' | 'email' | 'whatsapp' | 'referido' | 'otro'
export type TipoInteraccion = 'mensaje' | 'email' | 'llamada' | 'demo' | 'nota' | 'cambio_estado'
export type OrigenProspecto = 'busqueda' | 'landing' | 'manual'
export type EmailEstado = 'activo' | 'rebotado' | 'baja' | 'spam'

export interface RedesProspecto {
  instagram: string | null
  facebook: string | null
  linkedin: string | null
}

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
  telefono: string | null
  whatsapp: string | null
  sitio_web: string | null
  estado: EstadoProspecto
  proxima_accion: string | null
  fecha_proxima_accion: string | null
  notas: string | null
  fecha_primer_contacto: string | null
  fecha_ultimo_contacto: string | null
  created_at: string
  updated_at: string
  // Columnas del buscador con Google Places (migrate_prospectos_places.sql)
  google_place_id: string | null
  direccion: string | null
  maps_url: string | null
  localidad: string | null
  rating: number | null
  reviews_count: number | null
  prioridad_contacto: number | null
  origen: OrigenProspecto
  redes: RedesProspecto | null
  enriquecido_en: string | null
  intentos_enriquecimiento: number
  // Columnas del envío 1:1 vía Brevo (migrate_prospectos_brevo.sql)
  brevo_contact_id: string | null
  email_estado: EmailEstado
  ultimo_envio_en: string | null
  baja_en: string | null
  baja_motivo: string | null
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
  comercio:   'Comercio',
}

/** 1=WhatsApp confirmado, 2=email, 3=solo teléfono, 4=sin contacto. */
export const PRIORIDAD_CONTACTO: Record<number, { label: string; color: string }> = {
  1: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700' },
  2: { label: 'Email',    color: 'bg-blue-100 text-blue-700' },
  3: { label: 'Teléfono', color: 'bg-amber-100 text-amber-700' },
  4: { label: 'Sin contacto', color: 'bg-slate-100 text-slate-500' },
}

export const ORIGEN_STYLE: Record<OrigenProspecto, { label: string; color: string }> = {
  busqueda: { label: 'Búsqueda', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  landing:  { label: 'Landing',  color: 'bg-violet-50 text-violet-700 border-violet-100' },
  manual:   { label: 'Manual',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
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
