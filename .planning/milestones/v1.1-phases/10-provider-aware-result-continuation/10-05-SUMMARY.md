---
phase: 10-provider-aware-result-continuation
plan: 05
subsystem: api
tags: [bullmq, worker, openai, style-copy, provider-continuation, vitest]

requires:
  - phase: 10-provider-aware-result-continuation
    provides: OpenAI style-copy service helpers and provider-pinned queue payloads from plans 10-02 and 10-04
provides:
  - Provider-isolated OpenAI style-copy worker dispatch
  - OpenAI response/image-call linkage-first execution with selected-image fallback
  - Recoverable linkage fallback policy for missing, expired, invalid, or transient response linkage
  - Worker-level regression coverage for OpenAI/Gemini continuation isolation
affects: [phase-10-provider-aware-result-continuation, generation-worker, openai-style-copy]

tech-stack:
  added: []
  patterns:
    - "Worker callback delegates to exported processGenerationJob for direct Vitest coverage without Redis"
    - "OpenAI style-copy reads style references through generationService.getById(userId, styleReferenceId)"
    - "OpenAI linkage fallback is allow-listed and never runs for auth, permission, API key, quota, or rate-limit failures"

key-files:
  created:
    - .planning/phases/10-provider-aware-result-continuation/10-05-SUMMARY.md
    - apps/api/src/__tests__/worker.provider-continuation.test.ts
  modified:
    - apps/api/src/worker.ts

key-decisions:
  - "OpenAI style-copy runs before Gemini thoughtSignature parsing and never calls Gemini style-copy helpers."
  - "Linkage fallback is attempted exactly once only for recoverable missing/expired/invalid response linkage or 5xx errors."
  - "Saved OpenAI providerTrace mirrors copyTarget, styleReferenceId, styleSourceImageId, and linkageFallbackUsed at worker execution time."

patterns-established:
  - "Worker tests mock BullMQ Worker construction so worker.ts can be imported without live Redis."
  - "OpenAI SDK-shaped non-Error failures preserve their message when worker status is marked failed."

requirements-completed: [OED-02, OED-03]

duration: 10min
completed: 2026-04-29
---

# Phase 10 Plan 05: Provider-Aware Style-Copy Worker Summary

**OpenAI style-copy worker execution now uses saved OpenAI linkage first, falls back safely to the selected result image, and keeps Gemini thoughtSignature state isolated.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-29T01:34:17Z
- **Completed:** 2026-04-29T01:44:04Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Exported `processGenerationJob()` so worker behavior can be tested directly without connecting to Redis.
- Added worker regression tests for OpenAI linkage, selected-image fallback, recoverable `invalid_response`, auth/no-fallback behavior, Gemini isolation, provider mismatch, and existing OpenAI dispatch.
- Implemented OpenAI style-copy dispatch for `ip_change` and `sketch_to_real` worker branches before Gemini `thoughtSignature` logic.
- Added `isRecoverableOpenAILinkageError()` policy and providerTrace mirror fields for `copyTarget`, `styleReferenceId`, `styleSourceImageId`, `linkageFallbackUsed`, and `linkageFallbackReason`.

## Task Commits

1. **Task 1 RED: Worker provider-continuation harness and failing coverage** - `b410557` (test)
2. **Task 2 GREEN: OpenAI style-copy worker dispatch** - `f45e451` (feat)

_Note: Plan tasks were TDD-marked; the RED commit intentionally failed on the old OpenAI style-reference rejection, then the GREEN commit passed the targeted worker and OpenAI service tests._

## Files Created/Modified

- `apps/api/src/worker.ts` - Exports `processGenerationJob`, implements OpenAI style-copy linkage/fallback execution, saves providerTrace mirror fields, and preserves Gemini-only style-copy behavior.
- `apps/api/src/__tests__/worker.provider-continuation.test.ts` - Adds isolated worker tests with mocked BullMQ, Redis, services, OpenAI runtime, Gemini runtime, upload, background removal, and admin key services.
- `.planning/phases/10-provider-aware-result-continuation/10-05-SUMMARY.md` - Execution summary.

## Decisions Made

