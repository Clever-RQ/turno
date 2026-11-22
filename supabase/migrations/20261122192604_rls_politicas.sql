-- =============================================================
-- Turno: permisos y políticas RLS (issue #2)
--
-- Dos capas, hacen falta las dos para acceder a un dato:
--   GRANT  -> qué ROL puede hacer qué OPERACIÓN en qué TABLA
--   POLICY -> qué FILAS ve o modifica ese rol
--
-- Roles de Supabase:
--   anon          visitante sin cuenta (página pública de reservas)
--   authenticated dueño con sesión iniciada (panel)
--   service_role  nuestra API en el servidor (se salta RLS)
-- =============================================================


-- -------------------------------------------------------------
-- 1. Integridad entre negocios (FK compuestas)
--
-- Problema: las foreign keys no pasan por RLS. Un dueño podría
-- guardar un horario o una reserva con el personal_id de OTRO
-- negocio si conoce su uuid.
-- Solución: la FK incluye negocio_id, así la fila referenciada
-- tiene que ser del mismo negocio.
-- -------------------------------------------------------------

-- La FK compuesta necesita un unique sobre (id, negocio_id)
alter table public.servicios add constraint servicios_id_negocio_key unique (id, negocio_id);
alter table public.personal  add constraint personal_id_negocio_key  unique (id, negocio_id);
alter table public.clientes  add constraint clientes_id_negocio_key  unique (id, negocio_id);

-- horarios.personal_id (puede ser null = horario general;
-- con null la FK no se evalúa, que es lo que queremos)
alter table public.horarios drop constraint horarios_personal_id_fkey;
alter table public.horarios add constraint horarios_personal_negocio_fkey
  foreign key (personal_id, negocio_id)
  references public.personal (id, negocio_id) on delete cascade;

-- bloqueos.personal_id (null = bloquea todo el negocio)
alter table public.bloqueos drop constraint bloqueos_personal_id_fkey;
alter table public.bloqueos add constraint bloqueos_personal_negocio_fkey
  foreign key (personal_id, negocio_id)
  references public.personal (id, negocio_id) on delete cascade;

-- reservas: servicio, personal y cliente del mismo negocio
alter table public.reservas drop constraint reservas_servicio_id_fkey;
alter table public.reservas add constraint reservas_servicio_negocio_fkey
  foreign key (servicio_id, negocio_id)
  references public.servicios (id, negocio_id);

alter table public.reservas drop constraint reservas_personal_id_fkey;
alter table public.reservas add constraint reservas_personal_negocio_fkey
  foreign key (personal_id, negocio_id)
  references public.personal (id, negocio_id);

alter table public.reservas drop constraint reservas_cliente_id_fkey;
alter table public.reservas add constraint reservas_cliente_negocio_fkey
  foreign key (cliente_id, negocio_id)
  references public.clientes (id, negocio_id);


-- -------------------------------------------------------------
-- 2. GRANT: qué operaciones puede hacer cada rol
-- (el permiso automático de la API está desactivado en el
-- proyecto, así que sin esto nadie puede tocar las tablas)
-- -------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- API del servidor: todo (reservas y visitas se crean por aquí)
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Dueño: CRUD completo en lo que configura su negocio
grant select, insert, update, delete on
  public.negocios, public.servicios, public.personal, public.horarios,
  public.bloqueos, public.clientes, public.fuentes
  to authenticated;

-- Dueño: reservas sin DELETE (una cita se cancela, no se borra)
grant select, insert, update on public.reservas to authenticated;

-- Dueño: visitas solo lectura (métricas)
grant select on public.visitas to authenticated;

-- Público: solo lo necesario para la página de reservas.
-- Permisos por columna: negocios sin owner_id, personal solo id y nombre.
grant select (id, nombre, slug, telefono, zona_horaria) on public.negocios to anon;
grant select (id, negocio_id, nombre) on public.personal to anon;
grant select on public.servicios to anon;
grant select on public.horarios to anon;


-- -------------------------------------------------------------
-- 3. Políticas del dueño (authenticated)
--
-- "for all" = select, insert, update y delete con la misma regla.
-- Lo que el rol NO puede hacer ya lo limita el GRANT de arriba
-- (por ejemplo, borrar reservas).
--
-- (select auth.uid()) entre paréntesis: Postgres lo calcula una
-- vez por consulta y no una vez por fila (recomendación de Supabase).
-- -------------------------------------------------------------

create policy negocios_dueno on public.negocios
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Para las tablas hijas: la fila es del dueño si su negocio_id
-- es uno de los negocios cuyo owner_id es el usuario actual.
create policy servicios_dueno on public.servicios
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy personal_dueno on public.personal
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy horarios_dueno on public.horarios
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy bloqueos_dueno on public.bloqueos
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy clientes_dueno on public.clientes
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy fuentes_dueno on public.fuentes
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy reservas_dueno on public.reservas
  for all to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())))
  with check (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));

create policy visitas_dueno on public.visitas
  for select to authenticated
  using (negocio_id in (select id from public.negocios where owner_id = (select auth.uid())));


-- -------------------------------------------------------------
-- 4. Políticas del público (anon)
--
-- Solo para anon: la página pública se lee con un cliente SIN
-- sesión. Así un dueño logueado no puede leer el owner_id de
-- otros negocios por esta vía.
--
-- Nota: RLS no puede exigir "leer solo por slug". El público
-- puede listar todos los negocios; es aceptable porque son
-- páginas públicas.
-- -------------------------------------------------------------

create policy negocios_publico on public.negocios
  for select to anon
  using (true);

create policy servicios_publico on public.servicios
  for select to anon
  using (activo);

create policy personal_publico on public.personal
  for select to anon
  using (activo);

create policy horarios_publico on public.horarios
  for select to anon
  using (true);
