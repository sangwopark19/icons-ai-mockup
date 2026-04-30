# Roadmap: AI Mockup Platform

## Milestones

- ✅ **v1.0 AI Mockup Admin Panel** — Phases 1-6 shipped 2026-04-23
  - Archive: [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)
  - Requirements: [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)
  - Audit: [v1.0-MILESTONE-AUDIT.md](./milestones/v1.0-MILESTONE-AUDIT.md)
  - Phase artifacts: [v1.0-phases/](./milestones/v1.0-phases/)
- 🚧 **v1.1 OpenAI GPT Image 2 Dual Provider** — Phases 7-13 in progress, started 2026-04-24
  - Goal: keep Gemini intact while adding matching OpenAI GPT Image 2 workflows beside it
  - Requirements: [.planning/REQUIREMENTS.md](./REQUIREMENTS.md)
  - Research: [.planning/research/](./research/)
  - Skill guardrails: [.planning/OPENAI-SKILL-GUARDRAILS.md](./OPENAI-SKILL-GUARDRAILS.md)

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
<summary>🚧 v1.1 OpenAI GPT Image 2 Dual Provider (Phases 7-13) — IN PROGRESS</summary>

- [x] **Phase 7: Provider Foundation and Key Separation** — completed 2026-04-24
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
  - Required skills: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-ip-change`, `mockup-openai-cli-smoke`
  - Required prompt refs: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md`
  - Success criteria:
    1. Users can enter the OpenAI IP Change flow from the same project context as Gemini
    2. OpenAI IP Change returns two candidates and preserves structure/viewpoint/hardware constraints
    3. OpenAI IP Change outputs can be selected, saved to history, reopened, and downloaded through the existing lifecycle
    4. Gemini IP Change entry and behavior remain available and unaffected

- [ ] **Phase 9: OpenAI Sketch to Real Parity**
  - Goal: add an OpenAI GPT Image 2 version of `스케치 실사화` with the same design-preservation contract
  - Requirements: `PROV-02`, `OSR-01`, `OSR-02`, `OSR-03`
  - Required skills: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-sketch-realization`, `mockup-openai-cli-smoke`
  - Required prompt refs: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`
  - Success criteria:
    1. Users can enter the OpenAI Sketch to Real flow from the same project context as Gemini
    2. OpenAI Sketch to Real returns two candidates from sketch plus optional texture input
    3. Layout, silhouette, and key character/product details remain preserved while realistic material treatment is applied
    4. Transparent-background requests succeed through background-removal post-processing rather than unsupported direct model output

- [x] **Phase 10: Provider-Aware Result Continuation** — completed 2026-04-29; human UAT pending
  - Goal: make result pages, history, regenerate, edit, and style-copy flows stay pinned to the originating provider
  - Requirements: `PROV-03`, `PROV-04`, `OED-01`, `OED-02`, `OED-03`
  - Required skills: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-precision-edit`, `mockup-openai-cli-smoke`
  - Required prompt refs: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md`
  - Success criteria:
    1. Result and history views clearly show provider/model for every generation
    2. Regenerate reuses the original provider and saved inputs/options instead of silently switching engines
    3. OpenAI-generated results support partial edit from the existing result page
    4. OpenAI style-copy and iterative follow-ups use OpenAI lineage rather than Gemini-only `thoughtSignature`
    5. Follow-up actions on Gemini and OpenAI results no longer drift into the wrong provider runtime

- [x] **Phase 11: OpenAI Style-Copy Retry Recovery** — completed 2026-04-29
  - Goal: reconnect admin retry recovery with OpenAI style-copy continuation metadata
  - Requirements: `OPS-03`, `OED-02`, `OED-03`
  - Gap Closure: closes v1.1 audit blocker where `AdminService.retryGeneration()` omits `copyTarget` and `selectedImageId`
  - Success criteria:
    1. Admin retry requeues OpenAI style-copy jobs with complete persisted continuation metadata
    2. Regression coverage proves a failed OpenAI style-copy retry reaches provider dispatch with the required fields
    3. Gemini retry and non-style-copy OpenAI retry behavior remain unchanged

