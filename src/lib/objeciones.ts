/**
 * FAQ de objeciones comerciales, estructurado para consulta en vivo.
 *
 * Esta es la fuente de verdad del documento: la versión de /documentos/objeciones
 * se arma desde acá. Al aparecer una objeción nueva en una reunión, sumarla a
 * OBJECIONES con la respuesta que funcionó.
 *
 * Tema: por qué OnConcilia trabaja con el extracto que el cliente descarga de su
 * home banking y no con una conexión API directa al banco.
 */

/** Lo único que hay que saber de memoria. */
export const REENCUADRE = {
  frase:
    '¿Cuánto tardás hoy en bajar el extracto del home banking? Dos minutos. ¿Cuánto tardás en categorizar 300 movimientos, armar el comprobante de IVA de las comisiones, cruzar los comprobantes que te mandaron por WhatsApp y cerrar el mes? Dos días. Nosotros no automatizamos los dos minutos: automatizamos los dos días.',
  detalle:
    'Conectar por API ahorra el paso más barato de todo el proceso. Toda la propuesta de valor ocurre después de que el dato entra al sistema. Si el prospecto pone el foco en la ingesta, está midiendo el 2% del trabajo. Cuantificar siempre con los números del propio prospecto: ¿cuántos movimientos por mes tenés? ¿cuántas horas te lleva hoy?',
}

export const TARJETA: { rotulo: string; texto: string }[] = [
  {
    rotulo: 'Reencuadre',
    texto: 'Descargar el archivo = 2 min. Cerrar el mes = 2 días. Automatizamos los 2 días.',
  },
  {
    rotulo: 'Evidencia',
    texto:
      'Tenemos la API de Mercado Pago andando y aun así usamos el archivo: la API no devuelve quién te transfirió.',
  },
  {
    rotulo: 'Seguridad',
    texto:
      'Nunca pedimos usuario y clave del home banking. Solo lectura, sin credenciales, sin riesgo de fraude.',
  },
  {
    rotulo: 'Cobertura',
    texto: 'Si el banco da extracto, andamos. Incluidos los regionales que ningún agregador cubre.',
  },
  {
    rotulo: 'Velocidad',
    texto: 'Demo con TUS datos, hoy, en esta reunión. Ningún competidor por API puede hacer eso.',
  },
  {
    rotulo: 'Conceder',
    texto: '20+ cuentas con tesorería intradiaria: no somos nosotros.',
  },
]

export type Objecion = {
  id: string
  objecion: string
  respuesta: string
  siInsiste?: string
  tags: string[]
}

