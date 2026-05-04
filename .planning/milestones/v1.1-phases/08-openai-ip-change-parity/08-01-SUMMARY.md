---
phase: 08-openai-ip-change-parity
plan: 01
subsystem: api
tags: [openai, gpt-image-2, worker, bullmq, image-edit]
requires:
  - phase: 07-provider-foundation-and-key-separation
    provides: provider/model persistence, provider-scoped API keys, OpenAI metadata fields
provides:
  - OpenAI GPT Image 2 IP Change runtime
  - quality option contract for generation requests and queue jobs
  - OpenAI support metadata persistence
affects: [phase-08-openai-ip-change-parity, phase-10-provider-aware-result-continuation]
tech-stack:
  added: [openai]
  patterns: [parallel-openai-image-service, provider-gated-worker-dispatch]
key-files:
  created:
    - apps/api/src/services/openai-image.service.ts
    - apps/api/src/services/__tests__/openai-image.service.test.ts
  modified:
    - apps/api/package.json
    - pnpm-lock.yaml
    - packages/shared/src/types/index.ts
    - apps/api/src/routes/generation.routes.ts
    - apps/api/src/services/generation.service.ts
    - apps/api/src/services/__tests__/generation.service.test.ts
    - apps/api/src/lib/queue.ts
    - apps/api/src/worker.ts
key-decisions:
  - "OpenAI IP Change uses a separate openai-image.service.ts instead of mixing provider code into gemini.service.ts."
  - "Two v2 candidates are produced through one images.edit call with n=2."
  - "gpt-image-2 requests omit background and input_fidelity; after the Phase 8 review fix, OpenAI IP Change v2 does not expose transparent-background intent as an app option and backend guards reject direct transparentBackground requests."
patterns-established:
  - "OpenAI support IDs are stored in existing OpenAI fields and providerTrace without raw response bodies."
  - "Worker dispatch allows provider=openai only for mode=ip_change in Phase 8."
requirements-completed: [OIP-01, OIP-02]
duration: 19 min
completed: 2026-04-24
---

# Phase 08 Plan 01: Backend OpenAI IP Change Runtime Summary

**OpenAI GPT Image 2 IP Change runtime with two-candidate edits, quality routing, and support metadata capture**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-24T08:20:10Z
- **Completed:** 2026-04-24T08:39:04Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added the official `openai` SDK to `@mockup-ai/api`.
- Added `quality: low | medium | high` through shared schema, API validation, persistence, and BullMQ payloads.
- Created a dedicated OpenAI image service that calls `client.images.edit()` once with `n: 2` and returns exactly two candidate buffers.
- Updated the worker so `provider === "openai"` runs only `mode === "ip_change"` and blocks other OpenAI modes with an explicit Korean error.
- Persisted OpenAI request/response/image-call/revised-prompt metadata using existing Phase 7 schema fields.

## Task Commits

1. **Task 08-01-01: Add OpenAI SDK and generation quality contract** - `6562aa9`
2. **Task 08-01-02: Implement OpenAI image service for strict IP replacement** - `79e24c3`
3. **Task 08-01-03: Route OpenAI IP Change jobs in the worker** - `de943d8`

## Files Created/Modified

- `apps/api/src/services/openai-image.service.ts` - GPT Image 2 Image API edit service with strict IP replacement prompt.
- `apps/api/src/services/__tests__/openai-image.service.test.ts` - unit tests for two outputs, model, prompt sections, and forbidden parameter omissions.
- `apps/api/src/worker.ts` - provider-gated OpenAI IP Change dispatch and metadata persistence.
- `apps/api/src/services/generation.service.ts` - quality propagation and OpenAI support metadata update method.
- `apps/api/src/services/__tests__/generation.service.test.ts` - quality and OpenAI metadata persistence tests.
- `packages/shared/src/types/index.ts` - shared generation option quality contract.
- `apps/api/src/routes/generation.routes.ts` - request schema quality validation.
- `apps/api/src/lib/queue.ts` - queue payload quality field.
- `apps/api/package.json` and `pnpm-lock.yaml` - OpenAI SDK dependency.

## Decisions Made

- Used one `images.edit` call with `n: 2` to align the two-candidate product contract with a single external request.
- Stored multiple request IDs and image call IDs as comma-separated values in the existing singular support fields, with structured detail retained in `providerTrace`.
- Kept non-IP OpenAI modes blocked in worker until their roadmap phases add runtime support.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- `pnpm add openai` first failed because the sandbox had no registry DNS access; reran with approved network escalation.
- Vitest OpenAI constructor mock initially did not support `new OpenAI()`; adjusted the mock constructor and reran tests successfully.

## Verification

- `pnpm --filter @mockup-ai/api test` - passed, 81 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- Acceptance greps confirmed `client.images.edit`, `model: 'gpt-image-2'`, required prompt sections, forbidden parameter tests, worker provider/model checks, and OpenAI metadata fields.

## User Setup Required

None - OpenAI keys are managed through the existing provider-scoped admin API key system.

## Next Phase Readiness

The backend can now accept queued OpenAI IP Change v2 jobs and produce two output candidates. Wave 1 can continue with the v2 project entry and form, and Wave 2 can build result/history lifecycle behavior on the provider metadata now returned by the backend.

---
*Phase: 08-openai-ip-change-parity*
*Completed: 2026-04-24*
