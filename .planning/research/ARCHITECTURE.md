# Architecture Research

**Domain:** MockupAI dual-provider image architecture (`Gemini` + `OpenAI GPT Image 2`)  
**Researched:** 2026-04-23  
**Overall confidence:** HIGH

## Executive Recommendation

이 milestone의 핵심 아키텍처 변화는 "새 시스템 추가"가 아니라 "기존 generation pipeline에 `provider` 축을 추가"하는 것이다. 현재 구조는 `mode` 중심이다. 다음 milestone에서는 `provider -> mode -> service method` 순으로 분기해야 한다.

권장 구조는 다음과 같다.

- frontend는 기존 기능 페이지를 유지하면서 provider-aware 진입점을 추가
- API contract는 `provider`를 필수로 받음
- `Generation`과 `ApiKey`가 provider-aware가 됨
- BullMQ queue는 유지하되 job payload에 `provider`를 추가
- worker는 `geminiService`와 `openaiImageService` 사이를 provider 기준으로 라우팅
- follow-up flows (`edit`, `regenerate`, `style copy`)는 원본 generation의 provider를 그대로 따라감

## Current Architecture Snapshot

현재 repo의 흐름:

```text
Next.js project pages
  -> apps/web/src/lib/api.ts
  -> Fastify generation/edit routes
  -> generationService.create()
  -> BullMQ generation queue
  -> apps/api/src/worker.ts
  -> geminiService only
  -> uploadService + GeneratedImage persistence
```

이 구조는 Gemini 단일 provider일 때는 충분했지만, OpenAI를 추가하면 아래 지점이 병목이 된다.

- request payload에 provider가 없음
- queue payload에 provider가 없음
- worker가 `geminiService`에 직접 결합
- `edit.routes.ts`가 항상 Gemini 사용
- `ApiKey`가 전역 단일 active key 모델
- `Generation`이 provider/model/debug trace를 저장하지 않음

## Target Architecture

```text
Project page (Gemini version / OpenAI version)
  -> shared API client with provider
  -> Fastify routes
  -> generationService (provider-neutral orchestration)
  -> BullMQ generation queue with provider-aware payload
  -> worker dispatch
       -> geminiService
       -> openaiImageService
  -> uploadService + image persistence
  -> provider/model/trace metadata stored on Generation
```

## Recommended File-Level Changes

### Frontend

