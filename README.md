# Turno

Online booking for small businesses in Peru (barbershops, clinics, workshops).

Customers book from the business's link or QR code, using a calendar or by chatting with an AI assistant. Owners manage their schedule and see which link or QR brings them appointments.

> Work in progress. MVP planned for January 2027.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase (PostgreSQL, Row Level Security, Auth)
- Vitest for tests
- GitHub Actions for CI, Vercel for deploys

## Getting started

Requirements: Node.js 24 and npm.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check types with `tsc --noEmit` |
| `npm run test` | Run tests with Vitest |
| `npm run format` | Format files with Prettier |

## CI

Every push and pull request to `main` runs lint, typecheck and tests on GitHub Actions.
