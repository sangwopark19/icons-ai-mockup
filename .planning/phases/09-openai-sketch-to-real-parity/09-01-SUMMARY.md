---
phase: 09-openai-sketch-to-real-parity
plan: 01
subsystem: api
tags: [openai, gpt-image-2, sketch-to-real, fastify, bullmq, sharp, prisma]

requires:
  - phase: 07-provider-foundation-and-key-separation
    provides: provider/model persistence, provider-scoped keys, queue routing, and OpenAI metadata fields
  - phase: 08-openai-ip-change-parity
    provides: OpenAI image runtime pattern, two-candidate output, and v2 provider guardrails
provides:
  - OpenAI sketch_to_real backend create contract with product and material guidance
  - GPT Image 2 sketch_to_real image edit runtime with required two candidates
  - Sharp-based uniform light-background transparent post-process with fail-closed quality gates
  - Stable output_1/output_2 candidate ordering for generation detail reopen
affects: [09-openai-sketch-to-real-parity, result-history-lifecycle, smoke-validation]

tech-stack:
  added: []
  patterns:
    - Parallel OpenAI runtime method beside Gemini and IP Change paths
    - Opaque-first GPT Image 2 generation followed by local Sharp alpha post-processing
    - Optional transparency metadata on generated image persistence

key-files:
  created:
    - apps/api/src/services/background-removal.service.ts
    - apps/api/src/services/__tests__/background-removal.service.test.ts
  modified:
    - packages/shared/src/types/index.ts
    - apps/api/src/routes/generation.routes.ts
    - apps/api/src/routes/__tests__/generation.routes.test.ts
    - apps/api/src/services/generation.service.ts
    - apps/api/src/services/__tests__/generation.service.test.ts
    - apps/api/src/lib/queue.ts
    - apps/api/src/services/openai-image.service.ts
    - apps/api/src/services/__tests__/openai-image.service.test.ts
    - apps/api/src/worker.ts

key-decisions:
  - "OpenAI sketch_to_real accepts transparentBackground at create time, but fulfillment is opaque-first plus local Sharp post-process."
  - "Image 2 texture references are constrained to material, texture, finish, and color behavior only."
  - "Generated image ordering is normalized by output_N.png file index instead of creation time."
  - "No schema push required; existing JSON option fields and GeneratedImage.hasTransparency cover the plan."

patterns-established:
  - "Prompt sections use Task, Image roles, Product category, Material guidance, Must preserve, Must add, User instructions, Hard constraints, Output in fixed order."
  - "Transparent outputs must pass alpha ratio, border transparency, center opacity, and dark-composite border luma gates before save."
  - "generationService.saveGeneratedImage remains backward-compatible and only stores hasTransparency true when explicitly passed."

requirements-completed: [PROV-02, OSR-01, OSR-02, OSR-03]

duration: 12min
completed: 2026-04-28
---

# Phase 09 Plan 01: Backend OpenAI Sketch To Real Runtime Summary

**OpenAI GPT Image 2 Sketch to Real backend runtime with locked sketch prompts, two candidates, and fail-closed Sharp transparent post-processing**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-28T01:58:15Z
- **Completed:** 2026-04-28T02:10:02Z
- **Tasks:** 4/4
- **Files modified:** 11 code/test files

## Accomplishments

- OpenAI `provider: "openai"` + `providerModel: "gpt-image-2"` now accepts `mode: "sketch_to_real"` with required sketch, optional texture reference, product category, material guidance, quality, preservation options, and exactly two candidates.
- Added `generateSketchToReal()` using `client.images.edit()` with Image 1 as locked sketch and optional Image 2 as material/finish reference, while forbidding `background` and `input_fidelity`.
- Worker now routes OpenAI Sketch jobs after persisted-vs-queued provider/model guards, stores OpenAI support metadata, and post-processes transparent requests before saving.
- Added deterministic Sharp-based uniform light-background removal with measurable alpha/quality gates and fail-closed behavior.

## Task Commits

1. **Task 1: Extend API and service contracts for OpenAI Sketch to Real** - `e0a907a` (feat)
2. **Task 2: Implement OpenAI Sketch to Real image edit runtime** - `2320683` (feat)
3. **Task 3: Route OpenAI Sketch jobs and post-process transparent requests** - `1c073cb` (feat)
4. **Task 4: Confirm schema state before verification** - `094a2b4` (chore, verification-only)

## Files Created/Modified

