---
phase: 11-openai-style-copy-retry-recovery
reviewed: 2026-04-29T08:39:38Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - apps/api/src/__tests__/worker.provider-continuation.test.ts
  - apps/api/src/services/__tests__/admin.service.test.ts
  - apps/api/src/services/admin.service.ts
findings:
  critical: 3
  warning: 3
  info: 0
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-04-29T08:39:38Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

지정된 세 파일을 standard depth로 검토했습니다. `processGenerationJob` continuation tests의 happy path는 통과하지만, admin retry와 content deletion service에 release blocker급 상태/삭제 결함이 있습니다. 특히 retry는 queue enqueue 실패와 동시 호출을 안전하게 처리하지 못하고, bulk delete는 빈 filter로 전체 이미지를 삭제할 수 있습니다.

검증 참고:

- `pnpm --filter @mockup-ai/api type-check` 통과
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` 통과
- `pnpm --filter @mockup-ai/api lint` 통과, reviewed files 밖의 기존 warning 6개 있음

## Critical Issues

### CR-01: Retry Failure Can Leave A Generation Pending With No Queue Job

**Classification:** BLOCKER
**File:** `apps/api/src/services/admin.service.ts:554`
**Issue:** `retryGeneration` changes the row to `pending`, clears `errorMessage`, and increments `retryCount` before stored image paths are validated and before `addGenerationJob` succeeds. If `validateRetryStoragePath` at line 567 or `addGenerationJob` at line 575 rejects, the request fails after the generation has already left `failed`; line 550 then prevents retrying it again, and there may be no BullMQ job to process.
**Fix:**

```ts
const promptData = (generation.promptData as StoredGenerationPromptData) ?? {};
const options = (generation.options as StoredGenerationOptions) ?? {};
const [sourceImagePath, characterImagePath, textureImagePath] = await Promise.all([
  validateRetryStoragePath(promptData.sourceImagePath, [projectUploadPrefix], '원본'),
  validateRetryStoragePath(promptData.characterImagePath, [characterUploadPrefix], '캐릭터'),
  validateRetryStoragePath(promptData.textureImagePath, [projectUploadPrefix], '텍스처'),
]);
const jobData: GenerationJobData = {
  generationId: generation.id,
  userId: generation.project.userId,
  projectId: generation.projectId,
  mode: generation.mode as GenerationJobData['mode'],
  provider: generation.provider,
  providerModel: generation.providerModel,
  styleReferenceId: generation.styleReferenceId ?? undefined,
  sourceImagePath,
  characterImagePath,
  textureImagePath,
  prompt: stringValue(promptData.userPrompt),
  options: buildRetryGenerationOptions(options, promptData),
};

const updated = await prisma.generation.update({
  where: { id },
  data: { status: 'pending', errorMessage: null, retryCount: { increment: 1 } },
});

try {
  await addGenerationJob(jobData);
} catch (error) {
  const message = error instanceof Error ? error.message : '작업 큐 등록에 실패했습니다';
  await prisma.generation
    .update({ where: { id }, data: { status: 'failed', errorMessage: message } })
    .catch(() => undefined);
  throw error;
}

return updated;
```

### CR-02: Concurrent Retries Can Enqueue Duplicate Jobs For One Generation

**Classification:** BLOCKER
**File:** `apps/api/src/services/admin.service.ts:550`
**Issue:** The retry guard is a non-atomic `findUnique` -> status check -> `update` -> enqueue sequence. Two admin requests can both read the same `failed` row before either update commits, then both pass line 550, both increment `retryCount`, and both enqueue a job for the same `generationId`. The workers can then race through `deleteGeneratedOutputImages` and output writes for the same generation.
**Fix:** Claim the failed row with an atomic conditional update, and enqueue only when exactly one caller wins. Combine this with CR-01's validation-before-mutation and queue-failure rollback.

```ts
const claim = await prisma.generation.updateMany({
  where: { id, status: 'failed' },
  data: { status: 'pending', errorMessage: null, retryCount: { increment: 1 } },
});

