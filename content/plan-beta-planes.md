# Plan — Programa beta, tres planes y buscador secuencial

**Proyecto:** OnConcilia MKT (`C:\Apptivando\OnConcilia_MKT`, app en `onconcilia-web/`)
**Fecha:** 19/09/2026 · decisiones cerradas el 20/09/2026
**Reemplaza parcialmente:** [`PLAN_Landing_Prospectos_Brevo.md`](PLAN_Landing_Prospectos_Brevo.md)
(las Partes 1 y 3 — landing y Brevo — se rehacen acá; la Parte 2, el buscador,
se extiende, no se tira).

**El foco es la beta.** Las Etapas 1 a 3 son el programa. La Etapa 4 (los tres
planes, y sobre todo el BASE automático) se construye **durante** la beta, en
la ventana que va del primer beta al último. La Etapa 5 recién se ejecuta con
los 20 lugares ocupados.

Documento de trabajo: marcá los `[ ]` a medida que avances.

---

## Estado medido el 19-20/09/2026 (no estimado)

Consultado contra Supabase con la service key, antes de escribir nada:

| Qué | Al empezar | Después de correr el enriquecimiento |
|---|---|---|
| Prospectos vivos | 81 | 81 |
| **Con correo** | **1** | **14** |
| **Con WhatsApp** | **0** | **14** |
| Contactables (correo o WhatsApp) | 1 | **16** |
| `leads` del formulario | 1 | 1 |

### Rendimiento del buscador, medido sobre los 81

| Medida | Valor |
|---|---|
| Comercios con sitio web propio | **30 de 81 (37%)** |
| De esos, que publican un correo | **13 de 30 (43%)** |
| **Correos por prospecto encontrado** | **17,3%** |
| WhatsApp encontrados | 14 (prioridad 1) |

> La muestra es indumentaria en Paraná y Córdoba, que es de los rubros que
> menos sitio propio tiene. Con los rubros del checklist nuevo (distribuidoras,
> concesionarias, corralones) el 37% debería subir. **Para la meta de 35
> correos por ciudad hay que encontrar unos 200 prospectos**, o sea cinco
> búsquedas de 40 — dentro de lo que una ciudad mediana da sin repetir.

### Cuatro hallazgos que reordenaron el trabajo

1. **El cron de búsqueda no corre.** `prospect_searches` tiene 2 registros, del
   4 y 5 de septiembre, los dos manuales. Si el cron hubiera corrido los 10
   días hábiles siguientes habría prospectos de Rosario, Mendoza y el resto de
   la rotación. Hay que confirmar en Vercel → Settings → Cron Jobs si el job
   existe siquiera.

2. **El enriquecimiento nunca se había ejecutado.** Los 81 tenían
   `intentos_enriquecimiento = 0` y treinta sitios web sin visitar. Por eso
   había un solo correo. El botón de `/prospectos` existe desde el 04/09 y
   nadie lo apretó: un paso que depende de que alguien se acuerde, no corre.

3. **Bug de timeout en `http.ts` — corregido.** `fetchHtml` cancelaba el
   temporizador de aborto apenas llegaban los headers, y después leía el cuerpo
   **sin límite de tiempo**. Un servidor que manda los headers y deja de enviar
   bytes colgaba el worker para siempre: un lote de 4 prospectos tardó
   **979 segundos** con un presupuesto de 75. Con el temporizador vivo durante
   la lectura, el mismo lote tarda **8 segundos**. En Vercel esto se veía como
   "el cron no hace nada": la función se cortaba a los 60s con el trabajo a
   medio guardar.

4. **"Cordobá" quedó como `localidad` de 40 prospectos.** El typo del
   formulario se guardó tal cual. Hay que normalizar la ciudad antes de
   insertar, o el avance por ciudad nunca va a cerrar.

---

## Cómo funciona el programa, en llano

El buscador recorre el país por ciudad: **agota los rubros de una ciudad antes
de pasar a la siguiente**, y no se mueve hasta juntar unos 35 prospectos **con
correo** (no con ficha: con correo). Empieza por las capitales de provincia y
sigue por un ranking de ciudades por peso económico. De cada comercio intenta
el sitio propio y, si sólo publica una red, el link que esa red enlaza — el
perfil en sí no se visita.

