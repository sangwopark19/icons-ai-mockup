# Phase 11: OpenAI Style-Copy Retry Recovery - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 3
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/src/services/admin.service.ts` | service | CRUD + event-driven queue enqueue | `apps/api/src/services/generation.service.ts` | exact |
| `apps/api/src/services/__tests__/admin.service.test.ts` | test | CRUD + event-driven queue enqueue | `apps/api/src/services/__tests__/admin.service.test.ts` | exact |
| `apps/api/src/__tests__/worker.provider-continuation.test.ts` | test | event-driven worker dispatch | `apps/api/src/__tests__/worker.provider-continuation.test.ts` | exact |

`apps/api/prisma/schema.prisma` is intentionally not classified as a modified file. Phase 11 uses existing `Generation.promptData`, `Generation.styleReferenceId`, and `GenerationJobData.copyTarget` / `selectedImageId`.

## Pattern Assignments

### `apps/api/src/services/admin.service.ts` (service, CRUD + event-driven queue enqueue)

**Primary analog:** `apps/api/src/services/generation.service.ts`
**In-place analog:** `apps/api/src/services/admin.service.ts`

**Imports pattern** (`apps/api/src/services/admin.service.ts` lines 1-5):

```typescript
import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generationQueue, addGenerationJob, type GenerationJobData } from '../lib/queue.js';
import { assertStoragePathWithinPrefixes, uploadService } from './upload.service.js';
import { encrypt, decrypt, getEncryptionKey } from '../lib/crypto.js';
```

Use the existing `GenerationJobData` type import for any new literal guard helper. Do not add a schema or shared type dependency unless the implementation needs it.

**Small persisted-value guard pattern** (`apps/api/src/services/admin.service.ts` lines 35-37, 70-72):

```typescript
function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function qualityValue(value: unknown): GenerationJobData['options']['quality'] {
  return value === 'low' || value === 'medium' || value === 'high' ? value : undefined;
}
```

Copy this style for a local `copyTarget` guard: accept only `'ip-change'` or `'new-product'`, otherwise return `undefined`.

**Retry options reconstruction pattern** (`apps/api/src/services/admin.service.ts` lines 82-103):

```typescript
function buildRetryGenerationOptions(
  options: StoredGenerationOptions,
  promptData: StoredGenerationPromptData
): GenerationJobData['options'] {
  return {
    preserveStructure: booleanValue(options, 'preserveStructure', false),
    transparentBackground: booleanValue(options, 'transparentBackground', false),
    preserveHardware: booleanValue(options, 'preserveHardware', false),
    fixedBackground: booleanValue(options, 'fixedBackground', true),
    fixedViewpoint: booleanValue(options, 'fixedViewpoint', true),
    removeShadows: booleanValue(options, 'removeShadows', false),
    userInstructions: retryStringOption(options, promptData, 'userInstructions'),
    hardwareSpecInput: retryStringOption(options, promptData, 'hardwareSpecInput'),
    productCategory: retryStringOption(options, promptData, 'productCategory'),
    productCategoryOther: retryStringOption(options, promptData, 'productCategoryOther'),
    materialPreset: retryStringOption(options, promptData, 'materialPreset'),
    materialOther: retryStringOption(options, promptData, 'materialOther'),
    quality: qualityValue(options.quality),
    hardwareSpecs: options.hardwareSpecs as GenerationJobData['options']['hardwareSpecs'],
    outputCount: outputCountValue(options.outputCount),
  };
}
```

Add the Phase 11 continuation metadata beside this existing reconstruction layer, not in route code.

**Path validation and file-existence pattern** (`apps/api/src/services/admin.service.ts` lines 231-252):

```typescript
async function validateRetryStoragePath(
  value: unknown,
  allowedPrefixes: string[],
  label: string
): Promise<string | undefined> {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${label} 이미지 경로가 유효하지 않습니다`);
  }

  const normalized = assertStoragePathWithinPrefixes(
    value,
    allowedPrefixes,
    `${label} 이미지 경로 권한이 없습니다`
  );

  if (!(await uploadService.fileExists(normalized))) {
    throw new Error(`${label} 이미지를 찾을 수 없습니다`);
  }

  return normalized;
}
```

Preserve this path guard exactly for source, character, and texture paths. `copyTarget` and `selectedImageId` are metadata, not storage paths.

**Existing admin retry core pattern** (`apps/api/src/services/admin.service.ts` lines 537-582):

```typescript
async retryGeneration(id: string) {
  const generation = await prisma.generation.findUnique({
    where: { id },
    include: { project: true },
  });

  if (!generation) {
    throw new Error('Generation not found');
  }
  if (generation.status !== 'failed') {
    throw new Error('Only failed generations can be retried');
  }

  const updated = await prisma.generation.update({
    where: { id },
    data: {
      status: 'pending',
      errorMessage: null,
      retryCount: { increment: 1 },
    },
  });

  const promptData = (generation.promptData as StoredGenerationPromptData) ?? {};
  const options = (generation.options as StoredGenerationOptions) ?? {};
  const projectUploadPrefix = `uploads/${generation.project.userId}/${generation.projectId}`;
  const characterUploadPrefix = `characters/${generation.project.userId}`;
  const [sourceImagePath, characterImagePath, textureImagePath] = await Promise.all([
    validateRetryStoragePath(promptData.sourceImagePath, [projectUploadPrefix], '원본'),
    validateRetryStoragePath(promptData.characterImagePath, [characterUploadPrefix], '캐릭터'),
    validateRetryStoragePath(promptData.textureImagePath, [projectUploadPrefix], '텍스처'),
  ]);

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

  return updated;
}
```

Phase 11 should add only `copyTarget` and `selectedImageId` to this payload, sourced from `promptData`, while preserving provider/model/styleReferenceId/path/options behavior.

**Normal create payload pattern to copy** (`apps/api/src/services/generation.service.ts` lines 298-304, 333-364):

```typescript
promptData: {
  sourceImagePath: validatedPaths.sourceImagePath,
  characterImagePath,
  textureImagePath: validatedPaths.textureImagePath,
  copyTarget: input.copyTarget,
  selectedImageId: input.selectedImageId,
  userPrompt: input.prompt,
```

```typescript
await addGenerationJob({
  generationId: generation.id,
  userId,
  projectId: input.projectId,
  mode: input.mode,
  provider,
  providerModel,
  styleReferenceId: input.styleReferenceId,
  copyTarget: input.copyTarget,
  selectedImageId: input.selectedImageId,
  sourceImagePath: validatedPaths.sourceImagePath,
  characterImagePath,
  textureImagePath: validatedPaths.textureImagePath,
  prompt: input.prompt,
  options: {
    preserveStructure: input.options?.preserveStructure ?? false,
    transparentBackground: input.options?.transparentBackground ?? false,
    preserveHardware: input.options?.preserveHardware ?? false,
    fixedBackground: input.options?.fixedBackground ?? true,
    fixedViewpoint: input.options?.fixedViewpoint ?? true,
    removeShadows: input.options?.removeShadows ?? false,
    userInstructions: userInstructions || undefined,
    hardwareSpecInput: hardwareSpecInput || undefined,
    productCategory: productCategory || undefined,
    productCategoryOther: productCategoryOther || undefined,
    materialPreset: materialPreset || undefined,
    materialOther: materialOther || undefined,
    quality: input.options?.quality,
    hardwareSpecs: input.options?.hardwareSpecs,
    outputCount: input.options?.outputCount ?? 2,
  },
});
```

This is the exact missing field mapping that admin retry needs to mirror from persisted state.

**OpenAI style-copy creation pattern** (`apps/api/src/services/generation.service.ts` lines 753-815):

```typescript
if (!input.copyTarget) {
  throw new Error('OpenAI 스타일 복사에는 복사 대상이 필요합니다');
}

if (!input.selectedImageId) {
  throw new Error('OpenAI 스타일 복사에는 선택된 기준 이미지가 필요합니다');
}

const selectedImage = original.images.find((image) => image.id === input.selectedImageId);
if (!selectedImage) {
  throw new Error('선택한 스타일 기준 이미지를 찾을 수 없습니다');
}

return this.create(userId, {
  projectId: original.projectId,
  mode: original.mode,
  provider: original.provider,
  providerModel: original.providerModel,
  styleReferenceId: original.id,
  copyTarget: input.copyTarget,
  selectedImageId: input.selectedImageId,
  sourceImagePath: input.sourceImagePath || (promptData.sourceImagePath as string | undefined),
  characterId: replacesCharacter ? undefined : original.ipCharacterId || undefined,
  characterImagePath:
    input.characterImagePath || (promptData.characterImagePath as string | undefined),
  textureImagePath: promptData.textureImagePath as string | undefined,
  prompt: promptData.userPrompt as string | undefined,
  providerTrace: {
    workflow: 'style_copy',
    copyTarget: input.copyTarget,
    styleReferenceId: original.id,
    styleSourceImageId: input.selectedImageId,
  },
  options: {
    preserveStructure: (options.preserveStructure as boolean | undefined) ?? false,
    transparentBackground: (options.transparentBackground as boolean | undefined) ?? false,
    preserveHardware: (options.preserveHardware as boolean | undefined) ?? false,
    fixedBackground: (options.fixedBackground as boolean | undefined) ?? true,
    fixedViewpoint: (options.fixedViewpoint as boolean | undefined) ?? true,
    removeShadows: (options.removeShadows as boolean | undefined) ?? false,
    userInstructions: userInstructions || undefined,
    hardwareSpecInput: (options.hardwareSpecInput as string | undefined) ?? undefined,
    productCategory: (options.productCategory as string | undefined) ?? undefined,
    productCategoryOther: (options.productCategoryOther as string | undefined) ?? undefined,
    materialPreset: (options.materialPreset as string | undefined) ?? undefined,
    materialOther: (options.materialOther as string | undefined) ?? undefined,
    quality: (options.quality as 'low' | 'medium' | 'high' | undefined) ?? undefined,
    hardwareSpecs: (options.hardwareSpecs as HardwareSpecOption | undefined) ?? undefined,
    outputCount: 2,
  },
});
```

Use this as the source-of-truth for which continuation fields define OpenAI style-copy.

---

### `apps/api/src/services/__tests__/admin.service.test.ts` (test, CRUD + event-driven queue enqueue)

**Analog:** `apps/api/src/services/__tests__/admin.service.test.ts`

**Test imports and mocks pattern** (lines 1-63):

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    generation: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('../../lib/queue.js', () => ({
  generationQueue: {
    getJobCounts: vi.fn(),
  },
  addGenerationJob: vi.fn(),
}));

vi.mock('../../services/upload.service.js', () => ({
  assertStoragePathWithinPrefixes: vi.fn((relativePath: string) => relativePath),
  uploadService: {
    deleteFile: vi.fn(),
    fileExists: vi.fn().mockResolvedValue(true),
  },
}));
```

Keep the existing module mocks. New retry tests should import `prisma`, `addGenerationJob`, and `adminService` inside the `it` body like surrounding tests.

**Fixture pattern** (`apps/api/src/services/__tests__/admin.service.test.ts` lines 428-473):

```typescript
const mockGeneration = {
  id: 'gen1',
  projectId: 'proj1',
  mode: 'ip_change',
  status: 'failed',
  errorMessage: 'timeout',
  retryCount: 1,
  provider: 'gemini',
  providerModel: 'gemini-3-pro-image-preview',
  providerTrace: null,
  openaiRequestId: null,
  openaiResponseId: null,
  openaiImageCallId: null,
  openaiRevisedPrompt: null,
  styleReferenceId: 'style-gen1',
  promptData: {
    sourceImagePath: 'uploads/u1/proj1/img.png',
    characterImagePath: 'characters/u1/character.png',
    textureImagePath: 'uploads/u1/proj1/texture.png',
    userPrompt: 'retry this prompt',
  },
  options: {
    preserveStructure: true,
    transparentBackground: false,
    preserveHardware: true,
    fixedBackground: true,
    fixedViewpoint: false,
    removeShadows: true,
    userInstructions: 'keep the zipper',
    hardwareSpecInput: 'zipper: silver',
    hardwareSpecs: {
      items: [
        {
          type: 'zipper',
          material: 'metal',
          color: 'silver',
          position: 'front',
        },
      ],
    },
    outputCount: 2,
  },
  createdAt: new Date(),
  completedAt: null,
  project: { id: 'proj1', userId: 'u1', user: { email: 'test@example.com' } },
};
```

Copy this fixture style by spreading `mockGeneration` and overriding provider/model/styleReferenceId/promptData for OpenAI style-copy.

**Existing retry payload assertion pattern** (lines 646-687):

```typescript
it('should call addGenerationJob with correct GenerationJobData', async () => {
  const { prisma } = await import('../../lib/prisma.js');
  const { addGenerationJob } = await import('../../lib/queue.js');
  const { adminService } = await import('../admin.service.js');

  vi.mocked(prisma.generation.findUnique).mockResolvedValue(mockGeneration as any);
  vi.mocked(prisma.generation.update).mockResolvedValue({
    ...mockGeneration,
    status: 'pending',
  } as any);
  vi.mocked(addGenerationJob).mockResolvedValue({} as any);

  await adminService.retryGeneration('gen1');

  expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
    expect.objectContaining({
      generationId: 'gen1',
      userId: 'u1',
      projectId: 'proj1',
      mode: 'ip_change',
      provider: 'gemini',
      providerModel: 'gemini-3-pro-image-preview',
      styleReferenceId: 'style-gen1',
      sourceImagePath: 'uploads/u1/proj1/img.png',
      characterImagePath: 'characters/u1/character.png',
      textureImagePath: 'uploads/u1/proj1/texture.png',
      prompt: 'retry this prompt',
      options: expect.objectContaining({
        preserveStructure: true,
        transparentBackground: false,
        preserveHardware: true,
        fixedBackground: true,
        fixedViewpoint: false,
        removeShadows: true,
        userInstructions: 'keep the zipper',
        hardwareSpecInput: 'zipper: silver',
        hardwareSpecs: mockGeneration.options.hardwareSpecs,
        outputCount: 2,
      }),
    })
  );
});
```

New OpenAI style-copy regression should follow this exact `expect.objectContaining()` shape and assert:

```typescript
expect.objectContaining({
  provider: 'openai',
  providerModel: 'gpt-image-2',
  styleReferenceId: 'source-style-generation',
  copyTarget: 'ip-change',
  selectedImageId: 'style-source-image-2',
})
```

**OpenAI non-style-copy preservation pattern** (lines 689-752):

```typescript
it('preserves OpenAI sketch_to_real options when retrying a failed generation', async () => {
  const { prisma } = await import('../../lib/prisma.js');
  const { addGenerationJob } = await import('../../lib/queue.js');
  const { adminService } = await import('../admin.service.js');
  const openAISketchGeneration = {
    ...mockGeneration,
    mode: 'sketch_to_real',
    provider: 'openai',
    providerModel: 'gpt-image-2',
    styleReferenceId: null,
    promptData: {
      sourceImagePath: 'uploads/u1/proj1/sketch.png',
      textureImagePath: 'uploads/u1/proj1/texture.png',
      productCategory: '머그',
      productCategoryOther: 'wide mug',
      materialPreset: '세라믹',
      materialOther: 'glossy ceramic',
    },
    options: {
      preserveStructure: true,
      transparentBackground: true,
      userInstructions: 'keep the handle angle',
      productCategory: '머그',
      productCategoryOther: 'wide mug',
      materialPreset: '세라믹',
      materialOther: 'glossy ceramic',
      quality: 'high',
    },
  };

  vi.mocked(prisma.generation.findUnique).mockResolvedValue(openAISketchGeneration as any);
  vi.mocked(prisma.generation.update).mockResolvedValue({
    ...openAISketchGeneration,
    status: 'pending',
  } as any);
  vi.mocked(addGenerationJob).mockResolvedValue({} as any);

  await adminService.retryGeneration('gen1');

  expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
    expect.objectContaining({
      generationId: 'gen1',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/sketch.png',
      characterImagePath: undefined,
      textureImagePath: 'uploads/u1/proj1/texture.png',
      options: expect.objectContaining({
        preserveStructure: true,
        transparentBackground: true,
        fixedBackground: true,
        fixedViewpoint: true,
        userInstructions: 'keep the handle angle',
        productCategory: '머그',
        productCategoryOther: 'wide mug',
        materialPreset: '세라믹',
        materialOther: 'glossy ceramic',
        quality: 'high',
        outputCount: 2,
      }),
    })
  );
});
```

Keep this test passing to prove non-style-copy OpenAI retry behavior remains unchanged.

---

### `apps/api/src/__tests__/worker.provider-continuation.test.ts` (test, event-driven worker dispatch)

**Analog:** `apps/api/src/__tests__/worker.provider-continuation.test.ts`

**Worker test mock pattern** (lines 1-68):

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerationJobData } from '../lib/queue.js';

vi.mock('bullmq', () => ({
  Worker: vi.fn(function WorkerMock() {
    return {
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };
  }),
}));

vi.mock('../services/gemini.service.js', () => ({
  geminiService: {
    generateIPChange: vi.fn(),
    generateSketchToReal: vi.fn(),
    generateWithStyleCopy: vi.fn(),
  },
}));

vi.mock('../services/openai-image.service.js', () => ({
  openaiImageService: {
    generateIPChange: vi.fn(),
    generateSketchToReal: vi.fn(),
    generateStyleCopyWithLinkage: vi.fn(),
    generateStyleCopyFromImage: vi.fn(),
  },
}));

const { processGenerationJob } = await import('../worker.js');
const { geminiService } = await import('../services/gemini.service.js');
const { openaiImageService } = await import('../services/openai-image.service.js');
```

