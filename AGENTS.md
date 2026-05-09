# FlowForge - API Integration Testing Platform

## Overview

Full-stack TypeScript app: React 19 frontend + Express backend served via a single `server.ts` entry point using Vite dev middleware. Uses Supabase for auth/database and optionally Google Gemini for AI diagnostics.

## Cursor Cloud specific instructions

### Running the dev server

The dev command (`npm run dev` → `tsx server.ts`) requires Supabase env vars to be set, otherwise the Supabase client crashes at import time. The `.env.local` file is **not** auto-loaded by tsx; you must export the env vars in the shell before running:

```bash
export VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder
npm run dev
```

The server starts on port 3000 and serves both the Express API routes and the Vite SPA.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Lint (type-check) | `npm run lint` |
| Build | `npm run build` |
| Dev server | `npm run dev` (with env vars exported, see above) |

### Architecture notes

- `server.ts` — Express server handling webhooks (`/wh/:slug`), mock server engine (`/m/:serverSlug/*`), CORS proxy (`/api/proxy`), plus Vite dev middleware
- `src/` — React SPA with React Router, Zustand state, TanStack Query
- `supabase/migrations/` — PostgreSQL schema (requires a running Supabase instance for full functionality)
- Without real Supabase credentials, the server starts and the frontend renders, but auth and database operations will fail gracefully
- The CORS proxy endpoint (`POST /api/proxy`) works without Supabase and can be used to test external API calls

### Testing without Supabase

The frontend and the `/api/proxy` endpoint work without a real Supabase backend. Webhook and mock server routes will log errors to console but won't crash the server.
