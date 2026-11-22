-- =============================================================
-- Turno: tablas del MVP (issue #1)
-- Solo estructura. Las políticas RLS y los GRANT van en el #2.
-- =============================================================

-- btree_gist permite usar "=" sobre uuid dentro de un índice GiST,
-- lo que necesita el "exclude" de reservas (ver más abajo).
create extension if not exists btree_gist with schema extensions;

-- -------------------------------------------------------------
-- Tipos
-- -------------------------------------------------------------
create type public.estado_reserva as enum (
  'pendiente', 'confirmada', 'cancelada', 'asistio', 'no_asistio'
);

create type public.origen_reserva as enum (
  'web', 'asistente', 'agente_web', 'manual'
);

-- -------------------------------------------------------------
-- negocios: un negocio por dueño (por ahora)
-- -------------------------------------------------------------
create table public.negocios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  -- slug = la parte del link: turno.app/<slug>
  -- solo minúsculas, números y guiones; sin guion al inicio ni al final
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  telefono text,
  zona_horaria text not null default 'America/Lima',
  creado_en timestamptz not null default now()
);

create index negocios_owner_id_idx on public.negocios (owner_id);

-- -------------------------------------------------------------
-- servicios: lo que el negocio ofrece (corte, consulta...)
-- -------------------------------------------------------------
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null,
  duracion_min int not null check (duracion_min between 5 and 480),
  precio numeric(8, 2) check (precio >= 0),
  activo boolean not null default true
);

create index servicios_negocio_id_idx on public.servicios (negocio_id);

-- -------------------------------------------------------------
-- personal: quién atiende
-- -------------------------------------------------------------
create table public.personal (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null,
  activo boolean not null default true
);

create index personal_negocio_id_idx on public.personal (negocio_id);

-- -------------------------------------------------------------
-- horarios: horario semanal de atención
-- personal_id null = horario general del negocio
-- dia_semana: 0 = domingo ... 6 = sábado (igual que Date.getDay() en JS)
-- -------------------------------------------------------------
create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  personal_id uuid references public.personal (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null,
  cierra time not null,
  check (cierra > abre)
);

create index horarios_negocio_id_idx on public.horarios (negocio_id);
create index horarios_personal_id_idx on public.horarios (personal_id);

-- -------------------------------------------------------------
-- bloqueos: días libres, feriados, vacaciones
-- personal_id null = bloquea a todo el negocio
-- -------------------------------------------------------------
create table public.bloqueos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  personal_id uuid references public.personal (id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz not null,
  motivo text,
  check (fin > inicio)
);

create index bloqueos_negocio_id_inicio_idx on public.bloqueos (negocio_id, inicio);
create index bloqueos_personal_id_idx on public.bloqueos (personal_id);

-- -------------------------------------------------------------
-- clientes: quien reserva (no necesita cuenta)
-- -------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null,
  telefono text,
  email text
);

create index clientes_negocio_id_idx on public.clientes (negocio_id);

-- -------------------------------------------------------------
-- fuentes: QR o links con seguimiento (?de=<etiqueta>)
-- -------------------------------------------------------------
create table public.fuentes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('qr', 'link')),
  etiqueta text not null,
  unique (negocio_id, etiqueta) -- este unique ya sirve como índice por negocio_id
);

-- -------------------------------------------------------------
-- reservas
-- servicio, personal y cliente NO usan "on delete cascade":
-- no se puede borrar un servicio/persona/cliente con citas;
-- se desactiva con "activo = false".
-- -------------------------------------------------------------
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  servicio_id uuid not null references public.servicios (id),
  personal_id uuid not null references public.personal (id),
  cliente_id uuid not null references public.clientes (id),
  inicio timestamptz not null,
  fin timestamptz not null,
  estado public.estado_reserva not null default 'confirmada',
  origen public.origen_reserva not null,
  fuente_etiqueta text,
  creado_en timestamptz not null default now(),
  check (fin > inicio),
  -- La garantía anti doble reserva: dos citas activas del mismo
  -- profesional no pueden cruzarse en el tiempo. Lo hace la BD,
  -- así que funciona aunque dos peticiones lleguen a la vez.
  -- tstzrange(inicio, fin) es [inicio, fin): una cita que termina
  -- a las 10:00 no choca con otra que empieza a las 10:00.
  constraint reservas_sin_cruce exclude using gist (
    personal_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado in ('pendiente', 'confirmada'))
);

create index reservas_negocio_id_inicio_idx on public.reservas (negocio_id, inicio);
create index reservas_cliente_id_idx on public.reservas (cliente_id);
create index reservas_servicio_id_idx on public.reservas (servicio_id);

-- -------------------------------------------------------------
-- visitas: eventos para el embudo de métricas
-- -------------------------------------------------------------
create table public.visitas (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  sesion_id text not null,
  fuente_etiqueta text,
  evento text not null check (evento in ('visita', 'inicio_reserva')),
  creado_en timestamptz not null default now()
);

create index visitas_negocio_id_creado_en_idx on public.visitas (negocio_id, creado_en);

-- -------------------------------------------------------------
-- RLS activado en todas las tablas.
-- Sin políticas = nadie lee ni escribe por la API (deny by default).
-- Las políticas se agregan en la siguiente migración (#2).
-- -------------------------------------------------------------
alter table public.negocios  enable row level security;
alter table public.servicios enable row level security;
alter table public.personal  enable row level security;
alter table public.horarios  enable row level security;
alter table public.bloqueos  enable row level security;
alter table public.clientes  enable row level security;
alter table public.fuentes   enable row level security;
alter table public.reservas  enable row level security;
alter table public.visitas   enable row level security;