Use the existing mocked worker import pattern. Do not instantiate BullMQ or Redis for this regression.

**Base OpenAI job and stored generation pattern** (lines 85-129):

```typescript
const baseOptions: GenerationJobData['options'] = {
  preserveStructure: true,
  transparentBackground: false,
  preserveHardware: true,
  fixedBackground: true,
  fixedViewpoint: true,
  removeShadows: false,
  userInstructions: 'replace the target only',
  quality: 'high',
  outputCount: 2,
};

const baseOpenAIJob = (overrides: Partial<GenerationJobData> = {}): GenerationJobData => ({
  generationId: 'gen-openai-copy',
  userId: 'user-1',
  projectId: 'project-1',
  mode: 'ip_change',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  styleReferenceId: 'style-ref-1',
  selectedImageId: 'style-img-2',
  copyTarget: 'ip-change',
  sourceImagePath: 'uploads/user-1/project-1/source.png',
  characterImagePath: 'characters/user-1/target.png',
  options: baseOptions,
  ...overrides,
});

const generationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'gen-openai-copy',
  projectId: 'project-1',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  mode: 'ip_change',
  styleReferenceId: 'style-ref-1',
  promptData: {
    sourceImagePath: 'uploads/user-1/project-1/source.png',
    characterImagePath: 'characters/user-1/target.png',
    copyTarget: 'ip-change',
    selectedImageId: 'style-img-2',
  },
  options: baseOptions,
  images: [],
  ...overrides,
});
```

