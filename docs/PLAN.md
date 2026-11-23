# Turno — Plan técnico del MVP por sprints

## Resumen del MVP

7 sprints de una semana (23 nov 2026 – 10 ene 2027), unas 10–15 h por semana. Al final, un negocio real recibe reservas por la web y por el asistente.

**Entra en el MVP:**
- Registro del dueño y su negocio, con link propio (`turno.app/su-negocio`).
- Servicios, horarios, días libres y personal.
- Página pública de reservas con calendario.
- Asistente con IA que consulta horarios y reserva, siempre con confirmación del cliente.
- Panel del dueño: agenda, estados de cita, citas manuales.
- Correos de confirmación y recordatorio.
- Métricas: embudo visita → cita, origen de cada cliente, QR y links con seguimiento.
- Herramientas WebMCP para agentes del navegador.

**Fuera del MVP:** WhatsApp oficial, pagos (Yape, Plin, tarjeta), varias sucursales, app móvil nativa, otros idiomas.

## Stack

| Capa | Tecnología | Para qué |
| --- | --- | --- |
| Frontend y API | Next.js (App Router), TypeScript, Tailwind | Páginas, panel y route handlers en un repo |
| Base de datos | Supabase: PostgreSQL + RLS | Datos de cada negocio aislados |
| Autenticación | Supabase Auth (correo y Google) | Login del dueño; el cliente reserva sin cuenta |
| Validación | Zod | Un esquema para formularios, API y herramientas de la IA |
| IA | API de un LLM con tool calling | Asistente que consulta y reserva |
| Agentes web | WebMCP (`navigator.modelContext`) | Que el agente del navegador reserve |
| Correos | Resend + React Email | Confirmación y recordatorio |
| Tareas programadas | Vercel Cron | Recordatorios 24 h antes |
| QR | `qrcode` | QR de cada fuente |
| Pruebas | Vitest + Playwright | Lógica de horarios y flujos completos |
| CI/CD | GitHub Actions + Vercel | Lint, tipos y pruebas en cada push; deploy automático |

La IA se llama solo desde el servidor.

## Estructura del repo (objetivo final, se crea sprint a sprint)

Un solo proyecto Next.js, separado en capas dentro de `src/`. La frontera backend/frontend la hace cumplir el paquete `server-only`: si un componente del navegador importa algo de `src/server/`, el build falla.

```text
turno/
  src/
    app/                       solo rutas: páginas, layouts y route handlers
      (publico)/[slug]/        página de reservas del negocio
      (panel)/panel/           agenda, servicios, equipo, horarios, métricas
      api/reservas/            crear y cancelar reservas
      api/asistente/           chat con tool calling
      api/visitas/             registrar visitas y escaneos
      api/cron/recordatorios/  correos 24 h antes
    components/                interfaz, por área
      ui/                      piezas genéricas (campos, interruptor, íconos, logo)
      brand/                   el asistente: avatar, confirmar, avisos
      auth/ onboarding/ panel/ services/ team/ schedules/ …
    server/                    BACKEND: solo corre en el servidor
      actions/                 server actions por área
      data/                    consultas a Supabase
      supabase/                clientes de servidor y proxy de sesión
      tools/herramientas.ts    herramientas compartidas por IA y WebMCP
    domain/                    lógica pura, sin base de datos
      disponibilidad.ts        cálculo de horarios libres
      esquemas.ts              esquemas Zod
    proxy.ts                   renueva la sesión y protege rutas
  supabase/migrations/         SQL versionado
  tests/unit/  tests/rls/      Vitest (y Playwright desde el Sprint 3)
  .github/workflows/ci.yml
```

`src/server/tools/herramientas.ts` es la pieza clave: las mismas funciones (`ver_disponibilidad`, `crear_reserva`, etc.) las usan el asistente y WebMCP. Toda reserva pasa por ahí antes de llegar a Supabase.

## Modelo de datos

