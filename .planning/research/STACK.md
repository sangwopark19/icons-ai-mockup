# Technology Stack

**Project:** MockupAI dual-provider image runtime (`Gemini` + `OpenAI GPT Image 2`)
**Researched:** 2026-04-23
**Scope:** 기존 Gemini 구현을 유지한 채 OpenAI를 두 번째 provider로 추가하는 데 필요한 stack 변화만 정리
**Overall confidence:** HIGH

## Executive Recommendation

이 milestone은 새 framework를 도입하는 작업이 아니다. 기존 monorepo stack인 `Next.js 16 + Fastify 5 + Prisma + PostgreSQL + Redis + BullMQ + Sharp`는 그대로 유지하고, `apps/api`에 공식 `openai` Node SDK를 추가한 뒤 provider-aware routing, provider-aware API key storage, provider-aware generation metadata 저장을 넣는 것이 맞다.

핵심은 "Gemini 교체"가 아니라 "OpenAI 병렬 추가"다. 따라서 `gemini.service.ts`를 혼합 provider 서비스로 키우지 말고, `openai-image.service.ts`를 별도로 추가하고 worker와 admin API key 관리만 provider-aware로 확장해야 한다.

OpenAI 쪽 첫 구현은 현재 worker 구조와 맞는 `Image API` 중심이 맞다. 즉 `ip_change`, `sketch_to_real`, one-shot `partial edit`는 `images.edit()`로 시작하고, `style copy`처럼 Gemini의 `thoughtSignature`에 기대던 흐름만 선택적으로 `Responses API`로 추가한다. OpenAI 공식 문서는 단발 이미지 생성/편집에는 `Image API`, 대화형 반복 편집에는 `Responses API`를 권장한다.

## Repo-Specific Constraints Driving The Stack

- `apps/api/src/worker.ts`는 현재 `geminiService`와 단일 활성 API key를 하드코딩한다.
- `apps/api/src/routes/edit.routes.ts`도 부분 수정을 항상 Gemini로 보낸다.
- `apps/api/prisma/schema.prisma`의 `ApiKey`는 provider 구분이 없고, `Generation`도 provider/model 추적 컬럼이 없다.
- `Generation.thoughtSignatures`는 Gemini 전용 상태다. OpenAI state를 여기에 억지로 넣으면 안 된다.
- 현재 repo에는 OpenAI용 transparent background 후처리 stack이 없다. Gemini의 transparent 지원과 동일하게 취급하면 안 된다.

## Recommended Stack

### Must-Have Additions

| Category | Technology | Version | Purpose | Why |
|----------|------------|---------|---------|-----|
| API SDK | `openai` | `6.x` stable, current `6.34.0` on 2026-04-23 | OpenAI Images / Responses 호출 | 공식 JS/TS SDK다. `request ID`, retries, timeout, file upload helpers를 제공해서 현재 `Node 22 + Fastify` backend에 가장 자연스럽다. |
| Service split | `apps/api/src/services/openai-image.service.ts` | repo file addition | OpenAI 전용 image runtime | `gemini.service.ts`를 provider 혼합 blob으로 만들지 않고, worker dispatch를 단순하게 유지한다. |
| Provider contract | `ImageProvider` enum in `packages/shared` | repo type addition | request/response/admin payload에 provider 명시 | 생성, 재생성, 편집, 스타일 복사, admin API key 관리가 모두 provider-aware가 되어야 한다. |
| DB schema | `ApiKey.provider`, `Generation.provider`, `Generation.providerModel`, `Generation.providerTrace` | Prisma schema addition | provider별 key 선택, provider별 재생성/디버깅/히스토리 추적 | 현재 schema로는 OpenAI 요청을 같은 데이터 모델 안에서 안전하게 구분할 수 없다. |
| Worker dispatch | provider router in `apps/api/src/worker.ts` | repo runtime addition | Gemini/OpenAI 서비스 분기 | 큐와 worker는 그대로 쓰되, job payload에 provider를 넣고 dispatch만 분기하는 것이 가장 작은 변화다. |

### Recommended Data Model Changes