A retry-payload regression can use `baseOpenAIJob()` directly because it already models the complete recovered queue payload.

**OpenAI style-copy dispatch assertion pattern** (lines 207-234):

```typescript
it('uses OpenAI linkage before selected-image fallback for style copy', async () => {
  const jobData = baseOpenAIJob();
  mockGenerationLookup(generationRecord(), openAIReference());

  const result = await processGenerationJob({ data: jobData });

  expect(result).toEqual({ success: true, imageCount: 2 });
  expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalledWith(
    'openai-key',
    Buffer.from(`file:${jobData.characterImagePath}`).toString('base64'),
    expect.objectContaining({
      openaiResponseId: 'resp-style',
      openaiImageCallId: 'call-style-2',
      providerTrace: expect.objectContaining({ workflow: 'ip_change' }),
    }),
    expect.objectContaining({
      copyTarget: 'ip-change',
      quality: 'high',
      userInstructions: 'replace the target only',
    })
  );
  expect(openaiImageService.generateStyleCopyFromImage).not.toHaveBeenCalled();
  expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
});
```

This is the strongest analog for proving a retried payload reaches OpenAI style-copy dispatch and does not fall into Gemini.

**Mismatch guard regression pattern** (lines 395-421):

```typescript
it('rejects queue styleReferenceId mismatch before vendor calls', async () => {
  const jobData = baseOpenAIJob({ styleReferenceId: 'stale-style-ref' });
  mockGenerationLookup(generationRecord(), openAIReference());

  await expect(processGenerationJob({ data: jobData })).rejects.toThrow(
    '저장된 생성 입력과 큐 styleReferenceId가 일치하지 않습니다.'
  );

  expect(adminService.getActiveApiKey).not.toHaveBeenCalled();
  expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
  expect(openaiImageService.generateStyleCopyFromImage).not.toHaveBeenCalled();
  expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
});

it('rejects queue selectedImageId mismatch before vendor calls', async () => {
  const jobData = baseOpenAIJob({ selectedImageId: 'stale-style-image' });
  mockGenerationLookup(generationRecord(), openAIReference());

  await expect(processGenerationJob({ data: jobData })).rejects.toThrow(
    '저장된 생성 입력과 큐 selectedImageId가 일치하지 않습니다.'
  );

  expect(adminService.getActiveApiKey).not.toHaveBeenCalled();
  expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
  expect(openaiImageService.generateStyleCopyFromImage).not.toHaveBeenCalled();
  expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
});
```

