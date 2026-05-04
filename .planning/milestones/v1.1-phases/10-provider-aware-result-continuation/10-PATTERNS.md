# Phase 10: Provider-Aware Result Continuation - Pattern Map

**Mapped:** 2026-04-28
**Files analyzed:** 17
**Analogs found:** 16 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | component/page | request-response, event-driven UI | `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | exact |
| `apps/web/src/app/projects/[id]/history/page.tsx` | component/page | request-response, CRUD | `apps/web/src/app/projects/[id]/history/page.tsx` | exact |
| `apps/web/src/app/projects/[id]/style-copy/openai/page.tsx` | component/page | request-response, file-I/O | `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx`; `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` | role-match |
| `apps/web/src/lib/api.ts` | utility | request-response | `apps/web/src/lib/api.ts` | exact |
| `packages/shared/src/types/index.ts` | model/types | validation, transform | `packages/shared/src/types/index.ts` | exact |
| `apps/api/src/routes/generation.routes.ts` | route/controller | request-response | `apps/api/src/routes/generation.routes.ts` | exact |
| `apps/api/src/routes/edit.routes.ts` | route/controller | request-response, file-I/O | `apps/api/src/routes/edit.routes.ts` | exact |
| `apps/api/src/services/generation.service.ts` | service | CRUD, event-driven queue | `apps/api/src/services/generation.service.ts` | exact |
| `apps/api/src/services/generation-continuation.service.ts` | service | request-response, CRUD, file-I/O | `apps/api/src/services/generation.service.ts`; `apps/api/src/routes/edit.routes.ts` | role-match, optional |
| `apps/api/src/services/openai-image.service.ts` | service | external request-response, file-I/O, transform | `apps/api/src/services/openai-image.service.ts` | exact |
| `apps/api/src/worker.ts` | worker | event-driven, file-I/O | `apps/api/src/worker.ts` | exact |
| `apps/api/src/lib/queue.ts` | utility/config | event-driven | `apps/api/src/lib/queue.ts` | exact |
| `apps/api/src/services/__tests__/generation.service.test.ts` | test | CRUD, event-driven queue | `apps/api/src/services/__tests__/generation.service.test.ts` | exact |
| `apps/api/src/services/__tests__/openai-image.service.test.ts` | test | external request-response, transform | `apps/api/src/services/__tests__/openai-image.service.test.ts` | exact |
| `apps/api/src/routes/__tests__/generation.routes.test.ts` | test | request-response | `apps/api/src/routes/__tests__/generation.routes.test.ts` | exact |
| `apps/api/src/routes/__tests__/edit.routes.test.ts` | test | request-response, file-I/O | `apps/api/src/routes/__tests__/generation.routes.test.ts`; `apps/api/src/routes/edit.routes.ts` | role-match |
| `apps/api/src/__tests__/worker.provider-continuation.test.ts` | test | event-driven, file-I/O | none close; use `worker.ts` plus service test mocks | no close analog |

## Pattern Assignments

### `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` (component/page, request-response + event-driven UI)

**Analog:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`

**Imports pattern** (lines 3-16):
```tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  API_URL,
  apiFetch,
  getValidAccessToken,
  type GenerationDetail,
  type GenerationImage,
  type GenerationMode,
} from '@/lib/api';
```

**Provider-derived UI state** (lines 85-100):
```tsx
const [generation, setGeneration] = useState<GenerationDetail | null>(null);
const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
const [isPolling, setIsPolling] = useState(true);
const [showEditModal, setShowEditModal] = useState(false);
const [editPrompt, setEditPrompt] = useState('');
const [isEditing, setIsEditing] = useState(false);
const [isRegenerating, setIsRegenerating] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [saveMessage, setSaveMessage] = useState<string | null>(null);
const isV2 = generation?.provider === 'openai';
const isV2SketchToReal = Boolean(isV2 && generation?.mode === 'sketch_to_real');
```

**Polling/fetch pattern** (lines 110-160, 162-186):
```tsx
const fetchGeneration = useCallback(async () => {
  if (!accessToken || isLoadingRef.current) return;

  isLoadingRef.current = true;
  try {
    const response = await apiFetch(`/api/generations/${genId}`, { token: accessToken });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      const fetchedGeneration = data.data as GenerationDetail;
      const orderedImages = getImagesInOutputOrder(fetchedGeneration.images);
      setGeneration(fetchedGeneration);
      const selected = orderedImages.find((img: GenerationImage) => img.isSelected);
      if (selected) {
        setSelectedImageId(selected.id);
      } else if (orderedImages.length > 0) {
        setSelectedImageId(orderedImages[0].id);
      }
      if (fetchedGeneration.status === 'completed' || fetchedGeneration.status === 'failed') {
        setIsPolling(false);
      }
    }
  } finally {
    isLoadingRef.current = false;
  }
}, [accessToken, genId]);
```

**Action pattern to extend** (lines 268-385):
```tsx
const handleEdit = async () => {
  if (isV2) return;
  if (!accessToken || !selectedImageId || !editPrompt.trim()) return;
  // POST /api/generations/:id/edit, then route to new generation
};

const handleRegenerateWithSameInputs = async () => {
  if (isV2) return;
  if (!accessToken) return;
  // POST /api/generations/:id/regenerate, then route to new generation
};

const handleStyleCopy = (copyTarget: 'ip-change' | 'new-product') => {
  if (isV2) return;
  const styleRef = generation?.id ?? genId;
  const query = new URLSearchParams({ styleRef, copyTarget });
  router.push(`/projects/${projectId}/ip-change?${query.toString()}`);
};
```

Phase 10 should remove the `isV2` early returns, keep backend endpoints as provider source of truth, and route v2 style copy to `/projects/${projectId}/style-copy/openai?styleRef=...&copyTarget=...&imageId=...`.

**Version badge and action stack pattern** (lines 484-623):
```tsx
<h1 className="text-lg font-semibold text-[var(--text-primary)]">생성 결과</h1>
<span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
  {isV2 ? 'v2' : 'v1'}
</span>

<Button variant="secondary" className="w-full" onClick={() => setShowEditModal(true)}>
  ✏️ 부분 수정
</Button>
<Button variant="secondary" className="w-full" onClick={handleSaveToHistory} isLoading={isSaving}>
  📚 히스토리에 저장
</Button>
<Button variant="secondary" className="w-full" onClick={() => handleStyleCopy('ip-change')}>
  {styleCopyIpChangeLabel}
</Button>
<Button variant="ghost" className="w-full" onClick={handleRegenerateWithSameInputs} isLoading={isRegenerating}>
  🔁 동일 조건 재생성
</Button>
```

