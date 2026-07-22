# Dream Tutor AI

A free, no-login AI learning platform: study tools (research, essays, quizzes, flashcards, notes, presentations, text playground), a step-by-step math solver, and a virtual science lab with real PhET simulations.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/ai-study-hub run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec after editing `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, using multi-provider `generateJson` (Groq primary, GLM fallback) for AI tool endpoints
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → `lib/api-zod`, `lib/api-client-react` (React Query hooks)
- Frontend: React + Vite, wouter router, framer-motion page transitions, Tailwind theme tokens
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-study-hub` — the web frontend (all pages, layout, styling)
  - `src/pages/` — Home, About, Contact, MathSolver, VirtualLab, plus the 7 AI study tool pages (Research, Essay, Quiz, Flashcards, StudyNotes, Presentation, TextPlayground)
  - `src/components/layout/` — Header (top nav + Tools dropdown + mobile Sheet drawer), Footer (social icons + link columns), AppLayout, PageTransition
  - `src/lib/simulations.ts` — curated list of verified PhET simulation slugs used by Virtual Lab
  - `public/images/` — downloaded stock photos used across Home/About
- `artifacts/api-server` — Express API; AI tool routes in `src/routes/ai-tools.ts`
- `lib/api-spec/openapi.yaml` — source of truth for API contracts; run codegen after edits

## Architecture decisions

- Layout is a top-nav header + footer (not a sidebar), to match the site's marketing-style, multi-page design.
- Math Solver returns structured JSON (steps with title/explanation/expression, finalAnswer, checkNote) using plain-text math notation (e.g. `x^2`, `sqrt(x)`), not LaTeX — matches the existing AI-tool schema/route conventions.
- Virtual Lab embeds official PhET HTML5 simulations via iframe (`https://phet.colorado.edu/sims/html/{slug}/latest/{slug}_en.html`); PhET's pages allow cross-origin iframing (no `X-Frame-Options`, permissive CORS).
- Color system reuses/extends the existing dark teal-green primary + gold/amber accent palette rather than introducing a new one, since it already matched the desired Eduka-style direction.

## Product

- Home: hero, feature strip, about section, stats band, full tools grid (9 tools), CTA.
- 7 AI study tools: Deep Research, Essay Writer, Quiz Generator, Flashcards, Study Notes, Presentation Outline, Text Playground.
- Math Solver: step-by-step walkthrough for any equation/word problem, with a final answer and a check note.
- Virtual Lab: searchable/filterable grid of ~28 real PhET simulations (Physics, Chemistry, Math, Biology) with an in-app iframe viewer.
- About and Contact static pages.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API server does not hot-reload on file changes (build-then-start script) — restart the `artifacts/api-server` workflow after editing route files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
