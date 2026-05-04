---
phase: 10-provider-aware-result-continuation
plan: 03
subsystem: api
tags: [openai, gpt-image-2, partial-edit, fastify, provider-routing, vitest]

requires:
  - phase: 10-provider-aware-result-continuation
    provides: OpenAI one-output partial edit helper from plan 10-02
  - phase: 07-provider-foundation-and-key-separation
    provides: Provider/model persistence and provider-scoped active API keys
provides:
  - Provider-aware partial edit route for persisted Gemini and OpenAI generations
  - Route-level tests for OpenAI partial edit routing, selected image ownership, key-missing handling, and metadata storage
affects: [phase-10-provider-aware-result-continuation, edit-routes, openai-image-service, result-continuation]

tech-stack:
  added: []
  patterns:
    - "Edit route branches from persisted Generation.provider, never request-body provider fields"
    - "OpenAI partial edit stores safe metadata through generationService.updateOpenAIMetadata"
    - "selectedImageId is resolved only inside generation.images returned for the authenticated user"

key-files:
  created:
    - apps/api/src/routes/__tests__/edit.routes.test.ts
    - .planning/phases/10-provider-aware-result-continuation/10-03-SUMMARY.md
  modified:
    - apps/api/src/routes/edit.routes.ts

key-decisions:
  - "OpenAI partial edit is routed by persisted generation.provider and never falls back to Gemini."
  - "OpenAI edit output is persisted as exactly one selected generated image with options.outputCount = 1."
  - "OpenAI key configuration failures return OPENAI_KEY_MISSING without exposing vendor/debug metadata."

patterns-established:
  - "Route tests mock provider services and Prisma at the Fastify app.inject boundary."
  - "OpenAI metadata remains backend-only in updateOpenAIMetadata and is not returned in the edit response."

requirements-completed: [OED-01]

duration: 9min
completed: 2026-04-29
---

# Phase 10 Plan 03: Provider-Aware Partial Edit Route Summary

**Persisted-provider partial edit routing with OpenAI one-output edits, selected image ownership checks, and safe OpenAI metadata storage**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-29T01:33:46Z
- **Completed:** 2026-04-29T01:42:14Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added Fastify route tests covering Gemini preservation, OpenAI edit routing, OpenAI metadata storage, `OPENAI_KEY_MISSING`, forged provider payloads, and selected image ownership.
- Extended `edit.routes.ts` to accept `selectedImageId`, resolve it only from the authenticated generation's images, and branch by persisted `generation.provider`.
- Added OpenAI partial edit handling that reads the selected result image, calls `openaiImageService.generatePartialEdit`, saves exactly one selected output image, stores OpenAI metadata, and returns the existing 201 response shape.

## Task Commits

1. **Task 1 RED: Provider-aware edit route tests** - `c16d2e6` (test)
2. **Task 2 GREEN: OpenAI partial edit route branch** - `e76141e` (feat)

## Files Created/Modified

- `apps/api/src/routes/__tests__/edit.routes.test.ts` - New route tests for Gemini preservation and OpenAI provider-aware partial edit behavior.
- `apps/api/src/routes/edit.routes.ts` - Added `selectedImageId` validation, OpenAI branch, OpenAI key-missing mapping, one-output persistence, metadata storage, and no-Gemini-fallback behavior.
- `.planning/phases/10-provider-aware-result-continuation/10-03-SUMMARY.md` - Execution summary.

## Decisions Made

- Used the persisted generation provider as the only routing source so forged request payload fields cannot switch OpenAI edits into Gemini.
- Kept Gemini's existing edit flow intact while adding a separate OpenAI branch that calls the OpenAI image service.
- Stored OpenAI request/debug metadata through `generationService.updateOpenAIMetadata` and kept the route response limited to `{ generationId, message }`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Guarded Fastify inject timeout compatibility**
- **Found during:** Task 2 GREEN
- **Issue:** `reply.raw.setTimeout(120_000)` is required for the OpenAI route, but Fastify inject's test response can throw when called without a callback.
- **Fix:** Kept the direct `reply.raw.setTimeout(120_000)` call for real responses and added a callback fallback for inject-compatible raw responses.
- **Files modified:** `apps/api/src/routes/edit.routes.ts`
- **Verification:** Route tests passed after the fallback.
- **Committed in:** `e76141e`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The route still extends timeout before the OpenAI Image API helper call; the fallback only prevents test/runtime response-shim incompatibility.

## Issues Encountered

- During execution, `pnpm --filter @mockup-ai/api type-check` was temporarily blocked by out-of-scope worker continuation test errors while a parallel executor's worker changes were still uncommitted. Those files were outside this plan's ownership and were not modified here.
- After the parallel worker changes landed, the final API type-check passed.

## Authentication Gates

None.

## Known Stubs

None - stub scan found only test fixture default parameters, not runtime/UI placeholders.

## Threat Flags

None - the new selected-image resolution, provider routing, OpenAI file transfer, timeout, and metadata handling are covered by T-10-03-01 through T-10-03-06 in the plan threat model.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/routes/__tests__/edit.routes.test.ts` - RED before implementation: failed 5 OpenAI/ownership tests as expected; GREEN after implementation: passed 7 tests.
- `pnpm --filter @mockup-ai/api test -- src/routes/__tests__/edit.routes.test.ts src/services/__tests__/openai-image.service.test.ts` - passed 24 tests.
- `rg -n "selectedImageId|generatePartialEdit|outputCount: 1|updateOpenAIMetadata|provider: 'openai'|setTimeout\\(120_000\\)|OPENAI_KEY_MISSING|OpenAI v2 API 키가 설정되어 있지 않습니다" apps/api/src/routes/edit.routes.ts apps/api/src/routes/__tests__/edit.routes.test.ts` - passed.
- `git diff --check` - passed.
- `pnpm --filter @mockup-ai/api type-check` - passed on final re-run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

OpenAI partial edit can now be invoked from the existing result page route contract. Later continuation plans can rely on route-level provider isolation, one-output OpenAI persistence, and safe OpenAI metadata capture.

## Self-Check: PASSED

- Found summary, route test file, and route implementation file on disk.
- Verified task commits exist: `c16d2e6`, `e76141e`.
- Confirmed no tracked file deletions were introduced by either task commit.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