Keep these guards unchanged. Phase 11 should make admin retry produce matching queue payloads, not weaken this worker validation.

**Non-style-copy OpenAI preservation pattern** (lines 423-467):

```typescript
it('preserves existing OpenAI ip_change and sketch_to_real worker dispatch after processGenerationJob export', async () => {
  mockGenerationLookup(
    generationRecord({
      id: 'gen-ip',
      mode: 'ip_change',
      styleReferenceId: undefined,
      promptData: {
        sourceImagePath: 'uploads/user-1/project-1/source.png',
        characterImagePath: 'characters/user-1/target.png',
      },
    }),
    generationRecord({
      id: 'gen-sketch',
      mode: 'sketch_to_real',
      styleReferenceId: undefined,
      promptData: {
        sourceImagePath: 'uploads/user-1/project-1/source.png',
      },
    })
  );

  await processGenerationJob({
    data: baseOpenAIJob({
      generationId: 'gen-ip',
      styleReferenceId: undefined,
      selectedImageId: undefined,
      copyTarget: undefined,
    }),
  });
  await processGenerationJob({
    data: baseOpenAIJob({
      generationId: 'gen-sketch',
      mode: 'sketch_to_real',
      styleReferenceId: undefined,
      selectedImageId: undefined,
      copyTarget: undefined,
      characterImagePath: undefined,
    }),
  });

  expect(openaiImageService.generateIPChange).toHaveBeenCalledTimes(1);
  expect(openaiImageService.generateSketchToReal).toHaveBeenCalledTimes(1);
  expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
  expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
});
```