export const OBJECIONES: Objecion[] = [
  {
    id: 'directo-al-banco',
    objecion: '¿No se conecta directo al banco?',
    respuesta:
      'No, y es a propósito. Para conectarse directo hoy en Argentina hay que entregarle el usuario y la clave del home banking a un tercero, lo cual va en contra de los términos del banco y te deja a vos como responsable ante un fraude. Preferimos que el dato entre por donde el banco ya te lo entrega a vos: trabajamos sobre el extracto, en solo lectura, sin credenciales.',
    siInsiste: 'Pasar al argumento empírico: probamos la API de Mercado Pago y da peor dato.',
    tags: ['api', 'banco', 'directo', 'conexion', 'automatico'],
  },
  {
    id: 'otro-lo-trae-automatico',
    objecion: 'Otro sistema me lo trae automático.',
    respuesta:
      '¿Cubre tu banco? ¿Los seis? Preguntales qué pasa cuando el home banking cambia el diseño. Y sobre todo: eso te ahorra el paso de descargar. ¿Qué hacés después con los 300 movimientos? Ahí es donde trabajamos nosotros.',
    siInsiste:
      'Pedir que compare el resultado final, no la ingesta: «Hagamos una prueba: subí el extracto del mes pasado acá y mirá lo que sale».',
    tags: ['competencia', 'automatico', 'agregador', 'cobertura'],
  },
  {
    id: 'paso-manual',
    objecion: 'Es un paso manual, en 2026.',
    respuesta:
      'El manual es un archivo por cuenta, una o dos veces por semana. Lo que era manual de verdad —categorizar, separar el IVA, cruzar comprobantes, armar el informe del contador— ahora lo hace el sistema. Y si el tema es ver el saldo todos los días, tenemos la carga diaria de saldos: son 30 segundos y no requiere bajar nada.',
    tags: ['manual', 'anticuado', 'saldos', 'diario'],
  },
  {
    id: 'api-el-ano-que-viene',
    objecion: '¿Y si el banco abre la API el año que viene?',
    respuesta:
      'La enchufamos y no cambia nada más. El valor está en el motor de categorización, las reglas y los informes; el transporte del dato es intercambiable. De hecho ya tenemos Mercado Pago conectado por API oficial: cuando la API da mejor dato la usamos, y cuando el archivo lo da mejor usamos el archivo.',
    tags: ['api', 'futuro', 'open banking', 'roadmap'],
  },
  {
    id: 'interbanking',
    objecion: '¿InterBanking no hace esto?',
    respuesta:
      'InterBanking es para pagar. Te da los movimientos crudos: sin categorizar, sin el comprobante de IVA de comisiones, sin reportes. Pagás una adhesión por banco y seguís haciendo la conciliación a mano en Excel. Y si ya lo tenés, su archivo entra igual acá.',
    tags: ['interbanking', 'competencia', 'pagos'],
  },
  {
    id: 'seguro-subir-extractos',
    objecion: '¿Es seguro subir mis extractos a un sistema?',
    respuesta:
      'Es más seguro que la alternativa. Un extracto es información de solo lectura sobre lo que ya pasó: no permite operar, ni transferir, ni acceder a tu cuenta. Los sistemas que se conectan «automático» necesitan tu usuario y clave, que sí permiten todo eso. Nosotros no los tenemos ni los queremos.',
    tags: ['seguridad', 'datos', 'privacidad', 'riesgo'],
  },
  {
    id: 'mi-contador-ya-lo-hace',
    objecion: 'Mi contador ya me lo hace.',
    respuesta:
      'Perfecto, y le va a seguir llegando todo: tenemos envío directo al contador por email con el Excel y el PDF del período. La diferencia es que hoy le mandás el extracto crudo y él arma todo; con esto le llega ya categorizado y con el IVA separado. Le ahorra tiempo a él y te lo cobra menos a vos.',
    tags: ['contador', 'estudio', 'externo'],
  },
  {
    id: 'excel-funciona',
    objecion: 'Hoy lo hacemos en Excel y funciona.',
    respuesta:
      'Funciona porque alguien le dedica una hora por día. La planilla no se equivoca: se equivoca quien copia, pega y rehace las fórmulas cada mes. OnConcilia hace el mismo trabajo sin esa hora de ordenamiento, y con el saldo validado contra el extracto. Y no hace falta tirar la planilla: exportás a Excel cuando quieras.',
    siInsiste:
      'Proponer la comparación con sus propios datos: «Traé el extracto del mes pasado y la planilla que armaste. Medimos cuánto tardaste vos y cuánto tarda esto».',
    tags: ['excel', 'planilla', 'manual', 'ya funciona', 'hoja de calculo'],
  },
  {
    id: 'ia-entrena-datos',
    objecion: '¿Usan mis datos para entrenar la inteligencia artificial?',
    respuesta:
      'No. Los proveedores de procesamiento con IA que usamos trabajan bajo nuestras instrucciones y con acuerdos de confidencialidad: no usan tus datos para entrenar modelos y no los conservan más allá de lo necesario para prestar el servicio.',
    siInsiste:
      'Si es un cliente Enterprise que necesita el detalle de proveedores para una auditoría, se le informa bajo acuerdo de confidencialidad. En público no se nombran proveedores.',
    tags: ['ia', 'inteligencia artificial', 'entrenamiento', 'privacidad', 'datos', 'modelo'],
  },
  {
    id: 'donde-estan-los-datos',
    objecion: '¿Dónde quedan guardados mis datos?',
    respuesta:
      'En infraestructura de nivel empresarial, alojada en Sudamérica, y cada organización está aislada: sólo ve sus propios datos. Además, nunca tenemos tus claves del banco: lo que está guardado es información de lo que ya pasó, que no permite operar ni transferir desde tus cuentas.',
    siInsiste:
      'Si pregunta el país: Brasil. No prometer la migración a servidores en Argentina: es una idea para cuando crezca el volumen, no un compromiso.',
    tags: ['datos', 'servidor', 'alojamiento', 'hosting', 'nube', 'pais', 'privacidad'],
  },
]

