/**
 * Enriquecedor de prospectos: la cascada de dos niveles.
 *
 *   Nivel 0  Google Places        → nombre, dirección, teléfono, sitio, rating
 *      ↓  (si no hay sitio propio, no hay más nada que hacer automático)
 *   Nivel 1  Sitio web propio     → home + hasta 3 páginas · email, WA, redes
 *      ↓
 *   Sin resolver                  → queda para resolver a mano
 *
 * Adaptado de FORCOM (`forcom-web/src/lib/prospects/enrich.ts`). El nivel 3
 * (búsqueda web cuando no hay sitio) NO se portó — decidido el 03/09/2026,
 * medido contra resultados reales no mejoraba lo que ya daba Places, y
 * agregaba una dependencia (Serper) y un costo que no se justifican acá.
 *
 * Corre en el worker del cron y en el botón "Enriquecer ahora". Server-only.
 *
 * Nada de esto tira excepciones hacia arriba por un prospecto: un sitio caído
 * es lo normal, no una excepción, y si cada uno tirara, un lote fallaría por
 * culpa del primero.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchHtml, resolveRedirect, sleep } from "./http";
import { isAllowed, DEFAULT_DELAY_MS } from "./robots";
import { classifyUrl, registrableDomain } from "./urls";
import {
  extractEmails,
  extractPhones,
  extractWhatsapp,
  extractSocials,
  extractInternalLinks,
  inlineJsonScripts,
} from "./extract";
import { toWhatsappNumber } from "@/lib/phone";
import type { Prospecto, RedesProspecto } from "@/lib/types";

/** Páginas máximas por sitio (la home cuenta como una). */
const MAX_PAGES_PER_SITE = 4;
/** Presupuesto de tiempo por prospecto, para que un lote no se pase del límite. */
const SITE_BUDGET_MS = 20_000;

/**
 * Guías y directorios comerciales argentinos. Google Places a veces publica
 * como "sitio web" del comercio la ficha que un directorio le armó — de ahí
 * salen los contactos del directorio, no los del comercio. De estas páginas
 * se siguen guardando las **redes sociales** (se identifican solas por URL)
 * y se descartan el correo y el teléfono.
 */
const DIRECTORY_HOSTS = new Set([
  "guiaferreterias.com.ar", "paginasamarillas.com.ar", "cylex.com.ar",
  "guialocal.com.ar", "infoisinfo.com.ar", "opendi.com.ar", "tuugo.com.ar",
  "hotfrog.com.ar", "yalwa.com.ar", "dateas.com", "kompass.com",
  "guiaindustrial.com.ar", "elferretero.com.ar", "dir.ar", "empresite.com",
  "argentina.acambiode.com", "solomaquinaria.com.ar", "clasificados.com.ar",
]);

/** Lo que la cascada logró averiguar de un prospecto. */
interface Findings {
  email: string | null;
  phoneE164: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  notes: string[];
}

function emptyFindings(): Findings {
  return {
    email: null,
    phoneE164: null,
    whatsapp: null,
    instagram: null,
    facebook: null,
    linkedin: null,
    notes: [],
  };
}

/** El ideal completo: email + WhatsApp. Con eso se corta la visita al sitio. */
function isComplete(f: Findings): boolean {
  return Boolean(f.email && f.whatsapp);
}

/**
 * Vuelca lo encontrado en una página sobre el acumulado, sin pisar lo que ya
 * había. El `inlineJsonScripts` de la primera línea rescata el contenido de
 * los `<script type="application/json">` (páginas tipo Linktree, JSON-LD)
 * antes de que los extractores lo pierdan.
 */
function absorb(
  f: Findings,
  raw: string,
  opts: {
    siteDomain?: string;
    fromContactPage?: boolean;
    /** La página es de un directorio: se toman las redes y nada más. */
    soloRedes?: boolean;
  }
): void {
  const html = inlineJsonScripts(raw);

  // Las redes se leen siempre: la URL de un perfil se identifica sola, incluso
  // en una ficha de directorio. Lo que no se cree son el correo y el teléfono.
  const socials = extractSocials(html);
  f.instagram ??= socials.instagram;
  f.facebook ??= socials.facebook;
  f.linkedin ??= socials.linkedin;
  if (opts.soloRedes) return;

  if (!f.email) {
    const best = extractEmails(html, opts)[0];
    if (best) f.email = best.email;
  }

  if (!f.whatsapp) {
    const wa = extractWhatsapp(html);
    if (wa?.phone) {
      f.whatsapp = wa.phone;
    } else if (wa?.unresolvedLinks.length) {
      // Evidencia de WhatsApp sin número (un acortador wa.link). Se guarda el
      // link para que alguien lo abra: no da prioridad 1, pero es accionable.
      for (const link of wa.unresolvedLinks) {
        if (!f.notes.includes(link)) f.notes.push(link);
      }
    }
  }

  if (!f.phoneE164) {
    const best = extractPhones(html)[0];
    if (best) f.phoneE164 = best.e164;
  }
}

