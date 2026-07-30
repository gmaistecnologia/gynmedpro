# Stack: Vite + React + TypeScript + Supabase

This project moved off Next.js entirely — it is now a plain Vite SPA. There is
no server-side rendering, no `app/` router, no API routes. Data access goes
straight from the browser to Supabase (Postgres via PostgREST + Realtime),
authorized by Row Level Security policies, not by server-side code.

## Package versions run ahead of training data

This environment installs whatever is currently latest on npm, which is
routinely newer than any model's training cutoff (observed in this repo: Vite
8, TypeScript 6, ESLint 10, typescript-eslint 8.6x, React Router 7.1x). Don't
assume a config shape or API from memory — check the installed version
(`node_modules/<pkg>/package.json`) and, if something looks off, that
package's own README/CHANGELOG in `node_modules` before writing config code
(`vite.config.ts`, `eslint.config.js`, `tsconfig*.json`).

## Database

Schema and RLS policies live in the Supabase project (`fvsbvbppdmuhwlydjxsn`),
applied via migrations through the Supabase MCP tools — there is no local
`supabase/migrations` folder yet. Check `mcp__claude_ai_Supabase__list_tables`
and `list_migrations` before assuming the schema; don't hand-edit
`src/lib/database.types.ts` — regenerate it with
`mcp__claude_ai_Supabase__generate_typescript_types` after any schema change.

## Design system

Visual identity (colors, fonts, radii, elevation) is documented in
`stitch_assets/design_system.md` and mirrored as Tailwind tokens in
`src/index.css`. Treat it as the source of truth for styling — no solid 1px
borders for sectioning (use tone/elevation instead), Montserrat for
headlines, Inter for body/labels.
