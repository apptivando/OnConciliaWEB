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
| 6b | **Mercado Pago no es opcional: va incluido en los tres planes** | Lo va a necesitar todo el mundo, y mostrarlo incluido es argumento de venta, no un módulo más que cobrar |
| 7 | PRO elige **2 del menú de 4**; el canal de WhatsApp queda afuera | Es el único módulo con servidor dedicado propio |
| 7b | **WhatsApp no se usa para contacto en frío** | Meta lo tiene muy controlado para publicidad e invitaciones; el riesgo real es que bloqueen el número y se pierda el canal para los clientes de verdad |
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

## TUS TAREAS, EN ORDEN

Ordenadas por lo que bloquea a lo que. Las de Supabase y Brevo son las únicas
que me frenan a mí; el resto lo podés hacer en paralelo.

### Bloquean el lanzamiento

- [ ] **Supabase — correr 2 migraciones** en el SQL Editor del proyecto
      `bhtkkhytsznivdqzdold`:
      [`migrate_leads_beta.sql`](onconcilia-web/supabase/migrate_leads_beta.sql)
      (teléfono y "agendó" en `leads`) y
      [`migrate_prospect_ciudades.sql`](onconcilia-web/supabase/migrate_prospect_ciudades.sql)
      (las 48 ciudades con su avance). Sin la primera, el formulario de la
      landing guarda a medias; sin la segunda, el buscador no sabe por dónde va.
- [ ] **Brevo — armar el Automation.** Es lo único que no se puede hacer por
      API. Detalle exacto en la Etapa 1.4.
- [ ] **Vercel — cargar 4 variables**: `BREVO_API_KEY`,
      `BREVO_LIST_ID_LEADS=3`, `BREVO_WEBHOOK_SECRET` y `CAL_WEBHOOK_SECRET`
      (esta última la generás vos y la pegás también en Cal.com). En Production
      y en Preview.
- [ ] **Cal.com — crear el webhook.** Settings → Webhooks → Add, evento
      `BOOKING_CREATED`, URL `https://onconcilia.com/api/cal/webhook`, con el
      mismo secreto que cargaste como `CAL_WEBHOOK_SECRET`. Sin esto, al que
      agenda le siguen llegando los tres recordatorios de agendar.
- [ ] **Cal.com — las preguntas del evento de 15 minutos.** Que pida: con
      cuántos bancos trabajan, **con qué bancos** (define si hay parser que
      desarrollar), quién revisa los pagos y cuánto tardan en cerrar el mes.

### No bloquean, pero cuanto antes mejor

- [ ] **GitHub — cargar dos secrets** en el repo `apptivando/OnConciliaWEB`
      (Settings → Secrets and variables → Actions): `CRON_SECRET` (el mismo
      que ya está en Vercel) y `APP_URL` (`https://onconcilia.com`). Con eso
      el workflow de prospección empieza a correr solo.
- [ ] **Brevo — confirmar que la key no quedó cargada en el proyecto viejo de
      Vercel.** Si quedó, las campañas salen duplicadas. Es el mismo problema
      que ya pasó con Resend en agosto.
- [ ] **Brevo — apuntar el webhook a `onconcilia.com`** cuando esto se mergee
      a `main`. Hoy apunta a `dev.onconcilia.com`.
- [ ] **Leer los textos** de la landing y de los tres correos y marcarme lo que
      no te cierre.
- [ ] **Decidir la Etapa 4** (puesta en marcha y qué entra en el abono), que
      quedaste pensando.

### Y lo que hay que hacer en el otro repo (OnConcilia_Saas)

- [ ] Crear el **feature flag `prestamos`**. Hoy préstamos lo ve cualquier
      organización; si pasa a ser módulo opcional, necesita flag propio.
      No corre prisa: recién hace falta cuando se vendan planes.

---

## MIS TAREAS — estado