- `apps/api/src/services/background-removal.service.ts` - Sharp RGBA flood-fill remover and transparent-output quality gates.
- `apps/api/src/services/__tests__/background-removal.service.test.ts` - Synthetic light-background success and dark-background fail-closed coverage.
- `apps/api/src/services/openai-image.service.ts` - Sketch to Real edit runtime and prompt builder.
- `apps/api/src/worker.ts` - OpenAI Sketch dispatch, metadata persistence, and transparent post-process routing.
- `apps/api/src/services/generation.service.ts` - OpenAI Sketch contract, option persistence, stable output ordering, and optional transparency metadata.
- `apps/api/src/routes/generation.routes.ts` - Route validation for OpenAI Sketch, model, output count, and product/material options.
- `apps/api/src/lib/queue.ts` and `packages/shared/src/types/index.ts` - Product/material option typing through queue and shared contracts.
- API route/service/runtime tests updated for acceptance, negative validation, prompt constraints, texture handling, and transparency metadata.

## Decisions Made

- Used the existing JSON `promptData`/`options` fields instead of changing Prisma schema.
- Kept OpenAI IP Change transparent-background rejection unchanged; only OpenAI Sketch accepts it for local post-processing.
- Chose file index parsing (`output_1.png`, `output_2.png`) for candidate ordering because it matches upload persistence and avoids relying on DB timestamp order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected candidate-order sorting placement**
- **Found during:** Task 1
- **Issue:** Initial image-order helper was accidentally applied to `create()` return records that do not include `images`.
- **Fix:** Restored `create()` return shape and applied sorting only in `getById()`.
- **Files modified:** `apps/api/src/services/generation.service.ts`
- **Verification:** `pnpm --filter @mockup-ai/api test`, `pnpm --filter @mockup-ai/api type-check`
- **Committed in:** `e0a907a`

**2. [Rule 1 - Bug] Removed duplicate `Hard constraints:` token from user-instruction copy**
- **Found during:** Task 2
- **Issue:** The prompt-injection test found `Hard constraints:` inside the `User instructions:` guidance text before the real hard-constraint section.
- **Fix:** Reworded the guidance to reference "the hard constraints below" so the section heading appears once and after user-controlled content.
- **Files modified:** `apps/api/src/services/openai-image.service.ts`
- **Verification:** `pnpm --filter @mockup-ai/api test`, `pnpm --filter @mockup-ai/api type-check`
- **Committed in:** `2320683`

**3. [Rule 1 - Bug] Fixed Sharp blurred alpha mask channel handling**
- **Found during:** Task 3
- **Issue:** Sharp returned a 3-channel raw buffer after blurring a single-channel alpha mask, causing border transparency quality checks to fail.
- **Fix:** Extracted channel 0 after blur so the alpha mask remains one byte per pixel.
- **Files modified:** `apps/api/src/services/background-removal.service.ts`
- **Verification:** `pnpm --filter @mockup-ai/api test`, `pnpm --filter @mockup-ai/api type-check`
- **Committed in:** `1c073cb`

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All were directly caused by the current implementation and fixed within task scope. No architecture or dependency changes were introduced.

## Issues Encountered

- No schema push required. `git diff --name-only -- apps/api/prisma/schema.prisma` printed nothing.
- Existing `.planning/STATE.md` was already modified in the worktree and was left untouched per orchestrator ownership.

## Verification

- `pnpm --filter @mockup-ai/api test` - passed, 9 files / 100 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- `git diff --name-only -- apps/api/prisma/schema.prisma` - no output.

## Known Stubs

None found in files created or modified by this plan.

## Threat Flags

None - new OpenAI dispatch, local image processing, path validation, unsupported OpenAI parameters, and transparent-output fail-closed behavior are covered by the plan threat model.

## User Setup Required

None - no new dependencies or external service configuration required.

## Next Phase Readiness

The backend can now accept and execute OpenAI Sketch to Real jobs for the v2 frontend. Follow-on plans can rely on `provider/model` validation, two-output ordering, product/material option persistence, OpenAI metadata, and `hasTransparency` metadata for transparent Sketch outputs.

## Self-Check: PASSED

- Created files exist: `09-01-SUMMARY.md`, `background-removal.service.ts`, `background-removal.service.test.ts`, `openai-image.service.ts`, and `worker.ts`.
- Task commits found: `e0a907a`, `2320683`, `1c073cb`, `094a2b4`.
- Final verification passed: `pnpm --filter @mockup-ai/api test` and `pnpm --filter @mockup-ai/api type-check`.

---
*Phase: 09-openai-sketch-to-real-parity*
*Completed: 2026-04-28*
