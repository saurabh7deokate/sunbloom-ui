# SunBloom UI

Angular frontend for **SunBloom** — a career and skill-development platform that answers
one question:

> What should I do next to become better prepared for my target career?

**Status:** Architecture complete, not yet scaffolded.

## Documentation

- [FRONTEND-ARCHITECTURE.md](docs/FRONTEND-ARCHITECTURE.md) — structure, state, API layer,
  testing
- Domain, database, and system architecture live in
  [sunbloom-api/docs](https://github.com/saurabh7deokate/sunbloom-api/tree/main/docs)

## Two rules worth knowing before you read the code

**API types are generated from the backend's OpenAPI document.** Never hand-written,
never edited, never worked around with `any`. Two repositories means contract drift is
the main structural risk of this project, and generated types are the mitigation.

**The UI is required to be honest about uncertainty.** SunBloom tells people how ready
they are for a job. A score built only on self-assessment renders as provisional, an
unmeasured readiness component is labelled rather than shown as zero, and every score
links to the evidence behind it.

## Stack

Angular 21 · TypeScript · Tailwind CSS · signals for state (no NgRx) · Vitest · Playwright

## Related

Backend: [sunbloom-api](https://github.com/saurabh7deokate/sunbloom-api) — clone it as a
sibling directory.