| Etapa | Qué | Estado |
|---|---|---|
| 1.1 | Worker de enriquecimiento (`/api/cron/daily-enrich`) | ✅ |
| 1.1 | Bug de timeout en `http.ts` (979s → 8s) | ✅ |
| 1.1 | Enriquecer los 30 sitios pendientes | ✅ 14 correos |
| 1.1 | Checklist ciudad × rubro | ✅ |
| 1.1 | Normalizar las localidades mal tipeadas | ✅ 81 filas |
| 1.2 | Landing con el encuadre de beta Pro | ✅ |
| 1.2 | Formulario de la reunión como CTA (`BetaForm`) | ✅ |
| 1.3 | Los 3 correos opt-in reescritos | ✅ |
| 1.3 | Correo frío 1:1 con el CTA nuevo | ✅ |
| 1.5 | Webhook de Cal.com (`/api/cal/webhook`) | ✅ |
| 2.1 | Ciudades y rubros ordenados (`ciudades.ts`) | ✅ |
| 2.2 | Buscador secuencial por ciudad | ✅ |
| 2.2 | Workflow de GitHub Actions | ✅ |
| 1.5 | Guion de la reunión de 15 minutos | ⏳ pendiente |
| 1.3 | Guion de WhatsApp para después de la respuesta | ⏳ pendiente |
| 2.4 | Tablero de avance en `/prospectos` | ⏳ pendiente |
| 2.3 | Seguir el link que enlaza la bio de la red | ⏳ pendiente |
| 3.x | Todo lo de operar la beta | ⏳ durante la beta |

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
> continuo — que entra justo en la ventana de la beta si arranca ya.

### WhatsApp no es un canal de contacto en frío

Los 14 WhatsApp encontrados **no cambian la cuenta de arriba**. Meta tiene muy
controlado el envío de publicidad e invitaciones por ese medio, y el costo de
equivocarse no es una campaña floja: es que la gente bloquee el número, que es
un daño que no se revierte y que se lleva puesto el canal para los clientes
reales. El correo frío 1:1 tiene sus reglas y las conocemos; WhatsApp en frío
no.

**Dónde sí sirve:** después de que el prospecto respondió, agendó la reunión o
pidió que lo llamemos. Ahí es el mejor canal que hay. Antes de eso, no.

> **Consecuencia sobre `prioridad_contacto`.** Hoy la escala pone WhatsApp en
> 1 y email en 2, o sea "contactalo por WhatsApp primero". Esa escala se
> escribió pensando en qué dato es más valioso, no en qué canal se usa para
> abrir. Para el trabajo en frío el orden real es **email → teléfono**, con
> WhatsApp reservado para después de la respuesta. Hay que decidir si se
> reordena la escala o se deja y se documenta que significa otra cosa — ver
> Etapa 2.4.

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
- [x] Los 10 rubros del checklist reemplazan a los 8 del cron viejo.
- [x] Normalización del nombre de ciudad, al insertar y sobre lo ya guardado.
- [ ] Buscar y enriquecer las primeras ciudades del checklist. **Arranca en
      cuanto corras la migración de `prospect_ciudades`.**

### 1.2 — Landing: la beta pasa a ser PRO ✅

- [x] **El CTA es el formulario de la reunión**, no una captura de correo.
      Mismo patrón que `/coordinar/[id]`: nombre, correo, teléfono y con qué
      bancos trabajan; se guardan, y recién después aparece el calendario.
      Componente nuevo `BetaForm`, en el hero y en el cierre.
- [x] Los datos se guardan **antes** del calendario, a propósito: el que
      abandona ahí entra igual a la secuencia de correos, que ahora son
      recordatorios de agendar.
- [x] Sección "La beta": plan Pro completo, 90 días de historial de todas las
      cuentas, y el banco que falte desarrollado sin cargo.
- [x] Qué se pide a cambio: las dos encuestas (día 15 y 45) y el 50% × 3 meses
      que las paga. Decirlo de entrada filtra al que no va a contestar nunca.
- [x] **Fuera la tarjeta de estudios contables.** Vuelve cuando haya una
      función que les sirva; el portal del contador no existe y era la promesa
      más cara de incumplir. En su lugar, "comercios que cobran por todos
      lados".
- [x] Mercado Pago **y Mercado Libre** como función incluida, con el detalle
      de que separa compras y costos de venta de ML.
- [x] Franja de saldos diarios (franja, no tarjeta: es una rutina, no una
      función más).
- [x] **Sección de módulos opcionales**: echeqs, préstamos, liquidaciones y
      comprobantes, aclarando que en la beta se eligen dos.
- [x] Se borró `LeadForm.tsx`, que quedó sin uso. Dejarlo invitaba a que
      alguien lo volviera a colgar en la landing.

> **Una cosa a confirmar.** "Plan Pro completo" en la landing dice *dos*
> módulos opcionales a elección, que es la definición de PRO. Si la intención
> era que los betas tengan los cuatro, cambia una línea.

### 1.3 — Los correos, reescritos al nuevo encuadre

Los 3 opt-in (`emails-automation-optin/paso-*.html`) y el frío 1:1
(`mensajes.ts`, `comercio[1]`) ya existen y están bien armados. Cambia **qué se
ofrece**, no la estructura.