**Modal pattern** (lines 628-657):
```tsx
{showEditModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-xl bg-[var(--bg-secondary)] p-6">
      <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">✏️ 부분 수정</h2>
      <Input
        label="수정 요청"
        placeholder="예: 캐릭터 색상을 파란색으로 변경해주세요"
        value={editPrompt}
        onChange={(e) => setEditPrompt(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
      />
      <Button onClick={handleEdit} isLoading={isEditing} disabled={!editPrompt.trim()}>
        수정 요청
      </Button>
    </div>
  </div>
)}
```

---

### `apps/web/src/app/projects/[id]/history/page.tsx` (component/page, request-response + CRUD)

**Analog:** `apps/web/src/app/projects/[id]/history/page.tsx`

**Imports and API load pattern** (lines 3-9, 72-92):
```tsx
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { API_URL, apiFetch, type HistoryGenerationItem } from '@/lib/api';

const response = await apiFetch(
  `/api/generations/project/${projectId}/history?page=${page}&limit=20`,
  { token: accessToken }
);
const data = await response.json();
if (data.success) {
  setHistory(data.data);
  setTotalPages(data.pagination.totalPages);
}
```

**History card/version badge pattern** (lines 144-173):
```tsx
<Link
  key={item.id}
  href={`/projects/${projectId}/generations/${item.id}`}
  className="hover:border-brand-500 group overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] transition-all hover:shadow-lg"
>
  <div className="flex items-center gap-2 text-sm">
    <span>{modeCopy.icon}</span>
    <span className="text-[var(--text-secondary)]">{modeCopy.label}</span>
    {isVersionedMode && (
      <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
        {item.provider === 'openai' ? 'v2' : 'v1'}
      </span>
    )}
  </div>
</Link>
```

**Delete/error pattern** (lines 34-67):
```tsx
const handleDeleteGeneration = async (e: React.MouseEvent, generationId: string) => {
  e.preventDefault();
  e.stopPropagation();

  if (!accessToken) return;
  if (!confirm('히스토리 삭제\n이 생성 기록과 모든 이미지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) return;

  try {
    setDeletingId(generationId);
    const response = await apiFetch(`/api/generations/${generationId}`, {
      method: 'DELETE',
      token: accessToken,
    });
    if (!response.ok) throw new Error('삭제 실패');
    setHistory((prev) => prev.filter((item) => item.id !== generationId));
  } finally {
    setDeletingId(null);
  }
};
```

---

### `apps/web/src/app/projects/[id]/style-copy/openai/page.tsx` (component/page, request-response + file-I/O)

**Analog:** `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` and `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx`

**Imports pattern** (IP Change OpenAI lines 3-9):
```tsx
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiFetch } from '@/lib/api';
```

**OpenAI upload helper pattern** (IP Change OpenAI lines 48-71):
```tsx
const uploadImage = async (file: File, type: 'source' | 'character'): Promise<string> => {
  if (!accessToken) {
    throw new Error('인증이 필요합니다');
  }

  const formData = new FormData();
  formData.append('file', file);

  const endpoint =
    type === 'source' ? `/api/upload/image?projectId=${projectId}` : '/api/upload/character';

  const response = await apiFetch(endpoint, {
    method: 'POST',
    token: accessToken,
    body: formData,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || '업로드 실패');
  }
  return data.data.filePath;
};
```

**OpenAI submit pattern** (IP Change OpenAI lines 73-137):
```tsx
const handleGenerate = async () => {
  if (!accessToken) return;
  setError(null);
  if (!sourceImage || !characterImage) {
    setError('원본 제품 이미지와 새 캐릭터 이미지를 모두 업로드해주세요.');
    return;
  }

  setIsGenerating(true);
  try {
    const [sourceImagePath, characterImagePath] = await Promise.all([
      uploadImage(sourceImage, 'source'),
      uploadImage(characterImage, 'character'),
    ]);

    const response = await apiFetch('/api/generations', {
      method: 'POST',
      token: accessToken,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        mode: 'ip_change',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath,
        characterImagePath,
        options: { outputCount: 2, quality },
      }),
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || '생성 요청 실패');
    router.push(`/projects/${projectId}/generations/${data.data.id}`);
  } finally {
    setIsGenerating(false);
  }
};
```

**OpenAI image validation pattern** (Sketch OpenAI lines 14-19, 63-72):
```tsx
const OPENAI_IMAGE_ACCEPT = 'image/png,image/jpeg';
const OPENAI_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const OPENAI_MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const INVALID_IMAGE_TYPE_MESSAGE = 'PNG 또는 JPEG 이미지만 업로드할 수 있습니다.';

function validateOpenAIImage(file: File): string | null {
  if (!OPENAI_IMAGE_TYPES.includes(file.type)) return INVALID_IMAGE_TYPE_MESSAGE;
  if (file.size > OPENAI_MAX_IMAGE_SIZE) return MAX_IMAGE_SIZE_MESSAGE;
  return null;
}
```

**Uploader layout pattern** (Sketch OpenAI lines 288-315):
```tsx
<div className="grid gap-8 lg:grid-cols-2">
  <ImageUploader
    label="스케치 이미지"
    description="제품화할 2D 스케치/드로잉을 업로드하세요"
    accept={OPENAI_IMAGE_ACCEPT}
    maxSize={OPENAI_MAX_IMAGE_SIZE}
    invalidTypeMessage={INVALID_IMAGE_TYPE_MESSAGE}
    maxSizeMessage={MAX_IMAGE_SIZE_MESSAGE}
    removeAriaLabel="스케치 이미지 제거"
    onUpload={handleSketchUpload}
    onRemove={handleSketchRemove}
    onError={setError}
    preview={sketchPreview}
  />
</div>
```

Phase 10 style-copy page should adapt this to:
- read `styleRef`, `copyTarget`, and `imageId` from query params.
- fetch the source generation for the approved style image preview.
- upload only the replacement target asset.
- submit to `POST /api/generations/:styleRef/copy-style` with `characterImagePath` for `ip-change` or `sourceImagePath` for `new-product`, plus `imageId` if backend supports selected-image disambiguation.

---

### `apps/web/src/lib/api.ts` (utility, request-response)

**Analog:** `apps/web/src/lib/api.ts`

