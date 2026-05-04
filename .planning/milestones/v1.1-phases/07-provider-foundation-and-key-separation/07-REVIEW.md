---
phase: 07-provider-foundation-and-key-separation
reviewed: 2026-04-24T02:47:35Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - apps/api/prisma/schema.prisma
  - apps/api/src/lib/queue.ts
  - apps/api/src/routes/admin/api-keys.routes.ts
  - apps/api/src/routes/admin/generations.routes.ts
  - apps/api/src/routes/edit.routes.ts
  - apps/api/src/routes/generation.routes.ts
  - apps/api/src/services/__tests__/admin.service.test.ts
  - apps/api/src/services/admin.service.ts
  - apps/api/src/services/generation.service.ts
  - apps/api/src/worker.ts
  - apps/web/src/app/admin/api-keys/AddKeyModal.tsx
  - apps/web/src/app/admin/api-keys/ApiKeyTable.tsx
  - apps/web/src/app/admin/api-keys/page.tsx
  - apps/web/src/app/admin/dashboard/page.tsx
  - apps/web/src/components/admin/generation-detail-modal.tsx
  - apps/web/src/components/admin/generation-table.tsx
  - apps/web/src/lib/api.ts
  - packages/shared/src/types/index.ts
findings:
  critical: 2
  warning: 4
  info: 1
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-24T02:47:35Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 07 provider foundation 변경분을 버그, 보안, 데이터 격리, provider lineage, API contract mismatch, runtime fallback 위험, `providerTrace` 노출 여부 중심으로 검토했습니다.

Provider-scoped API key routing은 backend route, service method, web admin tab, dashboard payload까지 대부분 연결되어 있습니다. 현재 admin generation payload와 web `AdminGeneration` 타입에는 `providerTrace`가 포함되지 않습니다. 다만 generation image 처리 경로에 활성 보안/데이터 격리 결함이 있고, provider lineage와 retry 정확성에도 실제 동작을 왜곡할 수 있는 문제가 있습니다.

## Critical Issues

### CR-01: 신뢰할 수 없는 이미지 경로 입력이 사용자/업로드 경계를 넘을 수 있음

**File:** `apps/api/src/routes/generation.routes.ts:13`

**Issue:** `sourceImagePath`, `characterImagePath`, `textureImagePath`가 임의 문자열로 입력되고, 저장된 뒤 worker에서 `uploadService.readFile(...)`로 읽힙니다. `CopyStyleSchema`도 50-52라인에서 임의 `characterImagePath`, `sourceImagePath`를 받습니다. generation service가 이 경로가 인증된 사용자/프로젝트의 upload service 결과인지 확인하지 않기 때문에, 클라이언트가 다른 사용자의 알려진 relative path 또는 traversal 형태의 입력을 제출해 worker가 의도한 범위 밖의 데이터를 읽게 만들 수 있습니다.

**Fix:**
가능하면 path 대신 uploaded image ID를 전달하고 enqueue 전에 DB ownership을 검증하세요. path contract를 유지해야 한다면 `GenerationService.create()`와 `copyStyle()`에서 저장 전에 normalize 및 prefix 제한을 적용하세요.

```ts
function assertOwnedUploadPath(pathValue: string | undefined, allowedPrefixes: string[]): string | undefined {
  if (!pathValue) return undefined;
  const normalized = path.posix.normalize(pathValue.replaceAll('\\', '/'));
  if (path.isAbsolute(pathValue) || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('이미지 경로가 유효하지 않습니다');
  }
  if (!allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error('이미지 경로 권한이 없습니다');
  }
  return normalized;
}
```

`sourceImagePath`/`textureImagePath`는 `uploads/${userId}/${projectId}/` 하위인지 검증하고, direct character path는 사용자 소유 character prefix 또는 `IPCharacter` row lookup으로 검증해야 합니다.

### CR-02: 이미지 선택이 권한 있는 generation 밖의 이미지를 변경할 수 있음

**File:** `apps/api/src/services/generation.service.ts:201`

**Issue:** `selectImage()`는 먼저 사용자가 `generationId`를 소유하는지 확인하지만, 선택 이미지는 `where: { id: imageId }`만으로 update합니다. 다른 image UUID를 아는 사용자가 다른 generation 또는 다른 사용자의 이미지를 selected 상태로 바꿀 수 있습니다. 또한 요청된 image가 해당 generation에 속하는지 확인하기 전에 현재 generation의 선택 상태를 먼저 해제합니다.

**Fix:**
선택 해제 전에 image가 권한 확인된 generation에 속하는지 검증하고, 두 update를 transaction으로 묶으세요.

```ts
return prisma.$transaction(async (tx) => {
  const image = await tx.generatedImage.findFirst({
    where: { id: imageId, generationId },
  });
  if (!image) return null;

  await tx.generatedImage.updateMany({
    where: { generationId },
    data: { isSelected: false },
  });

  return tx.generatedImage.update({
    where: { id: image.id },
    data: { isSelected: true },
  });
});
```

## Warnings

### WR-01: OpenAI unsupported runtime guard가 key lookup과 file read 이후에 실행됨

**File:** `apps/api/src/worker.ts:68`

**Issue:** Worker는 provider lineage를 검증하지만, 97라인의 `provider === 'openai'` guard 전에 provider API key를 조회/복호화하고 generation을 processing으로 바꾸며 source image file을 읽습니다. OpenAI job이 명시적인 unsupported-runtime error 대신 "missing API key"나 file-read error로 실패할 수 있어 no-fallback guardrail이 약해지고 admin 실패 상태가 오해를 유발합니다.