| Pieza | Qué cambió |
|---|---|
| ~~`paso-1-bienvenida`~~ → **`paso-1-agenda`** | Ya no es una bienvenida: es el recordatorio de elegir horario. Dispara **a las 2 horas**, no inmediato — el contacto entra a la lista antes de ver el calendario, y el que agenda enseguida sale por el webhook, que tarda unos segundos |
| `paso-2-valor` | El dato del BCRA (777 millones de transferencias, +22%) y por qué ya no se concilia una vez por mes. Cierra en la reunión |
| `paso-3-cierre` | Último correo, y lo dice: "si no, no hace falta que hagas nada". Baja bajas y marcas de spam |
| `mensajes.ts` `comercio[1..3]` | Encuadre nuevo de la beta y el link a `/coordinar/[id]` en los tres pasos, no sólo en el primero |
| `ASUNTOS_COMERCIO` A/B/C | **Sin tocar**, como pediste: el test sigue corriendo y cambiar el asunto ahora lo invalidaría |

- [x] Reescritos los 4 textos.
- [ ] **Guion de WhatsApp para después de la respuesta** — no para abrir. Se
      usa cuando el prospecto ya contestó el correo, agendó o pidió que lo
      llamemos (ver *WhatsApp no es un canal de contacto en frío*).

### 1.4 — Brevo: qué está hecho y qué falta

Tenías razón en que está armado. Lo que falta es poco, pero es justo lo que no
tiene API.

**Ya hecho, verificado contra la API real (04/09):**

| Pieza | Estado |
|---|---|
| Dominio `onconcilia.com` autenticado (DKIM×2, DMARC, código) | ✅ `{"authenticated": true}` |
| Lista de leads | ✅ id **3** |
| Webhook de eventos (rebote, spam, baja, apertura, clic) | ✅ id **2168911** |
| Atributos personalizados `EMPRESA`/`LOCALIDAD`/`SECTOR`/`PRIORIDAD` | ✅ |
| Envío real de punta a punta | ✅ confirmado `delivered` |
| Código: `upsertContacto`, `enviarTransaccional`, baja automática por webhook | ✅ |
| Código nuevo: `quitarDeLista()`, y el alta de lead manda `FIRSTNAME` y `SMS` | ✅ |

> `FIRSTNAME` y `SMS` son atributos que Brevo trae de fábrica, así que **no hay
> que crearlos** en el panel — a diferencia de los cuatro del carril frío, que
> sí hubo que definir a mano.

**Lo que falta, todo del lado del panel:**

- [ ] **Armar el Automation.** Trigger: contacto entra a la lista 3. Tres
      correos con los textos de `emails-automation-optin/`:

      | Paso | Espera | Condición antes de enviar |
      |---|---|---|
      | `paso-1-agenda` | **2 horas** | sigue en la lista |
      | `paso-2-valor` | 3 días | sigue en la lista |
      | `paso-3-cierre` | 7 días | sigue en la lista |

- [ ] **La condición de "sigue en la lista" no es opcional.** Sacar un contacto
      de la lista **no corta** un Automation ya empezado: Brevo lo sigue
      corriendo. Sin esa condición en cada paso, al que agenda le llegan igual
      los tres recordatorios de agendar.
- [ ] Cargar en Vercel `BREVO_API_KEY`, `BREVO_LIST_ID_LEADS=3` y
      `BREVO_WEBHOOK_SECRET` — pendiente del plan anterior, y sin eso las
      rutas no funcionan en producción.
- [ ] Apuntar el webhook a `onconcilia.com` cuando esto llegue a `main` (hoy
      apunta a `dev.onconcilia.com`).
- [ ] Confirmar que la key **no** quedó cargada en el proyecto viejo de Vercel.

### 1.5 — La reunión como única puerta

- [x] **Webhook de Cal.com** (`/api/cal/webhook`, nuevo). Recibe
      `BOOKING_CREATED` con firma HMAC verificada, marca el lead como
      `reunion_agendada`, marca el prospecto como `demo_agendada` si el correo
      coincide con uno del carril frío, y saca el contacto de la lista de
      Brevo. Es la pieza que faltaba para distinguir al que agendó del que no.
- [ ] **Tuyo:** crear el webhook en Cal.com y cargar `CAL_WEBHOOK_SECRET` en
      Vercel (ver *Tus tareas*).