Use this existing test as the preservation guard for OpenAI non-style-copy worker behavior.

## Shared Patterns

### Queue Contract

**Source:** `apps/api/src/lib/queue.ts` lines 7-21, 67-71
**Apply to:** `admin.service.ts`, `admin.service.test.ts`, `worker.provider-continuation.test.ts`

```typescript
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  provider: 'gemini' | 'openai';
  providerModel: string;
  styleReferenceId?: string;
  copyTarget?: 'ip-change' | 'new-product';
  selectedImageId?: string;
  sourceImagePath?: string;
  characterImagePath?: string;
  textureImagePath?: string;
  prompt?: string;
  options: {
```

```typescript
export async function addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  return generationQueue.add('generate', data, {
    priority: 1,
    ...(data.provider === 'openai' ? { attempts: 1 } : {}),
  });
}
```

No queue type change is required for Phase 11.

### Worker Persisted-Metadata Guard

**Source:** `apps/api/src/worker.ts` lines 65-121
**Apply to:** Worker regression tests and admin retry payload reconstruction

```typescript
const assertQueuedFieldMatchesStored = (
  field: string,
  queuedValue: unknown,
  storedValue: unknown
): void => {
  const queued = queuedValue ?? undefined;
  const stored = storedValue ?? undefined;

  if (queued !== stored) {
    throw new Error(`저장된 생성 입력과 큐 ${field}가 일치하지 않습니다.`);
  }
};

const assertQueuedJobMatchesStoredGeneration = (
  jobData: GenerationJobData,
  generation: StoredGenerationJobSource
): void => {
  const promptData = getRecord(generation.promptData);

  assertQueuedFieldMatchesStored('projectId', jobData.projectId, generation.projectId);
  assertQueuedFieldMatchesStored('mode', jobData.mode, generation.mode);
  assertQueuedFieldMatchesStored(
    'styleReferenceId',
    jobData.styleReferenceId,
    getOptionalString(generation.styleReferenceId)
  );
  assertQueuedFieldMatchesStored(
    'sourceImagePath',
    jobData.sourceImagePath,
    getOptionalString(promptData.sourceImagePath)
  );
  assertQueuedFieldMatchesStored(
    'characterImagePath',
    jobData.characterImagePath,
    getOptionalString(promptData.characterImagePath)
  );
  assertQueuedFieldMatchesStored(
    'textureImagePath',
    jobData.textureImagePath,
    getOptionalString(promptData.textureImagePath)
  );
  assertQueuedFieldMatchesStored(
    'prompt',
    jobData.prompt,
    getOptionalString(promptData.userPrompt)
  );
  assertQueuedFieldMatchesStored(
    'copyTarget',
    jobData.copyTarget,
    getOptionalString(promptData.copyTarget)
  );
  assertQueuedFieldMatchesStored(
    'selectedImageId',
    jobData.selectedImageId,
    getOptionalString(promptData.selectedImageId)
  );
};
```