| File | Change | Why |
|------|--------|-----|
| `apps/web/src/app/projects/[id]/page.tsx` | OpenAI version entry points 추가 | 기존 Gemini 메뉴 옆에 같은 기능군을 provider별로 노출 |
| `apps/web/src/app/projects/[id]/ip-change/page.tsx` | provider-aware variant 또는 parallel page 지원 | 같은 form contract를 유지하면서 provider를 넘겨야 함 |
| `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx` | provider-aware variant 또는 parallel page 지원 | same |
| `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | provider badge, provider-aware edit/regenerate/style copy | 후속 action이 원본 provider를 따라가야 함 |
| `apps/web/src/lib/api.ts` | generation/edit DTO에 `provider`, `model` metadata 반영 | UI와 backend가 같은 contract를 공유해야 함 |

### API / Worker

| File | Change | Why |
|------|--------|-----|
| `apps/api/src/routes/generation.routes.ts` | create, regenerate, copy-style payload에 `provider` 추가 | 초기 generate와 follow-up action 모두 provider 고정이 필요 |
| `apps/api/src/routes/edit.routes.ts` | selected generation의 provider 기준으로 runtime 분기 | 현재는 OpenAI 결과도 Gemini edit로 빠질 수 있음 |
| `apps/api/src/services/generation.service.ts` | `provider`, `providerModel`, `providerTrace` 저장 | history/debug/regenerate source of truth |
| `apps/api/src/lib/queue.ts` | `GenerationJobData.provider` 추가 | worker dispatch의 필수 입력 |
| `apps/api/src/worker.ts` | provider dispatch layer 추가 | Gemini/OpenAI service split |
| `apps/api/src/services/openai-image.service.ts` | 신규 추가 | OpenAI 전용 service |
| `apps/api/src/services/admin.service.ts` | provider-aware API key CRUD/activation/getActive | 전역 active key 패턴 제거 |

### Shared Types / Schema

| Area | Change | Why |
|------|--------|-----|
| `packages/shared/src/types/index.ts` | `ImageProvider`, generation DTO 확장 | web/api consistency |
| `apps/api/prisma/schema.prisma` | `Generation.provider`, `Generation.providerModel`, `Generation.providerTrace`, `ApiKey.provider` | provider identity와 debug trace 저장 |

## Recommended Data Model

### `Generation`

추가 권장 필드:

```prisma
provider      String   @default("gemini")
providerModel String?  @map("provider_model")
providerTrace Json?    @map("provider_trace")
```

권장 의미:

- `provider`: `gemini` | `openai`
- `providerModel`: `gemini-3-pro-image-preview`, `gpt-image-2`, 또는 top-level transport model
- `providerTrace`: provider-specific debug and continuation metadata

OpenAI trace 예시:

```json
{
  "endpoint": "images.edit",
  "imageModel": "gpt-image-2",
  "transportModel": null,
  "requestId": "req_...",
  "responseId": null,
  "imageGenerationCallIds": [],
  "revisedPrompt": null
}
```

Responses API 예시:

```json
{
  "endpoint": "responses.create",
  "imageModel": "gpt-image-2",
  "transportModel": "gpt-5.4",
  "requestId": "req_...",
  "responseId": "resp_...",
  "previousResponseId": "resp_prev",
  "imageGenerationCallIds": ["ig_..."],
  "revisedPrompt": "..."
}
```

### `ApiKey`

현재 전역 단일 active key 구조를 provider별 active key 구조로 바꾸는 것이 필수다.

권장 필드:

```prisma
provider String @default("gemini")
```

운영 규칙:

- provider당 active key는 최대 1개
- `getActiveApiKey(provider)` 형태로 조회
- admin UI는 provider 탭/필터를 제공

## Provider-Aware Request Flows

### 1. New generation

```text
User chooses OpenAI IP Change
  -> frontend submits { mode: ip_change, provider: openai, ... }
  -> generationService persists provider/model seed
  -> queue payload includes provider
  -> worker dispatches to openaiImageService.generateIPChange()
  -> output saved to existing image/history flow
```

### 2. Partial edit

```text
User opens generation detail
  -> detail API returns provider
  -> edit request targets generationId
  -> edit.routes.ts loads generation
  -> branch by generation.provider
  -> call geminiService or openaiImageService
```

### 3. Regenerate

```text
User clicks regenerate
  -> generationService loads original generation
  -> copies original provider + original inputs/options
  -> new generation record created with same provider
  -> worker runs matching provider
```

### 4. Style copy

```text
User selects approved result
  -> styleReferenceId points to source generation
  -> source generation provider is loaded
  -> if provider=openai, use OpenAI lineage strategy
  -> if provider=gemini, use thoughtSignature strategy
```

## Build Order Recommendation

### Phase A: Foundation

- schema changes for provider/model/trace
- shared types and API contract
- provider-aware API key model

### Phase B: Runtime

- install `openai` SDK
- add `openai-image.service.ts`
- queue payload provider
- worker dispatch

### Phase C: Core user flows

- OpenAI IP Change
- OpenAI Sketch to Real
- OpenAI history/result integration

### Phase D: Follow-up flows

- OpenAI partial edit
- OpenAI regenerate
- OpenAI style copy

### Phase E: UX and ops

- provider badges
- admin provider-aware key UI
- debug metadata surfacing
- parity verification

## What Not To Do

| Avoid | Why |
|-------|-----|
| OpenAI microservice 분리 | 현재 규모에 비해 과도하고 existing worker flow와 어긋남 |
| separate queue per provider | provider field로 충분하며 운영 복잡도만 증가 |
| `gemini.service.ts` 안에 OpenAI code 혼합 | provider drift와 maintenance cost 증가 |
| OpenAI result를 Gemini follow-up으로 암묵 fallback | 사용자 신뢰를 깨뜨림 |
| OpenAI lineage를 `thoughtSignatures`에 억지 저장 | provider-specific continuation model이 다름 |

## Sources

- `apps/api/prisma/schema.prisma`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/services/generation.service.ts`
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/edit.routes.ts`
- `apps/api/src/worker.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/projects/[id]/ip-change/page.tsx`
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx`
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- `.codex/skills/mockup-openai-dual-provider/SKILL.md`
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md`