export type Argumento = {
  id: string
  titulo: string
  cuerpo: string
  frase?: string
  destacado?: boolean
  tags: string[]
}

export const ARGUMENTOS: Argumento[] = [
  {
    id: 'empirico',
    titulo: 'Probamos la API y da peor dato',
    destacado: true,
    cuerpo:
      'Es el argumento más fuerte y es propio nuestro: no es opinión, es un hallazgo del desarrollo. Tenemos la integración con Mercado Pago por API oficial (OAuth), funcionando. Y aun así, para conciliar, usamos el archivo.\n\nEn transferencias bancarias entrantes la API de Mercado Pago no devuelve quién transfirió: devuelve la identidad de la propia cuenta, y los campos del pagador vienen vacíos. El archivo descargado del panel sí trae el nombre real. Sin ese nombre no se puede conciliar contra el cliente: la API deja al usuario peor que el archivo.\n\nPor qué importa tanto: tapa la objeción de fondo, que no es técnica sino de confianza — «¿estos tipos no saben hacer una integración?». Sí sabemos, tenemos OAuth con MP en producción. No es incapacidad, es una decisión de calidad de dato.',
    frase:
      'Nosotros hicimos la integración por API con Mercado Pago. La tenemos andando. Y aun así, para conciliar, usamos el archivo, porque tiene mejor dato. No es una limitación nuestra: es cómo está construido el ecosistema acá.',
    tags: ['mercado pago', 'api', 'oauth', 'evidencia', 'calidad de dato'],
  },
  {
    id: 'sin-credenciales',
    titulo: 'Nunca pedimos usuario y clave del banco',
    destacado: true,
    cuerpo:
      'El único camino «automático» que existe hoy en Argentina para bancos es el scraping con credenciales del home banking. Eso implica entregarle usuario y contraseña a un tercero, violar los términos del banco —que casi siempre prohíben compartir credenciales, y ante un fraude esa cláusula traslada la responsabilidad al cliente— y sumar una superficie de ataque nueva.\n\nOnConcilia es solo lectura, sobre un archivo que el banco ya le entregó al cliente. No hay credenciales, no hay sesión activa, no hay nada que robar.\n\nPara el contador o el auditor pesa todavía más: un sistema con credenciales bancarias vivas es una observación de control interno. Un flujo por archivo es auditable y no genera ninguna.',
    tags: ['seguridad', 'credenciales', 'scraping', 'auditoria', 'fraude'],
  },
  {
    id: 'cobertura',
    titulo: 'Cobertura total desde el día uno',
    destacado: true,
    cuerpo:
      'Los agregadores cubren los bancos grandes de CABA. BICA, BERSA, cooperativos y regionales no están, o se rompen seguido.\n\nNosotros ya soportamos Nación, Santander, BICA, Macro, BERSA y Galicia. Sumar un banco nuevo es escribir un parser, no negociar comercialmente con la entidad.\n\nPara una empresa del interior con cuentas en un banco regional, esto no es un argumento más: es la razón por la que nadie más la puede atender.',
    frase:
      'Si el banco existe y te da un extracto, andamos. No dependemos de que un proveedor decida si tu banco vale la pena.',
    tags: ['cobertura', 'bancos', 'regional', 'bica', 'bersa', 'interior'],
  },
  {
    id: 'onboarding',
    titulo: 'Cero fricción de onboarding',
    cuerpo:
      'InterBanking tarda semanas: adhesión banco por banco, papeles, apoderados, firmas y abono mensual. La API de un banco tarda meses, si existe. OnConcilia tarda minutos: se sube el archivo que el cliente ya bajó esta mañana.\n\nEsto habilita algo que ningún competidor por API puede hacer: demo con datos reales del prospecto, en vivo, en la primera reunión. Es nuestra mejor herramienta de venta y la tenemos gratis por ser file-based. Usarla siempre.',
    tags: ['onboarding', 'demo', 'velocidad', 'interbanking'],
  },
  {
    id: 'costo-no-escala',
    titulo: 'El costo no escala por cuenta',
    cuerpo:
      'Toda conexión por API o agregador cobra por cuenta conectada por mes, y ese costo termina en el precio final. Con archivos, una empresa con seis cuentas paga lo mismo que una con una. Nuestro precio no tiene un piso impuesto por un proveedor externo.',
    tags: ['costo', 'precio', 'escala', 'cuentas'],
  },
  {
    id: 'control',
    titulo: 'La conciliación es un control, no un proceso invisible',
    cuerpo:
      'Una conexión automática que falla lo hace en silencio. Un día no sincronizó, nadie se enteró, y el balance no cierra a fin de mes; agravado porque ya nadie mira los movimientos, «entran solos».\n\nNuestro flujo tiene el control en el momento correcto: al importar se valida la continuidad de saldos, y si hay un salto lo avisa con los montos reales. El acto de subir el archivo es el punto de control. No es un paso de más: es el paso que garantiza que no falta nada.',
    tags: ['control', 'validacion', 'saldos', 'auditoria'],
  },
  {
    id: 'saldos-diarios',
    titulo: 'Ya tenemos respuesta al «necesito ver el saldo todos los días»',
    cuerpo:
      'El módulo de saldos: treinta segundos, se carga el saldo del día de cada cuenta, se ve la variación contra el anterior y sale el reporte por mail a los admins. Sin descargar ningún archivo.\n\nEso cubre el 90% de la necesidad real de inmediatez. La conciliación completa no necesita tiempo real: es un proceso diario o semanal. Nadie concilia intradiario.',
    tags: ['saldos', 'diario', 'tiempo real', 'inmediatez'],
  },
  {
    id: 'interbanking-absorber',
    titulo: 'No competimos con InterBanking: lo absorbemos',
    cuerpo:
      'InterBanking resuelve pagos B2B multi-banco; la información de cuentas es un accesorio. Y aun teniéndolo, el cliente sigue sin categorización, sin comprobante de IVA de comisiones, sin conciliación de comprobantes y sin reportes al contador.\n\nConvierte una objeción de competencia en una fuente de datos más.',
    frase:
      'Si ya tenés InterBanking, mejor: el archivo que exporta entra a OnConcilia igual. No te pedimos que lo des de baja.',
    tags: ['interbanking', 'competencia', 'integracion'],
  },
  {
    id: 'sin-lock-in',
    titulo: 'Sin lock-in',
    cuerpo:
      'Los datos entran con archivos que ya son del cliente y salen en Excel y PDF. No hay dependencia de una conexión que, si se corta la relación comercial, deja al cliente sin acceso a su propia información.',
    tags: ['lock-in', 'portabilidad', 'exportar'],
  },
  {
    id: 'agnostico',
    titulo: 'Somos agnósticos al canal de ingesta',
    cuerpo:
      'El valor del sistema está en el motor de categorización, las reglas, el tratamiento de IVA y los reportes. El transporte del dato es intercambiable. Ya tenemos las dos vías: API oficial (Mercado Pago) y archivo (bancos). Elegimos por caso cuál da mejor dato.',
    tags: ['arquitectura', 'ingesta', 'api', 'archivo'],
  },
  {
    id: 'categoria-por-archivo',
    titulo: 'No somos los únicos: la categoría trabaja por archivo',
    cuerpo:
      'Conciliac, uno de los especialistas regionales, se integra por API con los bancos principales y por Interbanking, y aun así lista la ingesta de archivos como vía de primera clase: «APIs, file ingestion, database connections». Asentia, argentina y competidora directa, dice que su mayor impacto es justamente «cuando la conciliación depende de extractos, ERP y varias planillas manuales».\n\nNinguno promete conexión directa con todos los bancos, porque en Argentina no hay con qué. El archivo no es una carencia nuestra: es la única vía que cubre a todos los bancos, incluidos los regionales.\n\nLos nombres son para vos. Frente al cliente no hace falta citarlos: alcanza con el argumento.',
    frase:
      'Fijate que nadie que haga esto en serio promete conectarse directo a todos los bancos. No es que no sepan: es que acá no se puede. Por eso trabajamos con el extracto, que es lo que cubre a todos.',
    tags: ['competencia', 'conciliac', 'asentia', 'archivo', 'categoria', 'mercado', 'api'],
  },
]