The planner should preserve this guard and make admin retry satisfy it.

### OpenAI Style-Copy Worker Dispatch

**Source:** `apps/api/src/worker.ts` lines 322-421, 488-504, 615-631
**Apply to:** Worker dispatch regression

```typescript
const generateOpenAIStyleCopy = async (params: {
  activeApiKey: string;
  userId: string;
  jobData: GenerationJobData;
  sourceImageBase64?: string;
  characterImageBase64?: string;
}): Promise<OpenAIImageGenerationResult> => {
  const { activeApiKey, userId, jobData, sourceImageBase64, characterImageBase64 } = params;
  const { copyTarget, styleReferenceId, selectedImageId, options } = jobData;

  if (!styleReferenceId) {
    throw new Error('OpenAI 스타일 복사에는 스타일 기준 결과가 필요합니다');
  }

  if (!copyTarget) {
    throw new Error('OpenAI 스타일 복사에는 복사 대상이 필요합니다');
  }

  const reference = await generationService.getById(userId, styleReferenceId);
  if (!reference) {
    throw new Error('스타일 참조 생성 기록을 찾을 수 없습니다');
  }

  if (reference.provider !== 'openai') {
    throw new Error('OpenAI 스타일 복사는 OpenAI 기준 결과만 사용할 수 있습니다');
  }
```

