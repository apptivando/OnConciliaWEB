import { Sector, VarianteAsunto } from './types'

interface TemplateVars {
  nombre: string
  empresa: string
  cargo?: string
  /** Solo lo usa `comercio[1]` — arma el link a /coordinar/[id]. */
  id?: string
  /** Solo lo usa `comercio[1]` — si ya se llenaron los CUPO_BETA lugares,
   *  la oferta pasa de "60 días de beta" a "prueba de 15 días". Lo calcula
   *  quien llama (cuenta prospectos en estado beta_activo), no esta función. */
  cupoLleno?: boolean
}

/** Beta cerrada, mismo número que dice la landing ("Beta cerrada — 20
 *  lugares"). Cuando se llenan los `beta_activo`, el email frío deja de
 *  ofrecer la beta y pasa a un trial estándar de 15 días. */
export const CUPO_BETA = 20

/** Base pública del sitio. Server y cliente leen la misma var — `mensajes.ts`
 *  se importa desde los dos lados (ProspectoDrawer es cliente). Exportada:
 *  también arma el link del footer en el email frío (outreach/send). */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://onconcilia.com'
}

/** Nombres de comercio largos rompen un asunto corto — se recorta antes de
 *  interpolar. `buscarProspectos` ya limpia el nombre al guardar (saca
 *  calificadores de sucursal tipo "- Peatonal Paraná"), esto es una red de
 *  seguridad extra, no la limpieza principal. */
function acortarEmpresa(empresa: string): string {
  return empresa.length > 28 ? `${empresa.slice(0, 28).trim()}…` : empresa
}

/**
 * A/B/C del asunto de email frío a comercios. Tres ángulos distintos a
 * propósito (no tres formas de decir lo mismo), para que el test compare algo
 * real: dolor/pérdida concreta, beneficio directo, curiosidad sin nombrar el
 * problema. La variante la asigna `buscarProspectos` al momento de la
 * búsqueda, rotando parejo entre las 3 — ver `prospectos.variante_asunto`.
 *
 * Corregido 09/09/2026: la primera versión hablaba de "cerrar la caja", que
 * es un problema de POS/retail — OnConcilia no hace eso, hace conciliación
 * bancaria (cruzar el extracto del banco contra los registros propios). El
 * gancho tiene que ser sobre el banco, no sobre la caja.
 */
export const ASUNTOS_COMERCIO: Record<VarianteAsunto, (empresa: string) => string> = {
  A: (empresa) => `${acortarEmpresa(empresa)}, ¿cuánto perdés con los movimientos del banco?`,
  B: (empresa) => `${acortarEmpresa(empresa)}: conciliá el banco en minutos, no en horas`,
  C: (empresa) => `Una idea rápida para ${acortarEmpresa(empresa)}`,
}

/** Asunto genérico para prospectos sin variante asignada (no vinieron de búsqueda). */
export const ASUNTO_GENERICO = (nombre: string) => `${nombre}, ¿conversamos sobre OnConcilia?`

type Templates = Record<Sector, Record<1 | 2 | 3, (v: TemplateVars) => string>>

/**
 * La oferta del correo frío a comercios, igual en la apertura y en el
 * recordatorio. Con los 20 lugares de la beta llenos ("estamos abriendo
 * lugares" ya no es cierto) pasa a una prueba estándar — no sólo cambia el
 * número de días, cambia el marco: ya no es "sumate a la beta", es "probalo
 * gratis".
 */
function ofertaComercio(cupoLleno?: boolean): string {
  return cupoLleno
    ? `Podés probarlo gratis durante 15 días, sin tarjeta ni compromiso.`
    : `Estamos abriendo 20 lugares de beta. El que entra tiene 60 días del plan Pro completo sin cargo, con 90 días de historial de todas sus cuentas ya cargado por nosotros — y si trabajás con un banco que todavía no leemos, lo desarrollamos sin cargo.`
}

