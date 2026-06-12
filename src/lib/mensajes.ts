import { Sector } from './types'

interface TemplateVars {
  nombre: string
  empresa: string
  cargo?: string
}

type Templates = Record<Sector, Record<1 | 2 | 3, (v: TemplateVars) => string>>

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
}

export function generarMensaje(
  sector: Sector,
  paso: 1 | 2 | 3,
  vars: TemplateVars
): string {
  return TEMPLATES[sector][paso](vars)
}