- Kept OpenAI fallback policy inside the worker because fallback eligibility depends on the runtime linkage call failure, not on route or queue creation.
- Passed reference `providerTrace` into the OpenAI linkage object while still saving worker-level mirror fields on the result metadata.
- Preserved the existing Gemini `parseThoughtSignatures` branch unchanged and placed OpenAI style-copy before that branch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed BullMQ Worker constructor mock**
- **Found during:** Task 1 RED
- **Issue:** The initial test harness mocked `Worker` with an arrow function, which cannot be used with `new Worker(...)` during `worker.ts` import.
- **Fix:** Replaced the mock with a constructor-style `function WorkerMock()` returning mocked `on` and `close` methods.
- **Files modified:** `apps/api/src/__tests__/worker.provider-continuation.test.ts`
- **Verification:** RED run executed all 7 tests and failed only on the planned OpenAI style-reference rejection.
- **Committed in:** `b410557`

**2. [Rule 1 - Bug] Preserved non-Error OpenAI failure messages**
- **Found during:** Task 2 GREEN
- **Issue:** SDK-shaped errors represented as plain objects with `message` would mark worker status with `알 수 없는 오류`.
- **Fix:** Reused the OpenAI error-message helper in the worker catch path so object messages are saved on failed generations.
- **Files modified:** `apps/api/src/worker.ts`
- **Verification:** `does not fallback for OpenAI auth or permission linkage errors` passed and asserted the failure message.
- **Committed in:** `f45e451`

**3. [Rule 3 - Blocking] Aligned typed test mocks with service contracts**
- **Found during:** Task 2 type-check
- **Issue:** Mocked active key and upload/save return shapes were missing fields required by the service typings.
- **Fix:** Added `provider`, upload metadata `format`, and a typed placeholder return for `generationService.saveGeneratedImage`.
- **Files modified:** `apps/api/src/__tests__/worker.provider-continuation.test.ts`
- **Verification:** `pnpm --filter @mockup-ai/api type-check` passed.
- **Committed in:** `f45e451`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes were required to make the worker tests executable and preserve accurate failed-job diagnostics. No product scope was added beyond the plan.

## Issues Encountered

- Parallel executors committed adjacent Phase 10 work while this plan was running. This plan only modified its owned files and did not touch shared tracking files.

## Authentication Gates

None.

## Known Stubs

None. Empty arrays and empty object defaults in the touched files are local accumulators or test override defaults, not UI-facing stubs.

## Threat Flags

None - the new worker trust-boundary behavior was covered by the plan threat model: provider guard before vendor calls, user-scoped style reference lookup, OpenAI/Gemini lineage isolation, metadata preservation, and linkage fallback policy.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts` - RED before implementation: 5 failed, 2 passed, failing on the planned OpenAI style-reference rejection.
- `pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts src/services/__tests__/openai-image.service.test.ts` - passed, 24 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- `rg -n "export async function processGenerationJob|uses OpenAI linkage before selected-image fallback|falls back to selected style image|invalid_response|does not fallback for OpenAI auth or permission linkage errors|rejects queue provider mismatch|preserves existing OpenAI ip_change and sketch_to_real worker dispatch" apps/api/src/worker.ts apps/api/src/__tests__/worker.provider-continuation.test.ts` - passed.
- `rg -n "generateStyleCopyWithLinkage|generateStyleCopyFromImage|isRecoverableOpenAILinkageError|linkageFallbackUsed|linkageFallbackReason|styleSourceImageId|copyTarget|OpenAI 스타일 복사 결과 이미지가 부족합니다|OpenAI 스타일 복사는 OpenAI 기준 결과만 사용할 수 있습니다" apps/api/src/worker.ts apps/api/src/__tests__/worker.provider-continuation.test.ts` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Worker execution is ready for OpenAI style-copy jobs produced by the Phase 10 route/service/UI work. Remaining validation for live image quality and real OpenAI linkage behavior should be handled by the planned smoke/human verification flow when an active OpenAI key is available.

## Self-Check: PASSED

- Found summary, worker, and worker provider-continuation test file on disk.
- Verified task commits exist: `b410557`, `f45e451`.
- Confirmed `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` have no local modifications from this plan.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
