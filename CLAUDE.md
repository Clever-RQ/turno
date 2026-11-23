# CLAUDE.md — Turno

## Who I am and how to work with me
- I'm Clever, a systems engineering student (8th semester). This is my portfolio project.
- **Always answer in Spanish.**
- **Ask me before making any change.** Explain what you will change and why, then wait for my approval.
- Work **only on the current sprint**. Don't create files, folders or code for future sprints.
- I write the core logic myself (availability calculation, bookings API, AI tools) so I can explain it in interviews. For those parts, guide me, review my code and propose tests. Don't write them for me unless I ask.
- You can help freely with: config, boilerplate, SQL drafts, CI, README, tests scaffolding, debugging.
- Explain errors in simple terms before fixing them.
- Never use `--force` or `--legacy-peer-deps` to "fix" npm errors. Find the real cause.
- Never commit secrets. Keys live in `.env.local` (gitignored) and in Vercel env vars.

## Environment
- Windows, VS Code, PowerShell terminal.
- Project folder is inside OneDrive (it works; if npm shows EBUSY/EPERM, pause OneDrive sync).
- GitHub repo: https://github.com/Clever-RQ/turno (public).
- Supabase project created (region: South America / São Paulo). RLS on new tables: enabled. Auto-grant API access: disabled (grants go in migrations).

## Project
Turno is a **web app** (mobile-first, no native app in the MVP) for small businesses in Peru (barbershops, clinics, workshops):
- Customers book from the business's link or QR, using a calendar or by chatting with an AI assistant.
- Owners manage their schedule and see metrics: visit → booking funnel and which QR/link brings appointments.
- Booking tools are also exposed with WebMCP for browser agents.

Full plan: `docs/PLAN.md`.

## Current status
**Sprint 2 — Free slots and public booking (next, 7–13 Dec)**

Tasks (create them as GitHub issues on the "Turno – MVP" board, then add the numbers here):
- [ ] `calcularHorariosLibres(servicio, fecha)` in `lib/disponibilidad.ts`, pure function, no DB. **Clever writes it** (TDD: Claude writes the tests first, then guides without giving the solution)
- [ ] Vitest for it: business hours, split shifts, per-person schedules (`personal.horario_propio`), days off, existing bookings, service duration, Lima time, past hours
- [ ] Public page `/[slug]` with services and a calendar (read with a client WITHOUT session: public policies are `anon` only)
- [ ] `POST /api/reservas` with Zod and rate limiting. **Clever writes it**, Claude guides and reviews
- [ ] Confirmation email with Resend

Done when: two simultaneous bookings for the same slot leave only one saved (the `reservas_sin_cruce` exclude already guarantees it; prove it with a test).

Notes for Sprint 2:
- Data the function needs already exists: `horarios` (null `personal_id` = business; per-person rows only when `horario_propio`), `bloqueos` (UTC instants), `reservas` (active = `pendiente`/`confirmada`), `negocios.zona_horaria`.
- Helpers to reuse: `lib/fechas.ts` (Lima ↔ UTC), `lib/horarios.ts` (`aMinutos`, `filasASemana`).
- `/[slug]` must not collide with app routes: reserved slugs live in `lib/slug.ts` and in the DB check.

**Sprint 1 — Data and owner access: done (23 Nov 2026, issues #1–#8, PRs #9–#17)**
- Tables, RLS + grants, composite FKs, one business per owner, reserved slugs, `slug_disponible()`, `guardar_horario()`.
- Email/password + Google login, onboarding (business + services), panel: Servicios, Equipo, Horarios (weekly + days off).
- Branded UI pieces: `components/panel/confirmar.tsx` (replaces `window.confirm`), `aviso-asistente.tsx`, `avatar-asistente.tsx` (atento / pensando / confirmó), shared side panel `dialogo-lateral.tsx`, animated switch.
- Tests: 83 unit (`npm run test`) + 20 RLS isolation against the real project (`npm run test:rls`, also in CI with repo secrets).

**Sprint 0 — Setup: done (22 Nov 2026)**
- Next.js 16 + TypeScript + Tailwind + ESLint + Prettier + Vitest
- CI on GitHub Actions (lint, typecheck, test, build, RLS tests), green on `main`
- Supabase CLI installed and linked (project ref `xjrzswgxfxwhbphrkoxc`, Postgres 17)
- Vercel deploys `main` automatically: https://turno-eta-seven.vercel.app
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (in `.env.local` and Vercel)

Known issues solved:
- `EALLOWSCRIPTS` on install: caused by `allow-scripts` in user `.npmrc`; fixed with `npm config delete allow-scripts --location=user`.
- `ERESOLVE` installing vitest: `@types/node@20` conflicted with vitest's peer range; fixed by installing `@types/node` matching Node 22/24.
- CI `Cannot find name 'LayoutProps'`: Next.js generates route types in `.next/`, which doesn't exist on a fresh checkout; fixed with `"typecheck": "next typegen && tsc --noEmit"`.
- `next build` fails with "uncached or runtime data during prerendering": the project has `cacheComponents: true`, so anything that reads the request (`cookies()`, `searchParams`, Supabase session) must be inside `<Suspense>`. Only `next build` catches this, not lint/typecheck/test.
- Next.js 16: `middleware.ts` is now `proxy.ts`.
- Dev overlay "unstable value Date.now() while prerendering" on pages that read the session: `partialPrefetching` prefetches with cookies, and `getClaims()` compares the token expiry with `Date.now()`. Fix: `await connection()` before reading the session.
- Auth emails: Supabase only allows editing templates with custom SMTP (Gmail account + app password). Templates live in `supabase/templates/` and use `{{ .RedirectTo }}?token_hash=...` so links work on any device.

Ideas for later sprints (decided, not started):
- Sprint 3: business logo in a "Mi negocio" panel screen, using Supabase Storage (bucket `logos`, public read, owner-only write under `{negocio_id}/`). Accept PNG/JPG/WebP only (no SVG: XSS risk), max ~2 MB, crop square and resize to 256 px. Falls back to initials.
