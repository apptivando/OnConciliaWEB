-- Archiva los 80 prospectos de indumentaria de Paraná y Córdoba, cargados el
-- 04 y el 05/09/2026 con las dos primeras búsquedas de prueba.
--
-- Decidido el 21/09/2026, con el rendimiento medido de los dos rubros:
--
--                          indumentaria   distribuidora mayorista
--   con sitio propio            38%                83%
--   CON CORREO                  16%                45%
--
-- No es que los datos estén mal —a diferencia del archivado del 03/09, acá la
-- información es correcta—: es que el rubro no es el público de OnConcilia.
-- Una tienda de indumentaria de mostrador tiene una cuenta y poco volumen
-- bancario; el producto se vende de tres cuentas para arriba. Los 60 de una
-- sola búsqueda de "distribuidora mayorista" dieron 27 correos, más del doble
-- que los 80 de indumentaria juntos.
--
-- Importa además por el test A/B/C de asuntos: el cron manda por orden de
-- antigüedad, así que sin archivarlos los primeros 13 correos —y las
-- conclusiones del test— saldrían del público equivocado.
--
-- Se archiva (estado='descartado') en vez de borrar: es reversible, y el cron
-- de envío filtra por estado, así que dejan de entrar en la tanda sin tocar
-- ninguna otra cosa.

update public.prospectos
set estado = 'descartado',
    notas  = coalesce(notas || ' · ', '') ||
             'Archivado 21/09/2026: indumentaria, rubro descartado por ' ||
             'rendimiento (16% de correos contra 45% de distribuidoras) y ' ||
             'por no ser el perfil de varias cuentas bancarias.',
    updated_at = now()
where origen = 'busqueda'
  and localidad in ('Paraná', 'Córdoba')
  and created_at < '2026-09-21';

-- Verificación: los 80 en descartado, y los de CABA intactos en por_contactar.
select localidad, estado, count(*)
from public.prospectos
where origen = 'busqueda'
group by localidad, estado
order by 1, 3 desc;
