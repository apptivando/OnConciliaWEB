# OnConcilia MKT — Plan de Herramientas de Automatización

> **Objetivo:** Construir herramientas internas que automaticen la estrategia de marketing
> definida en los documentos de Fase 0, Fase 1 y Estrategia General.
> **Stack:** Next.js 14 + Supabase (mismo stack del producto principal)

---

## Áreas automatizables por fase

### Fase 0 (Credibilidad Mínima)
- **Landing page "coming soon"** → ruta `/` para usuarios no autenticados
- **Formulario de captura de emails** → integrado en la landing, guardando en Supabase
- **Generador de posts LinkedIn** → templates pre-armados con variables

### Fase 1 (Outreach y Validación)
- **CRM de prospectos** → sección dentro de OnConcilia (reemplaza Google Sheets)
- **Generador de mensajes personalizados** → templates por segmento (A/B/C) × paso (1/2/3)
- **Tracker de secuencia de contacto** → estados, fechas, próxima acción, alertas
- **Dashboard de KPIs** → tasa de respuesta, demos, betas activos, NPS
- **Sistema de feedback/NPS** → formulario post-onboarding para betas

### Fase 2-3 (Tracción y Escala)
- **Blog integrado** → artículos SEO dentro del sitio
- **Email marketing automatizado** → secuencia de 5 emails de onboarding
- **A/B testing de asuntos** → tracking de apertura/respuesta por variante

---

## Plan de construcción

Priorizado por **impacto inmediato** y **dependencias técnicas**.

---

### Etapa 1 — Landing + Captura de Emails (3-4 días)

> Necesario ANTES del primer contacto comercial.

**Entregables:**
1. Landing page pública en `/` con 4 bloques:
   - Hero con headline del dolor + CTA
   - Para quién (pymes, estudios, franquicias)
   - Cómo funciona (3 pasos)
   - Beta cerrada + formulario de lista de espera
2. Tabla `leads` en Supabase:
   - `id`, `email`, `nombre` (opcional), `fuente`, `fecha_registro`, `estado`
3. Formulario de captura conectado a Supabase
4. Email de confirmación automático (opcional, con Resend o similar)

**Prioridad:** INMEDIATA

---

### Etapa 2 — CRM de Prospectos (4-5 días)

> Reemplaza el Google Sheets propuesto en la Fase 1. Todo integrado en la app.

**Entregables:**
1. Tabla `prospectos` en Supabase:
   - `nombre`, `empresa`, `sector` (A: pyme / B: estudio / C: franquicia)
   - `cargo`, `canal`, `linkedin_url`, `email`
   - `estado` (flujo completo — ver abajo), `fecha_primer_contacto`, `fecha_ultimo_contacto`
   - `proxima_accion`, `fecha_proxima_accion`, `notas`
2. Página `/prospectos` con lista filtrable por segmento y estado
3. Vista detalle con timeline de interacciones
4. Sistema de estados con el flujo del documento de Fase 1:
   ```
   Por contactar → Solicitud enviada → Conexión aceptada →
   Mensaje de valor enviado → Respondió positivo → Demo agendada →
   Demo realizada → Beta activo → Feedback recopilado → Descartado
   ```
5. Alertas de follow-ups vencidos (próxima acción pasada de fecha)

**Prioridad:** Semana siguiente a la landing

---

### Etapa 3 — Generador de Mensajes Personalizados (2-3 días)

> Ahorra tiempo en la personalización del outreach a 50 prospectos.

**Entregables:**
1. Templates de los 3 pasos × 3 segmentos = 9 mensajes base:
   - Paso 1: Solicitud de conexión LinkedIn (300 chars)
   - Paso 2: Mensaje de valor post-conexión
   - Paso 3: Email de seguimiento + CTA demo
2. Variables dinámicas: `{nombre}`, `{empresa}`, `{cargo}`, `{estudio}`
3. UI integrada en la ficha del prospecto:
   - Seleccionar paso → ver mensaje personalizado → copiar al clipboard
4. Registro automático: qué mensaje se envió, cuándo, por qué canal

**Prioridad:** Junto con el CRM (Etapa 2)

---

### Etapa 4 — Dashboard de Métricas (2-3 días)

> Visibilidad en tiempo real del progreso de la Fase 1.

**Entregables:**
1. Página `/marketing/dashboard`
2. KPIs principales (calculados desde tabla `prospectos`):
   - Prospectos en lista / contactados / respondieron / demos / betas activos
   - Tasa de respuesta (meta: 20-30%)
   - NPS promedio (meta: ≥ 7)
3. Funnel visual: contactados → respondieron → demo → beta
4. Comparativa por segmento (A vs B vs C) — cuál responde mejor
5. Tabla de A/B testing de asuntos de email (5 variantes del doc)

**Prioridad:** Cuando arranque el outreach activo

---

### Etapa 5 — Feedback y NPS de Betas (2 días)

> Para recopilar datos estructurados de los primeros usuarios beta.

**Entregables:**
1. Formulario con las 6 preguntas definidas en Fase 1:
   - Tiempo de conciliación antes de OnConcilia
   - Tiempo de conciliación con OnConcilia
   - Qué parte mejoró más
   - Qué falta o qué cambiaría
   - Recomendaría a otro (1-10 = NPS)
   - Disposición a pagar por mes
2. Tabla `feedback_beta` en Supabase
3. Cálculo automático de NPS (promotores - detractores)
4. Vista resumen con promedios y tendencias

**Prioridad:** Cuando haya usuarios beta activos

---

### Etapa 6 — Blog / Contenido SEO (3-4 días)

> Para Fase 2 de marketing. No urgente en esta iteración.

**Entregables:**
1. Tabla `posts` en Supabase (título, slug, contenido, fecha, estado, meta_description)
2. Página `/blog` con listado y detalle
3. SEO básico: meta tags dinámicos, Open Graph, sitemap.xml
4. Palabras clave objetivo del documento de estrategia:
   - `conciliación bancaria automatizada`
   - `software conciliación bancaria Argentina`
   - `herramienta conciliación contable pymes`
   - `reemplazar Excel para conciliación bancaria`

**Prioridad:** Fase 2 (meses 3-6)

---

## Resumen de prioridades

| Etapa | Qué | Tiempo est. | Cuándo |
|-------|-----|-------------|--------|
| 1 | Landing + Captura | 3-4 días | **Inmediato** (antes del outreach) |
| 2 | CRM Prospectos | 4-5 días | **Semana siguiente** |
| 3 | Generador Mensajes | 2-3 días | Junto con CRM |
| 4 | Dashboard Métricas | 2-3 días | Cuando arranque outreach |
| 5 | Feedback/NPS | 2 días | Cuando haya betas |
| 6 | Blog | 3-4 días | Fase 2 |

**Total estimado: ~16-22 días de desarrollo**

---

## Documentos de referencia

Los siguientes documentos contienen la estrategia completa de marketing:

- `OnConcilia_Fase0_Marketing.md` — Fase 0: Credibilidad Mínima Viable (2 semanas)
- `OnConcilia_Fase1_Outreach.md` — Fase 1: Outreach y Validación (meses 0-3, 50 prospectos)
- `OnConcilia_Estrategia_Marketing.md` — Estrategia general: ICPs, canales, mensajes, roadmap 3 fases

---

*Plan de herramientas de automatización para OnConcilia MKT*
*Versión 1.0 — Abril 2026*
