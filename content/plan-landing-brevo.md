# Plan — Landing, buscador de prospectos y Brevo

**Proyecto:** OnConcilia MKT (`C:\Apptivando\OnConcilia_MKT`, app en `onconcilia-web/`)
**Repo:** `github.com/apptivando/OnConciliaWEB`
**Fecha:** 03/09/2026

Documento de trabajo: marcá los `[ ]` a medida que avances.

**Decisiones cerradas el 03/09/2026:**
1. Saldos en la landing → **franja de una línea** (opción A).
2. Deploy → **recrear el proyecto en la cuenta nueva de Vercel (`apptivando1`)** antes de seguir.
3. Los 41 prospectos actuales → **archivar** (no se re-enriquecen). Arrancamos limpio con comercios.

---

## TUS TAREAS, EN ORDEN

Ordenadas por lo que bloquea a lo que. Los bloques 1 y 2 son los únicos que me
frenan a mí: el resto lo podés hacer en paralelo mientras yo escribo código.

### Bloque 1 — Vercel (esto destraba todo lo demás)

- [ ] En la cuenta nueva (`apptivando1`), **importar el repo** `apptivando/OnConciliaWEB`.
- [ ] **Root Directory: dejar el default (`./`).** La raíz del repo ya es la app: `package.json`, `next.config.mjs` y `vercel.json` están en el primer nivel. La carpeta local `OnConcilia_MKT/` que contiene a `onconcilia-web/` **no está versionada** — es solo la organización del disco, no la del repo.
- [ ] Framework Next.js, build command `pnpm run build` (detecta `pnpm-lock.yaml` solo).
- [x] Cargar las variables. **`onconcilia-web/.env.local` era del 13/07/2026 y no todo seguía vigente** — probé las 8 contra sus APIs el 03/09/2026:

| Variable | Estado verificado | Resolución |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ apunta a `bhtkk…` (el de la app) | Copiar tal cual |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 200 contra PostgREST | Copiar tal cual |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ verificada (con ella conté las filas) | Copiar tal cual |
| `ANTHROPIC_API_KEY` | ✅ 200 contra `/v1/models` | Copiar tal cual |
| `RESEND_API_KEY` | ⚠️ estaba duplicada, rotada | ✅ **Hecho** — `re_Rjwu…` nueva, verificada (200), guardada en `.env.local` |
| `NEXT_PUBLIC_APP_URL` | ❌ `http://localhost:3000` | ✅ **Resuelto** — proyecto nuevo es `https://onconciliaweb.vercel.app` |
| `SERPER_API_KEY` | ❌ muerta (403) | **Descartada, no se usa** — ver nota abajo |
| `CRON_SECRET` | Ver hallazgo de seguridad abajo | Generar uno para el proyecto nuevo |

**Auditoría de por qué rompió el build (hecha después del primer deploy
fallido).** Grep de las 8 rutas de `src/app/api/` en busca de código que se
ejecuta al cargar el módulo (no dentro de una función) — es lo que hace que
Next.js falle en "Collecting page data" aunque la ruta nunca se llame:

| Patrón module-level | Dónde | Variable | Riesgo de build |
|---|---|---|---|
| `new Resend(...)` | 3 rutas | `RESEND_API_KEY` | **Era el que rompió** — resuelto, key rotada y cargada |
| `new Anthropic(...)` | 1 ruta | `ANTHROPIC_API_KEY` | Ya estaba entre las 4 copiadas — sin riesgo |
| `createClient(...)` de Supabase | 6 rutas | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Ya estaban entre las 4 — sin riesgo |
| `process.env.SERPER_API_KEY` | 2 rutas | — | **Solo dentro de funciones**, nunca a nivel de módulo. Sin la variable, el build no se entera — recién falla si alguien llama a esa ruta en runtime |

Conclusión: **`SERPER_API_KEY` no hace falta cargarla en Vercel para nada**, ni
para el build ni para nada que vayamos a usar (ver decisión de abajo). No es
"queda pendiente", es que directamente no aplica.

**Nivel 3 (búsqueda web) queda descartado, no solo pausado.** No es una
decisión de presupuesto: en FORCOM, medido contra resultados reales, **no
mejoró lo que ya daba Places**. La documentación vieja de FORCOM (que yo cité
para justificar el nivel 3) decía lo contrario — el usuario corrigió con la
experiencia real de uso, que pesa más que lo que dice un comentario en el
código. El buscador de OnConcilia arranca y se queda con **Places + sitio
propio** únicamente (niveles 0 y 1 de la cascada de `enrich.ts`); el nivel 3
no se porta.

**Hallazgo de seguridad en el cron actual, no bloqueante pero para tener en
cuenta.** `daily-search/route.ts:39` valida así:
```ts
if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) { ... 401 ... }
```
Si `CRON_SECRET` **no** está seteada, el `&&` corta corto y el `if` nunca es
verdadero — el endpoint queda **abierto sin autenticación**, cualquiera podría
invocarlo y gastar cuota. `daily-outreach/route.ts:20` no tiene este problema
(su lógica sí rechaza por default). Conclusión: **`CRON_SECRET` sí hay que
cargarla**, no es opcional aunque el build no la necesite.

- [x] Cargar en Vercel (proyecto nuevo): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY` (la nueva), `CRON_SECRET`, y `NEXT_PUBLIC_APP_URL=https://onconciliaweb.vercel.app`. **`SERPER_API_KEY` no se carga.**
- [x] Volver a disparar el deploy y verificar que pase. **Hecho 04/09/2026 — build verde.**
- [ ] Verificar que el cron aparezca en **Settings → Cron Jobs**.

**Bloque 1 cerrado (04/09/2026).**

### Bloque 1b — Dominio propio + rama `dev` (03/09/2026)

`onconcilia.com` y `www` ya quedaron validados en el proyecto nuevo — resuelve
el "falta dominio propio" que venía pendiente del CLAUDE.md viejo de MKT.
Falta un ambiente de desarrollo separado, mismo patrón que `develop` →
`staging.onconcilia.com` en el proyecto de la app.

- [x] Rama `dev` creada y pusheada (idéntica a `main` por ahora).
- [~] `dev.onconcilia.com` agregado en Vercel y **validando** (04/09/2026) — confirmar cuando pase a "Valid".
- [ ] En Vercel: **Domains → Add → `dev.onconcilia.com`** → asignar a
      **Preview**, **"Assign to a Git Branch"** → `dev`. No como Production.
- [ ] En DonWeb: `CNAME dev.onconcilia.com → cname.vercel-dns.com`. El campo
      "Nombre" pide el hostname completo, no el prefijo.
- [ ] **Revisar el scope de las 7 variables del Bloque 1**: si al cargarlas
      solo tildaste Production, los deploys de `dev` van a fallar por las
      mismas variables — tildar también **Preview**.
