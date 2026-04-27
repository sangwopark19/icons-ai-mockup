# Phase 8: OpenAI IP Change Parity - Pattern Map

**Created:** 2026-04-24
**Status:** Ready for planning

## Purpose

Map Phase 8 files to existing code analogs so implementation plans can reuse local patterns instead of inventing new architecture.

## Data Flow

```text
Project page
  -> IP 변경 v2 route
  -> upload source image + character image
  -> POST /api/generations { provider: "openai", providerModel: "gpt-image-2", mode: "ip_change" }
  -> GenerationService persists provider-aware generation and queue job
  -> Worker validates queued provider/model against DB
  -> OpenAI image service runs Image API edit twice or returns two outputs
  -> uploadService saves output images
  -> result page polls /api/generations/:id
  -> user selects candidate, saves to history, reopens, downloads
```

## File Pattern Map

| Target file | Role | Closest analog | Pattern to reuse |
|-------------|------|----------------|------------------|
| `apps/api/src/services/openai-image.service.ts` | New OpenAI Image API runtime | `apps/api/src/services/gemini.service.ts` | Dedicated service singleton, `generateIPChange()` method returning `{ images: Buffer[] }`, option-to-prompt builder, no shared provider blob |
| `apps/api/src/services/__tests__/openai-image.service.test.ts` | Runtime unit tests | `apps/api/src/services/__tests__/generation.service.test.ts`, `admin.service.test.ts` | Vitest mocks, assert call shape and error behavior without real API key |
| `apps/api/src/worker.ts` | Provider dispatch | Existing provider/model validation at top of worker | Keep persisted-vs-queued validation before vendor calls; branch by `provider` and `mode`; keep Gemini path unchanged |
| `apps/api/src/services/generation.service.ts` | Persistence and queue creation | Existing `resolveGenerationProvider()`, `create()`, `regenerate()`, `copyStyle()` | Persist OpenAI defaults; keep Phase 8 unsupported follow-ups from executing or ensure UI blocks them |
| `apps/api/src/routes/generation.routes.ts` | Create/detail/history API | Existing Zod create schema and `{ success, data }` response shape | Accept provider/model already; add quality option only through validated options if needed |
| `apps/api/src/services/upload.service.ts` | Save outputs/post-process | Existing `saveGeneratedImage()` and `sharp` pipeline | Save PNG outputs and thumbnails; add background-removal/post-process helper here or adjacent service only if implemented concretely |
| `apps/web/src/app/projects/[id]/page.tsx` | Project workflow entry | Existing card + sidebar link structure | Add sibling v1/v2 entries; keep route `/ip-change`; add `/ip-change/openai`; preserve dark Tailwind tokens |
| `apps/web/src/app/projects/[id]/ip-change/page.tsx` | Existing Gemini v1 form | Itself | Preserve existing route and Gemini payload; label as v1 if touched |
| `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` | New OpenAI v2 form | Existing `ip-change/page.tsx` | Same upload/options flow with v2 defaults, hidden provider payload, quality segmented control |
| `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | Result lifecycle | Existing polling/select/save/download/follow-up actions | Add provider fields, v2 badge, exact two candidate labels, disabled v2 follow-up actions |
| `apps/web/src/app/projects/[id]/history/page.tsx` | History lifecycle | Existing grid cards and reopen link | Add provider field to `HistoryItem`, render v1/v2 badge, keep link to existing result route |
| `apps/web/src/lib/api.ts` | Client types | Existing `AdminProvider`, `AdminGeneration` and request helper patterns | Add product generation/provider types as needed; avoid leaking provider labels into product copy |
| `apps/api/package.json`, `pnpm-lock.yaml` | Dependency | Existing API package dependency layout | Add `openai` only to `@mockup-ai/api` |

## Backend Excerpts To Preserve

### Provider/model validation before dispatch

`apps/api/src/worker.ts` already validates both fields:

```ts
if (job.data.provider !== generation.provider) {
  throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}
```

Plan requirement: keep these checks before any Gemini/OpenAI runtime call.

### Current OpenAI unsupported branch

```ts
if (provider === 'openai') {
  throw new Error('OpenAI 이미지 런타임은 아직 지원되지 않습니다.');
}
```

Plan requirement: replace this with OpenAI `ip_change` dispatch only. Keep other OpenAI modes blocked until their phases.

### Generation provider defaults

`apps/api/src/services/generation.service.ts`:

```ts
const DEFAULT_PROVIDER_MODELS: Record<GenerationProvider, string> = {
  gemini: 'gemini-3-pro-image-preview',
  openai: 'gpt-image-2',
};
```

Plan requirement: v2 form should send `provider: "openai"` and either omit `providerModel` to use this default or send exact `gpt-image-2`.

### Existing save lifecycle

Result page already uses:

```ts
POST /api/generations/:id/select
POST /api/images/:id/save
GET /api/images/:id/download
```

Plan requirement: Phase 8 should reuse these endpoints for OIP-03.

## Frontend Patterns To Preserve

### Auth and route guard pattern

Project pages use:

```ts
const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/login');
  }
}, [authLoading, isAuthenticated, router]);
```

Plan requirement: new v2 route should preserve this pattern.

### Upload pattern

Existing IP Change form uploads:

```ts
const endpoint =
  type === 'source' ? `/api/upload/image?projectId=${projectId}` : '/api/upload/character';
```

Plan requirement: v2 route should keep this upload path and submit only storage paths to generation create.

### Result polling pattern

Result page polls every 2 seconds until `completed` or `failed`.

Plan requirement: v2 result should reuse this lifecycle and only change labels/actions based on provider.

## Prompt Pattern

OpenAI IP Change prompt should use the local `mockup-ip-change` shape:

```text
Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Image roles:
- Image 1: source product photo...
- Image 2: new character IP reference...

Must change:
- Replace only the character/IP artwork on Image 1...

Must preserve:
- Product geometry, dimensions, camera viewpoint, crop, perspective, material...

Hard constraints:
- Do not add extra characters, logos, watermark, text, props...
```

Plan requirement: tests must assert these section labels or equivalent exact phrases.

## Anti-Patterns

- Do not put OpenAI logic inside `gemini.service.ts`.
- Do not use `isOpenAI` booleans.
- Do not show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` in product workflow UI.
- Do not remove the v1 route.
- Do not execute v2 partial edit/style-copy/regenerate in Phase 8.
- Do not send `background: "transparent"` or `input_fidelity` to `gpt-image-2`.
- Do not assume schema changes are needed; Phase 7 already added provider fields.

## PATTERN MAPPING COMPLETE
