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
**Sprint 0 — Setup (in progress)**

Done:
- [x] Supabase project created
- [x] GitHub repo created and cloned
- [x] Next.js app created with `create-next-app` (recommended defaults: TypeScript, ESLint, Tailwind, App Router, no `src/`)
- [x] Installed dev deps: `vitest`, `prettier`, `@types/node` (matching my Node major)

Pending:
- [x] Add scripts to package.json: `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `format` (`prettier --write .`)
- [x] Add starter files: `.github/workflows/ci.yml`, `vitest.config.mts`, `.env.example`, `tests/smoke.test.ts`, `README.md`
- [x] `npm run lint`, `npm run typecheck`, `npm run test` all pass
- [x] First commit + push; GitHub Actions CI green
- [x] Create `.env.local` with Supabase URL and keys
- [x] Install Supabase CLI (`npm i -D supabase`), `npx supabase init`, `login`, `link --project-ref <ref>`
- [ ] Import repo in Vercel, add env vars, deploy
- [ ] GitHub Projects board with Sprint 1 tasks
- [ ] Final check: small change → push → CI green → visible on Vercel URL

Known issues solved:
- `EALLOWSCRIPTS` on install: caused by `allow-scripts` in user `.npmrc`; fixed with `npm config delete allow-scripts --location=user`.
- `ERESOLVE` installing vitest: `@types/node@20` conflicted with vitest's peer range; fixed by installing `@types/node` matching Node 22/24.