A esos contactos les sale la campaña de la beta. El correo **no ofrece
registrarse**: ofrece una **reunión de 15 minutos**, y esa reunión es
obligatoria para entrar. No es un trámite: es donde se entiende cómo trabajan
hoy y qué les va a cambiar la herramienta. Sin esa conversación no sabemos qué
cargarle ni qué medir después.

Quien entra recibe, sin cargo por 60 días:

- el **plan PRO completo**,
- **90 días de historial de todas sus cuentas** (aunque después no quiera
  cargarlas todas),
- y si opera con un banco que todavía no soportamos, le desarrollamos la
  **categorización de ese banco**.

A los 15 días recibe una encuesta corta; a los 45, otra. Por ese feedback, al
terminar la beta paga **50% del plan durante 3 meses**.

Con los 20 lugares ocupados, la landing y las campañas dejan de hablar de beta
y pasan a **vender los tres planes**.

---

## Decisiones cerradas

| # | Decisión | Detalle |
|---|---|---|
| 1 | La lista se produce a mano, con checklist | Sin pagar Vercel Pro. Ver [`CHECKLIST_Busqueda_Ciudad_Rubro.md`](CHECKLIST_Busqueda_Ciudad_Rubro.md) |
| 2 | Beta nueva: **50% por 3 meses** | Reemplaza al "precio fundador" sólo para los que entren de ahora en más |
| 3 | ADN y Centroficina conservan su 30% × 12 meses | Ya se les prometió. No se renegocia |
| 4 | **La reunión de 15 minutos es obligatoria para la beta** | Es la única puerta de entrada al programa |
| 5 | Historial de beta: **90 días de todas las cuentas** | Aunque el cliente después no las quiera todas |
| 6 | Módulos opcionales: **echeqs, préstamos, liquidaciones y comprobantes** | Préstamos pasa a ser opcional: hoy no tiene feature flag, hay que crearlo |
| 7 | PRO elige **2 del menú de 4**; el canal de WhatsApp queda afuera | Es el único módulo con servidor dedicado propio |
| 8 | **BASE no incluye historial.** Se cotiza **por trimestre y por cuenta** | Es lo que hace que la importación por lote siga siendo necesaria, pero por los betas y por el historial pago, no por BASE |
| 9 | Las redes no se visitan | Se toma sólo el link que la bio enlaza (sitio propio, linktree, `wa.me`) |

### Por qué el menú de PRO excluye WhatsApp

Con "dos opcionales a elección" incluidos, un PRO con los dos módulos pasaba de
$195.000 a $130.000 contra un Enterprise de $245.000: el ancla que sostiene la
grilla se caía. Dejando el canal de WhatsApp afuera del menú, la distancia se
mantiene y el corte se justifica solo — es el único módulo con **servidor
dedicado corriendo permanentemente**, o sea el único con costo de
infraestructura propio y continuo. No es una regla arbitraria de packaging.

---

## Aritmética del embudo — cuánto hay que buscar para 20 betas

Con el 17,3% medido y tasas de referencia de correo frío B2B:

| Paso | Tasa | Cantidad |
|---|---|---|
| Betas objetivo | — | 20 |
| Reuniones necesarias (60% cierra) | 60% | ~33 |
| Correos a enviar (3% agenda) | 3% | **~1.100** |
| Prospectos a encontrar (17,3% da correo) | 17,3% | **~6.400** |
| Búsquedas de 40 resultados | — | **~160** |
| Costo en Places | USD 0,056 c/u | **~USD 9** |

> **El cuello no es la plata, es el tiempo de envío.** Con el tope de 50
> correos por día ya decidido, 1.100 correos son **22 días hábiles** de envío
> continuo — que entra justo en la ventana de la beta si arranca ya. Los 14
> WhatsApp encontrados importan más de lo que parece: convierten bastante mejor
> que el correo frío y no consumen ese cupo.

---

