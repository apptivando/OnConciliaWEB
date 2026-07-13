-- Migración de tablas MKT (leads, prospectos, interacciones) al proyecto
-- Supabase de la aplicación (bhtkkhytsznivdqzdold).
--
-- No toca la tabla public.profiles existente ni el trigger
-- on_auth_user_created / crear_perfil_nuevo_usuario() de la app.
-- El acceso al CRM se controla con una tabla nueva e independiente,
-- profiles_crm, donde solo existen filas para quienes vos agregues a mano
-- (no todo superadmin de la app tiene por qué ser usuario del CRM).
--
-- Ejecutar en el SQL Editor del proyecto DESTINO (la app), no en el de MKT.

-- 1) profiles_crm: quién tiene acceso al CRM interno -----------------------
create table if not exists public.profiles_crm (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_staff boolean not null default true,
  created_at timestamptz default now()
);

alter table public.profiles_crm enable row level security;

drop policy if exists "Un usuario ve su propio registro crm" on public.profiles_crm;
create policy "Un usuario ve su propio registro crm"
  on public.profiles_crm for select
  to authenticated
  using (auth.uid() = id);

-- 2) leads (igual que en el proyecto MKT, sin cambios de policy) ----------
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  nombre text,
  fuente text default 'landing',
  estado text default 'nuevo',
  fecha_registro timestamptz default now()
);

alter table public.leads enable row level security;

drop policy if exists "Permitir insert público" on public.leads;
create policy "Permitir insert público"
  on public.leads
  for insert
  to anon
  with check (true);

-- 3) prospectos / interacciones (acceso restringido a profiles_crm) -------
create table if not exists public.prospectos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  empresa text not null,
  sector text not null check (sector in ('pyme', 'estudio', 'franquicia')),
  cargo text,
  canal text default 'linkedin' check (canal in ('linkedin', 'email', 'referido', 'otro')),
  linkedin_url text,
  email text,
  telefono text,
  whatsapp text,
  sitio_web text,
  estado text not null default 'por_contactar' check (
    estado in (
      'por_contactar',
      'solicitud_enviada',
      'conexion_aceptada',
      'mensaje_enviado',
      'respondio_positivo',
      'demo_agendada',
      'demo_realizada',
      'beta_activo',
      'feedback_recopilado',
      'descartado'
    )
  ),
  proxima_accion text,
  fecha_proxima_accion date,
  notas text,
  fecha_primer_contacto date,
  fecha_ultimo_contacto date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.interacciones (
  id uuid default gen_random_uuid() primary key,
  prospecto_id uuid references public.prospectos(id) on delete cascade,
  tipo text not null check (tipo in ('mensaje', 'email', 'llamada', 'demo', 'nota', 'cambio_estado')),
  contenido text,
  canal text,
  estado_anterior text,
  estado_nuevo text,
  created_at timestamptz default now()
);

alter table public.prospectos enable row level security;
alter table public.interacciones enable row level security;

drop policy if exists "Acceso autenticado prospectos" on public.prospectos;
drop policy if exists "Acceso staff prospectos" on public.prospectos;
create policy "Acceso staff prospectos"
  on public.prospectos for all
  to authenticated
  using (exists (select 1 from public.profiles_crm c where c.id = auth.uid() and c.is_staff = true))
  with check (exists (select 1 from public.profiles_crm c where c.id = auth.uid() and c.is_staff = true));

drop policy if exists "Acceso autenticado interacciones" on public.interacciones;
drop policy if exists "Acceso staff interacciones" on public.interacciones;
create policy "Acceso staff interacciones"
  on public.interacciones for all
  to authenticated
  using (exists (select 1 from public.profiles_crm c where c.id = auth.uid() and c.is_staff = true))
  with check (exists (select 1 from public.profiles_crm c where c.id = auth.uid() and c.is_staff = true));

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prospectos_updated_at on public.prospectos;
create trigger prospectos_updated_at
  before update on public.prospectos
  for each row execute function update_updated_at();

-- 4) Después de correr esto: agregate al CRM a mano ------------------------
-- Buscá tu user id en Authentication > Users del proyecto, después:
-- insert into public.profiles_crm (id, email) values ('<tu-uuid>', 'tu-email@dominio.com');