export const CONTEXTO: { titulo: string; texto: string }[] = [
  {
    titulo: 'En Argentina no hay open banking regulado',
    texto:
      'El BCRA no impuso un estándar de APIs abiertas como sí ocurrió en Brasil (Open Finance) o en Europa (PSD2). No existe la obligación del banco de exponer los datos del cliente por API.',
  },
  {
    titulo: 'InterBanking es el servicio oficial de facto',
    texto:
      'Para empresas, pero está diseñado alrededor de los pagos B2B, requiere adhesión banco por banco y tiene costo de abono. Su módulo de información de cuentas es accesorio.',
  },
  {
    titulo: 'Los agregadores funcionan mayormente por scraping',
    texto:
      'Con credenciales del home banking. Eso implica cobertura parcial —los bancos regionales no están o fallan— y conexiones que se rompen ante cada cambio de interfaz, MFA nuevo o captcha.',
  },
  {
    titulo: 'El extracto descargable es el único formato garantizado',
    texto:
      'Es lo que el banco está obligado a entregarle a su cliente. Es el contrato más estable que existe en este mercado.',
  },
]

export const CONCEDER: string[] = [
  'Empresa con 20+ cuentas y necesidad de tesorería intradiaria real. Ese no es nuestro cliente hoy. Decirlo abiertamente.',
  'Volumen muy alto de movimientos diarios donde bajar y subir archivos todos los días sí es una carga real. Mitigable con frecuencia semanal más el módulo de saldos diarios, pero hay un punto donde deja de alcanzar.',
  'Prospecto que ya tiene una conexión automática funcionando bien y solo quiere reemplazar la parte contable. No discutir la ingesta: ofrecer que exporte de ahí y entre por archivo.',
]

