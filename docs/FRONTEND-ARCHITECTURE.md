# SunBloom UI — Frontend Architecture

**Angular 21 · TypeScript · Tailwind CSS** · **Status:** Design, pre-scaffold

Domain questions are answered in `sunbloom-api/docs/`. This document covers only how
the frontend is put together.

---

## 1. Structure

Feature-first, not type-first. Grouping by `components/`, `services/`, `models/` at the
root scatters every feature across the tree and makes deletion and lazy-loading hard.

```
src/app/
├── core/                         Singleton, app-wide. Imported once.
│   ├── auth/                     Token storage, refresh interceptor, guards
│   ├── http/                     Error interceptor, correlation ID, base URL
│   ├── errors/                   Global handler, Problem Details parsing
│   └── layout/                   Shell, navigation, page chrome
│
├── shared/                       Reusable, presentational, zero feature knowledge
│   ├── ui/                       Button, card, dialog, skeleton, empty-state
│   ├── charts/                   Readiness ring, dimension bars, trend line
│   └── pipes/  directives/
│
├── features/                     Lazy-loaded. One folder per feature.
│   ├── auth/                     Login, register
│   ├── career/                   Path selection, goal setup
│   ├── skills/                   Skill tree browse, skill detail
│   ├── assessment/               Self-assessment flow
│   ├── plan/                     Daily plan
│   └── dashboard/                The five questions from §37
│
├── api/                          GENERATED from OpenAPI. Never hand-edited.
│   └── generated/
│
└── styles/                       Tailwind config, design tokens
```

Each feature owns its routes, components, and a single API-facing service:

```
features/skills/
├── skills.routes.ts
├── data/skill.store.ts           Signal state + API calls for this feature
├── pages/                        Routed components
└── components/                   Feature-local, not shared
```

**Rule:** if two features need the same component, it moves to `shared/ui/` — it does
not get imported across feature boundaries. Cross-feature imports are how a feature
tree quietly becomes a ball of mud.

---

## 2. State

**Signals in feature-scoped services.** No NgRx — see ADR-0009.

Three categories, handled differently:

| Kind | Approach |
|---|---|
| **Server state** (skills, scores, plan) | Signal store per feature, provided at the route |
| **UI state** (open panels, filters) | Component-local signals |
| **Session state** (current user, token) | One `AuthStore` in `core/`, app-wide |

A feature store is provided at the **route** level, not in `root`, so navigating away
disposes it. Root-provided stores accumulate stale data across a session and turn into
a cache nobody invalidates.

Derived values use `computed()`. Effects are for genuine side effects only — never for
deriving state, which is the most common way signal code becomes unpredictable.

`httpResource` may suit server state well; it was still experimental as of Angular 20,
so **confirm its status at scaffold time** rather than assuming.

---

## 3. API layer

Types are generated from the backend's OpenAPI document into `src/app/api/generated/`.
Never hand-written, never edited. If a type looks wrong, fix the API contract and
regenerate.

This is the mitigation for the two-repo split (ADR-0007). Bypassing it — by
hand-writing an interface or reaching for `any` — reintroduces exactly the drift risk
the generation exists to prevent.

Interceptors, in order:

1. **Base URL + correlation ID** — one ID per request, logged both sides
2. **Auth** — attaches the access token
3. **Refresh** — on 401, refreshes once and retries; concurrent 401s share one refresh
   and queue behind it rather than each firing their own
4. **Error** — parses RFC 9457 Problem Details into a typed app error

---

## 4. The four states

Every async view handles all four, explicitly. An unhandled empty state is a bug.

| State | Requirement |
|---|---|
| **Loading** | Skeletons matching final layout — not spinners; they prevent layout shift |
| **Empty** | Explains *why* it is empty and what to do next |
| **Error** | Says what failed and offers a retry; never a raw status code |
| **Loaded** | The content |

Empty states matter unusually much here: a new user's entire application is empty, so
empty states *are* the onboarding experience.

---

## 5. Honesty in the interface

SunBloom tells people how ready they are for a job. Presentation is therefore an
integrity concern, not only a design one.

- **Confidence is always visible.** The API returns confidence with every score. A
  score built only on self-assessment renders as provisional — muted, labelled,
  visually distinct from a corroborated one.
- **Unmeasured is never zero.** Readiness components without data are labelled *not
  yet measured* and excluded from the total. Rendering them as 0 would be a lie the
  maths already refuses to tell.
- **Every score links to its evidence.** "Why is this 4.2?" is one click, always.
- **Blocked skills show what blocks them.** This turns the prerequisite graph into
  guidance, and lets the user catch a wrong AI-generated edge.

---

## 6. Visual direction

Clean, modern, professional — a tool for adults preparing for interviews. Encouraging
without being childish.

The sunflower metaphor (seed → sunlight → growth → bloom) lives in **colour and
naming only**. No mascots, no badges, no confetti, no streak-shaming. §37 is explicit
that this must not feel like a gamified children's app, and that restraint is easiest
to hold at the start.

- Tailwind with design tokens; component-level classes, not utility soup in templates
- Angular Material only where it earns its weight (date picker, dialog, menu)
- Responsive from the start; the dashboard must be readable on a phone
- Dark mode via CSS custom properties from day one — retrofitting is painful
- WCAG AA contrast; never colour alone to convey meaning (weak/moderate/strong needs
  a label or icon too — red/amber/green is invisible to a meaningful share of users)

---

## 7. Testing

| Level | Tool | Scope |
|---|---|---|
| Component | Vitest + Testing Library | Rendering logic, the four states |
| Store | Vitest | Signal transitions, derived values |
| E2E | Playwright | Critical paths only |

Critical E2E paths: register → log in → pick career → self-assess → see ranked gaps →
see today's plan. That single flow *is* the product; if it works, the app works.

Per §36, tests protect behaviour rather than coverage. A test asserting that a
component renders its own template is noise.

---

## 8. Performance

Lazy-load every feature route · `OnPush` everywhere · `@defer` for below-the-fold
dashboard panels · virtual scrolling for skill trees beyond ~200 visible nodes ·
`trackBy` on every list · budget the initial bundle and fail CI when it regresses.

The skill tree is the one component with real performance risk — a 400-node tree
rendered eagerly with default change detection will feel slow on a mid-range phone.
Virtualize it when it exceeds roughly 200 rendered nodes.
