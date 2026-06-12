create table if not exists public.prospectos (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  empresa text not null,
  sector text not null check (sector in ('pyme', 'estudio', 'franquicia')),
  cargo text,
  canal text default 'linkedin' check (canal in ('linkedin', 'email', 'referido', 'otro')),
  linkedin_url text,
  email text,
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

-- Acceso completo solo para usuarios autenticados
create policy "Acceso autenticado prospectos"
  on public.prospectos for all
  to authenticated
  using (true) with check (true);

create policy "Acceso autenticado interacciones"
  on public.interacciones for all
  to authenticated
  using (true) with check (true);

-- Función para actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospectos_updated_at
  before update on public.prospectos
  for each row execute function update_updated_at();
