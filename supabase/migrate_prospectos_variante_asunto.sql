-- A/B/C test de asunto para el email frío a comercios (búsqueda de
-- prospectos). Se asigna en el momento de la búsqueda (buscar.ts), rotando
-- A/B/C dentro de cada tanda de resultados — así cada búsqueda reparte parejo
-- entre las 3 variantes sin necesitar un contador persistido aparte.
alter table public.prospectos
  add column if not exists variante_asunto text
    check (variante_asunto in ('A', 'B', 'C'));

comment on column public.prospectos.variante_asunto is
  'A/B/C del asunto de email frío. Null para prospectos que no vinieron de búsqueda.';
