---
phase: 10-provider-aware-result-continuation
source: 10-REVIEW.md
status: fixed
fixed_at: 2026-04-29T03:01:32Z
findings_in_scope: 10
fixed: 10
skipped: 0
iterations: 4
commits:
  - b8e93f7 fix(10): preserve OpenAI style-copy regeneration lineage
  - 9ab4163 fix(10): resolve selected OpenAI style-copy linkage
  - 8718c4c fix(10): label OpenAI Responses target MIME correctly
  - 48391dc fix(10): guard unsupported continuation UI states
  - f80d1b8 fix(10): bind OpenAI style copy to selected candidate
  - 5323a96 fix(10): pin Responses image tool to GPT Image 2
  - 7201bd7 fix(10): close OpenAI style-copy review warnings
---

# Phase 10 Code Review Fix Report

## Summary

All code review findings raised during the Phase 10 review loop were fixed. The final re-review updated `10-REVIEW.md` to `status: clean` with zero critical, warning, or info findings.

## Fixes Applied

### OpenAI Style-Copy Regeneration Lineage

Status: fixed

- Preserved `styleReferenceId`, `copyTarget`, and `selectedImageId` when regenerating OpenAI style-copy results.
- Allowed selected image replay only for validated OpenAI style-copy regeneration.
- Added regression coverage for both `ip-change` and `new-product` style-copy regeneration paths.

Commit: `b8e93f7 fix(10): preserve OpenAI style-copy regeneration lineage`

### Selected Candidate Linkage

Status: fixed

- Resolved selected candidate `image_generation_call` IDs from provider trace and persisted output index instead of sending comma-joined call IDs.
- Bound Responses style copy to the selected candidate call ID when both response and image-call linkage are present.
- Added worker and OpenAI service tests for selected-candidate linkage.

Commits:

- `9ab4163 fix(10): resolve selected OpenAI style-copy linkage`
- `f80d1b8 fix(10): bind OpenAI style copy to selected candidate`

### Responses Image Payload Correctness

Status: fixed

- Detected target image MIME type before constructing Responses `input_image` data URLs.
- Pinned the Responses hosted `image_generation` tool to `gpt-image-2` through the configured model.
- Added JPEG/WEBP MIME tests and model pinning assertions.

Commits:

- `8718c4c fix(10): label OpenAI Responses target MIME correctly`
- `5323a96 fix(10): pin Responses image tool to GPT Image 2`

### Unsupported Continuation UI States

Status: fixed

- Disabled same-condition regeneration for one-output OpenAI partial-edit results.
- Converted malformed OpenAI style-copy start URLs with missing `imageId` into an actionable error instead of a permanent loading state.

Commit: `48391dc fix(10): guard unsupported continuation UI states`

### Linkage Fallback Accounting

Status: fixed

- Counted the failed Responses linkage attempt when the worker falls back to selected-image style copy.
- Persisted fallback trace metadata including `linkageFallbackUsed` and fallback reason.

Commit: `9ab4163 fix(10): resolve selected OpenAI style-copy linkage`

### Stale Style Source And Character Lineage

Status: fixed

- Failed stale queued `selectedImageId` values instead of silently falling back to a different style candidate.
- Cleared the previous `ipCharacterId` when an `ip-change` style-copy continuation uploads a replacement character image.
- Preserved the previous character ID for `new-product` continuation where the original character remains the intended subject.

Commit: `7201bd7 fix(10): close OpenAI style-copy review warnings`

## Verification

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts src/services/__tests__/generation.service.test.ts
```

Result: 2 test files passed, 38 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check
```

Result: API Vitest passed 12 test files / 152 tests, API `tsc --noEmit` passed, and web `tsc --noEmit` passed.

Final re-review passed:

```bash
pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts src/__tests__/worker.provider-continuation.test.ts src/routes/__tests__/generation.routes.test.ts src/routes/__tests__/edit.routes.test.ts src/services/__tests__/generation.service.test.ts
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

Result: targeted API Vitest passed 5 test files / 74 tests, API type-check passed, and web type-check passed.

## Remaining Manual Gate

Automated review and regression coverage are clean. Live OpenAI partial edit and style-copy smoke remain `blocked_manual_needed` in `10-SMOKE.md` because the current session does not have a running local app/DB stack, exported shell `OPENAI_API_KEY`, completed selected OpenAI result, or approved target images for live OpenAI transmission.
