export type Nivel = 'interno' | 'compartible'
export type Grupo = 'vender' | 'acordar' | 'estrategia'

export type Documento = {
  slug: string
  titulo: string
  resumen: string
  cuando: string
  nivel: Nivel
  grupo: Grupo
  /** Archivo en /content. Si falta, el documento tiene página propia. */
  archivo?: string
  tags: string[]
}

export const GRUPOS: { id: Grupo; titulo: string; bajada: string }[] = [
  {
    id: 'vender',
    titulo: 'Para vender',
    bajada: 'Lo que se consulta durante una reunión o una llamada.',
  },
  {
    id: 'acordar',
    titulo: 'Para acordar',
    bajada: 'Precios, comisiones y condiciones. Lectura previa, no consulta en vivo.',
  },
  {
    id: 'estrategia',
    titulo: 'Estrategia y planes',
    bajada: 'El plan de fondo y su estado de avance.',
  },
]

export const NIVELES: Record<Nivel, { etiqueta: string; detalle: string; clase: string }> = {
  interno: {
    etiqueta: 'Interno',
    detalle: 'No compartir con clientes ni referidores',
    clase: 'bg-red-50 text-red-700 border-red-200',
  },
  compartible: {
    etiqueta: 'Compartible',
    detalle: 'Se puede enviar a un referidor',
    clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
}

export const DOCUMENTOS: Documento[] = [
  {
    slug: 'objeciones',
    titulo: 'Objeciones comerciales',
    resumen:
      'Por qué trabajamos con el extracto descargado y no con una API, y cómo convertir esa objeción en ventaja. Incluye la tarjeta resumen, diez objeciones con respuesta literal y once argumentos de fondo.',
    cuando: 'En la reunión, apenas aparece el tema. Buscá la objeción y leé la respuesta.',
    nivel: 'interno',
    grupo: 'vender',
    tags: [
      'api', 'banco', 'automatico', 'seguridad', 'credenciales', 'interbanking',
      'belvo', 'scraping', 'contador', 'manual', 'mercado pago', 'objecion',
      'reencuadre', 'open banking', 'extracto', 'excel', 'planilla', 'ia',
      'privacidad', 'datos', 'competencia',
    ],
  },
  {
    slug: 'guion-reunion',
    titulo: 'Guion de la reunión de 15 minutos',
    resumen:
      'La primera llamada con quien agendó: siete preguntas abiertas para que el cliente cuente cómo lleva hoy los movimientos y qué busca, la devolución, el cierre con la beta y qué anotar en la ficha.',
    cuando: 'Abierto al lado durante la llamada. Leelo una vez antes de la primera.',
    nivel: 'interno',
    grupo: 'vender',
    archivo: 'guion-reunion.md',
    tags: [
      'reunion', 'llamada', 'guion', 'preguntas', 'escuchar', 'beta', 'cierre',
      'bancos', 'modulos', 'demo', 'calificacion', 'ficha',
    ],
  },
  {
    slug: 'programa-referidores',
    titulo: 'Programa de referidores',
    resumen:
      'La pieza que se le presenta a un referidor: qué vende, a quién buscar, cómo abrir la conversación, cuánto cobra y cómo funciona el circuito.',
    cuando: 'Antes de la primera reunión con un referidor. Se le puede enviar tal cual.',
    nivel: 'compartible',
    grupo: 'acordar',
    archivo: 'programa-referidores.md',
    tags: [
      'referidor', 'comision', 'precios', 'planes', 'base', 'pro', 'enterprise',
      'modulos', 'puesta en marcha', 'formas de pago', 'cola de espera', 'calificacion',
    ],
  },
  {
    slug: 'canal-de-reventa',
    titulo: 'Canal de reventa',
    resumen:
      'El análisis completo: cómo se construyó el precio, cuántas horas lleva cada implementación, qué margen queda y dónde está el techo de capacidad.',
    cuando: 'Para decidir precios o revisar el esquema de comisión. Nunca en una reunión con terceros.',
    nivel: 'interno',
    grupo: 'acordar',
    archivo: 'canal-de-reventa.md',
    tags: [
      'precio', 'margen', 'comision', 'capacidad', 'automatizacion', 'icl',
      'ajuste', 'benchmark', 'fonder', 'asentia', 'conciliac', 'roi', 'cct',
      'puesta en marcha', 'horas', 'base', 'pro', 'enterprise', 'fundador',
      'monotributo', 'factura c', 'senuelo', 'ancla',
    ],
  },
  {
    slug: 'estrategia-marketing',
    titulo: 'Estrategia de marketing',
    resumen: 'El plan general por fases, del cero a la captación sostenida.',
    cuando: 'Para ubicar en qué etapa estamos y qué viene después.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'estrategia-marketing.md',
    tags: ['estrategia', 'fases', 'plan', 'marketing'],
  },
  {
    slug: 'fase0-marketing',
    titulo: 'Fase 0 — Credibilidad mínima',
    resumen: 'LinkedIn del fundador, landing y contenido semilla. La base para poder salir a hablar con alguien.',
    cuando: 'Referencia de lo ya ejecutado.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'fase0-marketing.md',
    tags: ['fase 0', 'linkedin', 'landing', 'credibilidad', 'contenido'],
  },
  {
    slug: 'fase1-outreach',
    titulo: 'Fase 1 — Outreach y validación',
    resumen:
      'Segmentación en pymes, estudios contables y franquicias; secuencia de contacto en doce semanas y guion de entrevistas de feedback.',
    cuando: 'Antes de armar una tanda de contactos o una entrevista con un beta.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'fase1-outreach.md',
    tags: ['fase 1', 'outreach', 'prospectos', 'segmentos', 'entrevistas', 'beta'],
  },
  {
    slug: 'plan-herramientas',
    titulo: 'Plan de herramientas',
    resumen: 'Las seis etapas de herramientas propias: landing, CRM, generador de mensajes, dashboard, feedback y blog.',
    cuando: 'Para decidir qué construir después.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'plan-herramientas.md',
    tags: ['herramientas', 'etapas', 'crm', 'roadmap'],
  },
  {
    slug: 'plan-landing-brevo',
    titulo: 'Plan operativo: landing, CRM y Brevo',
    resumen: 'El plan de implementación detallado de la landing, el CRM de prospectos y la integración con Brevo.',
    cuando: 'Referencia técnica de cómo quedó armado este sistema.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'plan-landing-brevo.md',
    tags: ['brevo', 'landing', 'crm', 'email', 'implementacion'],
  },
  {
    slug: 'plan-beta-planes',
    titulo: 'Plan: programa beta y pasaje a los tres planes',
    resumen:
      'Las cinco etapas del programa beta, la grilla nueva de planes con los módulos opcionales, y el rendimiento medido del buscador. Reemplaza las partes de landing y Brevo del plan anterior.',
    cuando: 'Es el plan vigente. Se consulta antes de tocar campañas, precios o el buscador.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'plan-beta-planes.md',
    tags: [
      'beta', 'planes', 'base', 'pro', 'enterprise', 'modulos', 'opcionales',
      'historial', 'encuestas', 'buscador', 'embudo', 'descuento', 'reunion',
    ],
  },
  {
    slug: 'checklist-busqueda',
    titulo: 'Checklist de búsqueda — ciudad × rubro',
    resumen:
      'Las 48 ciudades en orden (capitales primero, después por peso económico) con los diez rubros de cada una, para ir tildando a medida que se buscan.',
    cuando: 'Cada vez que se dispara una tanda de búsqueda desde /prospectos.',
    nivel: 'interno',
    grupo: 'estrategia',
    archivo: 'checklist-busqueda.md',
    tags: ['buscador', 'ciudades', 'rubros', 'places', 'prospectos', 'checklist'],
  },
]

export function getDocumento(slug: string): Documento | undefined {
  return DOCUMENTOS.find((d) => d.slug === slug)
}

/** Documentos que se sirven desde /content con el renderer genérico. */
export function getDocumentoConArchivo(slug: string): (Documento & { archivo: string }) | undefined {
  const doc = getDocumento(slug)
  if (!doc?.archivo) return undefined
  return doc as Documento & { archivo: string }
}
