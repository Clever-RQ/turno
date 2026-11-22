-- =============================================================
-- Turno: reglas del onboarding del negocio (issue #4)
-- =============================================================


-- -------------------------------------------------------------
-- 1. Un negocio por dueño (varias sucursales queda fuera del MVP)
-- El unique ya crea su propio índice, así que el índice simple
-- sobre owner_id del #1 sobra.
-- -------------------------------------------------------------
alter table public.negocios
  add constraint negocios_owner_id_key unique (owner_id);

drop index public.negocios_owner_id_idx;


-- -------------------------------------------------------------
-- 2. Esquema privado para funciones auxiliares
-- Supabase solo expone el esquema "public" por la API, así que
-- lo que vive en "privado" no se puede llamar desde el navegador.
-- -------------------------------------------------------------
create schema if not exists privado;
grant usage on schema privado to authenticated, service_role;


-- -------------------------------------------------------------
-- 3. Palabras reservadas para el slug
-- La página pública será turno.app/<slug>. Un negocio llamado
-- "login" o "panel" quedaría tapado por las rutas de la app.
-- La misma lista está en lib/slug.ts: si cambias una, cambia la otra.
-- -------------------------------------------------------------
create function privado.slug_reservado(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_slug = any (array[
    'admin', 'api', 'app', 'auth', 'ayuda', 'blog', 'brand', 'configuracion',
    'contacto', 'cuenta', 'icon', 'login', 'logout', 'negocio', 'nueva-contrasena',
    'onboarding', 'panel', 'precios', 'privacidad', 'recuperar', 'registro',
    'reservas', 'robots', 'salir', 'sitemap', 'soporte', 'terminos', 'turno', 'www'
  ]);
$$;

-- Postgres da EXECUTE a todos por defecto: lo quitamos y damos solo lo necesario.
-- authenticated lo necesita porque el check de abajo se evalúa con sus permisos al insertar.
revoke execute on function privado.slug_reservado(text) from public;
grant execute on function privado.slug_reservado(text) to authenticated, service_role;

alter table public.negocios
  add constraint negocios_slug_no_reservado check (not privado.slug_reservado(slug));


-- -------------------------------------------------------------
-- 4. ¿Está libre este link? (para el "✓ Disponible" en vivo)
--
-- Problema: por RLS, un dueño solo ve SU negocio, así que no puede
-- consultar si un slug ya lo usa otro.
-- Solución: "security definer" ejecuta la función con los permisos
-- de quien la creó (no del usuario), así puede revisar toda la tabla.
-- Solo devuelve true/false: no expone datos de otros negocios.
--
-- Esto es solo para la experiencia de usuario. La garantía real
-- contra duplicados es el "unique" de negocios.slug: si dos dueños
-- eligen el mismo link a la vez, uno recibe error al guardar.
-- -------------------------------------------------------------
create function public.slug_disponible(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(p_slug) between 3 and 60
    and not privado.slug_reservado(p_slug)
    and not exists (select 1 from public.negocios n where n.slug = p_slug);
$$;

-- Solo usuarios con sesión (el onboarding) y el servidor.
revoke execute on function public.slug_disponible(text) from public, anon;
grant execute on function public.slug_disponible(text) to authenticated, service_role;


-- -------------------------------------------------------------
-- 5. Formato del teléfono: +51 seguido de
--    celular:           9 + 8 dígitos   (+51987654321)
--    fijo de Lima:      1 + 7 dígitos   (+5112345678)
--    fijo de provincia: código 4X-8X + 6 dígitos (+5144123456)
-- La app ya lo normaliza; esto es la última defensa.
-- -------------------------------------------------------------
alter table public.negocios
  add constraint negocios_telefono_formato check (
    telefono is null or telefono ~ '^\+51(9[0-9]{8}|1[0-9]{7}|[4-8][0-9]{7})$'
  );
