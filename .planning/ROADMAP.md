# Roadmap: AI Mockup Platform

## Milestones

- ✅ **v1.0 AI Mockup Admin Panel** — Phases 1-6 shipped 2026-04-23 ([roadmap](./milestones/v1.0-ROADMAP.md), [requirements](./milestones/v1.0-REQUIREMENTS.md), [audit](./milestones/v1.0-MILESTONE-AUDIT.md), [phase artifacts](./milestones/v1.0-phases/))
- ✅ **v1.1 OpenAI GPT Image 2 Dual Provider** — Phases 7-13 shipped 2026-05-04 with accepted deferred evidence ([roadmap](./milestones/v1.1-ROADMAP.md), [requirements](./milestones/v1.1-REQUIREMENTS.md), [audit](./milestones/v1.1-MILESTONE-AUDIT.md), [integration](./milestones/v1.1-INTEGRATION-CHECK.md), [phase artifacts](./milestones/v1.1-phases/))

## Phases

<details>
<summary>✅ v1.0 AI Mockup Admin Panel (Phases 1-6) — SHIPPED 2026-04-23</summary>

- [x] **Phase 1: Auth Foundation** — role/status schema, JWT role payload, Fastify `requireAdmin`, `/admin` route guard, admin layout shell
- [x] **Phase 2: Dashboard and User Management** — dashboard KPIs/chart, user search/filter/pagination, suspend/delete/role lifecycle actions
- [x] **Phase 3: Generation and Content Monitoring** — generation job monitoring, failed-job details/retry, image browsing, single/bulk delete
- [x] **Phase 4: API Key Management** — encrypted Gemini API key storage, CRUD/activation routes, GeminiService DB-key refactor, call count tracking
- [x] **Phase 5: Dashboard Active Key Display Wiring** — active API key alias/callCount wired into dashboard KPI
- [x] **Phase 6: Edit-Mode API Call Count Fix** — edit-mode Gemini calls increment active key callCount

</details>

<details>
<summary>✅ v1.1 OpenAI GPT Image 2 Dual Provider (Phases 7-13) — SHIPPED 2026-05-04</summary>

- [x] **Phase 7: Provider Foundation and Key Separation** — provider-aware schema, queue routing, admin key lanes, and safe support metadata
- [x] **Phase 8: OpenAI IP Change Parity** — OpenAI IP Change v2 source/UI/result lifecycle wired; live/browser evidence accepted as deferred
- [x] **Phase 9: OpenAI Sketch to Real Parity** — OpenAI Sketch v2 source/UI/result lifecycle wired; transparent PNG final evidence accepted as deferred
- [x] **Phase 10: Provider-Aware Result Continuation** — result/history/regenerate/edit/style-copy continuation pinned to provider; live UAT and `PROV-03` display gap deferred
- [x] **Phase 11: OpenAI Style-Copy Retry Recovery** — admin retry preserves OpenAI style-copy continuation metadata
- [x] **Phase 12: OpenAI Sketch Verification Closure** — Phase 9 verification artifact created and orphaned requirement gap closed
- [x] **Phase 13: IP Change Verification Note Cleanup** — IP Change transparent-background wording corrected and `OIP-02` traceability aligned

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 AI Mockup Admin Panel | 1-6 | 18/18 | Shipped | 2026-04-23 |
| v1.1 OpenAI GPT Image 2 Dual Provider | 7-13 | 23/23 | Shipped with accepted deferred evidence | 2026-05-04 |

## Deferred At Close

Accepted during `$gsd-complete-milestone v1.1` on 2026-05-04:

- `PROV-03`: product result/history UI still shows product-safe `v1`/`v2` labels, not an explicit model label.
- `OSR-03`: final live transparent PNG alpha/composite evidence remains `human_needed`.
- Phase 8 and Phase 10 live OpenAI/browser UAT evidence remains `human_needed`.
- Two quick-task directory status records still report `missing` in the open artifact audit despite corresponding completed quick-task entries in `STATE.md`.

See `.planning/STATE.md` `Deferred Items` and `.planning/milestones/v1.1-MILESTONE-AUDIT.md` for details.

## Next

Start a fresh milestone with new requirements:

`$gsd-new-milestone`
