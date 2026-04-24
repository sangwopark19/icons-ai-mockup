---
phase: 08-openai-ip-change-parity
reviewed: 2026-04-24T09:01:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - 'apps/api/package.json'
  - 'packages/shared/src/types/index.ts'
  - 'apps/api/src/routes/generation.routes.ts'
  - 'apps/api/src/services/generation.service.ts'
  - 'apps/api/src/lib/queue.ts'
  - 'apps/api/src/services/openai-image.service.ts'
  - 'apps/api/src/services/__tests__/openai-image.service.test.ts'
  - 'apps/api/src/services/__tests__/generation.service.test.ts'
  - 'apps/api/src/worker.ts'
  - 'apps/web/src/app/projects/[id]/page.tsx'
  - 'apps/web/src/app/projects/[id]/ip-change/page.tsx'
  - 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx'
  - 'apps/web/src/app/projects/[id]/generations/[genId]/page.tsx'
  - 'apps/web/src/app/projects/[id]/history/page.tsx'
  - 'apps/web/src/lib/api.ts'
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-24T09:01:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

OpenAI IP change v2 flow, shared generation contracts, API generation routes/services, worker dispatch, result/history UI, and API client behavior were reviewed at standard depth. `pnpm-lock.yaml` was inspected for dependency context but excluded from `files_reviewed_list` as a lock file per review rules.

Verification run:
- `pnpm --filter @mockup-ai/api type-check` passed
- `pnpm --filter @mockup-ai/web type-check` passed
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts` passed

## Critical Issues

### CR-01: Access Token Is Exposed In Download URL

**File:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:158`

**Issue:** `handleDownload` appends the bearer access token to the download URL query string and opens it in a new tab. Query-string tokens are commonly persisted in browser history, server/proxy logs, and referrer surfaces. This turns a normal image download into credential exposure.

**Fix:**
```tsx
const handleDownload = async (imageId: string) => {
  if (!imageId) return;
  const validToken = await getValidAccessToken();
  if (!validToken) return;

  const response = await apiFetch(`/api/images/${imageId}/download`, {
    token: validToken,
  });
  if (!response.ok) {
    throw new Error('다운로드에 실패했습니다');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${imageId}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
};
```

## Warnings

### WR-01: OpenAI Input Files Are Always Labeled As PNG

**File:** `apps/api/src/services/openai-image.service.ts:64`

**Issue:** `generateIPChange` sends both source and character inputs to `toFile` with `{ type: 'image/png' }`, but the upload API accepts JPEG, PNG, and WebP. A valid JPEG/WebP upload will be sent to OpenAI with the wrong MIME type, which can cause rejected edits or inconsistent provider behavior.

**Fix:**
```ts
private detectMimeType(buffer: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg';
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  throw new Error('지원하지 않는 이미지 형식입니다');
}

const sourceBuffer = this.decodeBase64Image(sourceImageBase64);
const sourceImage = await toFile(sourceBuffer, `source-product-${index + 1}`, {
  type: this.detectMimeType(sourceBuffer),
});
```

### WR-02: Unsupported OpenAI Style Copy Can Still Be Enqueued

**File:** `apps/api/src/services/generation.service.ts:486`

**Issue:** The result UI disables v2 style copy, and the worker rejects OpenAI jobs that contain `styleReferenceId`. However, the backend `copyStyle` path can still create a new OpenAI generation with `styleReferenceId: original.id`, enqueue it, and only fail later in the worker. Direct API callers can create guaranteed-failing jobs and failed generation records.

**Fix:**
```ts
const original = await this.getById(userId, generationId);
if (!original) {
  throw new Error('생성 기록을 찾을 수 없습니다');
}

if (original.provider === 'openai') {
  throw new Error('OpenAI IP 변경 v2는 스타일 복사를 지원하지 않습니다');
}
```

### WR-03: History Pagination Accepts NaN, Zero, And Negative Values

**File:** `apps/api/src/routes/generation.routes.ts:274`

**Issue:** The history route parses `page` and `limit` with `parseInt` and passes the result directly to `getProjectHistory`. Values like `page=abc`, `page=-1`, or `limit=0` can produce `NaN`, negative `skip`, invalid `take`, or `Infinity` in `totalPages`, leading to incorrect responses or Prisma runtime errors.

**Fix:**
```ts
const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const { page, limit } = HistoryQuerySchema.parse(request.query);
const { generations, total } = await generationService.getProjectHistory(
  user.id,
  projectId,
  page,
  limit
);
```

---

_Reviewed: 2026-04-24T09:01:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
