/**
 * Rubros y ciudades objetivo de la prospección automática.
 *
 * El orden de ambos arrays importa: `RUBROS` va de mayor a menor rendimiento
 * esperado (se recorre en ese orden por ciudad), y `CIUDADES` va primero las
 * 24 capitales de provincia (tramo 1) y después 24 ciudades más por peso
 * económico (tramo 2) — el cron de `/api/cron/daily-search` las agota en
 * ese orden antes de pasar a la siguiente.
 */

export const RUBROS = [
  "distribuidora mayorista",
  "corralón de materiales",
  "concesionaria de autos",
  "agropecuaria",
  "supermercado",
  "ferretería industrial",
  "hotel",
  "transporte y logística",
  "clínica médica",
  "mueblería",
] as const;

export interface CiudadObjetivo {
  ciudad: string;
  provincia: string;
  tramo: 1 | 2;
}

export const CIUDADES: CiudadObjetivo[] = [
  // Tramo 1 — capitales de provincia.
  { ciudad: "Ciudad de Buenos Aires", provincia: "Buenos Aires", tramo: 1 },
  { ciudad: "Córdoba", provincia: "Córdoba", tramo: 1 },
  { ciudad: "La Plata", provincia: "Buenos Aires", tramo: 1 },
  { ciudad: "San Miguel de Tucumán", provincia: "Tucumán", tramo: 1 },
  { ciudad: "Mendoza", provincia: "Mendoza", tramo: 1 },
  { ciudad: "Salta", provincia: "Salta", tramo: 1 },
  { ciudad: "Santa Fe", provincia: "Santa Fe", tramo: 1 },
  { ciudad: "Corrientes", provincia: "Corrientes", tramo: 1 },
  { ciudad: "Resistencia", provincia: "Chaco", tramo: 1 },
  { ciudad: "Posadas", provincia: "Misiones", tramo: 1 },
  { ciudad: "San Salvador de Jujuy", provincia: "Jujuy", tramo: 1 },
  { ciudad: "Santiago del Estero", provincia: "Santiago del Estero", tramo: 1 },
  { ciudad: "Neuquén", provincia: "Neuquén", tramo: 1 },
  { ciudad: "Paraná", provincia: "Entre Ríos", tramo: 1 },
  { ciudad: "San Juan", provincia: "San Juan", tramo: 1 },
  { ciudad: "Formosa", provincia: "Formosa", tramo: 1 },
  { ciudad: "San Luis", provincia: "San Luis", tramo: 1 },
  { ciudad: "San Fernando del Valle de Catamarca", provincia: "Catamarca", tramo: 1 },
  { ciudad: "La Rioja", provincia: "La Rioja", tramo: 1 },
  { ciudad: "Santa Rosa", provincia: "La Pampa", tramo: 1 },
  { ciudad: "Río Gallegos", provincia: "Santa Cruz", tramo: 1 },
  { ciudad: "Rawson", provincia: "Chubut", tramo: 1 },
  { ciudad: "Viedma", provincia: "Río Negro", tramo: 1 },
  { ciudad: "Ushuaia", provincia: "Tierra del Fuego", tramo: 1 },
  // Tramo 2 — por peso económico.
  { ciudad: "Rosario", provincia: "Santa Fe", tramo: 2 },
  { ciudad: "Mar del Plata", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Bahía Blanca", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Comodoro Rivadavia", provincia: "Chubut", tramo: 2 },
  { ciudad: "San Nicolás de los Arroyos", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Río Cuarto", provincia: "Córdoba", tramo: 2 },
  { ciudad: "Concordia", provincia: "Entre Ríos", tramo: 2 },
  { ciudad: "Villa María", provincia: "Córdoba", tramo: 2 },
  { ciudad: "Rafaela", provincia: "Santa Fe", tramo: 2 },
  { ciudad: "Tandil", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Zárate", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Campana", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Pergamino", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Venado Tuerto", provincia: "Santa Fe", tramo: 2 },
  { ciudad: "San Francisco", provincia: "Córdoba", tramo: 2 },
  { ciudad: "Junín", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Olavarría", provincia: "Buenos Aires", tramo: 2 },
  { ciudad: "Gualeguaychú", provincia: "Entre Ríos", tramo: 2 },
  { ciudad: "San Rafael", provincia: "Mendoza", tramo: 2 },
  { ciudad: "General Roca", provincia: "Río Negro", tramo: 2 },
  { ciudad: "Cipolletti", provincia: "Río Negro", tramo: 2 },
  { ciudad: "Puerto Madryn", provincia: "Chubut", tramo: 2 },
  { ciudad: "Trelew", provincia: "Chubut", tramo: 2 },
  { ciudad: "San Pedro", provincia: "Buenos Aires", tramo: 2 },
];

function sinAcentos(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Devuelve el nombre canónico de la ciudad dada, comparando sin acentos ni
 * mayúsculas. Motivo real: hay prospectos con `localidad = 'Cordobá'` por un
 * error de tipeo en el formulario, y así el avance de `prospect_ciudades`
 * por ciudad nunca cierra porque el conteo de correos no encuentra las filas.
 */
export function normalizarCiudad(raw: string): string {
  const buscada = sinAcentos(raw);
  const match = CIUDADES.find((c) => sinAcentos(c.ciudad) === buscada);
  return match ? match.ciudad : raw.trim();
}