- [x] **Phase 12: OpenAI Sketch Verification Closure** — completed 2026-04-30
  - Goal: produce the missing Phase 9 verification and close Sketch to Real transparent-background evidence gaps
  - Requirements: `PROV-02`, `OSR-01`, `OSR-02`, `OSR-03`
  - Gap Closure: closes v1.1 audit orphaned Phase 9 requirements and transparent-background flow evidence gap
  - Success criteria:
    1. Phase 9 has a verification artifact mapping PROV-02, OSR-01, OSR-02, and OSR-03 to checked evidence
    2. Transparent-background requests are proven through background-removal post-processing evidence or an explicit milestone exception
    3. Opaque and transparent Sketch to Real smoke/UAT evidence is sufficient for a follow-up milestone audit

- [x] **Phase 13: IP Change Verification Note Cleanup** — completed 2026-04-30
  - Goal: remove stale transparent-background references from Phase 8 verification and align OIP-02 traceability with the current runtime
  - Requirements: `OIP-02`
  - Gap Closure: closes v1.1 audit warning connecting the Phase 8 verification artifact to the current IP Change v2 runtime
  - Success criteria:
    1. Phase 8 verification and release notes no longer imply an IP Change transparent option that the current API rejects
    2. OIP-02 evidence documents the supported structure, viewpoint, background, and hardware-preservation options
    3. Follow-up audit no longer reports a stale transparent-background warning for IP Change v2

</details>

## Phase Details

### Phase 7: Provider Foundation and Key Separation
**Goal**: Make generation, admin key management, and queue routing provider-aware without breaking Gemini
**Depends on**: v1.0 AI Mockup Admin Panel
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. Admin can create, activate, and inspect API keys separately for Gemini and OpenAI
  2. Generation records persist `provider`, `providerModel`, and provider-specific trace metadata
  3. Queue payloads and worker dispatch route jobs by provider before mode-specific execution
  4. Existing Gemini flows continue to run unchanged after provider-aware schema and worker refactor

### Phase 8: OpenAI IP Change Parity
**Goal**: Add an OpenAI GPT Image 2 version of the `IP 변경` workflow that matches current product expectations
**Depends on**: Phase 7
**Requirements**: PROV-01, OIP-01, OIP-02, OIP-03
**Required Skills**: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-ip-change`, `mockup-openai-cli-smoke`
**Required Prompt Refs**: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md`
**Success Criteria** (what must be TRUE):
  1. Users can enter the OpenAI IP Change flow from the same project context as Gemini
  2. OpenAI IP Change returns two candidates and preserves structure/viewpoint/hardware constraints
  3. OpenAI IP Change outputs can be selected, saved to history, reopened, and downloaded through the existing lifecycle
  4. Gemini IP Change entry and behavior remain available and unaffected

### Phase 9: OpenAI Sketch to Real Parity
**Goal**: Add an OpenAI GPT Image 2 version of `스케치 실사화` with the same design-preservation contract
**Depends on**: Phase 7
**Requirements**: PROV-02, OSR-01, OSR-02, OSR-03
**Required Skills**: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-sketch-realization`, `mockup-openai-cli-smoke`
**Required Prompt Refs**: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`
**Success Criteria** (what must be TRUE):
  1. Users can enter the OpenAI Sketch to Real flow from the same project context as Gemini
  2. OpenAI Sketch to Real returns two candidates from sketch plus optional texture input
  3. Layout, silhouette, and key character/product details remain preserved while realistic material treatment is applied
  4. Transparent-background requests succeed through background-removal post-processing rather than unsupported direct model output

**Wave Dependencies**:
- Wave 1: `09-01` Backend OpenAI Sketch To Real Runtime; `09-02` V2 Project Entry And Sketch Form
- Wave 2 *(blocked on Wave 1 completion)*: `09-03` V2 Sketch Result And History Lifecycle
- Wave 3 *(blocked on Wave 2 completion)*: `09-04` Phase 9 Smoke And Release Verification

**Cross-cutting constraints**:
- D-10: OpenAI Sketch transparent-background requests generate opaque through GPT Image 2 first, then route through post-processing.
- D-28: OpenAI Sketch to Real returns exactly two candidates.
- D-29: Prompt names image roles and separates Must preserve, Must add, and Hard constraints.
- D-30: Prompt states sketch is locked design spec and texture reference is not style/scene reference.

