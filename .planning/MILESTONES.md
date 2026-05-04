# Milestones

## v1.1 OpenAI GPT Image 2 Dual Provider (Shipped: 2026-05-04)

**Delivered:** Parallel OpenAI GPT Image 2 provider workflows beside Gemini, with provider-aware routing, history/continuation metadata, admin key separation, and accepted deferred evidence for live/browser gaps.

**Phases completed:** 7-13 (23 plans, 61 tasks)

**Key accomplishments:**

- Made `Generation.provider` / `providerModel`, queue payloads, worker dispatch, and admin monitoring provider-aware without removing Gemini.
- Added separate Gemini/OpenAI admin API key lanes and dashboard active-key visibility.
- Added OpenAI GPT Image 2 IP Change and Sketch to Real v2 workflows with two-candidate result/history lifecycle.
- Added provider-pinned regenerate, partial edit, style-copy continuation, and OpenAI linkage handling.
- Recovered admin retry behavior for failed OpenAI style-copy jobs by preserving continuation metadata.
- Closed audit orphan/stale-doc gaps through Phase 12 and Phase 13 verification artifacts.

**Stats:**

- 7 phases, 23 plans, 61 tasks
- 225 files changed across the `v1.0` -> archive range
- 22,719 TypeScript/TSX LOC currently under `apps/`
- Milestone started 2026-04-24; archived 2026-05-04

**Git range:** `v1.0` -> `v1.1`

**Known deferred items at close:** 8 open artifact items acknowledged in `.planning/STATE.md` under `Deferred Items`; audit status remained `gaps_found` and was accepted as milestone close tech debt.

**Archive:**

- [v1.1 roadmap](./milestones/v1.1-ROADMAP.md)
- [v1.1 requirements](./milestones/v1.1-REQUIREMENTS.md)
- [v1.1 audit](./milestones/v1.1-MILESTONE-AUDIT.md)
- [v1.1 integration check](./milestones/v1.1-INTEGRATION-CHECK.md)
- [v1.1 phase artifacts](./milestones/v1.1-phases/)

**What's next:** Run `$gsd-new-milestone` to define fresh requirements for the next milestone.

---

## v1.0 AI Mockup Admin Panel (Shipped: 2026-04-23)

**Delivered:** A secure admin panel inside the existing AI mockup app for user operations, generation/content monitoring, dashboard visibility, and encrypted Gemini API key management.

**Phases completed:** 1-6 (18 plans, 30 tasks)

**Key accomplishments:**

- Added role/status auth foundation with Fastify `requireAdmin`, JWT role payloads, and `/admin` frontend guard/layout.
- Built dashboard KPI cards, failure chart, polling, and full user lifecycle management.
- Built generation monitoring and content management with failed-job retry, image browsing, lightbox, and single/bulk deletion.
- Added encrypted Gemini API key CRUD/activation and refactored GeminiService/Worker/edit route to use active DB keys.
- Closed DASH-04 and KEY-06 audit gaps with active key dashboard wiring and edit-mode call count tracking.

**Stats:**

- 6 phases, 18 plans, 30 tasks
- 134 files changed across the v2 -> v1.0 branch range
- 105 TypeScript/TSX files currently under `apps/`, 13,857 total TS/TSX LOC
- Development work started 2026-03-10; milestone archived 2026-04-23

**Git range:** `e3298bb` (v2) -> current `v3-cl`

**Known deferred items at close:** 3 runtime/browser verification frontmatter items acknowledged in `.planning/STATE.md` under `Deferred Items`.

**Archive:**

- [v1.0 roadmap](./milestones/v1.0-ROADMAP.md)
- [v1.0 requirements](./milestones/v1.0-REQUIREMENTS.md)
- [v1.0 audit](./milestones/v1.0-MILESTONE-AUDIT.md)
- [v1.0 phase artifacts](./milestones/v1.0-phases/)

**What's next:** Run `$gsd-new-milestone` to define fresh requirements for the next milestone.

---
