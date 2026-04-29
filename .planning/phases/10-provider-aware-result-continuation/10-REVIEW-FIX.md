---
phase: 10-provider-aware-result-continuation
source: 10-REVIEW.md
status: all_fixed
fixed_at: 2026-04-29T05:45:21Z
fix_scope: critical_warning
findings_in_scope: 5
fixed: 5
skipped: 0
iteration: 1
commits:
  - 22da187 fix(10): make OpenAI Responses style copy deterministic
  - 54420da fix(10): harden partial edit persistence
  - 6b3a55c fix(10): fail generations when enqueue fails
---

# Phase 10 Code Review Fix Report

## Summary

Applied a single inline fallback fix pass for the five Critical/Warning findings in `10-REVIEW.md`.
The native `gsd-code-fixer` agent was started first, but its mandatory isolated-worktree setup failed because the current phase branch is already checked out in the main workspace. No agent code changes were applied before fallback.

## Fixes Applied

### CR-01: OpenAI image-call continuation sends an invalid Responses input item

Status: fixed

- Replaced the invalid `{ type: 'image_generation_call', id }` input item with the SDK-supported `{ type: 'item_reference', id }` shape.
- Removed the `request as never` escape hatch and typed the Responses request with `ResponseCreateParamsNonStreaming`.
- Added `ResponseInputImage`/`ResponseInputText` typed request content, including explicit `detail: 'auto'`.

Commit: `22da187 fix(10): make OpenAI Responses style copy deterministic`

### CR-02: Responses style-copy requires two outputs but makes only one tool request

Status: fixed

- Changed linked OpenAI style-copy to issue two explicit one-candidate `responses.create()` calls.
- Added per-candidate prompt text and forced the hosted `image_generation` tool via `tool_choice`.
- Combined the two Responses outputs into one result with `externalRequestCount: 2`, per-candidate response IDs, and stable candidate metadata.
- Updated OpenAI image service tests to assert two requests, one candidate per request, and `item_reference` linkage.

Commit: `22da187 fix(10): make OpenAI Responses style copy deterministic`

### CR-03: Partial edit persists `completed` generations before outputs are safely saved

Status: fixed

- Changed Gemini and OpenAI partial-edit child generations to start as `processing`.
- Marked child generations `completed` only after image persistence, metadata persistence, and history writes finish.
- Added failure compensation so any child generation created before a persistence failure is marked `failed` with the original error message.
- Added route coverage for successful status transitions and failed OpenAI output persistence.

Commit: `54420da fix(10): harden partial edit persistence`

### WR-01: Invalid edit payloads throw outside the route error handling

Status: fixed

- Replaced `EditRequestSchema.parse()` with `safeParse()`.
- Malformed edit bodies now return the route's structured `400 INVALID_REQUEST` response before generation lookup or vendor calls.
- Added route coverage for invalid edit payloads.

Commit: `54420da fix(10): harden partial edit persistence`

### WR-02: Generation records can be left permanently pending when queue enqueue fails

Status: fixed

- Wrapped `addGenerationJob()` in compensation logic after generation row creation.
- If enqueue fails, the just-created generation is marked `failed` with the enqueue error and the original error is rethrown.
- Added generation service coverage for Redis/BullMQ enqueue failure.

Commit: `6b3a55c fix(10): fail generations when enqueue fails`

## Verification

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts
```

Result: 1 test file passed, 20 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/routes/__tests__/edit.routes.test.ts
```

Result: 1 test file passed, 9 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts
```

Result: 1 test file passed, 30 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts src/routes/__tests__/edit.routes.test.ts src/routes/__tests__/generation.routes.test.ts src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts
```

Result: 5 test files passed, 77 tests passed.

Passed:

```bash
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

Result: API `tsc --noEmit` passed and web `tsc --noEmit` passed.

## Remaining Manual Gate

No code-review fix findings remain in this pass. Live OpenAI partial edit and style-copy smoke remains a separate manual gate already tracked in `10-SMOKE.md`.
