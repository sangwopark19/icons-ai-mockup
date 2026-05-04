---
phase: 09-openai-sketch-to-real-parity
reviewed: 2026-04-28T05:25:14Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - .gitignore
  - apps/api/src/lib/queue.ts
  - apps/api/src/routes/__tests__/generation.routes.test.ts
  - apps/api/src/routes/generation.routes.ts
  - apps/api/src/services/__tests__/background-removal.service.test.ts
  - apps/api/src/services/__tests__/generation.service.test.ts
  - apps/api/src/services/__tests__/openai-image.service.test.ts
  - apps/api/src/services/background-removal.service.ts
  - apps/api/src/services/generation.service.ts
  - apps/api/src/services/openai-image.service.ts
  - apps/api/src/worker.ts
  - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
  - apps/web/src/app/projects/[id]/history/page.tsx
  - apps/web/src/app/projects/[id]/page.tsx
  - apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx
  - apps/web/src/app/projects/[id]/sketch-to-real/page.tsx
  - apps/web/src/components/ui/image-uploader.tsx
  - packages/shared/src/types/index.ts
findings:
  critical: 1
  warning: 5
  info: 0
  total: 6
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-04-28T05:25:14Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

OpenAI sketch-to-real parity paths, worker routing, background removal, result/history UI, and shared request contracts were reviewed at standard depth. Scoped API tests and API/Web type-check pass, but there are correctness issues around retry/idempotency and several robustness defects that should be fixed before shipping.

Verification run:

```bash
pnpm test -- src/services/__tests__/openai-image.service.test.ts src/services/__tests__/background-removal.service.test.ts src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts
pnpm type-check # apps/api
pnpm type-check # apps/web
```

## Critical Issues

### CR-01: BLOCKER - Worker Retries Can Persist Partial Or Duplicate v2 Results

**File:** `apps/api/src/worker.ts:272`
**Issue:** The worker saves each generated image as soon as that candidate is processed. If candidate 1 is saved and candidate 2 fails background removal or any later save/metadata/status step fails, the catch block marks the job failed and rethrows. BullMQ retries this job (`apps/api/src/lib/queue.ts:52`) without deleting the already saved `GeneratedImage` rows/files. A later successful retry can leave 3+ images for the same generation, and the v2 sketch result page rejects completed generations unless it sees exactly two images (`apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:425`). This can turn a recoverable retry into a permanently broken completed result.
**Fix:** Make worker output persistence idempotent. Process all candidate buffers first, then replace existing output rows/files for the generation in one deliberate save step, or upsert by generation/output index with a unique constraint.

```ts
const processedImages = await Promise.all(
  generatedImages.map(async (image) => {
    if (provider === 'openai' && mode === 'sketch_to_real' && options.transparentBackground) {
      const processed = await removeUniformLightBackground(image);
      return { buffer: processed.buffer, hasTransparency: true };
    }
    return { buffer: image, hasTransparency: false };
  })
);

await generationService.replaceGeneratedImages(generationId, async () => {
  for (const [i, image] of processedImages.entries()) {
    const result = await uploadService.saveGeneratedImage(
      userId,
      projectId,
      generationId,
      image.buffer,
      i
    );
    await generationService.saveGeneratedImage(
      generationId,
      result.filePath,
      result.thumbnailPath,
      result.metadata,
      image.hasTransparency ? { hasTransparency: true } : undefined
    );
  }
});
```

## Warnings

### WR-01: WARNING - OpenAI Sketch User Instructions Are Sent Twice

**File:** `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx:187`
**Issue:** `trimmedInstructions` is sent as both top-level `prompt` and `options.userInstructions` (`line 195`). `OpenAIImageService.buildSketchToRealPrompt()` then concatenates both fields (`apps/api/src/services/openai-image.service.ts:313`), so every user instruction appears twice in the final prompt. That can overweight user text and makes prompt behavior diverge from the intended single "User instructions" section.
**Fix:** Send the text in one field only, or dedupe in the service before building `userContent`.

