-- Agrega el link a la ficha de Google Maps, para el chip de contacto del
-- nuevo panel lateral de /prospectos. Places ya lo daba (`mapsUrl`), no se
-- estaba guardando.
alter table public.prospectos add column if not exists maps_url text;
