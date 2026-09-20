# Plantillas de correo

Vivían en `OnConcilia_MKT/emails-automation-optin/`, fuera del repo, así que
no estaban respaldadas en ningún lado. Se movieron acá el 20/09/2026.

**Estos archivos son la fuente de verdad del texto, no el que está cargado en
Brevo.** Si editás un correo en el panel de Brevo, traelo acá también o la
próxima vez que alguien lea este directorio va a estar leyendo una versión
vieja.

## La secuencia opt-in

Se pega en el Automation de Brevo (Automations → trigger "contacto entra a la
lista `BREVO_LIST_ID_LEADS`"). El asunto y el disparo de cada uno están en el
comentario HTML al principio del archivo.

| Archivo | Cuándo | Asunto |
|---|---|---|
| `paso-1-agenda.html` | 2 horas después de entrar a la lista | Te falta elegir el horario |
| `paso-2-valor.html` | 3 días | La hora por día que se va en revisar pagos |
| `paso-3-cierre.html` | 7 días | ¿Cerramos el tema de la beta? |

Los tres necesitan, **antes de enviarse**, una condición de que el contacto
siga en la lista. Ver el plan, Etapa 1.4: quien agenda la reunión sale de la
lista por el webhook de Cal.com, pero sacar a alguien de una lista no detiene
un Automation que ya empezó a correr para esa persona.

## El resto

| Archivo | Qué es |
|---|---|
| `leads-search-frio.html` | Maqueta del correo frío 1:1. El texto real vive en `src/lib/mensajes.ts`, que es lo que se manda; esto es la cáscara HTML |
| `coordinar-preview.html` | Previsualización de la pantalla `/coordinar/[id]` con el tema del proyecto. Sirve para mirar cambios de diseño sin levantar el server |
| `gancho-en-frio.html` · `mesa-de-pruebas.html` | Mesas de trabajo de diseño, no se mandan a nadie |
