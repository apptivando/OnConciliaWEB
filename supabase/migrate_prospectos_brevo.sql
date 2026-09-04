-- Columnas para el envío 1:1 (carril frío) vía Brevo desde /api/outreach/send.
-- Correr en el SQL Editor del proyecto bhtkkhytsznivdqzdold.
--
-- El carril opt-in (leads → Automation de Brevo) no necesita columnas nuevas:
-- Brevo administra su propia lista de supresión (rebotes/bajas) del lado de
-- ellos, no hace falta espejarlo acá.

alter table public.prospectos
  add column if not exists brevo_contact_id text,
  add column if not exists email_estado text not null default 'activo'
    check (email_estado in ('activo', 'rebotado', 'baja', 'spam')),
  add column if not exists ultimo_envio_en timestamptz,
  add column if not exists baja_en timestamptz,
  add column if not exists baja_motivo text;

comment on column public.prospectos.email_estado is
  'activo = se le puede escribir. rebotado/baja/spam = nunca más, seteado por el webhook de Brevo.';

-- Verificación
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'prospectos'
  and column_name in ('brevo_contact_id', 'email_estado', 'ultimo_envio_en', 'baja_en', 'baja_motivo')
order by ordinal_position;