| Model | Change | Required | Why |
|-------|--------|----------|-----|
| `ApiKey` | `provider` enum 추가 (`gemini`, `openai`) | Yes | 현재는 활성 키가 전역 1개라서 OpenAI와 Gemini를 동시에 운영할 수 없다. |
| `ApiKey` | provider별 활성 상태 관리 | Yes | "활성 키 1개"가 아니라 "provider당 활성 키 1개"가 되어야 worker가 올바른 키를 가져온다. |
| `Generation` | `provider` enum 추가 | Yes | regenerate, edit, history, admin 모니터링에서 원본 provider를 유지해야 한다. |
| `Generation` | `providerModel` string 추가 | Yes | 어떤 모델로 생성됐는지 저장해야 같은 provider/model로 재생성이 가능하다. |
| `Generation` | `providerTrace` JSON 추가 | Yes | OpenAI `request_id`, `response.id`, `revised_prompt`, `image_generation_call_id`, endpoint type를 저장할 곳이 필요하다. |
| `Generation` | 기존 `thoughtSignatures` 유지 | Yes, backward compatibility | Gemini 히스토리를 깨지 않고 유지해야 한다. 단, OpenAI state는 여기에 저장하지 않는다. |

**Recommended `providerTrace` shape**

```ts
type ProviderTrace = {
  endpoint: 'images.edit' | 'images.generate' | 'responses.create';
  imageModel: 'gpt-image-2';
  transportModel?: 'gpt-5.4';
  requestId?: string;
  responseId?: string;
  previousResponseId?: string;
  imageGenerationCallIds?: string[];
  revisedPrompt?: string;
};
```

이 구조면 OpenAI 전용 디버깅 정보는 보존하면서 Gemini 전용 `thoughtSignatures`와 충돌하지 않는다.

### Runtime Integration Points

| File / Area | Change | Why it matters |
|-------------|--------|----------------|
| `apps/api/package.json` | `openai` 추가 | 공식 SDK 없이는 multipart image edits, Responses API, request ID 추적을 직접 구현해야 한다. |
| `apps/api/src/config/index.ts` | `OPENAI_API_KEY` optional, `OPENAI_LOG` optional, `OPENAI_TIMEOUT_MS` optional, `OPENAI_MAX_RETRIES` optional | 운영 디버깅과 smoke test에 필요하다. 단, primary key source는 DB여야 한다. |
| `apps/api/src/services/admin.service.ts` | `list/create/activate/getActive`를 provider-aware로 변경 | 현재 `getActiveApiKey()`는 Gemini 전용이다. OpenAI 추가 후에도 이 구조를 그대로 두면 잘못된 키를 쓴다. |
| `apps/api/src/lib/queue.ts` | `GenerationJobData.provider` 추가 | worker가 어떤 service를 호출할지 job 단위로 알아야 한다. |
| `apps/api/src/worker.ts` | `geminiService` 직접 호출 대신 provider dispatch | 같은 BullMQ queue를 유지하면서 provider만 분기한다. |
| `apps/api/src/routes/generation.routes.ts` | create/copy-style/regenerate payload에 provider 추가 | 재생성과 스타일 복사는 원본 provider를 따라가야 한다. |
| `apps/api/src/routes/edit.routes.ts` | edit도 generation.provider 기반으로 분기 | 현재는 Gemini 하드코딩이라 OpenAI 생성 결과를 수정할 수 없다. |
| `packages/shared/src/types/index.ts` | provider enum과 DTO 확장 | web/api/admin panel이 같은 contract를 공유해야 한다. |

### Buffer/File Handling Recommendation

OpenAI `images.edit()`는 현재 Gemini처럼 base64 중심 설계로 맞추는 것보다, worker가 `Buffer`를 읽고 provider service가 각자 변환하도록 바꾸는 편이 낫다.

- Gemini service: `Buffer -> base64`
- OpenAI service: `Buffer -> toFile(...)` 또는 `fs.ReadStream`

