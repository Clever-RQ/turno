-- =============================================================
-- Turno: el dueño como primer miembro del equipo (issue #6)
--
-- Desde ahora la app crea esa primera persona al crear el negocio.
-- Esta migración la crea para los negocios que ya existían sin personal.
-- Nombre: el del registro ("nombre"), el de Google ("full_name") o "Yo".
-- -------------------------------------------------------------

insert into public.personal (negocio_id, nombre)
select
  n.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'nombre'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    'Yo'
  )
from public.negocios n
join auth.users u on u.id = n.owner_id
where not exists (
  select 1 from public.personal p where p.negocio_id = n.id
);