if (claim.count !== 1) {
  throw new Error('Only failed generations can be retried');
}

try {
  await addGenerationJob(jobData);
} catch (error) {
  const message = error instanceof Error ? error.message : '작업 큐 등록에 실패했습니다';
  await prisma.generation.update({ where: { id }, data: { status: 'failed', errorMessage: message } });
  throw error;
}
```

### CR-03: Bulk Image Delete Has No Scope Guard And Can Delete Everything

**Classification:** BLOCKER
**File:** `apps/api/src/services/admin.service.ts:687`
**Issue:** `bulkDeleteImages` calls `buildImageWhere(params)` and then runs `findMany`/`deleteMany` with that `where`. When `params` is `{}` or all filter fields are absent, `buildImageWhere` returns `{}`, so line 689 selects every `GeneratedImage` and line 709 deletes every row. This is a direct data-loss path for a malformed or accidental admin bulk-delete request.
**Fix:**

```ts
function hasDeleteScope(params: Omit<ListImagesParams, 'page' | 'limit'>): boolean {
  return Boolean(
    params.email ||
      params.projectId ||
      params.startDate ||
      params.endDate ||
      (params.ids && params.ids.length > 0)
  );
}

async bulkDeleteImages(
  params: Omit<ListImagesParams, 'page' | 'limit'>
): Promise<{ deletedCount: number }> {
  if (!hasDeleteScope(params)) {
    throw new Error('벌크 삭제에는 최소 하나 이상의 필터가 필요합니다');
  }

  const where = buildImageWhere(params);
  // existing delete flow...
}
```

## Warnings

### WR-01: Pagination Inputs Can Produce Invalid Prisma Queries Or Invalid Metadata

**Classification:** WARNING
**File:** `apps/api/src/services/admin.service.ts:393`
**Issue:** `listUsers`, `listGenerations`, and `listGeneratedImages` accept `page`/`limit` directly. `page=0` or a negative page creates a negative `skip`, and `limit=0` produces `totalPages = Infinity`; these values are reachable from the admin route schemas because they coerce numbers but do not enforce `.min(1)`. This turns bad admin input into 500s or invalid pagination payloads.
**Fix:**

```ts
function normalizePagination(pageValue?: number, limitValue?: number) {
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit =
    Number.isInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

const { page, limit, skip } = normalizePagination(params.page, params.limit);
```

### WR-02: Short API Keys Are Fully Exposed In `maskedKey`

**Classification:** WARNING
**File:** `apps/api/src/services/admin.service.ts:753`
**Issue:** `maskedKey` is `keyToStore.slice(-4)`. For a key of four characters or fewer, the stored public field is the entire secret, and API key routes only require a non-empty string. Even invalid/test secrets should never be echoed back in full by a field intended for display.
**Fix:**

```ts
const trimmedKey = keyToStore.trim();
if (trimmedKey.length < 8) {
  throw new Error('API 키가 너무 짧습니다');
}
const maskedKey = trimmedKey.slice(-4);
const encryptedKey = encrypt(trimmedKey, getEncryptionKey());
```

### WR-03: `statusCounts` Test Uses The Wrong Prisma Mock Shape

**Classification:** WARNING
**File:** `apps/api/src/services/__tests__/admin.service.test.ts:552`
**Issue:** The service maps `row._count._all`, but this test mocks `groupBy` rows as `_count: { id: 10 }` and only asserts that `statusCounts` is defined. The test would still pass if `statusCounts.completed` and `statusCounts.failed` were `undefined`, so it does not protect the mapping it claims to cover.
**Fix:**

```ts
vi.mocked(prisma.generation.groupBy).mockResolvedValue([
  { status: 'completed', _count: { _all: 10 } },
  { status: 'failed', _count: { _all: 3 } },
] as any);

const result = await adminService.listGenerations({});

expect(result.statusCounts).toEqual({ completed: 10, failed: 3 });
```

---

_Reviewed: 2026-04-29T08:39:38Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