## ETAPA 1 — Lanzamiento de la beta (objetivo: lunes 21/09)

Lo único con fecha dura.

### 1.1 — Producir la lista

- [x] Worker de enriquecimiento como ruta propia: `/api/cron/daily-enrich`,
      en tandas con presupuesto de reloj.
- [x] **Bug de timeout de `http.ts` corregido** (ver hallazgo 3).
- [x] Enriquecidos los 30 sitios pendientes → 14 correos y 14 WhatsApp.
- [x] Rendimiento medido: **17,3% de correos por prospecto**.
- [x] [`CHECKLIST_Busqueda_Ciudad_Rubro.md`](CHECKLIST_Busqueda_Ciudad_Rubro.md)
      — 48 ciudades × 10 rubros, para tildar a mano.
- [ ] Reemplazar los 8 rubros del cron por los 10 del checklist.
- [ ] Normalizar el nombre de ciudad antes de insertar (el caso "Cordobá").
- [ ] Buscar y enriquecer las primeras ciudades del checklist.

### 1.2 — Landing: la beta pasa a ser PRO

Hoy la landing dice "acceso gratuito por 60 días" sin decir a qué, y promete a
estudios contables un panel multi-cliente que el producto no tiene.

- [ ] Encuadre nuevo: **plan PRO completo, 90 días de historial de todas tus
      cuentas, y la categorización de tu banco si no lo soportamos**. Es una
      oferta mucho más concreta que "acceso gratuito".
- [ ] El CTA pasa a ser **"agendá 15 minutos"**, no "dejá tu mail". La reunión
      es obligatoria, así que el formulario deja de ser el camino principal:
      queda para quien no quiera agendar en el momento, y el correo siguiente
      lo lleva igual a la reunión.
- [ ] Decir qué se pide a cambio: dos encuestas (día 15 y día 45). Es lo que
      justifica el 50% × 3 meses, y decirlo de entrada filtra al que no va a
      contestar nunca.
- [ ] Corregir la tarjeta de estudios contables (punto 1.2 del plan anterior,
      sigue sin hacerse). Es la promesa más cara de incumplir.
- [ ] Sumar Mercado Pago al hero y las dos tarjetas que faltan (Mercado Pago y
      Comprobantes) — puntos 1.1 y 1.4 del plan anterior.
- [ ] Franja de saldos diarios (punto 1.5, ya decidido: franja, no tarjeta).

### 1.3 — Los correos, reescritos al nuevo encuadre

Los 3 opt-in (`emails-automation-optin/paso-*.html`) y el frío 1:1
(`mensajes.ts`, `comercio[1]`) ya existen y están bien armados. Cambia **qué se
ofrece**, no la estructura.

| Pieza | Qué dice hoy | Qué tiene que decir |
|---|---|---|
| `paso-1-bienvenida` | "60 días gratis a cambio de 15 minutos" | PRO completo + 90 días de historial + tu banco; la reunión es la puerta |
| `paso-2-valor` | El problema del cierre de mes | Igual, cerrando en la reunión |
| `paso-3-cierre` | "Quedan pocos lugares" | Igual, con el contador real de lugares |
| `mensajes.ts` `comercio[1]` | "beta, 60 días sin costo" | Mismo encuadre, con el link a `/coordinar/[id]` |
| `ASUNTOS_COMERCIO` A/B/C | Test en curso desde el 08/09 | **No tocar** — todavía no midió nada; cambiarlo ahora lo invalida |

- [ ] Reescribir los 4 textos.
- [ ] **Guion de WhatsApp**, que hoy no existe y ahora hay 14 contactos de
      prioridad 1 esperándolo.

### 1.4 — Brevo

La infraestructura está hecha y verificada (dominio autenticado, lista id 3,
webhook id 2168911, envío real confirmado `delivered`). Falta lo de panel.

- [ ] **Tuyo:** armar el Automation — trigger "contacto entra a la lista
      `BREVO_LIST_ID_LEADS`" → los 3 correos, día 0 / día 3 / día 7.
