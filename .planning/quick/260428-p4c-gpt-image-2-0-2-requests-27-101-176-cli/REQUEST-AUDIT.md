# GPT Image 2 Request Audit

## Scope

사용자 관찰: GPT Image 2.0 테스트를 2번만 시도했는데 OpenAI dashboard에는 requests 27, tokens 101,176으로 보였다.

민감정보 보호: 이 문서는 API key, raw base64, uploaded image bytes, raw vendor response body, private product image를 기록하지 않는다. 기록 대상은 count, timestamp, generation ID, job ID, request ID, safe metadata뿐이다.

## CLI baseline

| Check | Result | Evidence |
|---|---:|---|
| `.env` has DB/Redis/OpenAI entries | yes | `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY` 존재 여부만 확인함 |
| Local API server on `:4000` | no | `lsof -nP -iTCP:4000 -sTCP:LISTEN` returned no listener |
| Local web server on `:3000` | no | `lsof -nP -iTCP:3000 -sTCP:LISTEN` returned no listener |
| Local PostgreSQL on `:5432` | no | Prisma query failed: database server unavailable at `localhost:5432` |
| Local Redis on `:6379` | no | BullMQ query failed: connection refused at `localhost:6379` |
| Recent OpenAI `Generation` rows | blocked | DB service unavailable locally |
| `ApiKey.callCount` for OpenAI | blocked | DB service unavailable locally |
| BullMQ job states / `attemptsMade` | blocked | Redis service unavailable locally |
| Worker logs | not available | No current worker process or persistent worker log was found |

## Static Request Budget Evidence

| Layer | Current behavior before fix | Count effect |
|---|---|---:|
| Browser submit | OpenAI v2 pages call one `POST /api/generations` after image uploads. `Button` disables itself when `isLoading` is true. | Expected 1 app generation POST per click |
| OpenAI SDK | `new OpenAI({ maxRetries: 2 })` in `openai-image.service.ts` | Up to 3 HTTP attempts per service call |
| BullMQ | `generationQueue.defaultJobOptions.attempts = 3`; `addGenerationJob()` does not override for OpenAI | Up to 3 worker executions per queued job |
| Worker call count | `adminService.incrementCallCount(provider, activeKeyId)` runs before the OpenAI vendor call | App admin count can increment for failed/replayed attempts |
| Output candidates | `images.edit({ n: 2 })` intentionally asks for two candidates | 2 output images from one successful Image API call |

Worst-case request multiplier before fix:

| User-submitted OpenAI jobs | BullMQ attempts/job | SDK attempts/worker attempt | Max OpenAI HTTP attempts | Candidate outputs if successful |
|---:|---:|---:|---:|---:|
| 1 | 3 | 3 | 9 | 2 |
| 2 | 3 | 3 | 18 | 4 |
| 3 | 3 | 3 | 27 | 6 |

## Browser network

Live browser reproduction is currently blocked because neither the web app (`:3000`) nor the API (`:4000`) is listening locally, and the DB/Redis dependencies are also down. A prior Playwright console artifact only shows a local page load and an auth refresh failure; it does not include a GPT Image 2 generation click or a `/api/generations` POST.

Post-fix browser attempt: Playwright MCP could not open a new page because its Chrome profile was already locked by another browser session. Fallback CLI checks confirmed `curl http://localhost:3000/admin/dashboard` and `curl http://localhost:4000/health` both failed with connection refused, matching the listener checks above.

Static browser-code finding:

- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` calls `apiFetch('/api/generations', { method: 'POST', ... })` once after two upload calls.
- `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` calls `apiFetch('/api/generations', { method: 'POST', ... })` once after one or two upload calls.
- `Button` disables on `disabled || isLoading`, so no obvious persistent duplicate-submit loop was found in the inspected code.

## BullMQ

The root BullMQ risk is confirmed by code:

- Queue default is `attempts: 3`.
- OpenAI jobs are enqueued without provider-specific override.
- If a worker attempt fails after the vendor call returns but before completion, BullMQ can replay the OpenAI vendor call.

Live BullMQ job state, job IDs, and `attemptsMade` could not be read because Redis is unavailable locally.

## OpenAI dashboard

OpenAI dashboard/API usage for the same historical time window could not be verified from this workspace. The observed `101,176` token number should be treated as OpenAI-side image/accounting usage, not an app-side text-token count, because this app does not currently persist OpenAI token usage for Image API calls.

Interpretation guardrails:

- App generation POST count, worker attempts, OpenAI Image API HTTP request IDs, output candidates from `n: 2`, and OpenAI dashboard token/request accounting are different counters.
- A single successful `images.edit` call can produce 2 images because `n: 2`; that is not 2 browser submits.
- Before this fix, hidden SDK retry and BullMQ retry could multiply app-invisible vendor attempts.

## root cause

Confirmed root cause: OpenAI jobs had two hidden retry layers and app-side call counting happened before the vendor call completed.

The exact historical `27 requests` cannot be proven from local CLI data because PostgreSQL, Redis, worker logs, and OpenAI dashboard access were unavailable in this workspace. The code does explain how 27 can happen: 3 queued OpenAI jobs, or a duplicate third app job, multiplied by 3 BullMQ attempts and 3 SDK attempts equals 27 vendor HTTP attempts. For the user's stated 2 intentional attempts, the same code allowed up to 18 vendor HTTP attempts before accounting differences such as dashboard candidate/token accounting.

## After-Fix Expectation

After implementation:

| Counter | Expected value for 1 OpenAI user job with `n: 2` |
|---|---:|
| Browser `POST /api/generations` | 1 |
| BullMQ attempts for OpenAI | 1 |
| OpenAI SDK hidden retries | 0 |
| App-recorded external request count | 1 |
| Output candidates | 2 |
| App admin `callCount` delta | +1 after vendor response |

Admin/API after-fix display:

- `/api/admin/generations` includes nullable safe fields derived from `providerTrace`: `openaiExternalRequestCount`, `openaiOutputCount`, `openaiSdkMaxRetries`, `openaiQueueAttempts`.
- Admin generation detail renders those safe fields in `지원 정보` alongside request IDs.
- Admin dashboard labels the OpenAI active-key KPI as app-recorded Image API calls, explicitly excluding browser polling and OpenAI token usage.
- Raw `providerTrace`, API keys, base64 image bytes, and raw vendor responses remain hidden from admin UI.

Remaining live checks after services are available:

1. Start local or remote verified services.
2. Submit one OpenAI v2 generation through the browser.
3. Confirm exactly one `POST /api/generations` for the click.
4. Confirm the resulting `providerTrace` records `externalRequestCount: 1`, `outputCount: 2`, `sdkMaxRetries: 0`, and `queueAttempts: 1`.
5. Compare app `callCount` delta to OpenAI dashboard usage for the same absolute time window.
