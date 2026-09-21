/**
 * Retirada el 21/09/2026. Se deja la ruta respondiendo 410 en vez de
 * borrarla, mismo criterio que `lead-search` y `scrape-sitios`: si alguien
 * vuelve a apretar un botón viejo o queda un link dando vueltas, que falle
 * diciendo por qué y no que haga algo que ya no corresponde.
 *
 * Qué hacía: le mandaba al lead un correo pidiéndole completar un formulario
 * de cuatro preguntas para "reservarle un lugar" en la beta.
 *
 * Por qué se retira, en orden de gravedad:
 *
 * 1. **Mandaba por Resend, no por Brevo.** Se salteaba el tope de 50 envíos
 *    diarios, la baja automática por rebote o spam del webhook, y el registro
 *    de la interacción en el CRM. Era un carril de envío que dábamos por
 *    apagado y seguía vivo.
 * 2. No llevaba link de baja.
 * 3. El texto era el viejo: "60 días de acceso gratuito a cambio de 30
 *    minutos de feedback", encuadre que se reemplazó por la beta del plan Pro
 *    con las dos encuestas.
 * 4. Pedía nombre y empresa, datos que el formulario de la landing ya captura
 *    y que ahora se cargan solos al crear el prospecto.
 *
 * Lo reemplaza el botón "Enviar por correo" de la ficha del prospecto, que
 * manda el mensaje con el link a la reunión pasando por
 * `/api/outreach/send` — o sea por Brevo, con tope diario y bajas.
 */
export async function POST() {
  return Response.json(
    {
      error:
        'Ruta retirada. El envío al prospecto se hace desde su ficha, con el botón "Enviar por correo", que pasa por Brevo.',
    },
    { status: 410 }
  )
}