즉 worker를 provider-neutral하게 만들고, 변환은 provider service 내부로 내리는 것이 맞다. 지금처럼 worker에서 모든 이미지를 무조건 base64로 바꾸면 OpenAI 쪽에서 다시 파일 객체로 감싸야 해서 비효율적이다.

### OpenAI Endpoint Mapping For This Repo

| Feature | OpenAI endpoint | Must/Optional | Why |
|---------|-----------------|---------------|-----|
| `ip_change` | `client.images.edit()` | Must | 현재 worker가 single-pass, image-reference 중심이라 가장 잘 맞는다. |
| `sketch_to_real` | `client.images.edit()` | Must | sketch를 anchor image로 두고 texture reference를 추가하기 쉽다. |
| one-shot `partial edit` | `client.images.edit()` | Must | 현재 edit route가 대화형이 아니라 단발 요청이다. |
| `style copy` for OpenAI | `client.responses.create()` + `image_generation` tool | Optional in first rollout, but recommended next | Gemini `thoughtSignature` 대체가 필요하고, OpenAI는 `previous_response_id`와 image generation call linkage를 공식 지원한다. |

## Environment And Config

### Must-Have Config Changes

| Env / Config | Required | Purpose | Recommendation |
|--------------|----------|---------|----------------|
| `OPENAI_API_KEY` | Optional for runtime, useful for local smoke test | 초기 검증/비상 fallback | 운영 기본값으로 쓰지 말고 admin-managed DB key가 주 경로가 되게 한다. |
| `OPENAI_TIMEOUT_MS` | Optional | 큰 이미지 편집 요청 타임아웃 제어 | 기본값 `60000` 권장 |
| `OPENAI_MAX_RETRIES` | Optional | transient error retry | 기본값 `2` 권장 |
| `OPENAI_LOG` | Optional | SDK 로그 제어 | 기본값 `warn`, production에서 `debug` 금지 |

### Key Management Recommendation

이 repo는 이미 Gemini key를 DB에 암호화 저장하는 방향이 검증돼 있다. OpenAI도 같은 방식을 따라야 한다.

- `ENCRYPTION_KEY`는 그대로 재사용
- 새 provider를 위해 별도 암호화 라이브러리를 추가할 필요 없음
- admin UI/API는 key CRUD 시 `provider`를 받도록 확장
- "현재 활성 키" UI도 provider별로 1개씩 표시

## Storage And Observability Implications

### Keep As-Is

| Area | Decision | Why |
|------|----------|-----|
| file storage | 기존 `UPLOAD_DIR` + `uploadService` 유지 | OpenAI 추가 때문에 새 blob storage가 필요한 상황이 아니다. |
| image post-processing | 기존 `Sharp` 유지 | 썸네일/파일 저장 처리로 충분하다. |
| queue | 기존 BullMQ `generation` queue 유지 | provider별 queue 분리는 복잡도만 늘리고 이득이 작다. |
| admin app structure | 기존 `/admin` 유지 | 별도 OpenAI 운영 앱은 불필요하다. |

### Must Store Or Log For OpenAI

- `provider`
- `providerModel`
- OpenAI `_request_id`
- OpenAI `response.id` if Responses API used
- `revised_prompt` if returned
- `image_generation_call_id` if Responses API used
- 실패한 요청의 endpoint type (`images.edit` or `responses.create`)

이 정보는 admin/debug용으로 중요하다. OpenAI 공식 SDK는 request ID와 logging controls를 제공하므로, 새 observability product를 붙일 필요 없이 기존 server logging과 DB metadata 저장으로 충분하다.

## Optional Additions

| Addition | Add only if | Why it is optional |
|----------|-------------|--------------------|
| `openai-files.service.ts` helper | Responses API에서 file ID 재사용 흐름을 실제로 구현할 때 | 초기 rollout은 local file -> `images.edit()`가 더 단순하다. |
| OpenAI style-copy persistence UX | OpenAI `style copy`를 Gemini와 동등하게 제공할 때 | first rollout의 table-stakes는 아니다. |
| transparent background post-process pipeline | OpenAI 결과에도 투명 배경을 유지해야 할 때 | 현재 repo에는 이 파이프라인이 없다. 별도 phase로 빼는 게 맞다. |