```sql
create extension if not exists btree_gist;

create type estado_reserva as enum ('pendiente','confirmada','cancelada','asistio','no_asistio');
create type origen_reserva as enum ('web','asistente','agente_web','manual');

create table negocios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  nombre text not null,
  slug text not null unique,
  telefono text,
  zona_horaria text not null default 'America/Lima',
  creado_en timestamptz not null default now()
);

create table servicios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  nombre text not null,
  duracion_min int not null check (duracion_min between 5 and 480),
  precio numeric(8,2),
  activo boolean not null default true
);

create table personal (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  nombre text not null,
  activo boolean not null default true
);

create table horarios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  personal_id uuid references personal(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null,
  cierra time not null check (cierra > abre)
);

create table bloqueos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  personal_id uuid references personal(id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz not null check (fin > inicio),
  motivo text
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  nombre text not null,
  telefono text,
  email text
);

create table fuentes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('qr','link')),
  etiqueta text not null,
  unique (negocio_id, etiqueta)
);

create table reservas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  servicio_id uuid not null references servicios(id),
  personal_id uuid not null references personal(id),
  cliente_id uuid not null references clientes(id),
  inicio timestamptz not null,
  fin timestamptz not null check (fin > inicio),
  estado estado_reserva not null default 'confirmada',
  origen origen_reserva not null,
  fuente_etiqueta text,
  creado_en timestamptz not null default now(),
  exclude using gist (
    personal_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado in ('pendiente','confirmada'))
);

create table visitas (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references negocios(id) on delete cascade,
  sesion_id text not null,
  fuente_etiqueta text,
  evento text not null check (evento in ('visita','inicio_reserva')),
  creado_en timestamptz not null default now()
);
```

**Seguridad (RLS):**
- El dueño lee y edita solo filas de su negocio (`owner_id = auth.uid()`).
- El público lee por `slug` el negocio y sus servicios y horarios activos. Nada más.
- Reservas y visitas no se insertan desde el navegador: pasan por la API (Zod + límite de intentos + clave de servidor).
- El `exclude` impide citas cruzadas del mismo profesional aunque lleguen a la vez.

**Métricas:** el embudo cuenta `visitas` (`visita`, `inicio_reserva`) y `reservas` por estado; "Por dónde llegan" agrupa ambas por `fuente_etiqueta`.

## División del trabajo

| Tema | Clever | Claude |
| --- | --- | --- |
| Producto | Decide alcance, habla con el negocio piloto | Propone opciones |
| Lógica central | Escribe `disponibilidad.ts`, `herramientas.ts`, API de reservas | Revisa, propone pruebas, explica errores |
| SQL y seguridad | Ejecuta y entiende migraciones y RLS | Borrador de SQL y RLS |
| UI | Implementa las pantallas del diseño | Ajustes y componentes base |
| IA | Integra tool calling y define límites | Prompt del sistema y conversaciones de prueba |
| Pruebas y CI | Mantiene el CI en verde | Workflow inicial y pruebas base |
| Documentación | Video demo y post de LinkedIn | README en español y borrador del post |

## Sprints

### Sprint 0 — Preparación (23–29 nov)
Objetivo: un repo que se prueba y se despliega solo.
- [ ] Repo `turno` con Next.js, TypeScript, Tailwind, ESLint, Prettier
- [ ] Proyecto Supabase + CLI para migraciones
- [ ] Repo conectado a Vercel
- [ ] GitHub Actions: lint, typecheck, test
- [ ] `.env.example` y README en español
- [ ] Tablero en GitHub Projects

Listo cuando: un push a `main` pasa el CI y aparece en la URL de Vercel.

### Sprint 1 — Datos y acceso del dueño (30 nov – 6 dic)
- [ ] Migración con las tablas
- [ ] Políticas RLS por tabla
- [ ] Login con correo y Google
- [ ] Onboarding: nombre del negocio y `slug`
- [ ] CRUD de servicios, personal, horarios y días libres
- [ ] Pruebas de RLS: un dueño no lee datos de otro

Listo cuando: dos cuentas de prueba no ven los datos de la otra.

