/**
 * Alta de un prospecto que llega por la landing.
 *
 * Los dos carriles —búsqueda en Places y formulario de la landing— viven en
 * la misma tabla `prospectos` y se distinguen por `origen`. La tabla `leads`
 * quedó como archivo histórico: tener el mismo contacto en dos tablas obligaba
 * a mantener sincronizado "si agendó" en los dos lados, que es el tipo de
 * duplicación que ya nos mordió con el avance del buscador.
 *
 * Server-only por costumbre del módulo, aunque acá no haya `fetch`.
 */

import { toE164Ar } from "@/lib/phone";
import { registrableDomain } from "./urls";

/**
 * Dominios de correo personal. Un `@gmail.com` no dice nada de la empresa;
 * un `@ferreteriasur.com.ar` la nombra.
 */
const CORREOS_PERSONALES = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.com.ar",
  "outlook.com", "outlook.com.ar", "yahoo.com", "yahoo.com.ar",
  "live.com", "live.com.ar", "icloud.com", "me.com",
  "protonmail.com", "proton.me", "fibertel.com.ar", "speedy.com.ar",
  "arnet.com.ar", "ciudad.com.ar",
]);

/**
 * `empresa` es `not null` y la landing no la pregunta: sumarle un campo más
 * al formulario que lleva a la reunión cuesta conversiones, y el dato sale
 * solo en los 15 minutos de la llamada.
 *
 * El dominio del correo la resuelve gratis cuando es corporativo. Con un
 * Gmail no hay nada que deducir, y poner el nombre de la persona en la
 * columna "empresa" del CRM confunde más de lo que ayuda: se marca explícito
 * que falta completarla, que además la hace buscable.
 */
export function empresaDesdeCorreo(email: string, nombre: string): string {
  const dominio = email.split("@")[1]?.toLowerCase() ?? "";
  if (!dominio || CORREOS_PERSONALES.has(dominio)) return `(completar) ${nombre}`;
  return registrableDomain(dominio) || `(completar) ${nombre}`;
}

export interface DatosLanding {
  email: string;
  nombre?: string | null;
  telefono?: string | null;
  /** Lo que contestó en "¿con qué bancos trabajan?". */
  nota?: string | null;
}

/**
 * La fila de `prospectos` para alguien que completó el formulario.
 *
 * Arranca en `por_contactar`: dejó sus datos, que es más que un prospecto
 * frío, pero todavía no hubo conversación. Quien además elige horario pasa a
 * `demo_agendada` desde el webhook de Cal.com.
 */
export function filaProspectoLanding(d: DatosLanding): Record<string, unknown> {
  const email = d.email.toLowerCase().trim();
  const nombre = d.nombre?.trim() || email.split("@")[0];
  const telefono = d.telefono?.trim() || null;

  return {
    nombre,
    empresa: empresaDesdeCorreo(email, nombre),
    // No lo pregunta la landing. 'pyme' es el default menos equivocado para
    // el público al que le hablamos; se confirma en la reunión.
    sector: "pyme",
    email,
    telefono: telefono ? toE164Ar(telefono)?.e164 ?? telefono : null,
    canal: "otro",
    origen: "landing",
    estado: "por_contactar",
    notas: d.nota ? `Trabaja con: ${d.nota}` : null,
    fecha_primer_contacto: new Date().toISOString().split("T")[0],
  };
}