**Authenticated fetch pattern** (lines 112-145):
```ts
export async function apiFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const { token, skipAuthRefresh = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  const authToken = token ?? useAuthStore.getState().accessToken;

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  let response = await fetch(buildApiUrl(endpoint), {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuthRefresh) {
    const refreshResult = await refreshStoredSession();
    if (refreshResult.accessToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${refreshResult.accessToken}`);
      response = await fetch(buildApiUrl(endpoint), {
        ...fetchOptions,
        headers: retryHeaders,
      });
    }
  }
  return response;
}
```

**Generation frontend types** (lines 252-290):
```ts
export type GenerationProvider = 'gemini' | 'openai';
export type GenerationMode = 'ip_change' | 'sketch_to_real';

export interface GenerationDetail {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mode: GenerationMode;
  provider: 'gemini' | 'openai';
  providerModel: string;
  options?: Record<string, unknown>;
  errorMessage: string | null;
  images: GenerationImage[];
}

export interface HistoryGenerationItem {
  id: string;
  mode: GenerationMode;
  provider: 'gemini' | 'openai';
  providerModel: string;
  createdAt: string;
  selectedImage: {
    id: string;
    filePath: string;
    thumbnailPath: string | null;
  } | null;
}
```

---

### `packages/shared/src/types/index.ts` (model/types, validation + transform)

**Analog:** `packages/shared/src/types/index.ts`

**Provider/model enums and options** (lines 63-102):
```ts
export const GenerationModeEnum = z.enum(['ip_change', 'sketch_to_real']);
export type GenerationMode = z.infer<typeof GenerationModeEnum>;

export const GenerationProviderEnum = z.enum(['gemini', 'openai']);
export type GenerationProvider = z.infer<typeof GenerationProviderEnum>;

export const GenerationOptionsSchema = z.object({
  preserveStructure: z.boolean().default(false),
  transparentBackground: z.boolean().default(false),
  outputCount: z.number().int().min(1).max(4).default(2),
  preserveHardware: z.boolean().default(false),
  fixedBackground: z.boolean().default(true),
  fixedViewpoint: z.boolean().default(true),
  removeShadows: z.boolean().default(false),
  userInstructions: z.string().max(2000).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
});
```

**Create/internal generation schema** (lines 124-160):
```ts
export const CreateGenerationSchema = z.object({
  projectId: z.string().uuid(),
  mode: GenerationModeEnum,
  provider: GenerationProviderEnum.optional(),
  providerModel: z.string().min(1).optional(),
  sourceImagePath: z.string().optional(),
  characterImagePath: z.string().optional(),
  textureImagePath: z.string().optional(),
  prompt: z.string().max(2000).optional(),
  options: GenerationOptionsSchema.optional(),
});

export const InternalGenerationSchema = z.object({
  provider: GenerationProviderEnum,
  providerModel: z.string().min(1),
  providerTrace: z.record(z.unknown()).nullable(),
  openaiRequestId: z.string().nullable(),
  openaiResponseId: z.string().nullable(),
  openaiImageCallId: z.string().nullable(),
  openaiRevisedPrompt: z.string().nullable(),
});
```

---

### `apps/api/src/routes/generation.routes.ts` (route/controller, request-response)

**Analog:** `apps/api/src/routes/generation.routes.ts`

**Imports and auth pattern** (lines 1-3, 186-188):
```ts
import { FastifyPluginAsync, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { generationService } from '../services/generation.service.js';

const generationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);
```

**Zod validation pattern** (lines 12-23, 55-120):
```ts
const CreateGenerationSchema = z
  .object({
    projectId: z.string().uuid(),
    mode: z.enum(['ip_change', 'sketch_to_real']),
    provider: z.enum(['gemini', 'openai']).optional(),
    providerModel: z.string().min(1).optional(),
    sourceImagePath: z.string().optional(),
    characterImagePath: z.string().optional(),
    textureImagePath: z.string().optional(),
    prompt: z.string().max(2000).optional(),
    options: z.object({ outputCount: z.number().int().min(1).max(4).optional() }).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'openai' && value.providerModel !== undefined) {
      const providerModel = value.providerModel.trim();
      if (providerModel !== 'gpt-image-2') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['providerModel'],
          message: 'OpenAI providerModel은 gpt-image-2여야 합니다',
        });
      }
    }
  });
