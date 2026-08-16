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

Node v20.19.0 · Angular 21 target — **verify the Node requirement at scaffold time**,
v20.19.0 is exactly at the v20 minimum and Angular 21 may require Node 22+.

## Current state

Not yet scaffolded. See `sunbloom-api/docs/ROADMAP.md` for the current slice.
