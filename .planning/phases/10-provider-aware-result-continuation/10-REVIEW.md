---
phase: 10-provider-aware-result-continuation
reviewed: 2026-04-29T05:15:05Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - apps/api/src/__tests__/worker.provider-continuation.test.ts
  - apps/api/src/lib/queue.ts
  - apps/api/src/routes/__tests__/edit.routes.test.ts
  - apps/api/src/routes/__tests__/generation.routes.test.ts
  - apps/api/src/routes/edit.routes.ts
  - apps/api/src/routes/generation.routes.ts
  - apps/api/src/services/__tests__/generation.service.test.ts
  - apps/api/src/services/__tests__/openai-image.service.test.ts
  - apps/api/src/services/generation.service.ts
  - apps/api/src/services/openai-image.service.ts
  - apps/api/src/worker.ts
  - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
  - apps/web/src/app/projects/[id]/history/page.tsx
  - apps/web/src/app/projects/[id]/style-copy/openai/page.tsx
  - packages/shared/src/types/index.ts
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-29T05:15:05Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Standard review found five actionable defects in the provider-aware continuation implementation. The highest-risk issues are in OpenAI Responses continuation and partial-edit persistence: selected image-call continuation sends a malformed input item, the linkage path does not deterministically create two candidates, and partial-edit failures can leave completed generations without valid output images.

## Critical Issues

### CR-01: OpenAI image-call continuation sends an invalid Responses input item

**Classification:** BLOCKER
**File:** `apps/api/src/services/openai-image.service.ts:429`
**Issue:** `generateStyleCopyWithLinkage()` passes `{ type: 'image_generation_call', id }` as a new Responses input item. In the OpenAI Node SDK types, a full `image_generation_call` item requires fields like `result` and `status`; a minimal reference to a prior item is `item_reference`. The current code hides the type error with `request as never`, so the selected-candidate linkage path can be rejected by the API before the image fallback runs.
**Fix:**
```ts
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses';

const imageCallReference = linkage.openaiImageCallId
  ? ({ type: 'item_reference', id: linkage.openaiImageCallId } as const)
  : null;

const request = imageCallReference
  ? ({
      ...baseRequest,
      input: [userInput, imageCallReference],
    } satisfies ResponseCreateParamsNonStreaming)
  : ({
      ...baseRequest,
      previous_response_id: linkage.openaiResponseId,
      input: [userInput],
    } satisfies ResponseCreateParamsNonStreaming);
```

### CR-02: Responses style-copy requires two outputs but makes only one tool request

**Classification:** BLOCKER
**File:** `apps/api/src/services/openai-image.service.ts:441`
**Issue:** The linked style-copy path makes a single `client.responses.create()` call, then `extractResponsesImageResult()` requires exactly two `image_generation_call` outputs at line 722. The `image_generation` tool configuration has no `n`/candidate-count field, so the implementation relies on the model deciding to call the tool twice. A normal one-image tool result is treated as a hard failure, breaking the two-candidate product contract.
**Fix:** Generate candidates deterministically: run two explicit Responses calls with the same selected style reference and target image, or add a typed helper that loops until two successful image-generation calls are collected and records `externalRequestCount` accurately.

### CR-03: Partial edit persists `completed` generations before outputs are safely saved

**Classification:** BLOCKER
**File:** `apps/api/src/routes/edit.routes.ts:194`
**Issue:** The OpenAI edit branch creates the new generation with `status: 'completed'` before saving the generated image and OpenAI metadata. If `uploadService.saveGeneratedImage()`, `generationService.saveGeneratedImage()`, or `updateOpenAIMetadata()` fails, the catch block returns `EDIT_FAILED` but leaves a completed generation with missing or partial output data. The Gemini branch has the same pattern starting at line 104.
**Fix:** Create the child generation as `processing`, save image records and metadata, then mark it `completed`. On any failure after creation, mark that child generation `failed` and clean up saved files/records where possible.

## Warnings

### WR-01: Invalid edit payloads throw outside the route error handling

**Classification:** WARNING
**File:** `apps/api/src/routes/edit.routes.ts:52`
**Issue:** `EditRequestSchema.parse(request.body)` runs before the route's `try` block. A malformed body, such as a missing prompt or non-string prompt, throws a `ZodError` through Fastify's generic error path instead of returning the structured 400 response used by the other generation routes.
**Fix:** Use `safeParse()` and return `INVALID_REQUEST` before looking up the generation.

### WR-02: Generation records can be left permanently pending when queue enqueue fails

**Classification:** WARNING
**File:** `apps/api/src/services/generation.service.ts:266`
**Issue:** `create()` writes the `Generation` row first, then calls `addGenerationJob()` at line 312. If Redis/BullMQ enqueue fails, the API reports failure but the database row remains `pending` with no queued worker job, so the user sees a stuck generation that cannot complete.
**Fix:** Add compensation around enqueue failures: mark the just-created generation `failed` with the enqueue error, or delete it before rethrowing. A more robust fix is an outbox-style enqueue flow with a recoverable dispatcher.

## Verification

- `pnpm --filter @mockup-ai/api type-check` passed.
- `pnpm --filter @mockup-ai/web type-check` passed.
- `pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts src/routes/__tests__/edit.routes.test.ts src/routes/__tests__/generation.routes.test.ts src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts` passed: 5 files, 74 tests.

---

_Reviewed: 2026-04-29T05:15:05Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