### Phase 10: Provider-Aware Result Continuation
**Goal**: Make result pages, history, regenerate, edit, and style-copy flows stay pinned to the originating provider
**Depends on**: Phases 8 and 9
**Requirements**: PROV-03, PROV-04, OED-01, OED-02, OED-03
**Required Skills**: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-precision-edit`, `mockup-openai-cli-smoke`
**Required Prompt Refs**: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md`
**Success Criteria** (what must be TRUE):
  1. Result and history views clearly show provider/model for every generation
  2. Regenerate reuses the original provider and saved inputs/options instead of silently switching engines
  3. OpenAI-generated results support partial edit from the existing result page
  4. OpenAI style-copy and iterative follow-ups use OpenAI lineage rather than Gemini-only `thoughtSignature`
  5. Follow-up actions on Gemini and OpenAI results no longer drift into the wrong provider runtime

### Phase 11: OpenAI Style-Copy Retry Recovery
**Goal**: Reconnect admin retry recovery with OpenAI style-copy continuation metadata
**Depends on**: Phases 7 and 10
**Requirements**: OPS-03, OED-02, OED-03
**Gap Closure**: Closes v1.1 audit blocker where admin retry requeues failed OpenAI style-copy jobs without `promptData.copyTarget` and `promptData.selectedImageId`.
**Success Criteria** (what must be TRUE):
  1. `AdminService.retryGeneration()` includes persisted style-copy continuation metadata in OpenAI retry queue payloads
  2. Regression coverage proves failed OpenAI style-copy retry reaches provider dispatch with complete metadata
  3. Existing Gemini and non-style-copy OpenAI retry behavior remains unchanged

### Phase 12: OpenAI Sketch Verification Closure
**Goal**: Produce the missing Phase 9 verification and close Sketch to Real transparent-background evidence gaps
**Depends on**: Phase 9
**Requirements**: PROV-02, OSR-01, OSR-02, OSR-03
**Required Skills**: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-sketch-realization`, `mockup-openai-cli-smoke`
**Required Prompt Refs**: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`
**Gap Closure**: Closes v1.1 audit orphaned requirements caused by missing `09-VERIFICATION.md` and deferred transparent-background evidence.
**Plans:** 2/2 plans complete
Plans:
**Wave 1**
- [x] 12-01-PLAN.md — Create Phase 9 verification artifact and OSR-03 exception discipline

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 12-02-PLAN.md — Record automated checks and deterministic audit closure evidence
**Success Criteria** (what must be TRUE):
  1. Phase 9 verification maps PROV-02, OSR-01, OSR-02, and OSR-03 to source, test, smoke, or explicit human-evidence status
  2. Transparent-background Sketch to Real requests are verified through the post-processing path with alpha/composite evidence or a documented milestone exception
  3. Follow-up audit no longer treats Phase 9 requirements as orphaned

### Phase 13: IP Change Verification Note Cleanup
**Goal**: Remove stale transparent-background references from Phase 8 verification and align OIP-02 traceability with the current runtime
**Depends on**: Phase 8
**Requirements**: OIP-02
**Required Skills**: `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-ip-change`, `mockup-openai-cli-smoke`
**Required Prompt Refs**: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md`
**Gap Closure**: Closes v1.1 audit warning that Phase 8 verification still mentions transparent-background option carry-through for IP Change v2.
**Plans:** 1/1 plans complete
Plans:
**Wave 1**
- [x] 13-01-PLAN.md — Correct IP Change verification notes and close OIP-02 traceability
**Success Criteria** (what must be TRUE):
  1. Phase 8 verification and related release notes accurately describe current IP Change v2 options
  2. OIP-02 evidence confirms structure, viewpoint, background, and hardware-preservation options without unsupported transparent-output claims
  3. Follow-up audit no longer reports the Phase 8 stale transparent-background warning

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 AI Mockup Admin Panel | 1-6 | 18/18 | Shipped | 2026-04-23 |
| v1.1 OpenAI GPT Image 2 Dual Provider | 7-13 | 11/19 original; 2/3 gap closures | In Progress | — |

## Next

**Phase 13: IP Change Verification Note Cleanup** — remove stale transparent-background references from Phase 8 verification and align OIP-02 traceability.

Run `$gsd-plan-phase 13` to plan the IP Change verification note cleanup.
