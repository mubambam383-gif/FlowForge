# FlowForge

FlowForge is a Vite + React application for API testing, webhook capture, mock servers, contract validation, and AI-assisted diagnostics. It uses Supabase for authentication, Postgres storage, and realtime updates.

## Tech Stack

- Frontend: React 19, Vite 6, TypeScript, Tailwind CSS 4
- Local backend: Express running through `tsx server.ts`
- Production backend: Vercel Serverless Functions in `api/`
- Database/auth: Supabase Postgres + Supabase Auth
- AI diagnostics: Google Gemini API, called only from server-side routes

## Required Environment Variables

Copy `.env.example` to `.env.local` for localhost development:

```bash
cp .env.example .env.local
```

Fill in:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3000
```

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the browser. Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` server-only.

## Supabase Setup

Apply the SQL files in order from `supabase/migrations/` using the Supabase SQL editor or Supabase CLI:

1. `20240508000000_initial_schema.sql`
2. `20240508000001_enterprise_features.sql`
3. `20240508000002_rls_and_vercel_support.sql`

Enable the auth providers you want to use in Supabase Auth. For OAuth providers, add these redirect URLs:

- `http://localhost:3000/dashboard`
- `https://your-vercel-domain.vercel.app/dashboard`

## Run Locally

Prerequisites:

- Node.js 20 or newer
- npm
- Supabase project with the migrations above applied

Commands:

```bash
npm ci
npm run dev
```

Local URLs:

- App: `http://localhost:3000`
- API proxy: `http://localhost:3000/api/proxy`
- AI diagnostics: `http://localhost:3000/api/diagnose`
- Webhook receiver: `http://localhost:3000/wh/user-<supabase-user-id>`
- Mock server route: `http://localhost:3000/m/<mock-server-slug>/<configured-path>`

## Validate Before Deploying

```bash
npm run lint
npm run build
```

## Deploy to Vercel

The included `vercel.json` configures Vite output and rewrites `/wh/*` and `/m/*` to serverless API functions.

Recommended Vercel settings:

- Framework preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Add these Vercel environment variables for Production, Preview, and Development:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

After deployment, add the Vercel domain to Supabase Auth redirect URLs.