// ─── Nivel 1: el sitio del prospecto ─────────────────────────────────────────

async function runLevel1(prospecto: Prospecto, f: Findings): Promise<{ error: string | null }> {
  if (!prospecto.sitio_web) return { error: null };

  const site = classifyUrl(prospecto.sitio_web);

  // El "sitio web" que publica Google puede ser en realidad una red social.
  // Se guarda como perfil; sin nivel 3, ahí termina lo que se puede hacer solo.
  if (site.kind === "instagram") {
    f.instagram ??= site.url;
    return { error: null };
  }
  if (site.kind === "facebook") {
    f.facebook ??= site.url;
    return { error: null };
  }
  if (site.kind === "linkedin") {
    f.linkedin ??= site.url;
    return { error: null };
  }
  if (!site.url || !site.host) return { error: "el sitio publicado no es una URL válida" };

  // Un "link in bio" (Linktree y parecidas) sí se visita: no pide login, sus
  // términos no lo prohíben, y es literalmente la página que el comercio armó
  // para publicar sus contactos. Lo que cambia es que no se le siguen links
  // internos — ver abajo.
  const isLinkInBio = site.kind === "linkinbio";

  const started = Date.now();
  const siteDomain = registrableDomain(site.host);

  const esDirectorio = DIRECTORY_HOSTS.has(siteDomain);
  if (esDirectorio) f.notes.push(`el sitio publicado en Google es una guía comercial (${siteDomain})`);

  const visited = new Set<string>();
  const queue: Array<{ url: string; isContactPage: boolean }> = [
    { url: site.url, isContactPage: /contact/i.test(site.url) },
  ];
  let delayMs = DEFAULT_DELAY_MS;
  let firstError: string | null = null;
  let pagesRead = 0;

  while (queue.length > 0 && visited.size < MAX_PAGES_PER_SITE) {
    if (Date.now() - started > SITE_BUDGET_MS) {
      f.notes.push("se agotó el tiempo asignado al sitio");
      break;
    }

    const next = queue.shift()!;
    if (visited.has(next.url)) continue;
    visited.add(next.url);

    const verdict = await isAllowed(next.url);
    delayMs = Math.max(delayMs, verdict.delayMs);
    if (!verdict.allowed) {
      firstError ??= verdict.reason ?? "robots.txt no permite la visita";
      // Si el sitio está roto (DNS, TLS, 5xx) no tiene sentido probar el resto.
      if (verdict.siteBroken) break;
      continue;
    }

    const res = await fetchHtml(next.url);
    if (!res.ok) {
      firstError ??= `${res.reason}${res.detail ? `: ${res.detail}` : ""}`;
      await sleep(delayMs);
      continue;
    }

    pagesRead++;
    absorb(f, res.ok.body, { siteDomain, fromContactPage: next.isContactPage, soloRedes: esDirectorio });
    if (res.ok.truncated) f.notes.push("la página era muy grande y se leyó parcial");

    if (isComplete(f)) break;

    // Solo desde la home se eligen más páginas: seguir links desde una página
    // interna llevaría a recorrer el sitio entero. Nunca desde un "link in
    // bio": ahí los links del mismo host son las páginas de OTROS comercios.
    if (visited.size === 1 && !isLinkInBio) {
      for (const link of extractInternalLinks(res.ok.body, res.ok.url).slice(0, MAX_PAGES_PER_SITE - 1)) {
        queue.push({ url: link.url, isContactPage: true });
      }
    }

    await sleep(delayMs);
  }

  // Un acortador de WhatsApp esconde el número detrás de un redirect. Vale un
  // request extra: convierte una nota en un contacto de prioridad 1.
  if (!f.whatsapp) {
    const shortLink = f.notes.find((n) => /wa\.link\//i.test(n));
    if (shortLink) {
      const resolved = await resolveRedirect(shortLink.startsWith("http") ? shortLink : `https:${shortLink}`);
      const phone = resolved && toWhatsappNumber(resolved.replace(/^.*wa\.me\//, ""));
      if (phone) {
        f.whatsapp = phone;
        f.notes = f.notes.filter((n) => n !== shortLink);
      }
    }
  }

  return { error: pagesRead === 0 ? firstError : null };
}

// ─── Orquestador ─────────────────────────────────────────────────────────────

export interface EnrichOutcome {
  prospectoId: string;
  prioridad: number;
  found: { email: boolean; whatsapp: boolean; phone: boolean };
  error: string | null;
}

/**
 * Deriva la prioridad de contacto (1-4) a partir de lo encontrado más lo que
 * ya tenía el prospecto. 1=WhatsApp, 2=email, 3=solo teléfono, 4=sin contacto.
 */
function calcularPrioridad(f: Findings, prospecto: Prospecto): number {
  const whatsapp = f.whatsapp ?? prospecto.whatsapp;
  const email = f.email ?? prospecto.email;
  const telefono = f.phoneE164 ?? prospecto.telefono;
  if (whatsapp) return 1;
  if (email) return 2;
  if (telefono) return 3;
  return 4;
}

/** Enriquece un prospecto y guarda el resultado. Nunca tira. */
export async function enrichProspecto(
  supabase: SupabaseClient,
  prospecto: Prospecto
): Promise<EnrichOutcome> {
  const f = emptyFindings();
  let error: string | null = null;

  try {
    const level1 = await runLevel1(prospecto, f);
    error = level1.error;
  } catch (err) {
    error = err instanceof Error ? err.message : "error desconocido";
  }

  const prioridad = calcularPrioridad(f, prospecto);

  // Solo se escribe lo que falta: nada de pisar datos que ya estaban, ni los
  // que alguien cargó a mano.
  const redesActuales: RedesProspecto = prospecto.redes ?? { instagram: null, facebook: null, linkedin: null };
  const patch: Record<string, unknown> = {
    enriquecido_en: new Date().toISOString(),
    intentos_enriquecimiento: prospecto.intentos_enriquecimiento + 1,
    prioridad_contacto: prioridad,
    updated_at: new Date().toISOString(),
  };

  if (f.email && !prospecto.email) patch.email = f.email;
  if (f.whatsapp && !prospecto.whatsapp) {
    patch.whatsapp = f.whatsapp;
    // El WhatsApp confirmado pasa a ser el medio de contacto preferido.
    if (prospecto.canal === "otro") patch.canal = "whatsapp";
  }
  if (f.phoneE164 && !prospecto.telefono) patch.telefono = f.phoneE164;

  const redesNuevas: RedesProspecto = {
    instagram: redesActuales.instagram ?? f.instagram,
    facebook: redesActuales.facebook ?? f.facebook,
    linkedin: redesActuales.linkedin ?? f.linkedin,
  };
  if (redesNuevas.instagram || redesNuevas.facebook || redesNuevas.linkedin) {
    patch.redes = redesNuevas;
  }

  const notasExtra = [...f.notes, ...(error ? [`enriquecimiento: ${error}`] : [])];
  if (notasExtra.length > 0) {
    patch.notas = [prospecto.notas, ...notasExtra].filter(Boolean).join("\n").slice(0, 2000);
  }

  const { error: dbError } = await supabase.from("prospectos").update(patch).eq("id", prospecto.id);

  return {
    prospectoId: prospecto.id,
    prioridad,
    found: {
      email: Boolean(f.email),
      whatsapp: Boolean(f.whatsapp),
      phone: Boolean(f.phoneE164),
    },
    error: dbError?.message ?? error,
  };
}

export interface BatchResult {
  procesados: number;
  encontrados: { email: number; whatsapp: number; telefono: number };
  outcomes: EnrichOutcome[];
}

/**
 * Procesa un lote de prospectos pendientes de enriquecimiento: los que tienen
 * `sitio_web` (algo que visitar) y `enriquecido_en` en null (nunca se
 * intentó). Sin RPC de locking — a esta escala (botón manual + un cron
 * diario, no un worker continuo) no hace falta: el riesgo de dos corridas
 * solapadas pisándose es bajo, mismo criterio que ya usan
 * `enrich-contacto`/`scrape-sitios` en este mismo repo.
 */
export async function enrichBatch(
  supabase: SupabaseClient,
  opts: { limit?: number } = {}
): Promise<BatchResult> {
  const limit = opts.limit ?? 12;

  const { data } = await supabase
    .from("prospectos")
    .select("*")
    .not("sitio_web", "is", null)
    .is("enriquecido_en", null)
    .neq("estado", "descartado")
    .order("created_at", { ascending: true })
    .limit(limit);

  const prospectos = (data ?? []) as Prospecto[];
  const outcomes: EnrichOutcome[] = [];

  for (const prospecto of prospectos) {
    outcomes.push(await enrichProspecto(supabase, prospecto));
  }

  return {
    procesados: outcomes.length,
    encontrados: {
      email: outcomes.filter((o) => o.found.email).length,
      whatsapp: outcomes.filter((o) => o.found.whatsapp).length,
      telefono: outcomes.filter((o) => o.found.phone).length,
    },
    outcomes,
  };
}