- [ ] **Tuyo:** cargar en Vercel `BREVO_API_KEY`, `BREVO_LIST_ID_LEADS=3` y
      `BREVO_WEBHOOK_SECRET` (pendiente del plan anterior; sin esto las rutas
      nuevas no funcionan en producción).
- [ ] **Tuyo:** apuntar el webhook a `onconcilia.com` cuando esto llegue a
      `main` (hoy apunta a `dev.onconcilia.com`).
- [ ] **Tuyo:** confirmar que la key de Brevo **no** quedó cargada en el
      proyecto viejo de Vercel, o las campañas salen duplicadas.

### 1.5 — La reunión como única puerta

Ya está casi todo: Cal.com `/15min`, `/coordinar/[id]` que guarda el contacto
antes de mostrar el calendario, y el estado `respondio_positivo`.

- [ ] **Tuyo:** revisar el evento de Cal.com para que las preguntas del
      formulario de reserva sirvan a la reunión: con cuántos bancos trabajan,
      **con qué bancos** (define si hay parser que desarrollar), quién revisa
      los pagos y cuánto tarda el cierre.
- [ ] Guion de la reunión de 15 minutos. Hoy no existe. Tiene que cubrir cómo
      trabajan hoy, qué les cambia, y el compromiso de las dos encuestas.

---

## ETAPA 2 — Motor de prospección secuencial

Reemplaza la rotación actual, que cambia de ciudad todos los días y nunca
termina ninguna.

### 2.1 — Orden geográfico (cerrado)

**Primero las 24 capitales** en orden de tamaño, **después 24 ciudades por peso
económico** — puerto, parque industrial, polo agroindustrial o cabecera
regional, no población sola. El listado completo con su fundamentación está en
[`CHECKLIST_Busqueda_Ciudad_Rubro.md`](CHECKLIST_Busqueda_Ciudad_Rubro.md).

> **Ojo con las capitales chicas.** Ushuaia, Viedma, Rawson y La Rioja no tienen
> densidad comercial para llegar a 35 correos. La regla de "si no alcanzás,
> pasá a la siguiente" es la que las resuelve.

### 2.2 — Ejecución a mano, con opción de automatizar gratis

Decidido: **no se paga Vercel Pro**. Se dispara a mano desde `/prospectos`
siguiendo el checklist.

- [ ] Opcional, cuando moleste hacerlo a mano: **GitHub Actions** con un
      `schedule` que le pegue a `/api/cron/daily-search` y
      `/api/cron/daily-enrich` con el `CRON_SECRET`. El repo ya está en
      GitHub, el secreto vive en los Secrets del repo, y el historial de
      corridas queda visible en la pestaña Actions — que es justo lo que faltó
      para notar que el cron llevaba dos semanas sin correr. Contra: GitHub
      desactiva los workflows programados si el repo pasa 60 días sin commits.
- [ ] Estado de avance por ciudad persistido (tabla nueva o columnas en
      `prospect_searches`): qué rubros se buscaron, cuántos correos lleva, si
      está cerrada. Es lo que hace que el checklist no haya que llevarlo a mano
      en dos lugares.

### 2.3 — Enriquecimiento

- [x] `/api/cron/daily-enrich` construido y corriendo.
- [x] Timeout de lectura corregido — sin esto nada de lo anterior rinde.
- [ ] Nivel 1b: cuando el prospecto sólo tiene red, seguir **el link que la bio
      enlaza** (sitio propio, linktree, `wa.me`) sin leer el perfil. La parte de
      "link in bio" ya está implementada para cuando Places publica el linktree
      como sitio; falta el caso en que publica el Instagram.

### 2.4 — Tablero de avance

- [ ] En `/prospectos`: ciudad en curso, rubros cerrados, correos acumulados,
      próxima ciudad. Hoy no hay forma de saber dónde está parado el motor sin
      consultar la base a mano — que es exactamente por qué nadie se enteró de
      que llevaba dos semanas detenido.

---

## ETAPA 3 — Operar la beta (durante los 60 días)

### 3.1 — Marcar la beta en el SaaS

