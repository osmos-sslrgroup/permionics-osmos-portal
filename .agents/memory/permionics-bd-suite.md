---
name: Permionics BD Suite
description: Architecture decisions and gotchas for the Permionics internal BD portal
---

## Key decisions

- **Database**: Supabase via `@supabase/supabase-js` service client on backend only. Tables: `case_studies`, `questionnaires`. Schema in `supabase-migration.sql` at workspace root.
- **Auth**: Single shared ADMIN_PASSWORD (env var) compared directly (no bcrypt at rest). JWT signed with SESSION_SECRET stored in httpOnly cookie named `bd_session`. `remember` field in LoginInput controls cookie maxAge (7 days vs session-only).
- **AI chatbot**: Anthropic claude-sonnet-4-6 via user's own ANTHROPIC_API_KEY. Keyword-based RAG scoring in `routes/chat.ts` — no vector embeddings needed for MVP.
- **CORS**: Locked to localhost + *.replit.app + explicit REPLIT_DOMAINS. Credentials: true required for cookie-based auth.
- **Search filter**: PostgREST OR filter with escaped special chars (`, { } ( ) ' " \`) to prevent malformed queries.
- **Password change**: Updates process.env only — user must update Replit Secret for persistence across restarts. Message shown in UI.
- **OpenAPI**: `LoginInput` includes `remember?: boolean` field — added after first codegen pass because the generated type was missing it.

**Why:**
- Supabase JS client chosen because only SUPABASE_URL + SUPABASE_SERVICE_KEY were provided (no direct PostgreSQL connection string available)
- No bcrypt for stored password because ADMIN_PASSWORD lives as a Replit Secret, not in the DB
- RAG is keyword-scoring (not vector embeddings) because the case study library is small and keyword matching is sufficient for this use case
