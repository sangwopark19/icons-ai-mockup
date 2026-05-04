# Phase 9: OpenAI Sketch to Real Parity - Pattern Map

**Created:** 2026-04-27
**Status:** Ready for planning

## Purpose

Map Phase 9 files to existing code analogs so execution plans can reuse local patterns from Phase 8 and the current Gemini Sketch to Real flow.

## Data Flow

```text
Project page
  -> 스케치 실사화 v2 route
  -> upload sketch image + optional texture/material reference
  -> POST /api/generations { provider: "openai", providerModel: "gpt-image-2", mode: "sketch_to_real" }
  -> GenerationService validates paths, persists options, enqueues provider-aware job
  -> Worker validates queued provider/model against DB
  -> OpenAI image service runs Image API edit with Image 1 sketch and optional Image 2 texture reference
  -> if transparentBackground is requested, post-process opaque output into transparent PNG
  -> uploadService saves output images and thumbnails
  -> result page polls /api/generations/:id
  -> user selects candidate, saves to history, reopens, downloads
```

## File Pattern Map

| Target file | Role | Closest analog | Pattern to reuse |
|-------------|------|----------------|------------------|
| `apps/web/src/app/projects/[id]/page.tsx` | Project workflow entry | Existing `IP 변경 v1/v2` entries | Add sibling Sketch v1/v2 entries; keep route `/sketch-to-real`; add `/sketch-to-real/openai`; preserve dark Tailwind tokens |
| `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx` | Existing Gemini v1 form | Itself | Preserve existing route and payload; label as v1 only if touched |
| `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` | New OpenAI v2 form | `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` | Reuse auth/upload/error/quality/options/submit patterns with Sketch-specific fields |
| `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | Result lifecycle | Existing Phase 8 v2 result logic | Generalize v2 detection to OpenAI `sketch_to_real`; route condition edit back to v2 Sketch; keep save/download/select lifecycle |
| `apps/web/src/app/projects/[id]/history/page.tsx` | History lifecycle | Existing Phase 8 v2 badge pattern | Show v1/v2 badge for Sketch to Real cards and preserve result reopen link |
| `apps/web/src/lib/api.ts` | Client types | Existing `GenerationDetail`, `HistoryGenerationItem` | Add typed Sketch option helpers only if useful; provider/model already exposed |
| `apps/api/src/routes/generation.routes.ts` | Create/detail/history API | Existing Zod create schema | Allow OpenAI `sketch_to_real`; add product/material options; keep two-output constraint |
| `apps/api/src/services/generation.service.ts` | Persistence and queue creation | Existing provider validation and path validation | Allow OpenAI `sketch_to_real`; persist/enqueue product/material options; keep provider/model defaults |
| `apps/api/src/lib/queue.ts` | Worker payload | Existing `GenerationJobData` | Add product/material option fields to queued options |
| `apps/api/src/worker.ts` | Provider dispatch | Existing OpenAI `ip_change` branch | Add OpenAI `sketch_to_real` branch after provider/model guard; keep Gemini branch unchanged |
| `apps/api/src/services/openai-image.service.ts` | OpenAI Image API runtime | Existing `generateIPChange()` | Add `generateSketchToReal()` and prompt builder beside IP Change, not in Gemini service |
| `apps/api/src/services/upload.service.ts` or new service | Transparent post-process | Existing `saveGeneratedImage()` and `sharp` usage | Implement deterministic post-process before save or explicit helper that returns final PNG buffer and transparency metadata |
| `apps/api/src/services/__tests__/openai-image.service.test.ts` | Runtime unit tests | Existing OpenAI IP Change tests | Assert edit request shape, two outputs, prompt constraints, no `background`, no `input_fidelity` |
| `apps/api/src/services/__tests__/generation.service.test.ts` | Service contract tests | Existing provider contract tests | Update unsupported OpenAI Sketch behavior to accepted behavior and transparent post-process expectations |
| `apps/api/src/routes/__tests__/generation.routes.test.ts` | Route schema tests | Existing generation route tests | Cover OpenAI Sketch create payload with product/material options |

## Backend Excerpts To Preserve

### Provider/model validation before dispatch

`apps/api/src/worker.ts`:

```ts
if (job.data.provider !== generation.provider) {
  throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}
```

Keep these checks before every Gemini/OpenAI runtime call.

### Existing OpenAI IP Change branch

`apps/api/src/worker.ts` already calls:

```ts
openaiImageService.generateIPChange(...)
```

Add a sibling `generateSketchToReal(...)` branch for `provider === 'openai' && mode === 'sketch_to_real'`. Do not merge OpenAI runtime code into `gemini.service.ts`.

### Existing OpenAI service call shape

`apps/api/src/services/openai-image.service.ts` already uses:

```ts
client.images.edit({
  model: this.model,
  image: [sourceImage, characterImage],
  prompt,
  quality,
  n: 2,
  size: '1024x1024',
  output_format: 'png',
})
```

For Sketch to Real, use `[sketchImage]` or `[sketchImage, textureImage]`, keep `n: 2`, and do not add `background` or `input_fidelity`.

### Existing save lifecycle

Result page already uses:

```ts
POST /api/generations/:id/select
POST /api/images/:id/save
GET /api/images/:id/download
```

Phase 9 should reuse these endpoints for `OSR-03`.

## Frontend Patterns To Preserve

### Auth and route guard pattern

New v2 route should preserve:

```ts
const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [authLoading, isAuthenticated, router]);
```

### Upload pattern

Existing Sketch to Real uploads sketch and optional texture through:

```ts
POST /api/upload/image?projectId=${projectId}
```

The v2 route can reuse this for both sketch and texture because both are project-owned uploads.

### Phase 8 quality control

Reuse the `QUALITY_OPTIONS` array shape from `ip-change/openai/page.tsx`:

```ts
type QualityValue = 'low' | 'medium' | 'high';
```

Labels stay Korean:

- `빠른모드`
- `균형모드`
- `퀄리티모드`

## Prompt Pattern

OpenAI Sketch to Real prompt should use this shape:

```text
Task:
Edit Image 1 into a photorealistic product mockup.

Image roles:
- Image 1: designer sketch. Treat it as the locked design spec.
- Image 2, optional: material/texture reference. Apply only material, texture, finish, and color behavior.

Product category:
[selected category or 기타 detail]

Material guidance:
[selected material or 기타 detail]

Must preserve:
- Exact layout, silhouette, proportions, face details, product construction, and perspective from Image 1.

Must add:
- Photorealistic material, lighting, surface finish, form shading, and manufacturing detail appropriate to the product category.

Hard constraints:
- Do not add new characters, text, logos, decorations, props, background objects, or scene staging.
- Do not import product shape, scene, logos, text, or props from Image 2.
- Do not change form, proportions, or face details.

Output:
- Two clean product-review mockup candidates on an opaque background.
```

## Anti-Patterns

- Do not remove or rename `/projects/:id/sketch-to-real`.
- Do not show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` in product workflow copy.
- Do not use ad hoc `isOpenAI` data model flags; use `provider`.
- Do not route OpenAI failures into Gemini.
- Do not send `background: "transparent"` or `input_fidelity` to `gpt-image-2`.
- Do not let texture reference modify product shape, character details, scene, text, logos, or props.
- Do not enable Phase 10 follow-ups for v2 in Phase 9.
- Do not modify `apps/api/prisma/schema.prisma` unless a real missing persisted field is discovered.

## PATTERN MAPPING COMPLETE