- [ ] `NEXT_PUBLIC_APP_URL` con valor propio por ambiente: `https://onconcilia.com`
      en Production, `https://dev.onconcilia.com` en Preview.

> ~~Límite de 2 cron jobs en Hobby~~ — desactualizado, Vercel lo subió a
> ~100. Igual conviene evitar declarar el mismo cron dos veces entre el
> proyecto viejo y el nuevo mientras el viejo siga vivo (ver aviso de abajo),
> pero ya no es un techo que haga rechazar el deployment.

> El proyecto viejo va a seguir deployando en cada push mientras exista. No es
> grave acá (esta app no manda emails automáticos todavía), pero cuando conectemos
> Brevo hay que asegurarse de que la key **no** quede cargada en el viejo, o las
> campañas salen duplicadas. Mismo problema que tuvimos con Resend en agosto.

### Bloque 2 — Google Cloud

**Proyecto nuevo, no el de FORCOM.** La key de FORCOM vive en un proyecto de
Google Cloud de la **cuenta del cliente** de ese negocio, no una cuenta
personal de prueba como yo había asumido — dato que corrige el Anexo A de
abajo. Mezclar el consumo de OnConcilia en la cuenta de Google de otro cliente
no corresponde: esa cuenta la administra el cliente, puede revocar acceso,
cambiar de plan de facturación, o simplemente no tener por qué ver cargos de
otro producto. OnConcilia necesita su propio proyecto, en una cuenta de Google
que controle Apptivando.

- [ ] **Definir qué cuenta de Google usar.** Tiene que ser una donde Apptivando
      tenga el control total (crear/borrar proyectos, ver facturación, rotar
      keys) — la cuenta personal de Guillermo sirve si no hay todavía una
      organizacional de Apptivando. Lo que hay que evitar es repetir el
      problema: no uses la cuenta de ningún otro cliente.
