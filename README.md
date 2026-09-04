# FrameNix

FrameNix is an intelligent audiovisual production platform — the production
layer between a creator's intent and the finished piece of content. It is
not "an AI video editor." It researches references, understands what makes
them work, discovers patterns across them, and turns that understanding
into an executable production plan.

See the full product philosophy and architecture in the project's master
prompt (kept alongside this codebase, not duplicated here). This README
covers what's actually built and how to run it.

## What's implemented (Phase 1)

The Phase 1 pipeline described in the master prompt, section 6:

```
user input → intent → research → analysis → patterns → blueprint → review → (production)
```

| Stage | Engine | Status |
|---|---|---|
| Understand intent | Intent Engine | ✅ real (Gemini) |
| Discover references | Research Engine | ✅ real (YouTube Data API v3) |
| Analyze references | Video Analysis Engine | ✅ real (Gemini native video understanding) |
| Find recurring patterns | Pattern Discovery Engine | ✅ real (Gemini, synthesizes across analyses) |
| Produce a plan | Blueprint Engine | ✅ real (Gemini) |
| Execute the plan | Production Engine | 🚧 architected, not implemented — returns `501` honestly |
| Adapt existing content | Transformation Engine | 🚧 architected, not implemented |
| One source → many outputs | Repurposing Engine | 🚧 architected, not implemented |

Nothing fakes a result it can't produce. The engines that aren't built
throw `NotImplementedError` and the API surfaces that as a real `501`
response — see `src/lib/engines/production.ts`.

## Architecture

```
src/
  app/
    studio/                 product UI (App Router pages)
    api/projects/...        route handlers — one per pipeline stage
  components/studio/        client components for the studio UI
  lib/
    ai/                     AIProvider abstraction + Gemini implementation
    research/                ResearchProvider abstraction + YouTube implementation
    engines/                 Intent / Research / Analysis / Patterns / Blueprint
                              + stubbed Production / Transformation / Repurposing
    db/prisma.ts              Prisma client singleton
    projects.ts                project graph loader
    demo-user.ts               Phase 1 has no auth; single seeded user
prisma/schema.prisma          full data model (wider than what Phase 1 executes —
                               see the file header for why)
public/index.html             the cinematic landing page (single file, no build step)
```

Every engine talks to the `AIProvider` / `ResearchProvider` interfaces, not
to a specific vendor SDK — swapping or adding a provider is a new class,
not a rewrite of the engines that use it.

## Landing page

`public/index.html` — served at `/` via a rewrite in `next.config.js`. A
standalone, single-file cinematic page (inline CSS/JS, no build step, no
React). The product itself lives under `/studio`.

The hero is a full-bleed video of a figure walking toward an illuminated
door — the platform's one visual anchor, preserved as-is. Everything
around it (copy, nav, sections) is FrameNix's own: no template branding,
no fictional partners/logos, no invented stats. Below the fold covers the
product story (what a reference becomes, how the pipeline works, what
makes it different, repurposing, long-form, the automation vision) with a
real, empty "Resultados" placeholder instead of fabricated numbers, and
"AI Live" explicitly labeled as not built yet.

## Running locally

```bash
cp .env.example .env
# fill in DATABASE_URL, GEMINI_API_KEY, YOUTUBE_API_KEY

npm install
npm run prisma:generate
npm run prisma:migrate   # creates the schema in your Postgres database

npm run dev
```

- `/` — the landing page
- `/studio` — start a new project
- `/studio/[projectId]` — the pipeline: intent → references → patterns → blueprint → (production)

### Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | — |
| `GEMINI_API_KEY` | Google GenAI API key | — |
| `GEMINI_TEXT_MODEL` | Model for text/JSON generation | `gemini-2.5-flash` |
| `GEMINI_VIDEO_MODEL` | Model for video understanding | `gemini-2.5-flash` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | — |

Uses `@google/genai` (the current Google GenAI SDK), never the deprecated
`@google/generative-ai`.

### A note on `npm audit`

`npm audit` reports 3 high-severity findings, all transitive dependencies
of the `prisma` CLI (`@prisma/config` → `deepmerge-ts`). They're reachable
only from `prisma generate`/`migrate` running over the project's own local,
trusted schema/config files — not from anything the deployed app executes
or from user input — so they're an accepted, dev-tooling-only residual
rather than something silently ignored. `@prisma/client`, the package the
app actually imports at runtime, doesn't pull them in. This was a deliberate
tradeoff after finding that `next@14.2.16` (the version this project
started on) carries ~20 real, HTTP-facing CVEs patched by upgrading to
`next@16.3.4` — that upgrade was made; the leftover Prisma CLI findings
were not chased further because doing so meant downgrading Prisma below a
version that supports this schema's `datasource url` syntax.

## What's deliberately not here yet

- **Auth.** One seeded demo user owns every project (`src/lib/demo-user.ts`).
- **Production, Transformation, Repurposing engines.** The data model and
  interfaces exist (`prisma/schema.prisma`, `src/lib/engines/*.ts`); the
  execution logic doesn't. Building it against real generation providers is
  the next real milestone, not this one.
- **Cross-provider research/analysis.** Phase 1 is YouTube + Gemini only,
  by design (master prompt, section 5).