Hoy **no existe** ningún campo de prueba, vencimiento ni suscripción en
`organizaciones`. Los 60 días y el 50% × 3 meses se llevarían de memoria.

- [ ] **Tuyo (Supabase):** columnas nuevas en `organizaciones` — `es_beta`,
      `beta_desde`, `beta_hasta`, `descuento_pct`, `descuento_hasta`.
- [ ] Mostrarlo en `/admin`: quién es beta, días restantes, cuántos de los 20
      lugares están ocupados.
- [ ] El contador de lugares que ya lee `mensajes.ts` (`CUPO_BETA`) pasa a leer
      de la app, que es donde está el dato real.

### 3.2 — Historial de 90 días de todas las cuentas

Es la promesa más cara: 20 betas × 90 días × todas sus cuentas.

- [ ] Medir cuánto lleva hoy cargar 90 días de una cuenta, con un caso real.
- [ ] **Importación por lote** — subir los 3 archivos de una cuenta juntos y
      procesarlos en cola. El mapeo de columnas ya se reconoce solo a partir
      del segundo archivo.

> **Corrección respecto de lo que decía `canal-de-reventa.md`.** Ahí la
> importación por lote figuraba como requisito del autoservicio de BASE. Ya no:
> **BASE no incluye historial**. Sigue siendo necesaria, pero por los betas y
> por el historial que se venda suelto, no por BASE.

### 3.3 — Bancos nuevos

"Categorización asistida para los bancos que no tenemos" es desarrollo por cada
beta que traiga un banco distinto de los seis soportados.

- [ ] Preguntar el banco **en la reunión de 15 minutos**, antes de prometer
      nada. Define si ese beta entra esta semana o la que viene.
- [ ] Cola explícita de bancos pedidos, ordenada por cuántos betas lo piden.
- [ ] Tope: cuántos parsers nuevos por mes sin frenar el resto.

### 3.4 — Encuestas día 15 y día 45

- [ ] Formulario propio en `onconcilia.com` con link personalizado por
      organización (ya hay Supabase y Brevo; no hace falta Google Forms).
- [ ] Dos Automations en Brevo disparados por la fecha de alta de la beta.
- [ ] Día 15: qué usó, qué no entendió, qué le falta. Día 45: si lo pagaría,
      cuánto, qué lo haría cancelar.

### 3.5 — El día 60

- [ ] Correo de cierre con la oferta del 50% × 3 meses.
- [ ] Alta real de la suscripción (débito automático o transferencia anual).

---

## ETAPA 4 — Los tres planes (durante la beta, en paralelo)

### 4.1 — Grilla nueva (a validar)

| | BASE | **PRO** | ENTERPRISE |
|---|---|---|---|
| Suscripción | $65.000 | $130.000 | $245.000 |
| Cuentas | 3 bancos + 1 billetera | 5 + 1 | 10 + 1 |
| Usuarios | 3 | 8 | 15 |
| Historial incluido | **Ninguno** — se cotiza **por trimestre y por cuenta** | **1 trimestre** | **1 año** |
| Categorización | **Defaults automáticos, sin asistencia** | **Asistida** | **Asistida** |
| Opcionales | Ninguno; **cada uno con costo de instalación** | **2 a elección** de echeqs · préstamos · liquidaciones · comprobantes | **Los 4 + canal de WhatsApp** |
| Capacitación en vivo | Ninguna (videos y manual) | **2 sesiones, hasta 2 personas** | **5 sesiones, hasta 3 personas** |
| Acompañamiento | — | Primer cierre | **Virtual durante el 1er mes** |
| Puesta en marcha | **Sin cargo, automática** | a recalcular | a recalcular |

- [ ] **Crear el feature flag `prestamos`** en el SaaS. Hoy los flags son
      `echeqs`, `liquidaciones`, `mercadopago` y `comprobantes`: préstamos lo
      ve cualquier organización. Es cambio de producto, no sólo de precio.
- [ ] Recalcular las horas de puesta en marcha de PRO (hoy 8 h con 1 sesión;
      pasa a 2 sesiones + 1 trimestre de historial) y de ENTERPRISE (hoy 32 h;
      suma 5 sesiones y el mes de acompañamiento).
