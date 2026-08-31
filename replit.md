# Permionics BD Suite

An internal business development portal for Permionics Membranes Pvt. Ltd. — password-protected, featuring a Case Study Library, Case Study Generator, Questionnaire Builder, and an AI-powered BD Assistant chatbot.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from $PORT)
- `pnpm --filter @workspace/permionics-bd-suite run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec

## First-Time Setup (Supabase)

Run `supabase-migration.sql` in Supabase SQL Editor (https://app.supabase.com → Project → SQL Editor). This creates the `case_studies` and `questionnaires` tables and seeds 4 demo case studies.

## Environment Variables (set as Replit Secrets)

- `ADMIN_PASSWORD` — shared team login password
- `SUPABASE_URL` — Supabase project URL (https://xxx.supabase.co)
- `SUPABASE_SERVICE_KEY` — Supabase service_role key (never expose to frontend)
- `ANTHROPIC_API_KEY` — Anthropic API key for the BD Assistant chatbot
- `SESSION_SECRET` — secret for JWT session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Wouter routing, React Query
- API: Express 5, pino logging
- Database: Supabase (PostgreSQL via supabase-js service client)
- AI: Anthropic claude-sonnet-4-6 for BD Assistant RAG chatbot
- Auth: JWT in httpOnly cookie (SESSION_SECRET), password from ADMIN_PASSWORD env var

## Where Things Live

- `artifacts/api-server/src/routes/` — API route handlers
- `artifacts/api-server/src/lib/supabase.ts` — Supabase client + types
- `artifacts/api-server/src/lib/auth.ts` — JWT auth helpers
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth middleware
- `artifacts/permionics-bd-suite/src/` — React frontend
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API)
- `supabase-migration.sql` — database setup script

## Architecture Decisions

- Supabase JS client (service key) used server-side only — never exposed to frontend
- Auth is a single shared team password (ADMIN_PASSWORD env var) with JWT session cookie
- BD Assistant uses keyword-based RAG: retrieves relevant case studies from Supabase, builds context, sends to Claude
- Chat history is session-only (not persisted to DB)
- Password "change" at runtime updates process.env only — for persistence, update ADMIN_PASSWORD in Replit Secrets

## Product

The Permionics BD Suite gives the sales and BD team:
1. **Dashboard** — stats, recent activity, quick actions
2. **Case Study Library** — persistent Supabase-backed repository with full-text search and sector/technology filters
3. **Case Study Generator** — live-preview form that pushes directly to the library
4. **Questionnaire Builder** — sector-tabbed technical discovery forms with customizable questions
5. **BD Assistant** — RAG chatbot powered by Claude, answers queries using actual Permionics case study data
6. **Settings** — password management and API status

## User Preferences

- No em dashes anywhere in UI copy or generated content
- Simple, clear English — no jargon
- Enterprise aesthetic: deep blue #0C4A8C, Inter font, clean tables
- Permionics brand assets in `attached_assets/`

## Gotchas

- Run `supabase-migration.sql` in Supabase SQL Editor BEFORE first use
- Re-run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- Chat history does not persist across logins (by design)
- ADMIN_PASSWORD change via settings only persists until server restart — update Replit Secret for permanent change