```

**Structured error helper** (lines 176-180):
```ts
function sendInvalidRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({
    success: false,
    error: { code: 'INVALID_REQUEST', message },
  });
}
```

**Regenerate/copy-style route pattern** (lines 326-391):
```ts
fastify.post('/:id/regenerate', async (request, reply) => {
  const user = (request as any).user;
  const { id } = request.params as { id: string };

  try {
    const generation = await generationService.regenerate(user.id, id);
    return reply.code(201).send({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        provider: generation.provider,
        providerModel: generation.providerModel,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '재생성에 실패했습니다';
    const statusCode = message.includes('찾을 수 없습니다') ? 404 : 400;
    return reply.code(statusCode).send({
      success: false,
      error: { code: 'REGENERATE_FAILED', message },
    });
  }
});

fastify.post('/:id/copy-style', async (request, reply) => {
  const parsed = CopyStyleSchema.safeParse(request.body);
  if (!parsed.success) {
    return sendInvalidRequest(reply, parsed.error.issues[0]?.message ?? '요청이 유효하지 않습니다');
  }
  const generation = await generationService.copyStyle(user.id, id, parsed.data);
  return reply.code(201).send({ success: true, data: { id: generation.id } });
});
```

---

### `apps/api/src/routes/edit.routes.ts` (route/controller, request-response + file-I/O)

**Analog:** `apps/api/src/routes/edit.routes.ts`

**Imports, schema, auth pattern** (lines 1-21):
```ts
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { geminiService } from '../services/gemini.service.js';
import { uploadService } from '../services/upload.service.js';
import { generationService } from '../services/generation.service.js';
import { adminService } from '../services/admin.service.js';

const EditRequestSchema = z.object({
  prompt: z.string().min(1, '수정 내용을 입력해주세요').max(500),
});

const editRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);
```

**Source generation and selected-image guard** (lines 32-58):
```ts
const generation = await generationService.getById(user.id, generationId);
if (!generation) {
  return reply.code(404).send({
    success: false,
    error: { code: 'NOT_FOUND', message: '생성 기록을 찾을 수 없습니다' },
  });
}

const selectedImage = generation.images.find((img) => img.isSelected);
if (!selectedImage) {
  return reply.code(400).send({
    success: false,
    error: { code: 'NO_SELECTED_IMAGE', message: '선택된 이미지가 없습니다' },
  });
}
```

**Synchronous edit/create/save pattern** (lines 60-140):
```ts
try {
  const originalBuffer = await uploadService.readFile(selectedImage.filePath);
  const originalBase64 = originalBuffer.toString('base64');
  const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(
    generation.provider
  );

  await adminService.incrementCallCount(generation.provider, activeKeyId);
  const editResult = await geminiService.generateEdit(activeApiKey, originalBase64, body.prompt);

  const newGeneration = await prisma.generation.create({
    data: {
      projectId: generation.projectId,
      ipCharacterId: generation.ipCharacterId,
      sourceImageId: selectedImage.id,
      mode: generation.mode,
      status: 'completed',
      provider: generation.provider,
      providerModel: generation.providerModel,
      promptData: {
        ...(generation.promptData as object),
        editPrompt: body.prompt,
        parentGenerationId: generationId,
      },
      options: generation.options as object,
      completedAt: new Date(),
    },
  });

  return reply.code(201).send({
    success: true,
    data: { generationId: newGeneration.id, message: '수정이 완료되었습니다' },
  });
} catch (error) {
  const message = error instanceof Error ? error.message : '수정에 실패했습니다';
  return reply.code(500).send({
    success: false,
    error: { code: 'EDIT_FAILED', message },
  });
}
```

Phase 10 OpenAI edit should copy this lifecycle, replace Gemini call with `openaiImageService` Image API edit, save exactly one image selected, and update OpenAI metadata.

---

### `apps/api/src/services/generation.service.ts` (service, CRUD + event-driven queue)

**Analog:** `apps/api/src/services/generation.service.ts`

**Imports/provider defaults** (lines 1-14):
```ts
import { prisma } from '../lib/prisma.js';
import { addGenerationJob } from '../lib/queue.js';
import { Prisma, type Generation, type GeneratedImage } from '@prisma/client';
import type { GenerationProvider, ThoughtSignatureData } from '@mockup-ai/shared/types';
import { assertStoragePathWithinPrefixes, uploadService } from './upload.service.js';

const DEFAULT_GENERATION_PROVIDER: GenerationProvider = 'gemini';
const DEFAULT_PROVIDER_MODELS: Record<GenerationProvider, string> = {
  gemini: 'gemini-3-pro-image-preview',
  openai: 'gpt-image-2',
};
```

**Storage ownership validation** (lines 67-110):
```ts
async function validateOwnedStoragePath(
  value: string | undefined,
  allowedPrefixes: string[],
  label: string
): Promise<string | undefined> {
  if (!value) return undefined;

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

**Create and enqueue pattern** (lines 216-331):
```ts
async create(userId: string, input: CreateGenerationInput): Promise<Generation> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  const { provider, providerModel } = resolveGenerationProvider(input);
  validateCreateGenerationInput(input, provider);

  const validatedPaths = await validateGenerationImagePaths(userId, input.projectId, {
    sourceImagePath: input.sourceImagePath,
    characterImagePath,
    textureImagePath: input.textureImagePath,
  });

  const generation = await prisma.generation.create({
    data: {
      projectId: input.projectId,
      mode: input.mode,
      status: 'pending',
      provider,
      providerModel,
      styleReferenceId: input.styleReferenceId || null,
      promptData: { sourceImagePath: validatedPaths.sourceImagePath, characterImagePath },
      options: { outputCount: input.options?.outputCount ?? 2 },
    },
  });

  await addGenerationJob({
    generationId: generation.id,
    userId,
    projectId: input.projectId,
    mode: input.mode,
    provider,
    providerModel,
    styleReferenceId: input.styleReferenceId,
    sourceImagePath: validatedPaths.sourceImagePath,
    characterImagePath,
    options: { outputCount: input.options?.outputCount ?? 2 },
  });

  return generation;
}
```

**OpenAI metadata persistence pattern** (lines 430-450):
```ts
async updateOpenAIMetadata(
  generationId: string,
  metadata: {
    requestIds: string[];
    responseId?: string;
    imageCallIds: string[];
    revisedPrompt?: string;
    providerTrace: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      openaiRequestId: metadata.requestIds.length > 0 ? metadata.requestIds.join(',') : null,
      openaiResponseId: metadata.responseId || null,
      openaiImageCallId: metadata.imageCallIds.length > 0 ? metadata.imageCallIds.join(',') : null,
      openaiRevisedPrompt: metadata.revisedPrompt || null,
      providerTrace: metadata.providerTrace as Prisma.JsonObject,
    },
  });
}
```

**Regeneration pattern** (lines 456-508, 511-555):
```ts
async regenerate(userId: string, generationId: string): Promise<Generation> {
  const original = await this.getById(userId, generationId);
  if (!original) throw new Error('생성 기록을 찾을 수 없습니다');

  const promptData = (original.promptData as Record<string, unknown>) || {};
  const options = (original.options as Record<string, unknown>) || {};

  const regenerationInput = {
    projectId: original.projectId,
    mode: original.mode,
    provider: original.provider,
    providerModel: original.providerModel,
    sourceImagePath: promptData.sourceImagePath as string | undefined,
    characterImagePath: promptData.characterImagePath as string | undefined,
    textureImagePath: promptData.textureImagePath as string | undefined,
    prompt: promptData.userPrompt as string | undefined,
    regenerationMeta: {
      originalGenerationId: original.id,
      regeneratedAt: new Date().toISOString(),
    },
    options: { outputCount: (options.outputCount as number | undefined) ?? 2 },
  };

  this.validateRegenerationInputs(original.mode, promptData, options, regenerationInput);
  return this.create(userId, regenerationInput);
}
```

Remove the current OpenAI block at lines 462-464 for Phase 10, but keep validation/fail-fast behavior for missing inputs.

**Style-copy orchestration pattern** (lines 590-643):
```ts
async copyStyle(
  userId: string,
  generationId: string,
  input: { characterImagePath?: string; sourceImagePath?: string }
): Promise<Generation> {
  const original = await this.getById(userId, generationId);
  if (!original) throw new Error('생성 기록을 찾을 수 없습니다');
  if (!input.characterImagePath && !input.sourceImagePath) {
    throw new Error('새 캐릭터 또는 제품 이미지를 제공해야 합니다');
  }

  const promptData = (original.promptData as Record<string, unknown>) || {};
  const options = (original.options as Record<string, unknown>) || {};

  return this.create(userId, {
    projectId: original.projectId,
    mode: original.mode,
    provider: original.provider,
    providerModel: original.providerModel,
    styleReferenceId: original.id,
    sourceImagePath: input.sourceImagePath || (promptData.sourceImagePath as string | undefined),
    characterImagePath: input.characterImagePath || (promptData.characterImagePath as string | undefined),
    textureImagePath: promptData.textureImagePath as string | undefined,
    prompt: promptData.userPrompt as string | undefined,
    options: { outputCount: (options.outputCount as number | undefined) ?? 2 },
  });
}
```

Remove the current OpenAI rejection at lines 604-606 and keep Gemini/OpenAI lineage separated downstream.

---

### `apps/api/src/services/generation-continuation.service.ts` (optional service, request-response + CRUD + file-I/O)

**Analog:** `apps/api/src/services/generation.service.ts`; `apps/api/src/routes/edit.routes.ts`

Use this optional file only if edit/regenerate/style-copy branching becomes too large for existing route/service files.

**Service class shape to copy** (generation service lines 212-216, 430-450):
```ts
export class GenerationService {
  async create(userId: string, input: CreateGenerationInput): Promise<Generation> {
    // service owns authorization, validation, persistence, and queue enqueue
  }

  async updateOpenAIMetadata(generationId: string, metadata: OpenAIMetadata): Promise<void> {
    await prisma.generation.update({ where: { id: generationId }, data: { providerTrace } });
  }
}
```

**Edit lifecycle to copy** (edit route lines 32-58, 78-140):
```ts
const generation = await generationService.getById(user.id, generationId);
if (!generation) return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND' } });

const selectedImage = generation.images.find((img) => img.isSelected);
if (!selectedImage) return reply.code(400).send({ success: false, error: { code: 'NO_SELECTED_IMAGE' } });

const newGeneration = await prisma.generation.create({
  data: {
    projectId: generation.projectId,
    sourceImageId: selectedImage.id,
    status: 'completed',
    provider: generation.provider,
    providerModel: generation.providerModel,
    completedAt: new Date(),
  },
});
```

---

### `apps/api/src/services/openai-image.service.ts` (service, external request-response + file-I/O + transform)

**Analog:** `apps/api/src/services/openai-image.service.ts`

**Imports/result metadata shape** (lines 1-41):
```ts
import OpenAI, { toFile } from 'openai';
import type { HardwareSpec } from '@mockup-ai/shared/types';

export interface OpenAIImageGenerationResult {
  images: Buffer[];
  requestIds: string[];
  responseId?: string;
  imageCallIds: string[];
  revisedPrompt?: string;
  providerTrace: Record<string, unknown>;
}
```

**Image API edit pattern** (lines 57-99):
```ts
async generateIPChange(
  apiKey: string,
  sourceImageBase64: string,
  characterImageBase64: string,
  options: OpenAIIPChangeOptions
): Promise<OpenAIImageGenerationResult> {
  const client = new OpenAI({ apiKey, maxRetries: 2, timeout: 60_000 });
  const prompt = this.buildIPChangePrompt(options);
  const quality = options.quality ?? 'medium';
  const sourceBuffer = this.decodeBase64Image(sourceImageBase64);
  const characterBuffer = this.decodeBase64Image(characterImageBase64);

  const sourceImage = await toFile(sourceBuffer, 'source-product.png', { type: 'image/png' });
  const characterImage = await toFile(characterBuffer, 'character-reference.png', { type: 'image/png' });

  const response = (await client.images.edit({
    model: this.model,
    image: [sourceImage, characterImage],
    prompt,
    quality,
    n: 2,
    size: '1024x1024',
    output_format: 'png',
  })) as OpenAIImageResponse;
}
```

**Metadata return pattern** (lines 128-143):
```ts
return {
  images,
  requestIds,
  responseId: response.id,
  imageCallIds,
  revisedPrompt: revisedPrompts[0],
  providerTrace: {
    provider: 'openai',
    model: this.model,
    endpoint: 'images.edit',
    quality,
    outputCount: images.length,
    externalRequestCount: 1,
    candidates,
  },
};
```

**Prompt builder pattern** (lines 272-301):
```ts
return `Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Image roles:
- Image 1: source product photo. Preserve the product body, camera angle, material, hardware, lighting, label placement, and product silhouette.
- Image 2: new character IP reference. Preserve this character's silhouette, proportions, facial features, colors, and recognizable details.

Must change:
- Replace the character/IP artwork on Image 1 with the character from Image 2.

Must preserve:
${preserveRules.map((rule) => `- ${rule}`).join('\n')}

Hard constraints:
- Do not add extra characters, logos, watermark, text, props, accessories, or decorative effects.
- Do not redesign the product body.`;
```

**File decoding/mime helpers** (lines 381-410):
```ts
private decodeBase64Image(value: string): Buffer {
  const normalized = value.includes(',') ? value.split(',').pop() || value : value;
  return Buffer.from(normalized, 'base64');
}

private detectMimeType(buffer: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg';
  }
  throw new Error('지원하지 않는 이미지 형식입니다');
}
```

Add Phase 10 methods beside `generateIPChange`/`generateSketchToReal`, not inside `gemini.service.ts`:
- `generatePartialEdit(...)` with `n: 1`.
- `generateStyleCopyFromLinkage(...)` using Responses API where linkage exists.
- `generateStyleCopyFromImages(...)` using selected-image fallback with `n: 2`.

---

### `apps/api/src/worker.ts` (worker, event-driven + file-I/O)

**Analog:** `apps/api/src/worker.ts`

**Imports and metadata adapter** (lines 1-24):
```ts
import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis.js';
import { geminiService } from './services/gemini.service.js';
import { openaiImageService } from './services/openai-image.service.js';
import { uploadService } from './services/upload.service.js';
import { generationService } from './services/generation.service.js';
import { adminService } from './services/admin.service.js';
import type { GenerationJobData } from './lib/queue.js';
import type { OpenAIImageGenerationResult } from './services/openai-image.service.js';

const toOpenAIMetadataPayload = (metadata: OpenAIImageGenerationResult) => ({
  requestIds: metadata.requestIds,
  responseId: metadata.responseId,
  imageCallIds: metadata.imageCallIds,
  revisedPrompt: metadata.revisedPrompt,
  providerTrace: metadata.providerTrace,
});
```

**Provider source-of-truth guard** (lines 73-94):
```ts
const generation = await generationService.getById(userId, generationId);
if (!generation) {
  throw new Error('생성 기록을 찾을 수 없습니다');
}

if (job.data.provider !== generation.provider) {
  throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}

const provider = generation.provider;
const mode = generation.mode;
const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(provider);
await generationService.updateStatus(generationId, 'processing');
```

**OpenAI dispatch pattern to extend** (lines 119-150, 233-258):
```ts
if (mode === 'ip_change') {
  if (!sourceImageBase64 || !characterImageBase64) {
    throw new Error('IP 변경에는 원본 이미지와 캐릭터 이미지가 필요합니다');
  }

  if (provider === 'openai') {
    if (job.data.styleReferenceId) {
      throw new Error('OpenAI IP 변경 v2는 스타일 참조를 지원하지 않습니다');
    }

    await adminService.incrementCallCount(provider, activeKeyId);
    const result = await openaiImageService.generateIPChange(
      activeApiKey,
      sourceImageBase64,
      characterImageBase64,
      { preserveStructure: options.preserveStructure, quality: options.quality }
    );
    generatedImages = result.images;
    openAIMetadata = result;
  }
}
```

Phase 10 should replace the style-reference rejection for OpenAI with a separate OpenAI style-copy branch before any Gemini `thoughtSignature` parsing.

**Gemini style-copy branch to keep isolated** (lines 150-190):
```ts
} else if (job.data.styleReferenceId) {
  const reference = await generationService.getById(userId, job.data.styleReferenceId);
  if (!reference) {
    throw new Error('스타일 참조 생성 기록을 찾을 수 없습니다');
  }

  const signatureData = parseThoughtSignatures(reference.thoughtSignatures);
  const signature = signatureData[selectedIndex >= 0 ? selectedIndex : 0] || signatureData[0];
  if (!signature) {
    throw new Error('스타일 참조 thoughtSignature가 없습니다');
  }

  const result = await geminiService.generateWithStyleCopy(...);
  generatedImages = result.images;
  thoughtSignatures = result.signatures;
}
```

**Save/status/error pattern** (lines 285-353):
```ts
if (openAIMetadata) {
  await generationService.updateOpenAIMetadata(generationId, toOpenAIMetadataPayload(openAIMetadata));
  openAIMetadataSaved = true;
}

await generationService.deleteGeneratedOutputImages(generationId);

for (let i = 0; i < processedImages.length; i++) {
  const result = await uploadService.saveGeneratedImage(userId, projectId, generationId, image.buffer, i);
  await generationService.saveGeneratedImage(
    generationId,
    result.filePath,
    result.thumbnailPath,
    result.metadata,
    { hasTransparency: image.hasTransparency, isSelected: i === 0 }
  );
}

if (thoughtSignatures.length > 0) {
  await generationService.updateThoughtSignatures(generationId, thoughtSignatures);
}
await generationService.updateStatus(generationId, 'completed');
```

---

### `apps/api/src/lib/queue.ts` (utility/config, event-driven)

**Analog:** `apps/api/src/lib/queue.ts`

**Job payload pattern** (lines 7-43):
```ts
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  provider: 'gemini' | 'openai';
  providerModel: string;
  styleReferenceId?: string;
  sourceImagePath?: string;
  characterImagePath?: string;
  textureImagePath?: string;
  prompt?: string;
  options: {
    preserveStructure: boolean;
    transparentBackground: boolean;
    preserveHardware?: boolean;
    fixedBackground?: boolean;
    fixedViewpoint?: boolean;
    removeShadows?: boolean;
    userInstructions?: string;
    quality?: 'low' | 'medium' | 'high';
    outputCount: number;
  };
}
```

**Queue config/enqueue pattern** (lines 49-68):
```ts
export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export async function addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  return generationQueue.add('generate', data, { priority: 1 });
}
```

Add only the minimum fields Phase 10 needs, such as selected style `imageId` or `copyTarget`, and keep `provider`/`providerModel` required.

---

### `apps/api/src/services/__tests__/generation.service.test.ts` (test, CRUD + queue)

**Analog:** `apps/api/src/services/__tests__/generation.service.test.ts`

**Mock setup pattern** (lines 1-41):
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    project: { findFirst: vi.fn() },
    generation: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    generatedImage: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    imageHistory: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../lib/queue.js', () => ({
  addGenerationJob: vi.fn(),
}));
```

**Provider-persist-and-enqueue assertions** (lines 93-131):
```ts
await generationService.create('u1', {
  projectId: 'proj1',
  mode: 'ip_change',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  sourceImagePath: 'uploads/u1/proj1/source.png',
  characterImagePath: 'characters/u1/character.png',
  options: {
    preserveStructure: true,
    transparentBackground: false,
    quality: 'high',
    outputCount: 2,
  },
});

expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.options).toMatchObject({
  quality: 'high',
  outputCount: 2,
});
expect(vi.mocked(addGenerationJob).mock.calls[0][0].options).toMatchObject({
  quality: 'high',
  outputCount: 2,
});
```

**OpenAI metadata assertions** (lines 396-425):
```ts
await generationService.updateOpenAIMetadata('gen1', {
  requestIds: ['req_1', 'req_2'],
  responseId: 'resp_1',
  imageCallIds: ['img_1', 'img_2'],
  revisedPrompt: 'revised prompt',
  providerTrace: {
    provider: 'openai',
    model: 'gpt-image-2',
    endpoint: 'images.edit',
  },
});

expect(vi.mocked(prisma.generation.update)).toHaveBeenCalledWith({
  where: { id: 'gen1' },
  data: {
    openaiRequestId: 'req_1,req_2',
    openaiResponseId: 'resp_1',
    openaiImageCallId: 'img_1,img_2',
    openaiRevisedPrompt: 'revised prompt',
    providerTrace: { provider: 'openai', model: 'gpt-image-2', endpoint: 'images.edit' },
  },
});
```

**Current blocker tests to replace** (lines 688-745):
```ts
it('rejects OpenAI v2 style copy before enqueueing a failing worker job', async () => {
  await expect(
    generationService.copyStyle('u1', 'gen1', { characterImagePath: 'characters/u1/character.png' })
  ).rejects.toThrow('OpenAI IP 변경 v2는 스타일 복사를 지원하지 않습니다');
});