## What NOT To Add

| Avoid | Why | Use instead |
|-------|-----|-------------|
| Separate OpenAI microservice | 현재 monorepo 규모에 과하다 | 기존 `apps/api` 안에 service file 추가 |
| Separate BullMQ queue for OpenAI | 운영 복잡도만 늘어난다 | 같은 queue + provider field |
| Mixed `gemini.service.ts` mega-service | provider 로직이 서로 오염된다 | `openai-image.service.ts` 분리 |
| Env-only OpenAI key management in production | 이미 DB-encrypted key management가 존재한다 | provider-aware `ApiKey` table reuse |
| New storage backend (`S3`, `R2`, vector DB`) | 이 milestone과 무관하다 | 현재 local storage 유지 |
| New HTTP client (`axios`, `got`, raw `fetch`) for OpenAI | 공식 SDK가 더 적합하다 | `openai` SDK 사용 |
| Universal Responses API rewrite | 현재 worker는 single-pass다 | first rollout은 `images.edit()` 중심 |
| OpenAI transparent background request parameter | `gpt-image-2`는 transparent background를 지원하지 않는다 | OpenAI에서는 옵션 비활성화하거나 별도 후처리 phase로 분리 |
| Gemini `thoughtSignature` emulation for OpenAI | 공식적으로 같은 개념이 없다 | `providerTrace`에 `response.id` / `previous_response_id` / call IDs 저장 |
| New frontend UI framework | provider selector와 badge는 기존 UI stack으로 충분하다 | 현재 `apps/web` stack 유지 |

## Installation

```bash
# API app only
pnpm --filter @mockup-ai/api add openai@^6.34.0
```

추가 npm 패키지는 필수 아님. 이번 rollout의 핵심 변화는 dependency 수보다 schema, config, worker dispatch, provider metadata 저장 구조다.

## Version Guidance

| Package | Recommendation | Notes |
|---------|----------------|-------|
| `openai` | stable `6.x` | 2026-04-23 기준 latest는 `6.34.0` 확인. 이후 설치 시에도 stable major 유지 권장 |
| `Node.js` | keep `22 LTS` | 현재 repo engine과 충돌 없음 |
| `Prisma` | keep existing major | 이번 milestone은 ORM 교체가 아니라 schema 확장 작업 |
| `BullMQ` | keep existing major | queue topology 변경 불필요 |

## Rollout Notes

- OpenAI GPT Image 모델 사용 전 조직 검증이 필요할 수 있다.
- OpenAI `Responses API`에서 top-level `model`은 `gpt-image-2`가 아니라 `gpt-5.4` 같은 text-capable model이어야 한다.
- `gpt-image-2`는 transparent background를 지원하지 않는다.
- mask 기반 edit를 나중에 붙일 경우 mask와 원본은 같은 포맷/크기여야 하고 alpha channel이 필요하다.

## Sources

### Repo inspection

- `apps/api/package.json`
- `apps/api/src/worker.ts`
- `apps/api/src/services/gemini.service.ts`
- `apps/api/src/services/admin.service.ts`
- `apps/api/src/services/generation.service.ts`
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/edit.routes.ts`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/config/index.ts`
- `apps/api/prisma/schema.prisma`
- `packages/shared/src/types/index.ts`
- `.env.example`

### Official / primary sources

- OpenAI GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- OpenAI image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- OpenAI Node SDK repo: https://github.com/openai/openai-node
- OpenAI npm package page: https://www.npmjs.com/package/openai

### Key verified points from official sources

- `Image API` is the recommended path for single-image generate/edit flows; `Responses API` is recommended for conversational editable experiences.
- `gpt-image-2` is available on `v1/images/generations` and `v1/images/edits`; current snapshot shown on 2026-04-23 is `gpt-image-2-2026-04-21`.
- `gpt-image-2` does not currently support transparent backgrounds.
- Responses image tool uses a mainline model such as `gpt-5.4` at the top level and supports `previous_response_id`.
- OpenAI Node SDK exposes file upload helpers, request IDs, retry/timeout controls, and logging configuration.