- [ ] Precio del trimestre de historial **por cuenta**, para vender a BASE.
- [ ] Precio de instalación de cada opcional en BASE.
- [ ] Revisar qué pasa con la puesta en marcha, que hoy incluye "alta del
      préstamo y las inversiones vigentes": si préstamos es opcional, ese
      bloque se cobra sólo a quien lo contrate.
- [ ] Rehacer §6, §8 y §9 de `canal-de-reventa.md` con los números nuevos.

### 4.2 — BASE automático: qué falta

Esto es lo que se construye mientras la beta corre.

**Bloqueante duro, escrito en `FUTURO.md`:** el wizard de `/bienvenida` escribe
`organizaciones`, `organizacion_miembros` y `cuentas_bancarias` **desde el
navegador**, así que el límite de cuentas del plan se puede saltear con la API
de Supabase directa. Es requisito antes de abrir el registro público.

- [ ] Pasar la creación de la organización al servidor y quitar esas policies.
- [ ] Alta de cuenta con las reglas por defecto del banco sembradas solas
      (`sembrarDefaultsBanco.ts` ya existe — es la pieza que hace posible "las
      categorizaciones se cargan con cada cuenta").
- [ ] Videos cortos por módulo. Son la capacitación de BASE y bajan el soporte
      de los otros dos planes.
- [ ] Cobro automático (débito por Mercado Pago) al terminar la prueba.
- [ ] **Prueba de que está listo:** un alta completa de punta a punta sin que
      intervengamos — registro, organización, cuenta, primer extracto
      importado y categorizado.

---

## ETAPA 5 — Pasaje a venta (con los 20 lugares ocupados)

- [ ] Landing con los tres precios visibles. **Enterprise tiene que mostrar su
      precio** aunque el botón diga "Hablemos": si dice sólo "consultar", el
      ancla deja de funcionar y PRO pierde la referencia.
- [ ] El correo frío deja de ofrecer beta y ofrece prueba de 15 días con
      tarjeta. El cambio ya está previsto en el código (`cupoLleno` en
      `mensajes.ts` cambia el encuadre solo al llegar a 20).
- [ ] [`canal-de-reventa.md`](onconcilia-web/content/canal-de-reventa.md) y
      [`programa-referidores.md`](onconcilia-web/content/programa-referidores.md)
      rearmados con: la grilla nueva, el menú de 4 opcionales, préstamos como
      módulo, el historial por trimestre y cuenta, y la beta terminada.
- [ ] Sacar de los dos documentos "mientras dure la beta, los clientes
      referidos entran con 60 días sin cargo" y reemplazarlo por la prueba de
      15 días.

---

## Anexo — Qué ya está construido y verificado (no rehacer)

| Pieza | Estado |
|---|---|
| Buscador Google Places + dedupe por `google_place_id` | Construido y probado contra base real (04/09) |
| Enriquecedor nivel 0 y 1 (sitio propio) | Construido; **nunca se había ejecutado** hasta el 19/09 |
| `/api/cron/daily-enrich` | Nuevo, 19/09 |
| Timeout de lectura de cuerpo en `http.ts` | Corregido, 19/09 — de 979s a 8s por lote |
| Brevo: dominio autenticado, lista id 3, webhook id 2168911 | Verificado con envío real `delivered` (04/09) |
| Correo frío 1:1 con tope de 50/día y baja automática por webhook | Construido |
| Test A/B/C de asunto | En curso desde el 08/09, sin medir todavía |
| Cal.com `/15min` + `/coordinar/[id]` | Construido |
| 3 correos opt-in maquetados | Escritos, falta el Automation |
| Planes con límites (`src/lib/planes.ts` del SaaS) | base/pro/enterprise con cuentas y usuarios definidos |
| Feature flags por organización | `echeqs`, `liquidaciones`, `mercadopago`, `comprobantes` — **falta `prestamos`** |
| Siembra de reglas por banco (`sembrarDefaultsBanco.ts`) | Construido — habilita el BASE automático |