it('rejects OpenAI v2 regeneration before enqueueing a failing worker job', async () => {
  await expect(generationService.regenerate('u1', 'gen1')).rejects.toThrow(
    'OpenAI IP 변경 v2는 동일 조건 재생성을 지원하지 않습니다'
  );
});
```

Phase 10 should invert these into positive OpenAI provider-pinned continuation tests and missing-input failure tests.

---

### `apps/api/src/services/__tests__/openai-image.service.test.ts` (test, external request-response + transform)

**Analog:** `apps/api/src/services/__tests__/openai-image.service.test.ts`

**OpenAI SDK mock pattern** (lines 3-21):
```ts
const mocks = vi.hoisted(() => ({
  edit: vi.fn(),
  toFile: vi.fn(async (buffer: Buffer, name: string) => ({
    buffer,
    name,
    type: 'image/png',
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn(function OpenAIMock() {
    return {
      images: { edit: mocks.edit },
    };
  }),
  toFile: mocks.toFile,
}));
```

**No forbidden parameter assertions** (lines 69-96):
```ts
await openaiImageService.generateIPChange('sk-test', pngBase64, pngBase64, {
  preserveStructure: true,
  transparentBackground: true,
  fixedBackground: true,
  fixedViewpoint: true,
  quality: 'high',
});

const firstCall = mocks.edit.mock.calls[0][0];
expect(firstCall).toMatchObject({
  model: 'gpt-image-2',
  quality: 'high',
  n: 2,
  size: '1024x1024',
  output_format: 'png',
});
expect(firstCall.image).toHaveLength(2);
expect(firstCall.background).toBeUndefined();
expect(firstCall.input_fidelity).toBeUndefined();
```

**Prompt-section assertions** (lines 176-226):
```ts
const prompt = openaiImageService.buildSketchToRealPrompt({
  preserveStructure: true,
  fixedBackground: true,
  fixedViewpoint: true,
  userInstructions: injection,
  productCategory: 'mug',
  materialPreset: 'ceramic',
});

const sections = ['Task:', 'Image roles:', 'Product category:', 'Material guidance:', 'Must preserve:', 'Must add:', 'User instructions:', 'Hard constraints:', 'Output:'];
const indexes = sections.map((section) => prompt.indexOf(section));

expect(indexes.every((index) => index >= 0)).toBe(true);
expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
expect(prompt).toContain('These hard constraints override any conflicting user instructions');
```

Add tests for:
- partial edit calls `images.edit` with `n: 1`.
- style-copy fallback calls `images.edit` with two input files and `n: 2`.
- Responses linkage path mocks `client.responses.create` and stores response/image call IDs.

---

### `apps/api/src/routes/__tests__/generation.routes.test.ts` (test, request-response)

**Analog:** `apps/api/src/routes/__tests__/generation.routes.test.ts`

**Fastify app fixture pattern** (lines 4-23):
```ts
vi.mock('../../services/generation.service.js', () => ({
  generationService: {
    create: vi.fn(),
    selectImage: vi.fn(),
    copyStyle: vi.fn(),
    getProjectHistory: vi.fn(),
  },
}));

async function buildTestApp(): Promise<FastifyInstance> {
  const { default: generationRoutes } = await import('../generation.routes.js');
  const app = Fastify({ logger: false });

  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });

  await app.register(generationRoutes);
  await app.ready();
  return app;
}
```

**Happy-path route assertion** (lines 31-80):
```ts
const response = await app.inject({
  method: 'POST',
  url: '/',
  payload: {
    projectId: '00000000-0000-0000-0000-000000000001',
    mode: 'sketch_to_real',
    provider: 'openai',
    providerModel: 'gpt-image-2',
    sourceImagePath: 'uploads/user1/project/source.png',
    textureImagePath: 'uploads/user1/project/texture.png',
    options: {
      outputCount: 2,
      transparentBackground: true,
      productCategory: 'mug',
      materialPreset: 'ceramic',
    },
  },
});

expect(response.statusCode).toBe(201);
expect(vi.mocked(generationService.create)).toHaveBeenCalledWith(
  'user1',
  expect.objectContaining({
    mode: 'sketch_to_real',
    provider: 'openai',
    providerModel: 'gpt-image-2',
  })
);
```

**Invalid payload assertion** (lines 229-267):
```ts
const response = await app.inject({
  method: 'POST',
  url: '/00000000-0000-0000-0000-000000000001/copy-style',
  payload: { characterImagePath: 123 },
});

expect(response.statusCode).toBe(400);
expect(JSON.parse(response.body)).toMatchObject({
  success: false,
  error: { code: 'INVALID_REQUEST' },
});
expect(vi.mocked(generationService.copyStyle)).not.toHaveBeenCalled();
```

---

### `apps/api/src/routes/__tests__/edit.routes.test.ts` (test, request-response + file-I/O)

**Analog:** `apps/api/src/routes/__tests__/generation.routes.test.ts`; target route `apps/api/src/routes/edit.routes.ts`

Copy the Fastify fixture from `generation.routes.test.ts` lines 13-23, but register `edit.routes.ts`.

**Route fixture pattern**:
```ts
async function buildTestApp(): Promise<FastifyInstance> {
  const { default: editRoutes } = await import('../edit.routes.js');
  const app = Fastify({ logger: false });
  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });
  await app.register(editRoutes);
  await app.ready();
  return app;
}
```

**Target behavior to test from route analog** (edit route lines 32-58, 134-146):
```ts
// get source generation through generationService.getById
// fail 404 when generation is missing
// fail 400 when selected image is missing
// for provider openai, call OpenAI edit path rather than UNSUPPORTED_PROVIDER_EDIT
// return 201 { success: true, data: { generationId, message } }
// return structured { success: false, error: { code, message } } on failure
```

---

### `apps/api/src/__tests__/worker.provider-continuation.test.ts` (test, event-driven + file-I/O)

**Analog:** No close existing worker test.

Use these partial patterns:
- mock style from `apps/api/src/services/__tests__/generation.service.test.ts` lines 3-41.
- provider guard and dispatch targets from `apps/api/src/worker.ts` lines 73-94, 119-150, 150-190, 285-353.

**No close analog reason:** There is no current worker unit test file or extracted worker helper. Planner should either extract dispatch logic into a testable helper or add a worker-adjacent test with mocked BullMQ dependencies.

**Required assertions:**
```ts
// OpenAI job with styleReferenceId does not parse reference.thoughtSignatures.
// OpenAI style-copy with linkage calls openaiImageService linkage method.
// OpenAI style-copy without linkage calls selected-image fallback method.
// Gemini style-copy still requires thoughtSignature and calls geminiService.generateWithStyleCopy.
// Queue provider/providerModel mismatch throws before any vendor call.
```

## Shared Patterns

### Authentication

**Source:** `apps/api/src/routes/generation.routes.ts` lines 186-188; `apps/api/src/routes/edit.routes.ts` lines 19-21; `apps/api/src/plugins/auth.plugin.ts` lines 23-67

**Apply to:** All API route files.

```ts
const generationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);
```

```ts
fastify.decorate(
  'authenticate',
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('인증 토큰이 필요합니다');
      }
      const user = await authService.getUserFromToken(token);
      (request as any).user = user;
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message },
      });
    }
  }
);
```

### API Response Shape

**Source:** `apps/api/src/routes/generation.routes.ts` lines 176-180, 211-227, 333-348

**Apply to:** Generation, edit, copy-style, upload route changes.

```ts
return reply.code(201).send({
  success: true,
  data: {
    id: generation.id,
    status: generation.status,
    provider: generation.provider,
    providerModel: generation.providerModel,
  },
});

