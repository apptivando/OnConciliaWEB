-- Ajustes de esquema para el buscador de prospectos vía Google Places,
-- apuntado a comercios y pymes por ciudad (plan del 03/09/2026).
--
-- Correr en el SQL Editor del proyecto bhtkkhytsznivdqzdold (el de la app,
-- donde vive `prospectos` desde la consolidación de julio).
--
-- `nombre` NO se toca: sigue NOT NULL. Se usa sin chequeo de null en varios
-- lugares de la UI (ver FichaClient.tsx) — al insertar desde Places, `nombre`
-- se llena con el mismo valor que `empresa` a nivel de aplicación, no acá.

-- 1) sector: agregar 'comercio' -------------------------------------------
alter table public.prospectos drop constraint if exists prospectos_sector_check;
alter table public.prospectos add constraint prospectos_sector_check
  check (sector in ('pyme', 'estudio', 'franquicia', 'comercio'));

-- 2) canal: agregar 'whatsapp' (prioridad 1 de contacto en comercios) -----
alter table public.prospectos drop constraint if exists prospectos_canal_check;
alter table public.prospectos add constraint prospectos_canal_check
  check (canal in ('linkedin', 'email', 'whatsapp', 'referido', 'otro'));

-- 3) columnas nuevas de Places ----------------------------------------------
alter table public.prospectos
  add column if not exists google_place_id text unique,
  add column if not exists direccion text,
  add column if not exists localidad text,
  add column if not exists rating numeric(2,1),
  add column if not exists reviews_count integer,
  add column if not exists prioridad_contacto smallint
    check (prioridad_contacto between 1 and 4),
  add column if not exists origen text not null default 'manual'
    check (origen in ('busqueda', 'landing', 'manual')),
  -- Solo la URL del perfil: Instagram/Facebook nunca se visitan, se lee el
  -- resumen que indexó el buscador. Ej: {"instagram": "https://...", "facebook": null}
  add column if not exists redes jsonb,
  add column if not exists enriquecido_en timestamptz,
  add column if not exists intentos_enriquecimiento integer not null default 0;

comment on column public.prospectos.google_place_id is
  'ID de Google Places. Es lo que hace que repetir una búsqueda fusione en vez de duplicar.';
comment on column public.prospectos.prioridad_contacto is
  '1=WhatsApp confirmado, 2=email, 3=solo teléfono, 4=sin contacto.';
comment on column public.prospectos.origen is
  'De dónde salió el prospecto: busqueda (Places), landing (formulario), manual (carga a mano).';

-- 4) log de búsquedas — control de gasto de Places -------------------------
create table if not exists public.prospect_searches (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  rubro text,
  ciudad text,
  resultados integer not null default 0,
  paginas_consumidas integer not null default 0,
  created_at timestamptz default now()
);

alter table public.prospect_searches enable row level security;

drop policy if exists "Acceso autenticado prospect_searches" on public.prospect_searches;
create policy "Acceso autenticado prospect_searches"
  on public.prospect_searches for all
  to authenticated
  using (true) with check (true);

-- Nota: `prospect_api_usage` (contador diario del nivel 3) NO se crea —
-- el nivel 3 (búsqueda web / Serper) queda descartado, no solo pausado.
-- Ver Bloque 1 del plan.

-- Verificación --------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'prospectos'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.prospectos'::regclass and contype = 'c';
