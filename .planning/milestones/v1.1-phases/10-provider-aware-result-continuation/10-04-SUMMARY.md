---
phase: 10-provider-aware-result-continuation
plan: 04
subsystem: api
tags: [fastify, prisma, bullmq, provider-aware, openai, style-copy, regeneration]

requires: []
provides:
  - Provider-pinned OpenAI regeneration replay from persisted generation inputs
  - OpenAI style-copy creation payloads with selected-image lineage and two-candidate output
  - Copy-style route and queue contract fields for copyTarget and selectedImageId
affects: [phase-10-provider-aware-result-continuation, openai-continuation, generation-worker]

tech-stack:
  added: []
  patterns:
    - "Continuation jobs copy provider/providerModel from persisted Generation records"
    - "OpenAI style-copy lineage is mirrored in providerTrace JSON without Prisma schema changes"

key-files:
  created:
    - .planning/phases/10-provider-aware-result-continuation/10-04-SUMMARY.md
  modified:
    - apps/api/src/services/generation.service.ts
    - apps/api/src/services/__tests__/generation.service.test.ts
    - apps/api/src/routes/generation.routes.ts
    - apps/api/src/routes/__tests__/generation.routes.test.ts
    - apps/api/src/lib/queue.ts
    - packages/shared/src/types/index.ts

key-decisions:
  - "OpenAI regeneration now replays stored provider/model/input/prompt/options through the existing generation creation path instead of rejecting early."
  - "OpenAI style-copy requires selectedImageId ownership validation and stores copyTarget/styleReferenceId/styleSourceImageId in providerTrace."
  - "Gemini style-copy remains on the existing styleReferenceId path and rejects selectedImageId as OpenAI-only continuation state."

patterns-established:
  - "Route-level copyTarget defaults are validated by Zod; service-level OpenAI style-copy enforces target-specific required assets."
  - "Queue payloads carry copyTarget and selectedImageId as optional continuation fields."

requirements-completed: [PROV-04, OED-02, OED-03]

duration: 8min
completed: 2026-04-29
---

# Phase 10 Plan 04: Provider-Aware Result Continuation Summary

**OpenAI regeneration and style-copy creation now produce provider-pinned continuation jobs from persisted generation records.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-29T01:21:56Z
- **Completed:** 2026-04-29T01:29:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced the OpenAI same-condition regeneration rejection with persisted provider/model/input/prompt/options replay.
- Added OpenAI style-copy creation for `ip-change` and `new-product` with selected-image ownership validation.
- Extended copy-style route, queue, and shared type contracts with `copyTarget` and `selectedImageId`.
- Persisted OpenAI style-copy lineage in `providerTrace` with `workflow`, `copyTarget`, `styleReferenceId`, and `styleSourceImageId`.

## Task Commits

1. **Task 1 RED: OpenAI regeneration replay tests** - `d852094` (`test`)
2. **Task 1 GREEN: Provider-pinned OpenAI regeneration** - `ab04523` (`feat`)
3. **Task 2 RED: OpenAI style-copy contract tests** - `10b8cb0` (`test`)
4. **Task 2 GREEN: OpenAI style-copy jobs** - `d146ac4` (`feat`)

_Note: Both plan tasks were marked `tdd="true"`, so each produced RED and GREEN commits._

## Files Created/Modified

- `apps/api/src/services/generation.service.ts` - Replays OpenAI regeneration, validates OpenAI style-copy selected image ownership, builds providerTrace lineage, and passes continuation fields to queue jobs.
- `apps/api/src/services/__tests__/generation.service.test.ts` - Covers OpenAI regeneration replay/failure and OpenAI style-copy targets, ownership rejection, Gemini selectedImageId rejection, and providerTrace lineage.
- `apps/api/src/routes/generation.routes.ts` - Validates copy-style `copyTarget`, `selectedImageId`, and `userInstructions`.
- `apps/api/src/routes/__tests__/generation.routes.test.ts` - Verifies copy-style route passthrough for continuation fields.
- `apps/api/src/lib/queue.ts` - Adds optional `copyTarget` and `selectedImageId` to `GenerationJobData`.
- `packages/shared/src/types/index.ts` - Adds `GenerationCopyTargetEnum` and shared create-generation fields.
- `.planning/phases/10-provider-aware-result-continuation/10-04-SUMMARY.md` - Execution summary.

## Decisions Made

- OpenAI regeneration continues to use `generationService.create()` so DB and queue payloads stay aligned with existing provider guardrails.
- OpenAI style-copy validates `selectedImageId` against `original.images` before creating a new generation or enqueueing a job.
- `providerTrace` uses the exact mirror keys required by the plan and does not introduce schema changes.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts` — passed, 36 tests.
- `pnpm --filter @mockup-ai/api type-check` — passed.
- `rg` check for old OpenAI regeneration/style-copy rejection strings — passed, no matches.
- `rg` check for direct `openai-image.service` dependency in plan-owned runtime files — passed, no matches.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None - new route/queue fields and service trust-boundary checks were already covered by the plan threat model.

## Issues Encountered

None.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 10-05 can rely on provider-pinned regeneration payloads and OpenAI style-copy creation records carrying `copyTarget`, `selectedImageId`, and `providerTrace` lineage. Worker/runtime execution remains intentionally outside this plan.

## Self-Check: PASSED

- Summary and all key modified files exist.
- Task commits found: `d852094`, `ab04523`, `10b8cb0`, `d146ac4`.
- No tracked file deletions were introduced by plan commits.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