- [ ] **Crear el proyecto.** [console.cloud.google.com](https://console.cloud.google.com) →
      selector de proyecto (arriba a la izquierda) → **"Proyecto nuevo"**.
      Nombre sugerido: `onconcilia-prospectos` o `OnConcilia`. Sin
      organización si es cuenta personal — Google la deja en "Sin
      organización" y es normal. **Crear**.
- [ ] **Vincular una cuenta de facturación.** Con el proyecto nuevo abierto:
      menú ☰ → **Facturación** → si no hay ninguna cuenta de facturación
      todavía, **Crear cuenta de facturación** (pide tarjeta; Google Cloud da
      USD 300 de crédito gratis los primeros 90 días en cuentas nuevas, pero
      igual hay que cargar una tarjeta). Si Apptivando ya tiene una cuenta de
      facturación de otro proyecto propio (no la de un cliente), vincular esa
      en vez de crear otra — así todo el gasto de Apptivando queda junto.
      **Sin facturación vinculada, Places API (New) no funciona aunque esté
      habilitada.**
- [ ] **Habilitar Places API (New).** Menú ☰ → **APIs y servicios** →
      **Biblioteca** → buscar *"Places API (New)"* (ojo, no la
      "Places API" a secas, que es la legacy) → **Habilitar**.
- [ ] **Configurar la alerta de presupuesto.** Menú ☰ → **Facturación** →
      **Presupuestos y alertas** → **Crear presupuesto**. Alcance: este
      proyecto. Monto sugerido para arrancar: USD 10/mes (una búsqueda de 60
      resultados cuesta ~USD 0,084, así que USD 10 son ~120 búsquedas
      completas). Alertas en 50%, 90% y 100%.
- [ ] **Crear la API key.** Menú ☰ → **APIs y servicios** → **Credenciales** →
      **+ Crear credenciales** → **Clave de API**. Se genera al toque.
- [ ] **Restringirla, antes de usarla en ningún lado.** En la lista de
      credenciales, clic en la key recién creada → **Editar**:
      - **Restricciones de aplicación** → dejar en **"Ninguna"**. Vercel no
        tiene IPs fijas y la llamada sale del servidor, no del navegador — una
        restricción por IP o por referrer HTTP la rompería sin avisar.
      - **Restricciones de API** → **Restringir clave** → tildar únicamente
        **Places API (New)**. Nada más.
      - Renombrarla arriba a algo identificable, ej. *"OnConcilia — Places
        prospectos"* — ayuda el día que haya que rotarla.
      - **Guardar.**
- [x] Copiar el valor de la key y pasármelo. **Hecho 03/09/2026** — cargada en
      `onconcilia-web/.env.local` y probada con una búsqueda real ("ferretería
      paraná") → 200, habilitación y restricciones OK.
- [ ] Cargar la misma key en Vercel (proyecto nuevo, `apptivando1`) como
      `GOOGLE_PLACES_API_KEY` cuando se cree ese proyecto (Bloque 1).

### Bloque 3 — Supabase

Dos archivos ya escritos en `onconcilia-web/supabase/`, listos para correr en
el SQL Editor del proyecto `bhtkkhytsznivdqzdold` (el de la app):

- [x] 1° — [`migrate_prospectos_places.sql`](onconcilia-web/supabase/migrate_prospectos_places.sql). **Hecho 04/09/2026** — constraints verificados contra la base: `canal` y `sector` con los valores nuevos, `origen` y `prioridad_contacto` creados, `prospect_searches` responde 200.
- [x] 2° — [`archivar_prospectos_2026-07-11.sql`](onconcilia-web/supabase/archivar_prospectos_2026-07-11.sql). **Hecho** — verificado: 41 en `descartado`, 0 en otro estado, total de la tabla sigue en 41 (no se perdió nada).

**Bloque 3 cerrado (04/09/2026).**

### Bloque 4 — Brevo (podés arrancar cuando quieras, no bloquea)

- [x] Cuenta creada (04/09/2026) — `apptivando@gmail.com`.
- [x] API key creada (sin MCP, sin bloqueo de IP). **Verificada 04/09/2026**
      — 200 contra `/v3/account`. Plan `free`, **300 emails/día** de tope
      (confirma el número que ya estaba anotado en Bloque 4 de abajo).
      Cargada en `onconcilia-web/.env.local` como `BREVO_API_KEY`.

> **MCP de Brevo (opcional, evaluado 04/09/2026):** existe, se activa
> tildando "MCP" al crear la key. **No es solo lectura** — la propia doc de
> Brevo dice que ejecuta acciones reales, incluida la creación/envío de
> campañas. Si se conecta, hacerlo por módulo (`contacts`,
> `email_campaign_management`, `campaign_analytics`), nunca el servidor
> completo (trae CRM, IPs dedicadas y gestión de usuarios — nada de eso
> aplica acá). Y conectarlo recién **después** de que la separación de
> carriles + la baja automática (Parte 3, tareas mías) estén construidas y
> probadas — no antes, para no tener un canal capaz de mandar una campaña
> real sin esa protección todavía en pie.
>
> **Actualización (04/09/2026): no hace falta.** Lo que motivaba el interés
> era poder armar el correo con un prompt — eso se resuelve con el
> "Generador de copy por prompt" de la sección Tareas mías (Anthropic, ya en
> el proyecto), sin exponer ninguna herramienta de envío real a un agente.
> MCP queda descartado para este proyecto, no solo pospuesto.
- [x] Registros de autenticación cargados en DonWeb (04/09/2026) — código
      Brevo, DKIM 1, DKIM 2, DMARC, más los 3 de branding (marca,
      redireccionamiento, imágenes). Los 7 coinciden byte a byte con lo que
      pide Brevo. Recordá: en Donweb el campo "Nombre" pide el **hostname
      completo**, no el prefijo — y ojo con lo que sigue.

> **Hallazgo (04/09/2026): CNAME y TXT no pueden coexistir en el mismo
> nombre.** `mkt.onconcilia.com` tenía a la vez el CNAME de "registro con
> marca" (`→ mkt-onconcilia-com.brand.brevosend.com`) y el TXT del código de
> verificación de Brevo. Confirmado con consultas DNS en vivo contra dos
> resolvers (Google y Cloudflare): la consulta TXT devolvía **SERVFAIL** en
> los dos — no era un error de tipeo ni de propagación, es una violación de
> DNS (un nombre con CNAME no puede tener ningún otro tipo de registro).
> Explica por qué "Código Brevo" era el único de los 4 registros de
> autenticación que el panel marcaba en error — los otros tres (DKIM×2,
> DMARC) están en nombres propios, sin colisión.
>
> **Decisión:** borrar el CNAME de "registro con marca" en DonWeb — se pierde
> el branding del link de tracking (cosmético), gana la verificación real del
> dominio (entregabilidad, lo que importa acá). `r.mkt` e `img.mkt` no tienen
> conflicto, quedan como están.
- [x] Confirmado 04/09/2026 — CNAME borrado, TXT ya resuelve sin SERVFAIL.
      DKIM 1, DKIM 2 y DMARC también correctos, verificados contra dos
      resolvers (Google y Cloudflare). **DNS 100% correcto de nuestro lado.**
- [ ] Brevo todavía muestra "diferencia" en el panel — **esperado, no es un
      error**. La propia doc de Brevo dice hasta 24-72hs para que su sistema
      refleje cambios de DNS, aunque el DNS ya esté bien (confirmado con
      consultas en vivo, no es propagación real). Reintentar "Authenticate
      this domain" en un rato; si sigue en rojo, esperar y no tocar más DNS.
- [ ] Escribir los 3 textos de la secuencia para comercios (los 9 actuales están escritos para estudios contables).
- [x] **Tope diario de envíos en frío: 50** (decidido 04/09/2026). Se aplica
      en nuestro código, no en Brevo — `OUTREACH_DAILY_LIMIT=50`, reemplaza el
      `.limit(20)` fijo que hoy tiene `daily-outreach/route.ts`. Deja margen
      sobre el tope de 300/día del plan free de Brevo para el carril opt-in y
      cualquier otra notificación del sistema.

### Bloque 5 — Revisión de textos (cuando quieras)

- [ ] Leer las propuestas de copy de la Parte 1 y marcar lo que no te cierre.

---

## Parte 0 — Estado actual (medido, no estimado)

Consultado directamente contra Supabase con la service key del repo, el 03/09/2026:

| Qué | Valor |
|---|---|
| Proyecto Supabase | `bhtkkhytsznivdqzdold` — el de la app. La consolidación de julio quedó hecha |
| `prospectos` | **41**, todos sector `estudio`, **todos creados el 11/07/2026** |
| Contactabilidad | 35 con teléfono · **9 con email** · 2 con WhatsApp · 6 con sitio web |
| `leads` | **0** |
| `interacciones` | **0** |
| Estados | 40 `por_contactar` · 1 `descartado` |

### Tres conclusiones

1. **Ya existe un buscador**, pero no es el de Places. Es `/api/agents/lead-search`:
   Serper Maps + Claude. El cron `daily-search` está declarado en `vercel.json`
   (L-V 8am AR, rotando 30 ciudades) pero **no cargó un solo prospecto desde el
   11/07**. Hay dos causas candidatas y no se pueden separar sin los logs del
   Vercel viejo, que es justo al que no hay acceso:
   - el deploy vive en la cuenta vieja de Vercel, y/o
   - **la `SERPER_API_KEY` está muerta** (403 verificado el 03/09 con una búsqueda
     real). Si el cron corrió, ese agente falla entero: Serper es su única fuente.

   Las dos se resuelven igual —proyecto nuevo + key nueva— así que no hace falta
   distinguirlas para avanzar.

2. **La calidad de los datos justifica el port.** En los primeros 6 registros hay
   dos cruzados con otra empresa:

   | Prospecto | Dato incorrecto |
   |---|---|
   | Matteoda Facundo Roberto | `economica.fca@uner.edu.ar` → es la facultad, no el estudio |
   | Marziali y Asoc | email y sitio de `estudioduranteyasociados.com` → otra empresa |

   Mandarle una campaña a esos emails no es un dato malo: son quejas de spam
   contra `onconcilia.com`.

3. **Con 9 emails no hay campaña que hacer.** El buscador desbloquea a Brevo,
   no al revés. Ese es el orden del plan.

---

## Parte 1 — Landing: ajustar a lo que el producto hace hoy

### Cómo funcionaría

La landing pasa a mostrar lo que el manual documenta y nada más. Se agregan las
tres funciones que existen y no estaban (Mercado Pago, saldos diarios,
comprobantes de pago), se corrige la promesa a estudios contables —que hoy no se
cumple— y se aclara que el envío al contador es automático.

**Fuera de alcance a propósito:** el bot de comprobantes por WhatsApp. Existe,
pero solo en `develop` (`main` devuelve 404 en `/api/bot/*`) y el manual no lo
menciona ni una vez. Entra a la landing recién cuando esté en producción y
documentado.

### Tareas tuyas

- [ ] Leer las propuestas de texto de abajo y marcar lo que no te cierre.
- [ ] Decidir entre las dos opciones de layout para "Saldos" (ver 1.5).

### Tareas mías

Todo sobre `onconcilia-web/src/app/page.tsx`.

#### 1.1 — Hero: sumar Mercado Pago

- [ ] **Antes:** *"OnConcilia importa el extracto de tus bancos argentinos, categoriza los movimientos y genera el reporte listo para tu contador. En minutos, no en horas."*
- [ ] **Después:** *"OnConcilia importa el extracto de tus bancos y de tu cuenta de Mercado Pago, categoriza los movimientos y genera el reporte listo para tu contador. En minutos, no en horas."*

#### 1.2 — "Para quién": corregir la tarjeta de estudios contables

La tarjeta actual promete *"múltiples clientes, múltiples cuentas. Un solo panel
para todo"*. **El producto no hace eso hoy**: un usuario pertenece a una sola
organización, y el portal del contador multi-organización sigue listado como
*Futuro* en el CLAUDE.md de la app. Es la promesa más cara de incumplir, porque
el estudio contable es justo el perfil que la beta quiere.

- [ ] **Después:** *"Estudios contables — Tu cliente cierra el mes en OnConcilia y a vos te llega el informe ya armado: Excel, PDF y el comprobante de comisiones con el IVA desglosado. El día 1 de cada mes, solo."*

Eso es exactamente lo que hace hoy (`email_contador` + cron del día 1), y sigue
siendo un buen argumento: reposiciona al estudio como **quien recibe**, no como
quien opera.

#### 1.3 — "Cómo funciona": el paso 3 se hace solo

- [ ] Paso 3, agregar al final: *"Y el día 1 de cada mes sale solo, sin que nadie lo dispare."*

#### 1.4 — "Funciones": pasar de 4 tarjetas a 6

| # | Tarjeta | Estado |
|---|---|---|
| 1 | Bancos argentinos | **Editar** — nombrar los bancos |
| 2 | Categorización masiva | Sin cambios |
| 3 | Mercado Pago | **Nueva** |
| 4 | Comprobantes de pago | **Nueva** |
| 5 | Comisiones e IVA | Sin cambios |
| 6 | Inversiones, préstamos y echeqs | Sin cambios |

**Tarjeta 1 — editar.** Nombrar los bancos es más creíble que "bancos argentinos":

- [ ] *"Subí el extracto de Nación, Santander, Macro, BICA, BERSA o Galicia y en segundos tenés todos los movimientos normalizados y listos para trabajar. Reconoce el formato de cada banco solo."*

**Tarjeta 3 — nueva (Mercado Pago), ícono 💳:**

- [ ] Título: *"Tus ventas de Mercado Pago, junto a lo del banco"*
- [ ] Texto: *"Importás el archivo de la billetera y los movimientos quedan en el mismo lugar que los del banco. Conectando la cuenta, OnConcilia averigua de cada venta si fue por QR, Point, link de pago o Mercado Libre, y trae el desglose de comisiones e impuestos de cada operación."*
- [ ] Badge: *"Bruto, retenciones y neto"*

**Tarjeta 4 — nueva (Comprobantes), ícono 🧾:**

- [ ] Título: *"El comprobante del cliente, unido al depósito"*
- [ ] Texto: *"Un cliente te transfiere y te manda la foto. En el extracto ese depósito es un renglón sin nombre. Subís la imagen o el PDF y OnConcilia lee monto, fecha, número de operación y CBU de destino, y busca solo cuál movimiento le corresponde. Si algo queda sin resolver, avisa a las 72 horas."*
- [ ] Badge: *"Lectura automática"*

#### 1.5 — Saldos diarios: franja de una línea (decidido)

Es la función que convierte al producto en rutina diaria en vez de herramienta
de cierre de mes. Cambia el argumento de *"ahorrás horas al cierre"* a *"sabés
todos los días cómo estás parado"*.

- [ ] Franja entre "Cómo funciona" y "Funciones", sin tarjeta:
      *"Y todos los días, en dos minutos: anotás el saldo de cada cuenta, OnConcilia te muestra el anterior y la variación. Si no cambió, no hace falta bajar ningún extracto."*

Así la grilla queda en 6 tarjetas parejas (3 filas de 2) y la rutina diaria se
lee como hábito, no como una función más.

---

## Parte 2 — Buscador de prospectos con Google Places

**✅ Construida, verificada y pusheada a `main` — 04/09/2026** (`250aa79`).
`GOOGLE_PLACES_API_KEY` confirmada en Vercel (04/09/2026) — el deploy de
producción ya tiene todo lo que necesita. Port del buscador de FORCOM
(`C:\Apptivando\ForcomWEB\forcom-web`), reapuntado a **comercios y pymes por
ciudad**. `pnpm run build` en verde, y probado de punta a punta contra
Supabase real (no solo compilado): una corrida con `GOOGLE_PLACES_MOCK=1`
insertó 24 prospectos de prueba, la repetición exacta dedupeó a 0 nuevos /
24 fusionados, y una corrida de `enrichBatch` contra `onconcilia.com` (sitio
real, se sabía de antemano qué debía encontrar) extrajo el email
correctamente. Todo el rastro de prueba se limpió después — cero datos de
test quedaron en la base.

Dos cosas que no estaban en el plan original y aparecieron haciendo el
trabajo, quedan documentadas en 2.1 y 2.3: `tsconfig.json` no tenía `target`
seteado (rompía con `for...of matchAll()`, típico al portar código entre
proyectos con configs distintas) y `comercio` como `Sector` real obligó a
escribir sus 3 plantillas en `mensajes.ts` antes de lo previsto (son un
primer borrador — el plan de Brevo ya prevé reemplazarlas con el generador de
copy por prompt).

### Cómo funcionaría

Entrás a `/prospectos`, escribís un rubro y una ciudad, y en segundos aparece la
lista de lo que Google Maps conoce ahí, con teléfono, dirección y sitio web.
Después, sola, la herramienta va visitando el sitio propio de cada comercio
para completar el email y el WhatsApp que Google no da. Cuando el comercio no
tiene sitio (o lo que Google publica como "sitio" en realidad es su
Instagram), ahí termina lo automático — queda con el teléfono que dio Places,
para resolver a mano.

Cada prospecto queda con una prioridad de contacto:

| Prioridad | Significa |
|---|---|
| **1** | WhatsApp confirmado (enlace `wa.me` o número junto a la palabra "WhatsApp") |
| **2** | Email |
| **3** | Solo teléfono (lo que publica Google Maps) |
| **4** | Sin contacto — queda para resolver a mano |

Lo importante frente a lo que hay hoy: **nunca se acepta un dato que no se pueda
verificar que pertenece a esa empresa**, y no duplica — repetir la misma búsqueda
fusiona por `google_place_id` en vez de crear filas nuevas.

Números medidos en FORCOM, primera corrida real de 20 prospectos ("ferreterías
en Córdoba Capital"): 8 con WhatsApp confirmado, 11 con email, 10 con perfil de
red, 0 sin ningún dato de contacto. Repetir la búsqueda: 0 nuevos, 20 fusionados.

### Tareas tuyas

#### Google Cloud

- [ ] Crear un proyecto de Google Cloud propio de Apptivando y la key ahí — nunca en el proyecto de un cliente. Paso a paso completo en **Bloque 2** (arriba) y motivo en **Anexo A**.
- [ ] Verificar que **Places API (New)** esté habilitada (la nueva, no la legacy).
- [ ] Restringir la key nueva a esa API únicamente. **No** poner restricción por IP: Vercel no tiene IPs fijas.
- [ ] Confirmar que la alerta de presupuesto del proyecto está activa.

#### Supabase

- [ ] Correr la migración SQL que voy a dejar en `onconcilia-web/supabase/` (columnas nuevas en `prospectos` + dos tablas de control). Detalle en 2.4.

#### Vercel — recrear en `apptivando1` (decidido, ver Bloque 1)

- [x] Recrear el proyecto en la cuenta nueva. **Hecho** — `https://onconciliaweb.vercel.app`. Detalle de las variables pendientes en **Bloque 1**.
- [ ] Cargar `GOOGLE_PLACES_API_KEY` (ya generada, ver Bloque 2) en Vercel y en `onconcilia-web/.env.local`.
- [ ] **No hace falta `PROSPECT_SEARCH_PROVIDER` ni `SERPER_API_KEY`** — el nivel 3 queda descartado (ver Bloque 1). El código de `search.ts` no se porta.
- [ ] Reiniciar `pnpm dev` después de cargar la key local: las variables se leen una sola vez, al arrancar.

### Tareas mías

#### 2.1 — Copiar los módulos independientes del dominio

De los ~2.800 líneas de `src/lib/prospects/` de FORCOM, se copian los módulos
que no saben nada de FORCOM — **sin `search.ts`**, ver nota abajo:

- [x] `places.ts` — adaptador de Places Text Search. `fetch` pelado, sin SDK
- [x] `http.ts` — fetch con timeout y límites de tamaño. UA cambiada a `OnConciliaBot/1.0`
- [x] `robots.ts` — respeta `robots.txt`. `BOT_NAME` cambiado a `onconciliabot`
- [x] `extract.ts` — extracción de emails, teléfonos, WhatsApp, redes y links internos. Copiado tal cual
- [x] `urls.ts` — clasificación de URLs y dominio registrable. Copiado tal cual
- [x] `config.ts` — reescrito, ver 2.2
- [x] `places.mock.ts` — 25 comercios de ejemplo, para desarrollar sin gastar cuota
- [x] `src/lib/phone.ts` — copiado tal cual (sin imports, cero cambios)

> **`search.ts` (369 líneas, nivel 3 multi-proveedor) no se porta.** Decidido
> el 03/09/2026: en FORCOM, medido contra resultados reales, no mejoró lo que
> ya daba Places. El buscador de OnConcilia queda en dos niveles: Places
> (nivel 0) + sitio propio del comercio (nivel 1). Si en algún momento se
> quiere reconsiderar, el módulo queda documentado acá — no hay que
> rediseñarlo, solo copiarlo cuando haga falta.

#### 2.2 — Adaptar rubros al público de OnConcilia

- [x] `INCLUDED_TYPES` reemplazado en `config.ts`: supermercados, farmacias,
      ferreterías, kioscos, estaciones de servicio, concesionarias, talleres,
      gastronomía, hotelería, indumentaria, mueblerías, electrónica.
- [x] Rotación del cron: 30 ciudades × 8 rubros en texto libre (ferretería,
      supermercado, farmacia, corralón, indumentaria, restaurante, estación de
      servicio, concesionaria) = 240 combinaciones, sin `sector` fijo.

> Nota de la doc de FORCOM: **el default recomendado es "sin filtro de tipo"**. Para
> rubros en español que no mapean limpio contra la Tabla A de Places, el texto libre
> anda mejor. Y solo se puede mandar un tipo por búsqueda.

#### 2.3 — Reescribir `enrich.ts` (785 → ~330 líneas)

- [x] Reapuntado a `prospectos`. Se cae toda la maquinaria exclusiva del nivel
      3 (`hitEsDelProspecto`, `dominioDelComercio`, `DIRECTORY_WEIGHTS`,
      `areaDe`, `SEARCH_BUDGET_MS`) — sin nivel 3 no tiene destinatario.
      `DIRECTORY_HOSTS` (guías comerciales argentinas) se mantiene: sigue
      siendo relevante en nivel 1, cuando Google publica como "sitio" del
      comercio la ficha de un directorio.
- [x] Mapeo de campos: `empresa`/`nombre` ← `displayName`, `telefono` ←
      `nationalPhone`/`internationalPhone` (normalizado con `toE164Ar`),
      `sitio_web` ← `websiteUri` (o `redes` si en realidad es un perfil
      social — `classifyUrl` lo distingue).
- [x] Se conserva: presupuesto de tiempo por prospecto (20s), tope de 4
      páginas por sitio, y que ningún prospecto tire excepción hacia arriba.
      **No se porta** el contador atómico de cuota diaria — era del nivel 3.
- [x] **Cambio de arquitectura sobre el original de FORCOM**: la prioridad de
      contacto (1-4) ya no se deriva del "nivel" que alcanzó la cascada — es
      un eje distinto (de dónde salió el dato vs. qué tan buen dato es). Se
      calcula aparte, al final, a partir de lo encontrado.
- [x] `enrichBatch` sin RPC de locking (`FOR UPDATE SKIP LOCKED`): a esta
      escala (botón manual + un cron diario, no un worker continuo) no hace
      falta — mismo criterio que ya usan `enrich-contacto`/`scrape-sitios` en
      este repo.

**Bug real encontrado al probar contra la base (no en el compilador) —
corregido:** la primera versión de la query de `enrichBatch` no excluía
`estado='descartado'`. Al probar con datos reales, agarró 5 de los 41
prospectos ya archivados y les escribió `prioridad_contacto`/
`enriquecido_en` — trabajo desperdiciado sobre algo que ya se había decidido
no perseguir. Confirmó además, de nuevo, el bug original que motivó el
archivado: uno de los 5 (Marziali y Asoc) sigue con el email de
`estudioduranteyasociados.com`, que ni siquiera es su sitio. Se agregó
`.neq("estado", "descartado")` a la query y se revirtieron a mano las 4
columnas que había tocado en esos 5 registros, restaurándolos exactamente al
estado que dejó el script de archivado — verificado campo por campo.

#### 2.4 — Migración SQL

- [x] Escrita — [`migrate_prospectos_places.sql`](onconcilia-web/supabase/migrate_prospectos_places.sql). Correrla es tarea tuya, Bloque 3.

Columnas nuevas en `prospectos`:

| Columna | Para qué |
|---|---|
| `google_place_id text unique` | Dedupe. Es lo que hace que repetir una búsqueda fusione en vez de duplicar |
| `direccion`, `localidad` | Lo que da Places |
| `rating`, `reviews_count` | Señal de si el comercio está activo |
| `prioridad_contacto smallint` | 1 a 4, según la tabla de arriba |
| `origen text` | `busqueda` / `landing` / `manual` |
| `redes jsonb` | Instagram y Facebook. **Solo la URL: los perfiles no se visitan** |
| `enriquecido_en`, `intentos_enriquecimiento` | Para que el worker sepa a quién le toca |

Tres cambios de esquema que hay que hacer sí o sí, porque la tabla actual no los
soporta:

- [x] **`sector`**: el CHECK actual es `in ('pyme','estudio','franquicia')`. Resuelto en la migración — agrega `'comercio'`.
- [x] ~~`nombre` es `not null`: hacerlo nullable~~ — **descartado.** `nombre`
      se usa en 4 lugares de la UI sin chequeo de null, y uno de ellos
      (`FichaClient.tsx:27`, `prospecto.nombre.split(' ')[0]` para el
      generador de mensajes) **rompería con un `TypeError`** apenas se abra la
      ficha de un prospecto de comercio. Se deja `not null` tal cual está y,
      al insertar desde Places, `nombre` se llena con el mismo valor que
      `empresa` — sin tocar código de UI.
- [x] **`canal`**: el CHECK actual no contemplaba `whatsapp`. Resuelto en la
      migración. (`busqueda` no va en `canal` — es un valor de `origen`, que
      es una columna distinta: `canal` es el medio de contacto, `origen` es de
      dónde salió el prospecto.)

Tabla nueva (control de gasto):

- [x] `prospect_searches` — log de cada búsqueda: query, resultados, páginas consumidas de Places. Creada en la misma migración.

> `prospect_api_usage` (contador diario del nivel 3) no se crea — no aplica sin nivel 3.

#### 2.5 — Rutas y UI

- [x] `/api/prospects/search` — dispara la búsqueda. Gateada por el
      middleware (agregado a `PROTECTED_API`, mismo criterio que
      `/api/agents`).
- [x] `/api/prospects/enrich` — worker del enriquecimiento, lotes de 12.
- [x] `src/lib/prospects/buscar.ts` (nuevo, no estaba en el plan original) —
      la lógica de búsqueda+dedupe+insert se separó en su propia función,
      porque la necesitan DOS lugares (el botón y el cron) y **no podían
      compartirla vía `fetch` interno** — ver hallazgo abajo.
- [x] Panel de búsqueda reusa los modales que MKT ya tenía
      (`BuscadorAgent.tsx`, `EnriquecerAgent.tsx`) en vez de construir uno
      nuevo desde cero: mismo patrón de modal ya estilizado, solo se
      reapuntaron los `fetch` y se cambiaron los campos del form (rubro +
      ciudad + tipo opcional + cantidad, en vez del selector de sector viejo).
- [x] Prioridad de contacto y origen visibles en `/prospectos`: badge de
      color bajo el nombre (solo para `origen='busqueda'`) + localidad.

**Bug latente encontrado (no de este cambio, preexistente) — evitado, no
reproducido:** el cron viejo llamaba a `/api/agents/lead-search` con un
`fetch` interno. Esa ruta está en `PROTECTED_API`, gateada por sesión de
usuario — un `fetch` servidor-a-servidor no tiene cookie de sesión, así que
en teoría el cron nunca pudo haber pasado el middleware (401). No se investigó
si esto explica parte de por qué el cron no cargó nada desde julio, porque no
hace falta: el cron nuevo (2.6) llama a `buscarProspectos` **directo, por
import**, sin pasar por HTTP ni por el middleware — el mismo patrón que ya
evita el problema de raíz.

#### 2.6 — Reemplazar el cron actual

- [x] `/api/cron/daily-search` reescrito — usa `buscarProspectos` (Places)
      en vez de Serper Maps + Claude, llamado por import directo (ver
      hallazgo arriba).
- [x] `/api/agents/lead-search`, `enrich-contacto`, `scrape-sitios` — **quedan
      desconectados, no se borran.** Ya no los llama nada (verificado con
      grep). Sirven de referencia si algún día se reconsidera el enfoque de
      Claude + Serper.

- [x] **Archivado de los 41 prospectos viejos** — escrito en
      [`archivar_prospectos_2026-07-11.sql`](onconcilia-web/supabase/archivar_prospectos_2026-07-11.sql).
      Correrlo es tarea tuya, Bloque 3 (después de la migración).

---

## Parte 3 — Brevo

**✅ Código construido y verificado — 04/09/2026.** `pnpm run build` en verde.
Probado contra la API real de Brevo (creación de contacto, sin mandar ningún
email) — funcionó, contacto de prueba borrado después. Falta correr la
migración y la configuración del lado de Brevo (lista abajo) antes de que
funcione en producción — nada de esto se probó con un envío real todavía,
a propósito.

**Decisiones tomadas el 04/09/2026, distintas al plan original:**
- **Solo cola manual** (`/cola` → `/api/outreach/send`) para el carril frío.
  `daily-outreach` (el cron automático) queda retirado — de hecho nunca
  estuvo en `vercel.json`, solo `daily-search` lo estaba, así que en los
  hechos ya era manual-only. El archivo queda como estaba (Resend, inerte),
  mismo criterio que `lead-search`.
- El tope de 50/día ahora vive en `/api/outreach/send` mismo (cuenta los
  envíos de hoy en `interacciones`), no en un cron separado — tiene sentido
  igual aunque el envío sea manual: evita que se recorra toda la cola de una
  sentada.
- **La secuencia opt-in la arma un Automation de Brevo**, no código nuestro.
  El código solo sincroniza el contacto + lo agrega a una lista al insertar
  en `leads`.

### Cómo funcionaría

Un segundo tablero maneja el correo, con **dos carriles separados a propósito**:

- **Carril opt-in** — los que se anotaron por el formulario de la landing
  (`leads`). Van a una lista de Brevo y reciben la secuencia de campañas. Esto es
  email marketing normal: campaña, plantilla, estadísticas de apertura.

- **Carril frío** — los prospectos que salieron de la búsqueda. Reciben envíos
  **individuales y personalizados, de a poco**, no una campaña masiva. Es
  contacto comercial uno a uno, que es lo que el flujo de outreach ya hace hoy.

Todos los días sale una tanda acotada. Lo que abre, clickea, rebota o se da de
baja vuelve por webhook a la ficha del prospecto y queda en `interacciones`.

> **Por qué los dos carriles no se mezclan.** Brevo prohíbe en sus términos enviar
> campañas a listas scrapeadas: hacerlo suspende la cuenta y, peor, quema el
> dominio. Un envío 1:1 personalizado a un comercio es otra cosa y es lo que
> hacen todas las herramientas de ventas. La separación no es burocracia, es lo
> que mantiene vivo el canal.

### Tareas tuyas

- [x] Crear la cuenta de Brevo y sacar la API key.
- [x] Crear el subdominio de envío `mkt.onconcilia.com`, DKIM/DMARC en DonWeb.
- [x] Cargar `BREVO_API_KEY` en `.env.local`.
- [ ] Cargar `BREVO_API_KEY`, `BREVO_LIST_ID_LEADS=3` y
      `BREVO_WEBHOOK_SECRET` (valor generado, pedímelo si lo perdiste) en
      **Vercel** — proyecto `apptivando1`, ambiente Preview como mínimo
      (para `dev.onconcilia.com`). Las rutas nuevas los necesitan en
      producción/staging, no solo en `.env.local`.
- [ ] Escribir los 3 textos de la secuencia opt-in para comercios (para el
      Automation de Brevo — distintos de los 3 de `mensajes.ts`, que son
      para el envío 1:1 en frío).
- [x] Tope diario de envíos en frío: **50** — aplicado en el código.

**⚠️ Corrección 04/09/2026 — los registros de autenticación estaban en el
subdominio equivocado.** El dominio que Brevo registró es `onconcilia.com`
(la raíz), no `mkt.onconcilia.com` como se instruyó la sesión anterior —
confirmado contra `GET /v3/senders/domains`, `host_name` viene relativo
(`@`, `brevo1._domainkey`, `_dmarc`). Por eso seguía sin autenticar un día
después: no era propagación, estaban en el lugar que no correspondía. Los 3
registros de "marca" (`mkt`/`r.mkt`/`img.mkt`, click-tracking) sí estaban
bien — es una función aparte, no depende de esto.

- [ ] En DonWeb, agregar 3 registros nuevos en la **raíz** (sin `.mkt`):
      - TXT `onconcilia.com` → `brevo-code:c6228f9be14e175c73b0b788f22b8f24`
      - CNAME `brevo1._domainkey.onconcilia.com` → `b1.onconcilia-com.dkim.brevo.com`
      - CNAME `brevo2._domainkey.onconcilia.com` → `b2.onconcilia-com.dkim.brevo.com`
- [ ] **Modificar** (no agregar otro) el DMARC existente de la raíz:
      `_dmarc.onconcilia.com` pasa de `v=DMARC1; p=none` a
      `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`. Un dominio no
      puede tener dos registros DMARC — agregar uno nuevo al lado rompería
      la validación de los dos.
- [ ] Los 4 registros viejos en `mkt.onconcilia.com` (código, DKIM×2, DMARC)
      quedan huérfanos — se pueden borrar cuando quieras, no urge.
- [x] **Autenticado — 04/09/2026.** Los 4 registros coincidían (confirmado
      contra el autoritativo), pero el flag general seguía en `false` hasta
      disparar la validación final — encontrado por API:
      `PUT /v3/senders/domains/onconcilia.com/authenticate`. Resultado:
      `{"authenticated": true, "verified": true}`.

**Hecho por API el 04/09/2026 (sin pasar por el dashboard):**

- [x] 4 atributos personalizados creados —
      `EMPRESA`/`LOCALIDAD`/`SECTOR` (texto), `PRIORIDAD` (numérico).
      El código de `/api/outreach/send` mandaba `''` para `PRIORIDAD` vacío;
      corregido a `null` porque el atributo quedó numérico, no texto.
- [x] Migración de `prospectos` corrida — `brevo_contact_id` etc. ya existen.
- [x] Lista de leads creada — **id `3`**, carpeta "Your first folder".
      Falta cargarla como `BREVO_LIST_ID_LEADS` en Vercel (arriba).
- [x] Webhook registrado — id `2168911`, eventos `hardBounce`/`spam`/
      `unsubscribed`/`opened`/`click`, apuntando a
      `https://dev.onconcilia.com/api/brevo/webhook?secret=…` (no a
      `onconcilia.com`: esa ruta todavía no existe en `main`/producción,
      solo en `dev`). **Actualizar la URL del webhook cuando esto se
      mergee a main.**

**Lo único que sigue siendo dashboard-only, sin API limpia para armarlo a
ciegas:**

- [ ] Armar el Automation en Brevo: trigger "contacto entra a la lista
      `BREVO_LIST_ID_LEADS`" → 3 emails espaciados con los textos de arriba.

- [x] **Envío de prueba — rechazado, causa encontrada (04/09/2026).** Brevo
      aceptó el request (201) pero el mensaje real fue rechazado:
      *"Sending has been rejected because the sender you used
      guillermo@mkt.onconcilia.com is not valid. Validate your sender or
      authenticate your domain"* — confirmado vía
      `GET /v3/smtp/statistics/events`, no alcanza con mirar el código 201.

**La causa de fondo:** el dominio autenticado es `onconcilia.com` (la raíz),
no `mkt.onconcilia.com`. Autenticar uno no autentica el otro — son
identidades separadas para Brevo. El remitente que usa el código
(`guillermo@mkt.onconcilia.com`) queda sin autenticar.

**✅ Resuelto — Opción A, 04/09/2026.** Se probó agregar `mkt.onconcilia.com`
como dominio propio en Brevo (Opción B) pero nunca terminó de autenticar del
lado de Brevo — descartada, el dominio de prueba se borró
(`DELETE /v3/senders/domains/mkt.onconcilia.com`).

Remitente cambiado a `guillermo@onconcilia.com` (`/api/outreach/send`,
`REMITENTE`). Se resigna el aislamiento completo de reputación entre
marketing y producto (mismo dominio visible en el "De" para las dos cosas),
pero Resend y Brevo siguen siendo sistemas distintos.

**Verificado con un envío real de punta a punta** — no alcanzaba con el 201
de `POST /smtp/email` (el primer intento con `guillermo@mkt.onconcilia.com`
también dio 201 y after fue rechazado igual). Se confirmó contra
`GET /v3/smtp/statistics/events?messageId=…`: el segundo intento, con
`guillermo@onconcilia.com`, dio `event: "delivered"`. Llegó a la bandeja de
entrada de `apptivando@gmail.com`, confirmado por el usuario.

**Lección:** para confirmar que Brevo mandó algo de verdad, chequear
`/v3/smtp/statistics/events`, no solo el código HTTP de `/smtp/email` — un
201 solo confirma que Brevo aceptó el pedido, no que el mensaje salió.

> **El subdominio no era opcional.** `onconcilia.com` manda las invitaciones y
> los reportes a los contadores vía Resend, y `send.onconcilia.com` es el
> dominio de envío de Resend. Separar la reputación del marketing evita que
> los emails del producto se vean afectados.

### Tareas mías

- [x] `src/lib/brevo.ts` — `upsertContacto()` y `enviarTransaccional()`, `fetch` pelado.
      **Verificado contra la API real** (creación de contacto de prueba,
      borrado después — sin mandar ningún email).
- [x] `/api/outreach/send` migrado de Resend a Brevo — valida `email_estado`,
      aplica el tope diario (cuenta `interacciones` de hoy), sincroniza el
      contacto en Brevo antes de enviar, `replyTo` apunta a
      `guillermo@onconcilia.com` (el buzón real).
- [x] `/api/leads/capture` (nuevo) — reemplaza el insert directo que hacía
      `LeadForm.tsx` desde el navegador. Necesario porque el insert directo
      no tenía ningún punto server-side donde enganchar el sync a Brevo.
      `LeadForm.tsx` actualizado para postear acá en vez de insertar directo.
- [x] `/api/brevo/webhook` — normaliza el nombre del evento (Brevo no es
      consistente entre su propia documentación sobre el formato exacto:
      `hardBounce` en la referencia de API, `hard bounce` en la guía) antes
      de matchear. `hardBounce`/`invalid`/`spam`/`unsubscribed` → baja
      automática (`email_estado`, `baja_en`, `baja_motivo`); cualquier
      evento reconocido queda como `interaccion` en la ficha.
- [x] Migración SQL escrita — [`migrate_prospectos_brevo.sql`](onconcilia-web/supabase/migrate_prospectos_brevo.sql).
- [ ] **Generador de copy por prompt** — no se hizo en esta tanda. Ruta
      nueva, mismo patrón que `/api/agents/qualify-lead` (Anthropic, ya en
      el proyecto): escribís un prompt, Claude devuelve asunto + cuerpo, lo
      ves y editás antes de guardar. Sigue pendiente.
- [x] **Cron diario de envío y disparo de campañas opt-in — no se
      construyen.** Decidido 04/09/2026: el carril frío queda solo-manual
      (`/cola`), y el carril opt-in lo maneja un Automation de Brevo, no
      código nuestro (ver "Cómo funcionaría" arriba).
- [x] **Futuro de `/api/outreach/send` — decidido: migra a Brevo**, sigue
      siendo el canal 1:1 (llamado desde `/cola`), ya no hay una ruta de
      cron separada que compita con él.

---

## Anexo A — Por qué NO se reutiliza la key de Google de FORCOM

*(Corregido el 03/09/2026 — versiones anteriores de este plan asumían que esa
key era de una cuenta personal de prueba de Guillermo. No lo es: es un
proyecto de Google Cloud de la **cuenta del cliente** de FORCOM.)*

Técnicamente sí se podría — una API key pertenece al proyecto de Google Cloud,
no a la aplicación, y la misma key serviría desde las dos apps sin ningún
trámite. Pero acá el límite no es técnico: es que ese proyecto lo administra
el cliente de FORCOM, no Apptivando. Cargar el consumo de OnConcilia ahí
significa:

- El cliente ve en su propia factura de Google Cloud un gasto que no es suyo.
- El cliente (o quien administre esa cuenta del lado de FORCOM) puede revocar,
  restringir o borrar la key sin saber que corta también a OnConcilia.
- Si algún día se cierra la relación con ese cliente o se transfiere el
  proyecto, OnConcilia se queda sin buscador de un día para el otro.

Por eso el Bloque 2 de arriba crea un **proyecto de Google Cloud propio**, en
una cuenta que controle Apptivando — key nueva, facturación propia, alerta de
presupuesto propia. Mismo criterio que ya se aplicó con Supabase y GitHub en
la consolidación de infraestructura: cada cliente en lo suyo, Apptivando en lo
suyo.

---

## Anexo B — Costos

| Concepto | Costo | Referencia |
|---|---|---|
| Places Text Search | USD 28 / 1.000 requests (tier Enterprise, tramo 0-100k) | Se cobra **por página de 20**, no por resultado |
| Una búsqueda de 60 prospectos | **≈ USD 0,084** | 3 páginas = 3 requests |
| Una búsqueda de 20 prospectos | **≈ USD 0,028** | 1 request. Pedir menos cuesta menos |
| Brevo | Gratis hasta 300 emails/día | |

> Nivel 3 (Serper) descartado — ver Bloque 1 y 2.1. Enriquecer con Places +
> sitio propio no tiene costo extra más allá de las visitas al sitio, que son
> `fetch` directo sin API paga.

> **No agregar campos al FieldMask de Places "por las dudas".** Cae en tier
> Enterprise porque incluye teléfono y sitio web, que son justamente el producto.
> Agregar campos no encarece mientras no se pase de Enterprise, pero sacarlos sí
> abarata.

> **Techo duro de Places: 60 resultados por búsqueda.** No es una elección, es la
> API. Para cubrir una ciudad grande conviene repetir por barrio; los repetidos se
> fusionan solos por `google_place_id`.

---

## Anexo C — Riesgos y decisiones tomadas

| # | Decisión | Por qué |
|---|---|---|
| 1 | WhatsApp queda fuera de la landing | Existe solo en `develop`; `main` da 404 en `/api/bot/*` y el manual no lo menciona |
| 2 | Se corrige la promesa a estudios contables | El portal multi-organización no existe; es la promesa más cara de incumplir |
| 3 | Buscador antes que Brevo | Con 9 emails no hay campaña que hacer |
| 4 | Subdominio aparte para marketing | Proteger la reputación de `onconcilia.com`, que manda los emails del producto |
| 5 | Dos carriles de email separados | Brevo prohíbe campañas a listas scrapeadas: suspende la cuenta |
| 6 | Proyecto de Google Cloud propio, no el de FORCOM | Ese proyecto es de la cuenta del cliente de FORCOM, no una cuenta personal de prueba |
| 7 | Nunca se aceptan datos sin verificar pertenencia | Es el bug que ya está en la base: 2 de 6 prospectos con datos de otra empresa |
| 8 | Los perfiles de redes no se visitan | Solo se lee el resumen que el buscador indexó. Es la vuelta legal |
| 9 | Saldos como franja, no como tarjeta | La grilla queda pareja en 6 y la rutina diaria se lee como hábito |
| 10 | Se recrea el proyecto en `apptivando1` | Sin eso el cron no corre: es el bloqueante de toda la Parte 2 |
| 11 | Los 41 prospectos se archivan, no se re-enriquecen | Son estudios contables con datos sin verificar; ahora vamos por comercios |

### Riesgos abiertos

- **Hay una key de Resend viva en un proyecto de Vercel que no podés administrar.**
  `re_7akd4…` (la de MKT) es distinta de la de la app y sobrevivió a la rotación
  de agosto; sigue habilitada para enviar como `onconcilia.com`. Rotarla es la
  tarea de más prioridad después del deploy.
- **El proyecto viejo de Vercel sigue deployando en cada push** mientras exista.
  Hoy es casi inocuo, pero cuando entre Brevo hay que confirmar que la key **no**
  quede cargada ahí, o las campañas salen duplicadas.
- **Plan Hobby: máximo 2 cron jobs.** Ya está `daily-search`; el de Brevo será el
  2°. Un tercero invalida `vercel.json` entero y Vercel rechaza el deployment sin
  dejar rastro de build fallido.
