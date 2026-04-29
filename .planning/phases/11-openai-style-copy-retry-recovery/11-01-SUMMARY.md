---
phase: 11-openai-style-copy-retry-recovery
plan: 01
subsystem: api
tags: [openai, admin-retry, bullmq, vitest, provider-routing]

requires:
  - phase: 07-provider-foundation-and-key-separation
    provides: provider/model source-of-truth fields and worker provider guardrails
  - phase: 10-provider-aware-result-continuation
    provides: OpenAI style-copy continuation metadata and worker linkage dispatch
provides:
  - Admin retry reconstruction for OpenAI style-copy copyTarget and selectedImageId
  - Regression coverage for retry payload metadata and worker dispatch acceptance
  - Guarded persisted promptData copyTarget handling for retry recovery
affects: [admin-retry, openai-style-copy, worker-provider-continuation]

tech-stack:
  added: []
  patterns:
    - Persisted promptData metadata is literal/string-guarded before retry queueing
    - Worker dispatch regressions use mocked provider services without Redis or live OpenAI

key-files:
  created:
    - .planning/phases/11-openai-style-copy-retry-recovery/11-01-SUMMARY.md
  modified:
    - apps/api/src/services/admin.service.ts
    - apps/api/src/services/__tests__/admin.service.test.ts
    - apps/api/src/__tests__/worker.provider-continuation.test.ts

key-decisions:
  - "Admin retry uses persisted Generation.promptData as the only source for copyTarget and selectedImageId."
  - "copyTarget is accepted only as ip-change or new-product before queueing; invalid stored values are omitted."
  - "No schema, route, UI, queue type, OpenAI service, or Gemini runtime changes were needed."

patterns-established:
  - "Retry continuation metadata: reconstruct optional queue fields from persisted promptData with narrow value guards."
  - "Provider isolation regression: assert OpenAI style-copy linkage dispatch and no Gemini style-copy call for complete retry payloads."

requirements-completed: [OPS-03, OED-02, OED-03]

duration: 4min
completed: 2026-04-29T08:13:33Z
---

# Phase 11 Plan 01: OpenAI Style-Copy Retry Recovery Summary

**Admin retry now requeues failed OpenAI style-copy jobs with persisted continuation metadata while preserving provider isolation.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-29T08:09:37Z
- **Completed:** 2026-04-29T08:13:33Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added a RED regression proving admin retry omitted OpenAI style-copy `copyTarget` and `selectedImageId`.
- Updated `AdminService.retryGeneration()` to rebuild retry queue payloads from persisted `promptData` with a literal `copyTarget` guard.
- Added worker regression proving a complete admin-retried OpenAI style-copy payload passes stored/queued metadata checks and reaches OpenAI linkage dispatch without Gemini fallback.

## Task Commits

1. **Task 1: Add admin retry regression for persisted OpenAI style-copy metadata** - `d069f2e` (test)
2. **Task 2: Reconstruct retry copyTarget and selectedImageId from persisted promptData** - `72bd54a` (feat)
3. **Task 3: Prove complete retried payload reaches OpenAI style-copy dispatch** - `f7aa1e5` (test)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/api/src/services/__tests__/admin.service.test.ts` - Adds the OpenAI style-copy admin retry regression and verifies provider/model/styleReferenceId/copyTarget/selectedImageId in the queued payload.
- `apps/api/src/services/admin.service.ts` - Adds `copyTargetValue()` and conditionally includes persisted `copyTarget` and `selectedImageId` in retry jobs.
- `apps/api/src/__tests__/worker.provider-continuation.test.ts` - Adds exact worker regression for complete admin-retried OpenAI style-copy payload dispatch.
- `.planning/phases/11-openai-style-copy-retry-recovery/11-01-SUMMARY.md` - Records execution results and verification.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "requeues failed OpenAI style-copy retry with persisted continuation metadata"` - FAILED before implementation as expected; assertion showed missing `copyTarget` and `selectedImageId`.
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "retryGeneration"` - PASSED, 6 tests.
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` - PASSED, 66 tests.
- `pnpm --filter @mockup-ai/api type-check` - PASSED.
- Static gates for `copyTargetValue`, persisted metadata reads, conditional payload spreads, and both regression test names - PASSED.

## Decisions Made

- Used persisted `Generation.promptData` as the source for retry continuation metadata, matching the worker guard and normal create flow.
- Kept optional retry fields out of non-style-copy payloads via conditional spreads.
- Left worker mismatch checks unchanged; the new worker test proves the corrected payload passes the existing guard.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Stub-pattern scan only found existing accumulator/test-helper empty object defaults and null checks; no hardcoded UI/rendering stubs were introduced.

## Threat Flags

None. No new network endpoints, auth paths, schema changes, file access patterns, or provider runtime surfaces were introduced.

## Issues Encountered

None. `.planning/STATE.md` was already modified in the worktree before execution and was intentionally not staged or committed per orchestrator instructions.

## User Setup Required

None - no external service configuration required.

## TDD Gate Compliance

- RED gate: `d069f2e` added the failing admin retry regression before implementation.
- GREEN gate: `72bd54a` implemented the retry payload fix and passed targeted retry tests.
- Additional regression: `f7aa1e5` added worker dispatch coverage and passed phase validation.

## Next Phase Readiness

The Phase 11 retry recovery gap is closed in source and automated tests. Remaining OpenAI live/browser UAT from Phase 10 remains separate and unchanged.

## Self-Check: PASSED

- Found summary file and all modified source/test files.
- Found task commits `d069f2e`, `72bd54a`, and `f7aa1e5` in git history.
- Confirmed `.planning/STATE.md` remains unstaged and uncommitted per orchestrator instructions.

---
*Phase: 11-openai-style-copy-retry-recovery*
*Completed: 2026-04-29*
