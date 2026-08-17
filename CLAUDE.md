# SunBloom UI — working context

Read this first, every session.

## What SunBloom is

A career and skill-development platform answering one question:

> **What should I do next to become better prepared for my target career?**

Pick a target career → see required skills → assess where you stand → get gaps
ranked → get told what to do today.

## Repositories

| Repo | Contents |
|---|---|
| `sunbloom-ui` (this one) | Angular frontend, `docs/FRONTEND-ARCHITECTURE.md` |
| `sunbloom-api` | Backend and **all domain, database, and architecture docs + ADRs** |

The API repo is the system of record for the domain. When a question is about *what
a skill or an evidence record means*, the answer is in `sunbloom-api/docs/`, not here.
Clone it alongside this repo — a sibling directory under `Downloads/SunBloom/`.

## The contract rule

**API types are generated from the backend's OpenAPI document. Never hand-write them.**

Two repos means contract drift is the main structural risk of this project. Generated
types are the mitigation. If a generated type looks wrong, fix the API contract and
regenerate — do not patch the generated file, and do not work around it with `any`.

## Non-negotiable rules

1. **No `any`.** Ever, without a comment explaining the specific reason.
2. **Standalone components only.** No NgModules.
3. **`ChangeDetectionStrategy.OnPush` on every component.**
4. **Signals for state**, in feature-scoped services. No NgRx. See ADR-0009.
5. **No business logic in templates.** Compute in the component or a service.
6. **No direct `HttpClient` calls from components.** Go through a feature API service.
7. Every async view handles four states explicitly: **loading, empty, error, loaded**.
   An unhandled empty state is a bug, not a detail.
8. Feature code lives under `src/app/features/<feature>/` and is lazy-loaded.

## What the UI must never imply

SunBloom shows people how ready they are for a job. That makes honesty a UI concern:

- **Never present a low-confidence score as fact.** When competency rests only on
  self-assessment, the UI must say so visibly. The API returns a confidence value
  with every score — surface it.
- **Never show a readiness component as `0` when it is simply unmeasured.** Unmeasured
  components are excluded and the score renormalized; label them as not yet measured.
- Readiness is always **explainable** — every score links to the evidence behind it.

## Design direction

Clean, modern, professional. Encouraging without being childish — this is a tool for
adults preparing for job interviews, not a gamified learning app. The sunflower
metaphor (seed → sunlight → growth → bloom) stays subtle: colour and naming, not
mascots, badges, or confetti.

## Environment

Node **v20.19.0** · Angular **21.2** · Vitest · Playwright · Tailwind 4

**Angular 21 is a deliberate choice, not staleness.** Angular 22 is current but requires
Node `^22.22.3`; the owner chose to stay on Node 20 for now. Do not "upgrade" to Angular
22 — it will not build on this machine. Revisit only if Node is upgraded first.

The dev server runs on **port 4300**, not 4200 — an unrelated process occupies 4200 on
this machine.

## Commands

```bash
npm start            # dev server on :4300, proxies /api to the API on :5078
npm test             # Vitest unit tests
npm run e2e          # Playwright; needs API on :5078 and npm start running

# Review-queue E2E needs a ContentAdmin account. Credentials come from the environment,
# never the repo — the tests skip with a stated reason when these are unset.
SB_ADMIN_EMAIL=you@example.com SB_ADMIN_PASSWORD=... npm run e2e
npm run sync:openapi # pull the contract from a running API into openapi/
npm run generate:api # regenerate src/app/api/generated/schema.ts from it
```

`proxy.conf.json` forwards `/api` to `http://localhost:5078`, so the browser sees one
origin and CORS never has to be configured.

## Gotchas that have already cost time

- **Areas start expanded, deeper levels collapsed.** A toggle's accessible name is
  `Expand X` or `Collapse X` depending on state — targeting the wrong one in a test
  matches nothing and burns the whole timeout.
- **`ng test` can flake on a cold start** (browser runner timing out around 60s while
  the dev server is also building). Re-run before investigating.
- The **root component holds only `<router-outlet />`**. App chrome lives in `Shell`,
  which wraps authenticated routes only — so login and register render without it.

## Current state

**Sub-slices 1.4 and 1.5b complete.** Scaffold, Tailwind, generated API types, auth flow
with shared-refresh interceptor, route guards, skill tree and detail pages, and the
content review queue at `/review` (ContentAdmin only).

The review queue supports bulk approve, because a real career path is several hundred
nodes and approving them one dialog at a time is how review degrades into
rubber-stamping. Reject is deliberately slower — it asks for a note, which is what tells
the next prompt version what went wrong.

Next: **1.6 — the evidence ledger and scoring** (in `sunbloom-api`). See
`sunbloom-api/docs/ROADMAP.md`.

**Known gap:** tokens are in `localStorage`, which trades XSS exposure for surviving a
page refresh. The safer arrangement is an httpOnly cookie for the refresh token, which
needs an API change. Recorded, not forgotten.
