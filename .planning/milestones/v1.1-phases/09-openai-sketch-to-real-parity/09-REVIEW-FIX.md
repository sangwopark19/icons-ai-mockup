---
phase: 09-openai-sketch-to-real-parity
fixed_at: 2026-04-28T05:39:51Z
review_path: .planning/phases/09-openai-sketch-to-real-parity/09-REVIEW.md
fix_scope: critical_warning
findings_in_scope: 6
fixed: 6
skipped: 0
iteration: 1
status: all_fixed
commits:
  - 8c6deab fix(09): make generation output retries idempotent
  - b8ba0e3 fix(09): persist openai metadata before output handling
  - 90534c0 fix(09): avoid duplicate sketch instructions
  - 78a59dd fix(09): align generation lock defaults
  - 0432f09 fix(09): return structured route validation errors
  - 5a4fb94 fix(09): handle image selection failures
---

# Phase 09 Code Review Fix Report

## Summary

The configured `gsd-code-fixer` agent failed before making changes because its isolated worktree setup attempted to check out the already-active branch. The fixes were applied inline as the sequential fallback for the same `critical_warning` scope.

All six Critical/Warning findings from `09-REVIEW.md` were fixed. No findings were skipped.

## Fixes Applied

### CR-01: Worker Retries Can Persist Partial Or Duplicate v2 Results

Status: fixed

- Added `GenerationService.deleteGeneratedOutputImages()` to delete existing output rows, related image history rows, and stale files before a retry save pass.
- Updated the worker to process all generated buffers first, including transparent-background post-processing, before deleting or saving any output rows.
- Saved the processed output set after cleanup so BullMQ retries do not accumulate duplicate candidates.
- Added service tests covering retry cleanup and no-op behavior when no output rows exist.

Commit: `8c6deab fix(09): make generation output retries idempotent`

### WR-02: OpenAI Debug Metadata Is Lost On Post-Generation Failures

Status: fixed

- Persisted OpenAI metadata immediately after a successful OpenAI image call.
- Added catch-block fallback persistence if a failure happens after metadata exists but before the first metadata write completes.
- Removed the late-only metadata write that previously ran after output persistence.

Commit: `b8ba0e3 fix(09): persist openai metadata before output handling`

### WR-01: OpenAI Sketch User Instructions Are Sent Twice

Status: fixed

- Removed the duplicate top-level `prompt` field from the OpenAI Sketch v2 form submission.
- Kept user text in `options.userInstructions`, which is the intended prompt-builder input.

Commit: `90534c0 fix(09): avoid duplicate sketch instructions`

### WR-03: Shared Defaults And Service Defaults Disagree

Status: fixed

- Aligned omitted `fixedBackground` and `fixedViewpoint` defaults with `GenerationOptionsSchema` by defaulting both to `true` in generation persistence, queue payloads, regeneration normalization, and copy-style construction.
- Preserved explicit `false` values from callers.
- Added a regression test for omitted lock defaults.

Commit: `78a59dd fix(09): align generation lock defaults`

### WR-04: Several Route Parsers Can Turn Bad Input Into 500s

Status: fixed

- Replaced `parse()` with `safeParse()` in select-image, copy-style, and history routes.
- Added a shared invalid-request response helper returning structured `400 INVALID_REQUEST` payloads.
- Added route tests for invalid select payloads, copy-style payloads, and history query params.

Commit: `0432f09 fix(09): return structured route validation errors`

### WR-05: Image Selection UI Ignores API Failure

Status: fixed

- Updated the result page selection handler to check `response.ok` and API `success`.
- Rolls back to the previous selected image on failure.
- Updates local `isSelected` state after successful persistence and shows an error message on failure.

Commit: `5a4fb94 fix(09): handle image selection failures`

## Verification

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts src/services/__tests__/background-removal.service.test.ts src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts
```

Result: 4 test files passed, 35 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api type-check
```

Result: `tsc --noEmit` exited 0.

Passed:

```bash
pnpm --filter @mockup-ai/web type-check
```

Result: `tsc --noEmit` exited 0.

## Follow-Up

This was a single fix pass. Because `--auto` was not requested, no automatic re-review iteration was run.