export const FRASE_CONCEDER =
  'Si lo que necesitás es tesorería minuto a minuto sobre veinte cuentas, hoy no somos nosotros. Si lo que te come el mes es cerrar la contabilidad, ahí sí.'

export const NO_DECIR: { que: string; porque: string }[] = [
  {
    que: '«Todavía no tenemos la conexión por API.»',
    porque: 'Instala que es una carencia y que estamos atrasados. Es una decisión, no una deuda.',
  },
  {
    que: '«Lo vamos a agregar más adelante.»',
    porque:
      'Promete algo que depende de terceros y admite que lo actual es inferior. Decir en cambio: «si un banco abre la API, la enchufamos, el motor ya está preparado».',
  },
  {
    que: 'Hablar mal de los agregadores por nombre.',
    porque:
      'El argumento es el modelo (credenciales compartidas), no la empresa. Atacar competidores por nombre baja el nivel y se nota.',
  },
  {
    que: 'Pedir disculpas por el paso de descarga.',
    porque: 'Nunca. Es un paso de control.',
  },
  {
    que: 'Entrar en detalle técnico sin que lo pidan.',
    porque:
      'El prospecto no quiere saber qué es OAuth. Quiere saber si su información está segura y cuánto tiempo ahorra.',
  },
  {
    que: 'Prometer que un banco específico va a estar soportado sin haber visto un extracto real.',
    porque:
      'Cada banco es un parser validado contra archivos reales. Galicia, por ejemplo, todavía no tiene categorización.',
  },
]

export const REGLA_GENERAL =
  'Nunca ponerse defensivo. La descarga de archivo no es una carencia que hay que justificar, es una decisión de diseño con razones. El tono es «elegimos esto y te explico por qué», nunca «todavía no llegamos a eso».'
