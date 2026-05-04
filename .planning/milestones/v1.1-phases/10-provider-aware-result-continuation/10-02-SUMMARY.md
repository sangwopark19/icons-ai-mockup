---
phase: 10-provider-aware-result-continuation
plan: 02
subsystem: api
tags: [openai, gpt-image-2, image-api, responses-api, provider-continuation, vitest]

requires:
  - phase: 07-provider-foundation-and-key-separation
    provides: Provider/model persistence and OpenAI metadata fields
  - phase: 08-openai-ip-change-parity
    provides: OpenAI Image API service pattern for two-candidate generation
  - phase: 09-openai-sketch-to-real-parity
    provides: GPT Image 2 runtime constraints and opaque-first image handling
provides:
  - OpenAI one-output partial edit helper using images.edit
  - OpenAI style-copy helper using Responses linkage first
  - OpenAI selected-image style-copy fallback using images.edit
  - Prompt normalization tests for user-controlled continuation text
affects: [phase-10-provider-aware-result-continuation, openai-image-service, worker-style-copy, edit-routes]

tech-stack:
  added: []
  patterns:
    - "OpenAI continuation service methods return OpenAIImageGenerationResult with providerTrace metadata"
    - "User-controlled prompt text is normalized before insertion into protected prompt sections"
    - "Responses API linkage uses previous_response_id first, then image_generation_call id only when needed"

key-files:
  created:
    - .planning/phases/10-provider-aware-result-continuation/10-02-SUMMARY.md
  modified:
    - apps/api/src/services/openai-image.service.ts
    - apps/api/src/services/__tests__/openai-image.service.test.ts

key-decisions:
  - "OpenAI partial edit uses images.edit with n: 1 and an exact one-image result guard."
  - "OpenAI style copy is split into linkage-first Responses API and selected-image Image API fallback helpers."
  - "OpenAI style-copy helpers accept OpenAI response/image-call linkage only, with no Gemini lineage parameter."

patterns-established:
  - "Continuation prompts place normalized user text only under Must change."
  - "Hard constraints begin with an override sentence for user-instruction conflicts."
  - "OpenAI Responses metadata records responsesModel while providerTrace.model remains gpt-image-2."

requirements-completed: [OED-01, OED-02, OED-03]

duration: 8min
completed: 2026-04-29
---

# Phase 10 Plan 02: OpenAI Continuation Runtime Helpers Summary

**OpenAI partial edit and style-copy service helpers with strict prompt normalization, OpenAI-only linkage, and metadata-safe result contracts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-29T01:21:20Z
- **Completed:** 2026-04-29T01:29:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added `generatePartialEdit()` with `images.edit`, `n: 1`, exact one-output enforcement, and `partial_edit` provider trace metadata.
- Added `generateStyleCopyWithLinkage()` for `previous_response_id` and image-call-only Responses API linkage paths.
- Added `generateStyleCopyFromImage()` as the selected-image fallback using two input images and `n: 2`.
- Added tests for forbidden OpenAI parameters, prompt section injection prevention, two-candidate style-copy results, metadata capture, and no Gemini lineage in the OpenAI service.

## Task Commits

1. **Task 1 RED: Partial edit service tests** - `79a5833` (test)
2. **Task 1 GREEN: Partial edit helper** - `ba0ef8f` (feat)
3. **Task 2 RED: Style-copy service tests** - `2371d06` (test)
4. **Task 2 GREEN: Style-copy helpers** - `9ff0d79` (feat)

## Files Created/Modified

- `apps/api/src/services/openai-image.service.ts` - Added partial edit, linkage-first style copy, selected-image fallback style copy, and prompt normalization helpers.
- `apps/api/src/services/__tests__/openai-image.service.test.ts` - Added tests for partial edit, Responses linkage, image-call-only linkage, selected-image fallback, prompt normalization, forbidden parameter omission, and OpenAI/Gemini lineage separation.
- `.planning/phases/10-provider-aware-result-continuation/10-02-SUMMARY.md` - Execution summary.

## Decisions Made

- Used `client.images.edit()` for one-shot partial edit and selected-image style-copy fallback because these flows are single-request image edits.
- Used `client.responses.create()` for linkage-aware style copy because OpenAI response/image-call linkage is the OpenAI-native continuation primitive.
- Kept raw user edit/copy text out of `Must preserve`, `Hard constraints`, and `Output` sections by normalizing fake headers before interpolation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reset OpenAI edit mock implementation between tests**
- **Found during:** Task 1 RED
- **Issue:** A new failing test using `mockResolvedValueOnce()` could leave a one-time mock response queued after the expected method-missing failure, causing later unrelated sketch tests to consume the wrong one-image response.
- **Fix:** Reset `mocks.edit` in `beforeEach()` before installing the default two-image response.
- **Files modified:** `apps/api/src/services/__tests__/openai-image.service.test.ts`
- **Verification:** RED run then failed only on the missing partial edit method; final targeted Vitest run passed 17 tests.
- **Committed in:** `79a5833`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test isolation was corrected to keep TDD RED failures scoped to the intended missing implementation. No product scope changed.

## Issues Encountered

- None beyond the documented test isolation fix.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None - new OpenAI request/metadata surfaces were already covered by the plan threat model for API-to-OpenAI calls, OpenAI metadata handling, and style-copy lineage isolation.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts` - passed, 17 tests.
- `rg -n "generatePartialEdit|workflow: 'partial_edit'|Must preserve exactly|Product body, camera angle, crop, background rule, lighting, text, labels, hardware, and non-target details|These hard constraints override any conflicting user instructions|normalizes partial edit user prompt section headers before interpolation|normalizeUserControlledPromptText|n: 1" apps/api/src/services/openai-image.service.ts apps/api/src/services/__tests__/openai-image.service.test.ts` - passed.
- `rg -n "generateStyleCopyWithLinkage|generateStyleCopyFromImage|OPENAI_RESPONSES_IMAGE_MODEL|responses\\.create|image_generation_call|previous_response_id|copyTarget|Replace only the character/IP artwork|Replace only the product|These hard constraints override any conflicting user instructions|normalizes style copy user instructions section headers before interpolation" apps/api/src/services/openai-image.service.ts apps/api/src/services/__tests__/openai-image.service.test.ts` - passed.
- `! rg -n "thoughtSignature" apps/api/src/services/openai-image.service.ts` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

OpenAI continuation runtime helpers are ready for route, generation service, and worker integration. Later plans can call the service boundary without using Gemini `thoughtSignature` or provider fallback behavior.

## Self-Check: PASSED

- Found summary, service file, and test file on disk.
- Verified task commits exist: `79a5833`, `ba0ef8f`, `2371d06`, `9ff0d79`.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
