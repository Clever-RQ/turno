-- =============================================================
-- Turno: reglas de horarios (issue #7)
-- =============================================================


-- -------------------------------------------------------------
-- 1. Sin tramos cruzados
-- El mismo día, para la misma persona (o para el negocio), dos
-- tramos no pueden pisarse: 9:00-13:00 y 12:00-18:00 se rechaza.
-- 9:00-13:00 y 13:00-18:00 sí se permite (el rango es [abre, cierra)).
--
-- "time" no tiene tipo de rango propio, así que se arma un tsrange
-- sobre una fecha fija (2000-01-01). Y como en un "exclude" null no
-- es igual a null, el horario del negocio (personal_id null) se
-- compara con un uuid de ceros.
-- -------------------------------------------------------------
alter table public.horarios
  add constraint horarios_sin_cruce exclude using gist (
    negocio_id with =,
    (coalesce(personal_id, '00000000-0000-0000-0000-000000000000'::uuid)) with =,
    dia_semana with =,
    tsrange('2000-01-01'::date + abre, '2000-01-01'::date + cierra) with &&
  );


-- -------------------------------------------------------------
-- 2. ¿La persona tiene horario propio?
-- false (por defecto) = atiende en el horario del negocio.
-- true = usa sus propias filas en horarios (aunque sean cero: toda la
-- semana libre). Sin esta columna no se podría distinguir "usa el
-- del negocio" de "no trabaja ningún día".
-- -------------------------------------------------------------
alter table public.personal
  add column horario_propio boolean not null default false;


-- -------------------------------------------------------------
-- 3. Guardar una semana completa en una sola transacción
--
-- Guardar = borrar los tramos viejos + insertar los nuevos. Si se
-- hiciera en dos llamadas desde la app y la segunda fallara, el
-- negocio quedaría SIN horario. Una función de Postgres corre en una
-- transacción: si algo falla (un cruce, un cierre antes de la
-- apertura), se deshace todo y el horario anterior queda intacto.
--
-- "security invoker": corre con los permisos del usuario, así que
-- RLS sigue aplicando (un dueño solo toca horarios de su negocio).
--
-- p_personal_id null  -> horario del negocio.
-- p_propio = false    -> la persona vuelve al horario del negocio
--                        (se borran sus tramos, p_tramos se ignora).
-- p_tramos            -> [{"dia_semana": 1, "abre": "09:00", "cierra": "19:00"}, ...]
-- -------------------------------------------------------------
create function public.guardar_horario(
  p_personal_id uuid,
  p_tramos jsonb,
  p_propio boolean default true
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_negocio_id uuid;
begin
  -- Por RLS solo puede volver el negocio del usuario con sesión.
  select id into v_negocio_id from public.negocios where owner_id = auth.uid();
  if v_negocio_id is null then
    raise exception 'El usuario no tiene negocio';
  end if;

  delete from public.horarios
  where negocio_id = v_negocio_id
    and personal_id is not distinct from p_personal_id;

  if p_personal_id is not null then
    update public.personal
    set horario_propio = p_propio
    where id = p_personal_id;

    if not found then
      raise exception 'Persona no encontrada';
    end if;

    if not p_propio then
      return;
    end if;
  end if;

  insert into public.horarios (negocio_id, personal_id, dia_semana, abre, cierra)
  select v_negocio_id, p_personal_id, t.dia_semana, t.abre, t.cierra
  from jsonb_to_recordset(coalesce(p_tramos, '[]'::jsonb))
    as t(dia_semana smallint, abre time, cierra time);
end;
$$;

revoke execute on function public.guardar_horario(uuid, jsonb, boolean) from public, anon;
grant execute on function public.guardar_horario(uuid, jsonb, boolean) to authenticated;