return reply.code(statusCode).send({
  success: false,
  error: { code: 'REGENERATE_FAILED', message },
});
```

### Provider Source Of Truth

**Source:** `apps/api/src/worker.ts` lines 73-94; `apps/api/src/services/generation.service.ts` lines 456-508

**Apply to:** Regenerate, edit, style copy, worker dispatch.

```ts
const generation = await generationService.getById(userId, generationId);
if (!generation) {
  throw new Error('생성 기록을 찾을 수 없습니다');
}

if (job.data.provider !== generation.provider) {
  throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}
```

### Storage Path Ownership

**Source:** `apps/api/src/services/upload.service.ts` lines 45-61; `apps/api/src/services/generation.service.ts` lines 67-110

**Apply to:** Style-copy target upload paths, selected style image fallback, regeneration stored inputs.

```ts
export function assertStoragePathWithinPrefixes(
  relativePath: string,
  allowedPrefixes: string[],
  message = '파일 경로 권한이 없습니다'
): string {
  const normalized = normalizeStoragePath(relativePath);
  const normalizedPrefixes = allowedPrefixes.map((prefix) => normalizeStoragePath(prefix));
  const allowed = normalizedPrefixes.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );

  if (!allowed) {
    throw new Error(message);
  }

  return normalized;
}
```

### OpenAI Metadata

**Source:** `apps/api/src/services/openai-image.service.ts` lines 34-41, 128-143; `apps/api/src/services/generation.service.ts` lines 430-450

**Apply to:** OpenAI regeneration, partial edit, style copy.

```ts
export interface OpenAIImageGenerationResult {
  images: Buffer[];
  requestIds: string[];
  responseId?: string;
  imageCallIds: string[];
  revisedPrompt?: string;
  providerTrace: Record<string, unknown>;
}
```

```ts
providerTrace: {
  provider: 'openai',
  model: this.model,
  endpoint: 'images.edit',
  quality,
  outputCount: images.length,
  externalRequestCount: 1,
  candidates,
}
```

### Prompt Preservation

**Source:** `apps/api/src/services/openai-image.service.ts` lines 272-301 and 342-378; `.codex/skills/mockup-precision-edit/SKILL.md`

**Apply to:** Partial edit and style copy prompt builders.

```ts
return `Task:
Edit the image by changing only this requested target:
${userPrompt}

Must preserve exactly:
- Product body, camera angle, crop, background rule, lighting, text, labels, hardware, and non-target details.
- Overall composition, scale, saturation, contrast, sharpness, and image quality.

Hard constraints:
- Do not add or remove objects.
- Do not restyle the image.
- Do not change surrounding areas.`;
```

### UI Product Metadata Boundary

**Source:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` lines 484-490; `apps/web/src/app/projects/[id]/history/page.tsx` lines 169-173