```typescript
if (provider === 'openai') {
  if (job.data.styleReferenceId) {
    const result = await generateOpenAIStyleCopy({
      activeApiKey,
      userId,
      jobData: job.data,
      sourceImageBase64,
      characterImageBase64,
    });
    const tracedResult = attachOpenAIWorkerTrace(result, job);
    openAIMetadata = tracedResult;
    await adminService.incrementCallCount(
      provider,
      activeKeyId,
      getPositiveNumber(tracedResult.providerTrace.externalRequestCount, 1)
    );
    generatedImages = tracedResult.images;
  } else {
```

Use this dispatch branch as the acceptance target: recovered retry payload reaches `generateOpenAIStyleCopy()` and never calls Gemini `generateWithStyleCopy`.

### Admin Auth And Route Error Shape

**Source:** `apps/api/src/routes/admin/index.routes.ts` lines 12-15; `apps/api/src/routes/admin/generations.routes.ts` lines 35-49
**Apply to:** Route-level assumptions; no Phase 11 route edit expected

```typescript
const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 모든 admin 라우트에 requireAdmin 적용
  fastify.addHook('preHandler', fastify.requireAdmin);
```

```typescript
fastify.post('/:id/retry', async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    const result = await adminService.retryGeneration(id);
    return reply.code(200).send({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('not found')) {
      return reply.code(404).send({ success: false, error: message });
    }
    if (message.toLowerCase().includes('not failed') || message.toLowerCase().includes('only failed')) {
      return reply.code(400).send({ success: false, error: message });
    }
    return reply.code(500).send({ success: false, error: message });
  }
});
```

Admin retry is already admin-only through the route tree. Phase 11 should not add request body fields to this route.

## No Analog Found

None. All Phase 11 files have direct in-repo analogs.

## Metadata

**Analog search scope:** `.planning/*`, `.codex/skills/*/SKILL.md`, `apps/api/src/services`, `apps/api/src/services/__tests__`, `apps/api/src/__tests__`, `apps/api/src/lib`, `apps/api/src/routes/admin`, `apps/api/src/worker.ts`

**Files scanned:** 14 primary files plus local skill indexes

**Pattern extraction date:** 2026-04-29