```ts
body: JSON.stringify({
  projectId,
  mode: 'sketch_to_real',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  sourceImagePath,
  textureImagePath,
  options: {
    outputCount: 2,
    quality,
    preserveStructure,
    fixedViewpoint,
    fixedBackground,
    transparentBackground,
    userInstructions: trimmedInstructions || undefined,
    productCategory,
    productCategoryOther: isOtherCategory ? productCategoryOther.trim() : undefined,
    materialPreset,
    materialOther: isOtherMaterial ? materialOther.trim() : undefined,
  },
});
```

### WR-02: WARNING - OpenAI Debug Metadata Is Lost On Post-Generation Failures

**File:** `apps/api/src/worker.ts:307`
**Issue:** OpenAI request IDs, response IDs, image call IDs, and provider trace are saved only after all images are saved. If the OpenAI call succeeds but background removal or image persistence fails, execution jumps to the catch block (`line 322`) and only `status/errorMessage` is persisted. The failed generation then loses the exact OpenAI IDs needed for support/debugging.
**Fix:** Persist `openAIMetadata` immediately after the OpenAI call succeeds, or persist it in the catch block before updating failure status.

```ts
let openAIMetadataSaved = false;

// after assigning openAIMetadata
if (openAIMetadata) {
  await generationService.updateOpenAIMetadata(generationId, openAIMetadata);
  openAIMetadataSaved = true;
}

// in catch
if (openAIMetadata && !openAIMetadataSaved) {
  await generationService.updateOpenAIMetadata(generationId, openAIMetadata).catch(() => undefined);
}
await generationService.updateStatus(generationId, 'failed', message);
```

### WR-03: WARNING - Shared Defaults And Service Defaults Disagree

**File:** `packages/shared/src/types/index.ts:77`
**Issue:** The shared `GenerationOptionsSchema` defaults `fixedBackground` and `fixedViewpoint` to `true`, but `GenerationService.create()` persists and enqueues both as `false` when callers omit them (`apps/api/src/services/generation.service.ts:261` and `:294`). API consumers using the shared contract will expect the locks to be enabled by default, while the worker receives weaker prompt constraints.
**Fix:** Centralize request parsing through the shared schema, or make the service defaults match the shared contract everywhere options are reconstructed.

```ts
fixedBackground: input.options?.fixedBackground ?? true,
fixedViewpoint: input.options?.fixedViewpoint ?? true,
```

### WR-04: WARNING - Several Route Parsers Can Turn Bad Input Into 500s

**File:** `apps/api/src/routes/generation.routes.ts:236`
**Issue:** `SelectImageSchema.parse()`, `CopyStyleSchema.parse()` (`line 301`), and `HistoryQuerySchema.parse()` (`line 362`) are called outside a `try`/`safeParse` path. Invalid client bodies or query params can throw Zod errors through Fastify and produce internal errors instead of the API's normal structured 400 response.
**Fix:** Use `safeParse` for these routes and return a 400 response with the first validation message.

```ts
const parsed = SelectImageSchema.safeParse(request.body);
if (!parsed.success) {
  return reply.code(400).send({
    success: false,
    error: {
      code: 'INVALID_REQUEST',
      message: parsed.error.issues[0]?.message ?? '요청이 유효하지 않습니다',
    },
  });
}
const body = parsed.data;
```

### WR-05: WARNING - Image Selection UI Ignores API Failure

**File:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:201`
**Issue:** `handleSelectImage()` optimistically updates `selectedImageId`, awaits the API call, and never checks `response.ok` or the JSON `success` flag. If the server rejects the selection, the page displays a selection that was not persisted; later history/save/download behavior can disagree with what the user sees.
**Fix:** Keep the previous selection, check the response, and roll back or refetch on failure.

```ts
const previousImageId = selectedImageId;
setSelectedImageId(imageId);

const response = await apiFetch(`/api/generations/${genId}/select`, {
  method: 'POST',
  token: accessToken,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageId }),
});

const data = await response.json();
if (!response.ok || !data.success) {
  setSelectedImageId(previousImageId);
  setSaveMessage(data.error?.message || '이미지 선택에 실패했습니다.');
}
```

---

_Reviewed: 2026-04-28T05:25:14Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
