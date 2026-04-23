# Roadmap: AI Mockup Platform

## Milestones

- ✅ **v1.0 AI Mockup Admin Panel** — Phases 1-6 shipped 2026-04-23
  - Archive: [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)
  - Requirements: [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)
  - Audit: [v1.0-MILESTONE-AUDIT.md](./milestones/v1.0-MILESTONE-AUDIT.md)
  - Phase artifacts: [v1.0-phases/](./milestones/v1.0-phases/)
- 📋 **v1.1 OpenAI GPT Image 2 Dual Provider** — Phases 7-10 planned 2026-04-23
  - Goal: keep Gemini intact while adding matching OpenAI GPT Image 2 workflows beside it
  - Requirements: [.planning/REQUIREMENTS.md](./REQUIREMENTS.md)
  - Research: [.planning/research/](./research/)

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

<details open>
<summary>📋 v1.1 OpenAI GPT Image 2 Dual Provider (Phases 7-10) — PLANNED</summary>

- [ ] **Phase 7: Provider Foundation and Key Separation**
  - Goal: make generation, admin key management, and queue routing provider-aware without breaking Gemini
  - Requirements: `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`
  - Success criteria:
    1. Admin can create, activate, and inspect API keys separately for Gemini and OpenAI
    2. Generation records persist `provider`, `providerModel`, and provider-specific trace metadata
    3. Queue payloads and worker dispatch route jobs by provider before mode-specific execution
    4. Existing Gemini flows continue to run unchanged after provider-aware schema and worker refactor

- [ ] **Phase 8: OpenAI IP Change Parity**
  - Goal: add an OpenAI GPT Image 2 version of the `IP 변경` workflow that matches current product expectations
  - Requirements: `PROV-01`, `OIP-01`, `OIP-02`, `OIP-03`
  - Success criteria:
    1. Users can enter the OpenAI IP Change flow from the same project context as Gemini
    2. OpenAI IP Change returns two candidates and preserves structure/viewpoint/hardware constraints
    3. OpenAI IP Change outputs can be selected, saved to history, reopened, and downloaded through the existing lifecycle
    4. Gemini IP Change entry and behavior remain available and unaffected

- [ ] **Phase 9: OpenAI Sketch to Real Parity**
  - Goal: add an OpenAI GPT Image 2 version of `스케치 실사화` with the same design-preservation contract
  - Requirements: `PROV-02`, `OSR-01`, `OSR-02`, `OSR-03`
  - Success criteria:
    1. Users can enter the OpenAI Sketch to Real flow from the same project context as Gemini
    2. OpenAI Sketch to Real returns two candidates from sketch plus optional texture input
    3. Layout, silhouette, and key character/product details remain preserved while realistic material treatment is applied
    4. Transparent-background requests succeed through background-removal post-processing rather than unsupported direct model output

- [ ] **Phase 10: Provider-Aware Result Continuation**
  - Goal: make result pages, history, regenerate, edit, and style-copy flows stay pinned to the originating provider
  - Requirements: `PROV-03`, `PROV-04`, `OED-01`, `OED-02`, `OED-03`
  - Success criteria:
    1. Result and history views clearly show provider/model for every generation
    2. Regenerate reuses the original provider and saved inputs/options instead of silently switching engines
    3. OpenAI-generated results support partial edit from the existing result page
    4. OpenAI style-copy and iterative follow-ups use OpenAI lineage rather than Gemini-only `thoughtSignature`
    5. Follow-up actions on Gemini and OpenAI results no longer drift into the wrong provider runtime

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 AI Mockup Admin Panel | 1-6 | 18/18 | Shipped | 2026-04-23 |
| v1.1 OpenAI GPT Image 2 Dual Provider | 7-10 | 0/0 | Planned | — |

## Next

**Phase 7: Provider Foundation and Key Separation** — make generation and admin control plane provider-aware before exposing OpenAI workflows.

Run `$gsd-discuss-phase 7` to gather implementation context, or `$gsd-plan-phase 7` to move directly into planning.
