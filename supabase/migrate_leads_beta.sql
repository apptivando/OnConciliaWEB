-- Migración: el formulario de la landing pasa a ser el de la reunión.
--
-- Hasta ahora `leads` guardaba sólo el correo: la landing pedía el mail y
-- nada más. El formulario nuevo pide nombre, correo y teléfono y después
-- muestra el calendario, igual que `/coordinar/[id]` hace con un prospecto
-- que vino del correo frío.
--
-- El dato que aparece y no existía es `reunion_agendada_en`: quien deja sus
-- datos entra igual a la secuencia de 3 correos, y esos correos ahora son
-- recordatorios de agendar. Al que sí agendó no hay que recordarle nada, y
-- sin esta columna no había forma de distinguirlos.
--
-- Correr en el SQL Editor del proyecto `bhtkkhytsznivdqzdold`.

alter table public.leads add column if not exists telefono text;
alter table public.leads add column if not exists nota text;
alter table public.leads add column if not exists reunion_agendada_en timestamptz;
alter table public.leads add column if not exists brevo_contact_id text;

-- Para el tablero: cuántos dejaron datos y cuántos de esos agendaron.
create index if not exists leads_reunion_idx
  on public.leads (reunion_agendada_en nulls first);

-- ---------------------------------------------------------------------------
-- OPCIONAL, y conviene: dar de baja el insert público.
-- ---------------------------------------------------------------------------
-- La policy `Permitir insert público` existía porque `LeadForm.tsx` insertaba
-- directo desde el navegador con la anon key. Desde que el alta pasa por
-- `/api/leads/capture` (service role, servidor) nadie la usa: verificado por
-- grep, no queda ningún insert a `leads` del lado del cliente.
--
-- Mientras siga viva, cualquiera con la anon key —que es pública por
-- definición— puede llenar la tabla de basura. Descomentar y correr:
--
--   drop policy if exists "Permitir insert público" on public.leads;
--
-- Si después de eso el formulario de la landing sigue funcionando (tiene que
-- seguir: no pasa por RLS), quedó bien.
