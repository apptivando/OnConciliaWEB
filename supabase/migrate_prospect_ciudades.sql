-- Estado de avance de la prospección automática por ciudad, para que
-- `/api/cron/daily-search` agote una ciudad (todos los rubros o la meta de
-- correos) antes de pasar a la siguiente, en vez de rotar todos los días
-- sin terminar ninguna.
create table if not exists public.prospect_ciudades (
  ciudad text primary key,
  provincia text not null,
  tramo smallint not null,
  orden int not null,
  rubros_buscados text[] not null default '{}',
  correos int not null default 0,
  cerrada boolean not null default false,
  cerrada_motivo text,
  actualizada_en timestamptz default now()
);

alter table public.prospect_ciudades enable row level security;

create policy "Lectura autenticada prospect_ciudades"
  on public.prospect_ciudades for select
  to authenticated
  using (true);

insert into public.prospect_ciudades (ciudad, provincia, tramo, orden) values
  ('Ciudad de Buenos Aires', 'Buenos Aires', 1, 1),
  ('Córdoba', 'Córdoba', 1, 2),
  ('La Plata', 'Buenos Aires', 1, 3),
  ('San Miguel de Tucumán', 'Tucumán', 1, 4),
  ('Mendoza', 'Mendoza', 1, 5),
  ('Salta', 'Salta', 1, 6),
  ('Santa Fe', 'Santa Fe', 1, 7),
  ('Corrientes', 'Corrientes', 1, 8),
  ('Resistencia', 'Chaco', 1, 9),
  ('Posadas', 'Misiones', 1, 10),
  ('San Salvador de Jujuy', 'Jujuy', 1, 11),
  ('Santiago del Estero', 'Santiago del Estero', 1, 12),
  ('Neuquén', 'Neuquén', 1, 13),
  ('Paraná', 'Entre Ríos', 1, 14),
  ('San Juan', 'San Juan', 1, 15),
  ('Formosa', 'Formosa', 1, 16),
  ('San Luis', 'San Luis', 1, 17),
  ('San Fernando del Valle de Catamarca', 'Catamarca', 1, 18),
  ('La Rioja', 'La Rioja', 1, 19),
  ('Santa Rosa', 'La Pampa', 1, 20),
  ('Río Gallegos', 'Santa Cruz', 1, 21),
  ('Rawson', 'Chubut', 1, 22),
  ('Viedma', 'Río Negro', 1, 23),
  ('Ushuaia', 'Tierra del Fuego', 1, 24),
  ('Rosario', 'Santa Fe', 2, 25),
  ('Mar del Plata', 'Buenos Aires', 2, 26),
  ('Bahía Blanca', 'Buenos Aires', 2, 27),
  ('Comodoro Rivadavia', 'Chubut', 2, 28),
  ('San Nicolás de los Arroyos', 'Buenos Aires', 2, 29),
  ('Río Cuarto', 'Córdoba', 2, 30),
  ('Concordia', 'Entre Ríos', 2, 31),
  ('Villa María', 'Córdoba', 2, 32),
  ('Rafaela', 'Santa Fe', 2, 33),
  ('Tandil', 'Buenos Aires', 2, 34),
  ('Zárate', 'Buenos Aires', 2, 35),
  ('Campana', 'Buenos Aires', 2, 36),
  ('Pergamino', 'Buenos Aires', 2, 37),
  ('Venado Tuerto', 'Santa Fe', 2, 38),
  ('San Francisco', 'Córdoba', 2, 39),
  ('Junín', 'Buenos Aires', 2, 40),
  ('Olavarría', 'Buenos Aires', 2, 41),
  ('Gualeguaychú', 'Entre Ríos', 2, 42),
  ('San Rafael', 'Mendoza', 2, 43),
  ('General Roca', 'Río Negro', 2, 44),
  ('Cipolletti', 'Río Negro', 2, 45),
  ('Puerto Madryn', 'Chubut', 2, 46),
  ('Trelew', 'Chubut', 2, 47),
  ('San Pedro', 'Buenos Aires', 2, 48)
on conflict (ciudad) do nothing;