export const TEMPLATES: Templates = {
  pyme: {
    1: ({ nombre, empresa }) =>
      `Hola ${nombre}, vi que estás en administración en ${empresa}. Estoy construyendo OnConcilia, una herramienta de conciliación bancaria para pymes, y me gustaría saber si es un problema que te lleva tiempo cada mes. ¿Conectamos?`,

    2: ({ nombre }) =>
      `Gracias por conectar, ${nombre}.

Te cuento brevemente: la conciliación bancaria manual en Excel suele consumir entre 8 y 20 horas por mes en una pyme. Es tiempo de administración que nadie va a recuperar.

Estamos en beta de OnConcilia — automatizamos ese proceso. El extracto del banco entra, se cruza con los registros de la empresa, y el sistema muestra solo las diferencias que necesitan atención. Lo que antes era un día de trabajo, toma minutos.

Buscamos las primeras 10 empresas para validarlo en condiciones reales, sin costo y sin compromiso. A cambio, nos dan feedback honesto.

¿Te interesa que te lo muestre en una llamada de 15 minutos esta semana?`,

    3: ({ nombre }) =>
      `Hola ${nombre},

Te escribo como seguimiento a nuestra conexión en LinkedIn.

El problema que estamos resolviendo con OnConcilia es concreto: en la mayoría de las pymes, la conciliación bancaria se hace manualmente en Excel y consume entre 8 y 20 horas por mes. Es un proceso lento, propenso a errores, y que no aporta valor una vez que está automatizado.

Cómo funciona:
1. Subís el extracto del banco (CSV o Excel)
2. OnConcilia lo normaliza y lo cruza con tus registros
3. Ves únicamente las diferencias — sin revisar fila por fila

Estamos ofreciendo acceso gratuito a los primeros 10 clientes beta. Funciona desde el navegador, sin instalar nada. A cambio, pedimos feedback real sobre lo que funciona y lo que no.

¿Tenés 15 minutos esta semana para que te lo muestre? Solo respondé con tu disponibilidad y armamos la llamada.

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,
  },

  estudio: {
    1: ({ nombre, empresa }) =>
      `Hola ${nombre}, soy Guillermo. Estoy desarrollando OnConcilia, un software de conciliación bancaria para estudios que manejan múltiples clientes. Vi el trabajo de ${empresa} y me gustaría saber si el cierre de mes es un cuello de botella. ¿Conectamos?`,

    2: ({ nombre }) =>
      `Gracias por conectar, ${nombre}.

Te cuento: si manejás 10 clientes con cuentas bancarias distintas, la conciliación manual puede representar decenas de horas por mes en el estudio, repartidas entre varios profesionales.

Estamos en beta de OnConcilia — una herramienta que automatiza la conciliación bancaria. Está pensada específicamente para estudios que gestionan múltiples clientes: un solo panel, todas las cuentas, las diferencias ya marcadas.

Buscamos estudios para validarlo gratuitamente. Si te parece interesante, me encantaría mostrártelo en 15 minutos. ¿Tenés un hueco esta semana o la próxima?`,

    3: ({ nombre }) =>
      `Hola ${nombre},

Te escribo como seguimiento a nuestra conexión en LinkedIn.

Si manejás varios clientes con cuentas bancarias, la conciliación manual probablemente representa una parte significativa de las horas del estudio cada mes — multiplicada por cada cliente.

OnConcilia resuelve eso:
- Cada cliente tiene su propio panel con sus cuentas y movimientos
- El sistema detecta diferencias automáticamente
- El reporte de conciliación queda listo para descargar en PDF o Excel

Estamos en beta y buscamos estudios que quieran probarlo sin costo. El acceso es gratuito durante el período de validación.

¿Tiene sentido que lo veamos en 15 minutos? Si querés, lo probamos directamente con un extracto real de uno de tus clientes.

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,
  },

  franquicia: {
    1: ({ nombre, empresa }) =>
      `Hola ${nombre}, vi que ${empresa} tiene varios locales. Imagino que consolidar las cuentas bancarias de cada uno puede ser un proceso lento. Estoy desarrollando algo específicamente para eso. ¿Me das unos minutos?`,

    2: ({ nombre }) =>
      `Gracias por conectar, ${nombre}.

En una cadena de varios locales, la conciliación bancaria se multiplica con cada cuenta que se agrega. El problema no es solo el tiempo — es la consistencia: asegurarse de que los registros de cada local cuadren con los del banco.

OnConcilia automatiza ese proceso. Estamos en beta y buscamos las primeras cadenas para validarlo sin costo.

¿Tiene sentido que lo veamos en una llamada corta?`,

    3: ({ nombre, empresa }) =>
      `Hola ${nombre},

Te escribo como seguimiento a nuestra conexión en LinkedIn.

En ${empresa}, con varios locales operando en paralelo, la conciliación bancaria crece con cada cuenta que se suma. OnConcilia consolida todo en un solo panel y detecta las diferencias automáticamente.

Estamos en beta y buscamos cadenas que quieran probarlo sin costo ni compromiso.

¿Tenés 15 minutos esta semana para que te lo muestre?

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,
  },

  // A diferencia de los otros tres segmentos, estos comercios salen de una
  // búsqueda en Google Places, no de una conexión en LinkedIn: el tono es de
  // email frío, no de seguimiento. El asunto NO va acá, sale de
  // `ASUNTOS_COMERCIO` según `prospecto.variante_asunto` (test A/B/C).
  //
  // La secuencia fría son **dos** correos: la apertura (1) y un recordatorio
  // a los 15 días (2), con texto parecido. Decidido el 21/09/2026; ver
  // `PASOS_FRIO` en `lib/outreach.ts`. El 3 queda porque el tipo lo exige
  // para todos los sectores, pero el cron no lo manda a comercios.
  comercio: {
    1: ({ nombre, id, cupoLleno }) =>
      `Hola${nombre ? ` ${nombre}` : ''},

¿Cuánto perdés por no revisar bien los movimientos del banco? Entre comisiones que pasan sin que nadie las mire, movimientos que no cuadran con lo que tenés anotado y errores que se descubren semanas después, conciliar el banco a mano es un problema que crece con cada cuenta que sumás.

Armamos OnConcilia para resolver justo eso: cruza automáticamente el extracto de tu banco o de Mercado Pago contra tus movimientos, categoriza todo solo, y te deja ver únicamente lo que necesita tu atención.

${ofertaComercio(cupoLleno)}

No hay alta automática: antes de activar nada hablamos 15 minutos para entender cómo llevás hoy el banco. Si no te sirve, te lo digo en esa misma llamada.

Dejame tu teléfono y elegí el horario acá: ${appUrl()}/coordinar/${id}

Si no es el momento, gracias por leer este correo.

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,

    // Recordatorio a los 15 días. Parecido a la apertura a propósito: quien
    // no contestó la primera vez probablemente ni la leyó, así que no se da
    // por sabido nada. Es el último correo: lo dice, y eso baja las bajas y
    // las marcas de spam — el que no está interesado sabe que no tiene que
    // hacer nada.
    2: ({ nombre, id, cupoLleno }) =>
      `Hola${nombre ? ` ${nombre}` : ''},

Hace un par de semanas te escribí sobre OnConcilia y no quería dejarlo sin volver a preguntar.

¿Cuánto tiempo se les va por día en revisar los movimientos del banco? Entre comisiones que nadie mira, pagos que no cuadran con lo anotado y errores que aparecen semanas después, conciliar a mano es un trabajo que crece con cada cuenta.

OnConcilia cruza solo el extracto de tu banco y de Mercado Pago contra tus movimientos, categoriza todo y te deja ver únicamente lo que necesita tu atención.

${ofertaComercio(cupoLleno)}

Si te interesa, dejame tu teléfono y elegí el horario acá: ${appUrl()}/coordinar/${id}

Y si no es el momento, no te escribo más por este tema.

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,

    3: ({ nombre, empresa, id }) =>
      `Hola${nombre ? ` ${nombre}` : ''},

Último mensaje sobre esto, para no hacerme pesado.

En ${empresa}, entre el banco y Mercado Pago, revisar qué entró y qué falta se lleva bastante más tiempo del necesario. OnConcilia importa los extractos, los categoriza y te deja ver solo lo que necesita tu atención.

Si te interesa entrar a la beta, el horario lo elegís acá: ${appUrl()}/coordinar/${id}

Si no, no hace falta que hagas nada — no te escribo más por este tema.

Saludos,
Guillermo
OnConcilia
guillermo@onconcilia.com`,
  },
}

export function generarMensaje(
  sector: Sector,
  paso: 1 | 2 | 3,
  vars: TemplateVars
): string {
  return TEMPLATES[sector][paso](vars)
}
