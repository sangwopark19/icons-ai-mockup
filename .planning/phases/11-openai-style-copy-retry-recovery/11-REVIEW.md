---
phase: 11-openai-style-copy-retry-recovery
reviewed: 2026-04-29T08:20:07Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - apps/api/src/__tests__/worker.provider-continuation.test.ts
  - apps/api/src/services/__tests__/admin.service.test.ts
  - apps/api/src/services/admin.service.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-29T08:20:07Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

지정된 admin retry service와 provider-continuation tests를 standard depth로 검토했습니다. OpenAI style-copy continuation metadata 자체는 happy path에서 queue payload로 전달되지만, `retryGeneration`의 상태 전이와 queue enqueue가 실패/경합 경로에서 안전하지 않습니다. 이 상태로 ship하면 failed generation이 실행되지 않는 `pending` 상태로 고착되거나, 같은 generation에 중복 worker job이 생성될 수 있습니다.

검증 참고:

- `pnpm --filter @mockup-ai/api type-check` 통과
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` 통과

## Critical Issues

### CR-01: Retry Failure Can Leave a Generation Pending With No Queue Job

**Classification:** BLOCKER
**File:** `apps/api/src/services/admin.service.ts:554`
**Issue:** `retryGeneration` updates the generation to `pending`, clears `errorMessage`, and increments `retryCount` before it validates stored image paths and before `addGenerationJob` succeeds. If `validateRetryStoragePath` rejects because a file is missing/unauthorized, or if BullMQ/Redis makes `addGenerationJob` reject, the method throws after the DB row has already been moved out of `failed`. The admin route returns an error, but the row is now `pending` with no queued job, and line 550 prevents retrying it again because it is no longer `failed`.
**Fix:**

```ts
const promptData = (generation.promptData as StoredGenerationPromptData) ?? {};
const options = (generation.options as StoredGenerationOptions) ?? {};
const projectUploadPrefix = `uploads/${generation.project.userId}/${generation.projectId}`;
const characterUploadPrefix = `characters/${generation.project.userId}`;
const [sourceImagePath, characterImagePath, textureImagePath] = await Promise.all([
  validateRetryStoragePath(promptData.sourceImagePath, [projectUploadPrefix], '원본'),
  validateRetryStoragePath(promptData.characterImagePath, [characterUploadPrefix], '캐릭터'),
  validateRetryStoragePath(promptData.textureImagePath, [projectUploadPrefix], '텍스처'),
]);

let updated;
try {
  updated = await prisma.generation.update({
    where: { id },
    data: { status: 'pending', errorMessage: null, retryCount: { increment: 1 } },
  });

  await addGenerationJob({
    generationId: generation.id,
    userId: generation.project.userId,
    projectId: generation.projectId,
    mode: generation.mode as 'ip_change' | 'sketch_to_real',
    provider: generation.provider,
    providerModel: generation.providerModel,
    styleReferenceId: generation.styleReferenceId ?? undefined,
    sourceImagePath,
    characterImagePath,
    textureImagePath,
    prompt: promptData.userPrompt as string | undefined,
    options: buildRetryGenerationOptions(options, promptData),
  });
} catch (error) {
  const message = error instanceof Error ? error.message : '작업 큐 등록에 실패했습니다';
  await prisma.generation
    .update({ where: { id }, data: { status: 'failed', errorMessage: message } })
    .catch(() => undefined);
  throw error;
}
return updated;
```

### CR-02: Concurrent Admin Retries Can Enqueue Duplicate Jobs For The Same Generation

**Classification:** BLOCKER
**File:** `apps/api/src/services/admin.service.ts:550`
**Issue:** The retry guard is a non-atomic read/check/update sequence: `findUnique` loads the row, line 550 checks `generation.status !== 'failed'`, line 554 updates it, and line 575 enqueues a job. Two concurrent requests can both read `failed` before either update commits, then both increment `retryCount` and enqueue separate BullMQ jobs for the same `generationId`. Those workers race on the same generation and can overwrite/delete each other's output state.
**Fix:** Claim the failed row with an atomic conditional update before enqueueing, and enqueue only when exactly one caller wins. Combine this with CR-01's failure compensation.

```ts
const claim = await prisma.generation.updateMany({
  where: { id, status: 'failed' },
  data: { status: 'pending', errorMessage: null, retryCount: { increment: 1 } },
});

if (claim.count !== 1) {
  throw new Error('Only failed generations can be retried');
}

const updated = await prisma.generation.findUniqueOrThrow({ where: { id } });
await addGenerationJob(jobData);
return updated;
```

## Warnings

### WR-01: Retry Tests Only Cover The Happy Path

**Classification:** WARNING
**File:** `apps/api/src/services/__tests__/admin.service.test.ts:689`
**Issue:** The new OpenAI style-copy retry test verifies that complete `copyTarget` and `selectedImageId` metadata are forwarded, but there is no test for `addGenerationJob` rejection, storage validation rejection, or duplicate retry attempts. The current suite passes while the two blocker paths above remain untested, so future retry changes can keep regressing queue/state consistency.
**Fix:** Add focused tests that make `addGenerationJob` reject and make `uploadService.fileExists` return `false`, then assert the generation is not left as unqueued `pending`. Add a concurrency/claim test that simulates two retry calls and asserts only one queue job is added.

---

_Reviewed: 2026-04-29T08:20:07Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
