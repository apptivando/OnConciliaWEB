-- Archiva los 41 prospectos cargados el 11/07/2026 con el buscador viejo
-- (Serper Maps + Claude, `/api/agents/lead-search`).
--
-- Decidido el 03/09/2026: no se re-enriquecen. Son estudios contables (ahora
-- se apunta a comercios) y al menos 2 de 6 revisados a mano tenían email o
-- sitio web de OTRA empresa (ej. "Matteoda Facundo Roberto" con el email de
-- la facultad, no del estudio) — resultado del buscador viejo sin validación
-- de pertenencia.
--
-- Se archiva (estado='descartado') en vez de borrar: reversible, y
-- 'descartado' ya existe en el CHECK de `estado`, así que el buscador nuevo
-- no los vuelve a levantar.
--
-- Correr DESPUÉS de migrate_prospectos_places.sql, en el mismo proyecto.

update public.prospectos
set estado = 'descartado',
    notas  = coalesce(notas || ' · ', '') ||
             'Archivado 03/09/2026: carga del 11/07 con el buscador viejo ' ||
             '(Serper + Claude), datos de contacto sin verificar pertenencia.',
    updated_at = now()
where created_at::date = '2026-07-11';

-- Verificación: deberían quedar 41 en descartado y 0 en por_contactar
-- para esa fecha de carga.
select estado, count(*)
from public.prospectos
where created_at::date = '2026-07-11'
group by estado
order by 2 desc;
