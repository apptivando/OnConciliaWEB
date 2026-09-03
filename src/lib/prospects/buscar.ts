/**
 * Búsqueda de prospectos vía Google Places, apuntada a comercios y pymes.
 *
 * Server-only. La usan dos lugares: el botón "Buscar" de `/prospectos`
 * (vía `/api/prospects/search`, gateado por el middleware) y el cron diario
 * (`/api/cron/daily-search`) — los dos importan esta función directo, sin
 * pasar por un `fetch` interno a una ruta protegida por middleware, que
 * fallaría con 401 al no tener sesión.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { searchPlaces, placesConfigured, PlacesError, type PlaceResult } from "./places";
import { classifyUrl } from "./urls";
import { toE164Ar } from "@/lib/phone";
import type { RedesProspecto } from "@/lib/types";

export interface BuscarOpts {
  rubro: string;
  ciudad: string;
  tipo?: string;
  cantidad?: number;
}

export interface BuscarResultado {
  nuevos: number;
  fusionados: number;
  descartados: number;
  resumen: string;
}

function placeToRow(place: PlaceResult, ciudad: string): Record<string, unknown> | null {
  // Local cerrado permanentemente: no vale la pena trabajarlo.
  if (place.businessStatus === "CLOSED_PERMANENTLY") return null;

  const telefono = place.internationalPhone
    ? toE164Ar(place.internationalPhone)?.e164 ?? null
    : place.nationalPhone
      ? toE164Ar(place.nationalPhone)?.e164 ?? null
      : null;

  // El "sitio web" que da Places a veces es en realidad un perfil de red.
  const site = classifyUrl(place.website);
  const sitioWeb = site.kind === "web" || site.kind === "linkinbio" ? site.url : null;
  const redes: RedesProspecto = {
    instagram: site.kind === "instagram" ? site.url : null,
    facebook: site.kind === "facebook" ? site.url : null,
    linkedin: site.kind === "linkedin" ? site.url : null,
  };
  const tieneRedes = Boolean(redes.instagram || redes.facebook || redes.linkedin);

  const prioridad = telefono ? 3 : 4;
  // Sin sitio propio que visitar, no hay nivel 1 que correr: se marca
  // enriquecido de una para no quedar en la cola para siempre.
  const enriquecidoYa = !sitioWeb;

  return {
    nombre: place.name ?? "Sin nombre",
    empresa: place.name ?? "Sin nombre",
    sector: "comercio",
    canal: "otro",
    telefono,
    sitio_web: sitioWeb,
    estado: "por_contactar",
    origen: "busqueda",
    google_place_id: place.id,
    direccion: place.address,
    localidad: ciudad,
    rating: place.rating,
    reviews_count: place.reviewsCount,
    prioridad_contacto: prioridad,
    redes: tieneRedes ? redes : null,
    enriquecido_en: enriquecidoYa ? new Date().toISOString() : null,
    intentos_enriquecimiento: 0,
  };
}

/** Busca en Places, descarta lo ya conocido (por `google_place_id`) e inserta el resto. */
export async function buscarProspectos(
  supabase: SupabaseClient,
  opts: BuscarOpts
): Promise<BuscarResultado> {
  if (!placesConfigured()) {
    throw new Error("Falta GOOGLE_PLACES_API_KEY (o GOOGLE_PLACES_MOCK=1 para probar)");
  }

  const query = `${opts.rubro} en ${opts.ciudad}`;
  let results: PlaceResult[];
  try {
    results = await searchPlaces({ query, includedType: opts.tipo, maxResults: opts.cantidad });
  } catch (err) {
    const hint = err instanceof PlacesError && err.hint ? ` (${err.hint})` : "";
    throw new Error(`${err instanceof Error ? err.message : "búsqueda fallida"}${hint}`);
  }

  const rows = results.map((p) => placeToRow(p, opts.ciudad)).filter((r): r is Record<string, unknown> => r !== null);
  const descartados = results.length - rows.length;

  // Log de la búsqueda — control de gasto, no afecta el resultado si falla.
  await supabase
    .from("prospect_searches")
    .insert({
      query,
      rubro: opts.rubro,
      ciudad: opts.ciudad,
      resultados: results.length,
      paginas_consumidas: Math.max(1, Math.ceil(results.length / 20)),
    })
    .then(
      () => {},
      () => {}
    );

  if (rows.length === 0) {
    return { nuevos: 0, fusionados: 0, descartados, resumen: `Sin resultados para "${query}".` };
  }

  const placeIds = rows.map((r) => r.google_place_id as string);
  const { data: existentes } = await supabase
    .from("prospectos")
    .select("google_place_id")
    .in("google_place_id", placeIds);
  const yaExisten = new Set((existentes ?? []).map((r) => (r as { google_place_id: string }).google_place_id));

  const nuevas = rows.filter((r) => !yaExisten.has(r.google_place_id as string));

  if (nuevas.length > 0) {
    const { error } = await supabase.from("prospectos").insert(nuevas);
    if (error) throw new Error(`Error al guardar: ${error.message}`);
  }

  const fusionados = rows.length - nuevas.length;
  const resumen =
    `"${query}": ${results.length} resultados de Google Maps → ` +
    `${nuevas.length} nuevos, ${fusionados} ya estaban, ${descartados} descartados (cerrados).`;

  return { nuevos: nuevas.length, fusionados, descartados, resumen };
}