**Apply to:** Result page, history page, style-copy page.

```tsx
<span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
  {item.provider === 'openai' ? 'v2' : 'v1'}
</span>
```

Do not render raw `Gemini`, `OpenAI`, `GPT Image 2`, `gpt-image-2`, `provider`, or `providerModel` in normal product UI.

### Local UI Controls

**Source:** `apps/web/src/components/ui/button.tsx` lines 10-36, 50-82; `apps/web/src/components/ui/image-uploader.tsx` lines 29-43, 175-260

**Apply to:** Style-copy page upload/action controls and result actions.

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: { primary: 'bg-brand-500 text-white', secondary: 'bg-transparent text-[var(--text-primary)] border border-[var(--border-default)]', ghost: 'bg-transparent text-[var(--text-secondary)]' },
      size: { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4', lg: 'h-12 px-6 text-base', icon: 'h-10 w-10' },
    },
  }
);
```

```tsx
<ImageUploader
  label="새 캐릭터 이미지"
  description="교체할 캐릭터/IP 이미지를 업로드하세요"
  onUpload={handleTargetUpload}
  onRemove={handleTargetRemove}
  onError={setError}
  preview={targetPreview}
/>
```

### Vitest Route/Service Tests

**Source:** `apps/api/src/routes/__tests__/generation.routes.test.ts` lines 4-23; `apps/api/src/services/__tests__/generation.service.test.ts` lines 1-41

**Apply to:** New edit route test, service continuation tests, OpenAI image tests.

```ts
vi.mock('../../services/generation.service.js', () => ({
  generationService: {
    create: vi.fn(),
    selectImage: vi.fn(),
    copyStyle: vi.fn(),
    getProjectHistory: vi.fn(),
  },
}));

async function buildTestApp(): Promise<FastifyInstance> {
  const { default: generationRoutes } = await import('../generation.routes.js');
  const app = Fastify({ logger: false });
  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });
  await app.register(generationRoutes);
  await app.ready();
  return app;
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/api/src/__tests__/worker.provider-continuation.test.ts` | test | event-driven, file-I/O | No existing worker test harness or extracted worker helper exists. Use partial patterns from `worker.ts`, `generation.service.test.ts`, and `openai-image.service.test.ts`, or extract dispatch logic first. |

## Metadata

**Analog search scope:** `apps/api/src`, `apps/web/src`, `packages/shared/src`, `.codex/skills`, phase documents under `.planning/phases/10-provider-aware-result-continuation`.

**Files scanned:** 87 source files via `rg --files apps/api/src apps/web/src packages/shared/src`, plus 7 project skill indexes and 4 phase context files.

**Project instructions:** No root `AGENTS.md` file exists in the workspace. User-supplied AGENTS directives were applied: user-facing responses in Korean, technical terms/code identifiers in English, and no Claude/`~/.claude` workflow edits.

**Project skills loaded:** `mockup-ip-change`, `mockup-openai-cli-smoke`, `mockup-openai-dual-provider`, `mockup-openai-image-runtime`, `mockup-openai-workflows`, `mockup-precision-edit`, `mockup-sketch-realization`.

**Pattern extraction date:** 2026-04-28