**Fix:** OpenAI guard를 persisted provider 검증 직후, active-key lookup/status transition/file read 이전으로 이동하세요.

```ts
const provider = generation.provider;
const mode = generation.mode;

if (provider === 'openai') {
  throw new Error('OpenAI 이미지 런타임은 아직 지원되지 않습니다.');
}

const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(provider);
await generationService.updateStatus(generationId, 'processing');
```

### WR-02: Admin retry가 원본 prompt, style reference, provider 관련 options를 누락함

**File:** `apps/api/src/services/admin.service.ts:453`

**Issue:** `retryGeneration()`은 persisted JSON으로 queue payload를 다시 만들지만, `GenerationService.create()`가 user prompt를 `promptData.userPrompt`로 저장하는 반면 retry는 `promptData.prompt`를 읽습니다. 또한 `styleReferenceId`, `preserveHardware`, `fixedBackground`, `fixedViewpoint`, `removeShadows`, `userInstructions`, `hardwareSpecInput`, `hardwareSpecs`를 누락합니다. 따라서 retry job이 실패한 generation과 다른 instruction/options로 실행될 수 있습니다.

**Fix:**
`GenerationService.create()`가 사용한 payload shape를 그대로 보존하세요.

```ts
await addGenerationJob({
  generationId: generation.id,
  userId: generation.project.userId,
  projectId: generation.projectId,
  mode: generation.mode as 'ip_change' | 'sketch_to_real',
  provider: generation.provider,
  providerModel: generation.providerModel,
  styleReferenceId: generation.styleReferenceId ?? undefined,
  sourceImagePath: promptData.sourceImagePath as string | undefined,
  characterImagePath: promptData.characterImagePath as string | undefined,
  textureImagePath: promptData.textureImagePath as string | undefined,
  prompt: promptData.userPrompt as string | undefined,
  options: {
    preserveStructure: (options.preserveStructure as boolean | undefined) ?? false,
    transparentBackground: (options.transparentBackground as boolean | undefined) ?? false,
    preserveHardware: (options.preserveHardware as boolean | undefined) ?? false,
    fixedBackground: (options.fixedBackground as boolean | undefined) ?? false,
    fixedViewpoint: (options.fixedViewpoint as boolean | undefined) ?? false,
    removeShadows: (options.removeShadows as boolean | undefined) ?? false,
    userInstructions: (options.userInstructions as string | undefined) ?? undefined,
    hardwareSpecInput: (options.hardwareSpecInput as string | undefined) ?? undefined,
    hardwareSpecs: options.hardwareSpecs as GenerationJobData['options']['hardwareSpecs'],
    outputCount: (options.outputCount as number | undefined) ?? 1,
  },
});
```

### WR-03: `providerModel`이 provider와 결합 검증 없이 저장됨

**File:** `apps/api/src/services/generation.service.ts:61`

**Issue:** `providerModel`은 request에서 받은 뒤 trim/fallback만 거쳐 저장됩니다. route는 비어 있지 않은 문자열이면 모두 허용하고, worker는 `job.data.provider`만 persisted generation provider와 비교합니다. 클라이언트가 `provider: 'gemini'`, `providerModel: 'gpt-image-2'` 같은 잘못된 조합을 저장할 수 있어 admin/history payload의 lineage가 부정확해지고, 이후 provider runtime dispatch contract도 취약해집니다.

**Fix:**
허용된 provider/model pair를 중앙화하고 create 및 queue lineage 양쪽에서 검증하세요.

```ts
const DEFAULT_PROVIDER_MODELS: Record<GenerationProvider, string> = {
  gemini: 'gemini-3-pro-image-preview',
  openai: 'gpt-image-2',
};

if (input.providerModel && input.providerModel !== DEFAULT_PROVIDER_MODELS[provider]) {
  throw new Error('providerModel이 provider와 일치하지 않습니다');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}
```

### WR-04: active API key 배타성이 DB layer에서 보장되지 않음

**File:** `apps/api/prisma/schema.prisma:247`

**Issue:** Schema에는 provider index가 추가되어 있고 `activateApiKey()`는 transaction 안에서 active key를 비활성화한 뒤 target key를 활성화합니다. 하지만 provider당 active key 1개를 강제하는 uniqueness constraint가 없어서, 같은 provider에 대한 동시 activate transaction이 두 개의 active key를 남길 수 있습니다.

**Fix:**
DB-level partial unique index를 추가하고, service transaction은 application-level 경로로 유지하세요.

```sql
CREATE UNIQUE INDEX api_keys_one_active_per_provider
ON api_keys(provider)
WHERE is_active = true;
```

이 repo에서 migration을 아직 쓰지 않는다면, 동일한 배포 step과 기존 duplicate active key 정리 preflight를 추가해야 합니다.

## Info

### IN-01: 현재 admin/web payload에는 `providerTrace`가 없지만 shared public schema에는 포함됨

**File:** `packages/shared/src/types/index.ts:141`

**Issue:** 현재 admin list mapping과 web `AdminGeneration` 타입에는 `providerTrace`가 없어 즉시 payload 노출은 없습니다. 다만 shared `GenerationSchema`는 여전히 `providerTrace`를 export하므로, 향후 client-safe response 코드가 이 shared schema를 재사용하면 backend-only trace field가 public contract에 들어갈 수 있습니다.

**Fix:** internal persisted generation schema와 client-safe generation response schema를 분리하거나, exported client-facing `GenerationSchema`에서 `providerTrace`를 제외하세요.

---

_Reviewed: 2026-04-24T02:47:35Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