- [ ] **Tuyo:** las preguntas del evento de 15 minutos.
- [ ] Guion de la reunión. Tiene que cubrir cómo trabajan hoy, qué les cambia,
      con qué bancos operan, y el compromiso de las dos encuestas.

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

### 2.2 — Buscador secuencial ✅

- [x] `src/lib/prospects/ciudades.ts` — las 48 ciudades en orden, los 10
      rubros, y `normalizarCiudad()`.
- [x] `/api/cron/daily-search` reescrito: toma la primera ciudad abierta, el
      primer rubro sin buscar, recalcula los correos acumulados y cierra la
      ciudad al llegar a la meta (`BUSQUEDA_META_CORREOS`, default 35) o al
      quedarse sin rubros.
- [x] Tabla `prospect_ciudades` con el avance —
      [`migrate_prospect_ciudades.sql`](onconcilia-web/supabase/migrate_prospect_ciudades.sql),
      **correrla es tarea tuya**.
- [x] De paso, se corrigió en `daily-search` el mismo agujero de autenticación
      que tenía `daily-enrich`: `if (process.env.CRON_SECRET && ...)` deja el
      endpoint abierto justo cuando falta la variable.
- [x] `normalizarCiudad` aplicado al insertar, y los 81 registros viejos
      corregidos a mano ("Cordobá" → Córdoba, "Parana" → Paraná).

**Automatización gratuita — `.github/workflows/prospeccion.yml`** ✅

Decidido: no se paga Vercel Pro, que además limita a un cron por día. El
workflow corre tres veces por día hábil en horario argentino y le pega primero
a `daily-search` y después a `daily-enrich`, imprimiendo la respuesta de cada
llamada en el log. También tiene disparo manual (`workflow_dispatch`) con un
input de vueltas, para empujar volumen cuando haga falta.

Ventaja sobre el cron de Vercel, que no es menor: **el historial de corridas
queda a la vista en la pestaña Actions**. Es justo lo que faltó para notar que
el buscador llevaba dos semanas detenido.

- [ ] **Tuyo:** cargar los secrets `CRON_SECRET` y `APP_URL` en el repo.
- [ ] Ojo con esto: GitHub **desactiva los workflows programados si el repo
      pasa 60 días sin commits**. Con el proyecto activo no molesta.

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
- [ ] Decidir qué hacer con `prioridad_contacto`: hoy WhatsApp es 1 y email 2,
      lo que se lee como "abrí por WhatsApp" y es justo lo que no hay que
      hacer. O se reordena a **email → teléfono → WhatsApp**, o se renombra la
      escala para que quede claro que mide calidad del dato, no orden de
      contacto.

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

**La importación por lote es requisito del programa beta**, no una mejora
deseable. Se construye *mientras salen las campañas*: la ventana entre el
primer correo enviado y el primer beta activado es exactamente el tiempo que
hay para tenerla lista. Si los betas empiezan a entrar y la carga sigue siendo
archivo por archivo, el cuello de botella somos nosotros desde el día uno.

- [ ] Medir cuánto lleva hoy cargar 90 días de una cuenta, con un caso real.
      Es el número que dice cuán urgente es el lote.
- [ ] **Importación por lote** — subir los archivos de una cuenta juntos y
      procesarlos en cola. El mapeo de columnas ya se reconoce solo a partir
      del segundo archivo, así que la parte difícil está hecha.

> **Corrección respecto de lo que decía `canal-de-reventa.md`.** Ahí la
> importación por lote figuraba como requisito del **autoservicio de BASE**.
> Eso ya no aplica: BASE no incluye historial. Lo que la hace obligatoria es el
> programa beta, y después el historial que se venda suelto por trimestre y
> cuenta.

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

> **En pausa a propósito.** Lo estás pensando: qué entra en el abono y cómo
> queda la puesta en marcha. Nada de acá se toca hasta que eso esté decidido.
> La grilla de abajo es el borrador sobre el que discutir, no una definición.

### 4.1 — Grilla nueva (a validar)

| | BASE | **PRO** | ENTERPRISE |
|---|---|---|---|
| Suscripción | $65.000 | $130.000 | $245.000 |
| Cuentas | 3 bancos + 1 billetera | 5 + 1 | 10 + 1 |
| Usuarios | 3 | 8 | 15 |
| Historial incluido | **Ninguno** — se cotiza **por trimestre y por cuenta** | **1 trimestre** | **1 año** |
| Categorización | **Defaults automáticos, sin asistencia** | **Asistida** | **Asistida** |
| Mercado Pago | **Incluido** | **Incluido** | **Incluido** |
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