### Sprint 2 — Horarios libres y reserva pública (7–13 dic)
- [ ] `calcularHorariosLibres(servicio, fecha)` sin dependencias de BD
- [ ] Vitest: horario de atención, días libres, citas existentes, duración, hora de Lima, horas pasadas
- [ ] Página pública `/[slug]` con servicios y calendario
- [ ] `POST /api/reservas` con Zod y límite de intentos
- [ ] Correo de confirmación con Resend

Listo cuando: dos reservas simultáneas al mismo horario dejan solo una guardada.

### Sprint 3 — Panel del dueño (14–20 dic)
- [ ] Agenda día y semana
- [ ] Cambiar estado: confirmada, cancelada, asistió, no asistió
- [ ] Cita manual y lista de clientes
- [ ] Recordatorio 24 h antes con Vercel Cron
- [ ] Playwright: reservar como cliente y verla en el panel

Listo cuando: la prueba Playwright pasa en el CI.

### Sprint 4 — Asistente con IA (21–27 dic, semana ligera)
- [ ] `src/server/tools/herramientas.ts`: `ver_servicios`, `ver_disponibilidad`, `crear_reserva`, `cancelar_reserva`
- [ ] `POST /api/asistente` con tool calling y argumentos validados con Zod
- [ ] Prompt del sistema con datos del negocio; no inventa precios ni horarios
- [ ] `crear_reserva` solo tras confirmación del cliente en la tarjeta
- [ ] Límite de mensajes por sesión y tokens por respuesta
- [ ] Avatar con estados atento, pensando, confirmó
- [ ] 15 conversaciones de prueba revisadas

Listo cuando: las 15 conversaciones terminan sin datos inventados ni reservas sin confirmar.

### Sprint 5 — Métricas, QR y WebMCP (28 dic – 3 ene)
- [ ] Crear fuentes (QR o link) y descargar el QR
- [ ] Registrar visitas con `?de=` en `POST /api/visitas`
- [ ] SQL del embudo y de la tabla por origen
- [ ] Pantalla de Métricas con filtro por periodo
- [ ] Herramientas WebMCP solo si el navegador lo soporta; origen `agente_web`

Listo cuando: escanear un QR y reservar suma una visita y una cita a esa fuente.

### Sprint 6 — Piloto y lanzamiento (4–10 ene)
- [ ] Revisión de seguridad: RLS, límites, claves solo en servidor
- [ ] Accesibilidad y Lighthouse en la página pública
- [ ] Configurar negocio piloto e imprimir su QR
- [ ] README en español con capturas, arquitectura y cómo correrlo
- [ ] Video demo de 2 minutos
- [ ] Post en LinkedIn y repo fijado en GitHub

Listo cuando: el negocio piloto recibe reservas reales.

## Definición de terminado
- Está en `main`, pasa el CI y funciona en la URL de Vercel.
- Entra por pull request.
- Lleva pruebas si toca horarios, reservas o herramientas de la IA.
- No expone claves.
- Funciona en celular.

CI en cada push/PR: `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` → (desde Sprint 3) `npm run test:e2e`.

## Diseño
Identidad: logo "turn◔" (la "o" es un reloj con una franja verde reservada), colores tinta `#0B1F1A`, esmeralda `#10B981`, texto verde `#047857`, menta `#D1FAE5`; tipografías Bricolage Grotesque (solo logo), Space Grotesk (títulos), Inter (texto). Avatar del asistente = la "o" con ojos, estados atento / pensando / confirmó.

## Riesgos
| Riesgo | Qué hacemos |
| --- | --- |
| No hay negocio piloto | Buscarlo desde el sprint 0 |
| La IA inventa o reserva mal | Solo usa datos de las herramientas; reservar exige confirmación; 15 pruebas |
| Costo de la IA | Modelo económico y límites |
| WebMCP no disponible | Extra detrás de detección de soporte |
| Falta de tiempo | Recortar sprint 5 primero; nunca saltar pruebas ni deploy |

Después del MVP: recordatorios por WhatsApp, pagos Yape/Plin, app del dueño con Expo, varias sucursales.
