---
phase: 10-provider-aware-result-continuation
reviewed: 2026-04-29T02:15:31Z
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
  critical: 4
  warning: 2
  info: 0
  total: 6
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-04-29T02:15:31Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 10 wires OpenAI result continuation through partial edit, style copy, and same-condition regeneration. The implementation has multiple provider-continuation regressions: style-copy regenerations lose their style lineage, partial-edit regenerations are exposed but cannot pass backend validation, and OpenAI linkage metadata is replayed in shapes the worker/service cannot safely send back to OpenAI.

## Critical Issues

### CR-01: OpenAI Style-Copy Regeneration Drops Style Lineage

**Classification:** BLOCKER
**File:** `apps/api/src/services/generation.service.ts:477`
**Issue:** `regenerate()` rebuilds a new request only from `sourceImagePath`, `characterImagePath`, `textureImagePath`, `prompt`, and options. It does not carry `original.styleReferenceId`, `promptData.copyTarget`, or `promptData.selectedImageId`, even though `copyStyle()` stores those fields for OpenAI style-copy jobs. Regenerating an OpenAI style-copy result therefore enters the normal `generateIPChange` / `generateSketchToReal` branch instead of the style-copy branch, producing a different workflow from the saved result.
**Fix:**
```ts
const regenerationInput: CreateGenerationInput = {
  projectId: original.projectId,
  mode: original.mode,
  provider: original.provider,
  providerModel: original.providerModel,
  styleReferenceId: original.styleReferenceId ?? undefined,
  copyTarget: promptData.copyTarget as GenerationCopyTarget | undefined,
  selectedImageId: promptData.selectedImageId as string | undefined,
  sourceImagePath: promptData.sourceImagePath as string | undefined,
  characterId: original.ipCharacterId || undefined,
  characterImagePath: promptData.characterImagePath as string | undefined,
  textureImagePath: promptData.textureImagePath as string | undefined,
  prompt: promptData.userPrompt as string | undefined,
  regenerationMeta: { originalGenerationId: original.id, regeneratedAt: new Date().toISOString() },
  options: regeneratedOptions,
};
```
Update `validateOpenAIRegenerationSource()` so `selectedImageId` is allowed when it is the selected style-reference image for an existing `styleReferenceId`, and add a regression test for regenerating both `copyTarget` values.

### CR-02: OpenAI Partial-Edit Results Expose Regenerate But Backend Rejects Them

**Classification:** BLOCKER
**File:** `apps/api/src/routes/edit.routes.ts:209`
**Issue:** OpenAI partial edits are saved as completed generations with `options.outputCount: 1`. The result page still shows the "동일 조건 재생성" action for every completed generation, but `generationService.regenerate()` replays that `outputCount: 1` through `create()`, where OpenAI requests with any output count other than 2 are rejected. Users can start a visible continuation action that is guaranteed to fail for OpenAI partial-edit results.
**Fix:**
```ts
// UI option if partial-edit regeneration is not supported yet
const canRegenerate =
  !(generation.provider === 'openai' && generation.options?.outputCount === 1);

<Button
  variant="ghost"
  className="w-full"
  onClick={handleRegenerateWithSameInputs}
  isLoading={isRegenerating}
  disabled={isRegenerating || !canRegenerate}
>
  동일 조건 재생성
</Button>
```
Alternatively, implement a dedicated partial-edit regeneration path that reuses `parentGenerationId`, `selectedImageId`, and `editPrompt`, calls `generatePartialEdit()`, and permits `outputCount: 1` only for that workflow.

### CR-03: Comma-Joined Image Call IDs Are Sent As One Linkage ID

**Classification:** BLOCKER
**File:** `apps/api/src/services/generation.service.ts:457`
**Issue:** `updateOpenAIMetadata()` stores all OpenAI image call IDs as one comma-joined string. Later, `worker.ts` reads `reference.openaiImageCallId` as if it were a single ID, and `openai-image.service.ts` sends it unchanged as `{ type: 'image_generation_call', id: linkage.openaiImageCallId }`. For any two-candidate result without a usable `openaiResponseId`, the continuation request sends an invalid ID like `img_1,img_2` instead of the selected candidate's call ID.
**Fix:**
```ts
// Store structured candidate linkage in providerTrace and resolve by selected image/output index.
const selectedCandidate = getCandidateForSelectedImage(reference.providerTrace, referenceImage);
const linkage = {
  openaiResponseId: reference.openaiResponseId,
  openaiImageCallId: selectedCandidate?.imageCallId ?? undefined,
};
```
Do not pass comma-separated strings to `image_generation_call`. Add a test where `openaiResponseId` is null and `openaiImageCallId` contains two comma-separated IDs.

### CR-04: Responses Linkage Mislabels JPEG/WEBP Uploads As PNG Data URLs

**Classification:** BLOCKER
**File:** `apps/api/src/services/openai-image.service.ts:410`
**Issue:** `generateStyleCopyWithLinkage()` always builds `image_url` as `data:image/png;base64,...`. The OpenAI style-copy page uses the shared `ImageUploader`, which accepts PNG, JPEG, and WEBP by default. JPEG/WEBP targets sent through the preferred Responses linkage path are therefore labeled with the wrong MIME type and can be rejected or decoded incorrectly.
**Fix:**
```ts
const targetBuffer = this.decodeBase64Image(targetImageBase64);
const targetMimeType = this.detectMimeType(targetBuffer);
const targetImageInput = {
  type: 'input_image',
  image_url: `data:${targetMimeType};base64,${targetBuffer.toString('base64')}`,
};
```
Add coverage for JPEG and WEBP target images on `generateStyleCopyWithLinkage()`.

## Warnings

### WR-01: Linkage Fallback Under-Counts OpenAI API Calls

**Classification:** WARNING
**File:** `apps/api/src/worker.ts:275`
**Issue:** When `generateStyleCopyWithLinkage()` makes an OpenAI request and then falls back to `generateStyleCopyFromImage()`, the worker only increments API-key usage from the successful fallback result's `externalRequestCount`. The failed linkage request is omitted from usage accounting, so admin call counts under-report actual OpenAI calls.
**Fix:** When fallback is used, add the failed linkage request to the returned trace, for example `externalRequestCount: result.providerTrace.externalRequestCount + 1`, or increment call count immediately around each vendor request attempt.

### WR-02: Missing `imageId` Leaves The Style-Copy Page In A Permanent Loading State

**Classification:** WARNING
**File:** `apps/web/src/app/projects/[id]/style-copy/openai/page.tsx:118`
**Issue:** `fetchStyleReference()` returns early when `imageId` is missing, but only sets `styleFetchError` when `styleRef` or `copyTarget` is missing. A malformed or stale URL with `styleRef` and `copyTarget` but no `imageId` leaves the page disabled with "스타일 기준 이미지를 불러오는 중입니다." and no actionable error.
**Fix:** Treat missing `imageId` the same as a missing style reference.

```ts
if (!accessToken || !styleRef || !imageId || !copyTarget) {
  if (!styleRef || !imageId || !copyTarget) {
    setStyleFetchError(GENERIC_START_ERROR);
  }
  return;
}
```

---

_Reviewed: 2026-04-29T02:15:31Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
