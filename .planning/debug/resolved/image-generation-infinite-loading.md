---
status: resolved
trigger: "image-generation-infinite-loading"
created: 2026-03-11T00:00:00Z
updated: 2026-03-11T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - worker process is not started by `pnpm dev`, so BullMQ generation jobs sit in Redis queue forever (status stays pending)
test: verified by examining turbo.json dev pipeline and API package.json scripts
expecting: adding worker to turbo dev pipeline (or docker-compose) will fix the infinite loading
next_action: fix turbo.json or add worker to dev pipeline so worker starts with dev

## Symptoms

expected: 이미지 생성 버튼 클릭 시 API로 생성 요청이 전송되고, 이미지가 생성되어 결과가 표시됨
actual: 로딩만 표시되고 이미지가 생성되지 않음. 서버 로그에 generation POST 요청이 보이지 않고, GET /api/generations/project/{id}/history 폴링만 반복됨
errors: 명시적 에러 메시지 없음. 서버는 모두 200 응답. 다만 이미지 생성 POST 요청 자체가 서버에 도달하지 않는 것으로 보임
reproduction: 이미지 생성 시도 시 매번 발생
started: 현재 발생 중

Server logs show:
- GET /api/projects/{id} -> 200
- GET /api/generations/project/{id}/history?page=1&limit=20 -> 200 (repeated)
- GET /api/admin/dashboard/stats -> 200
- GET /api/admin/dashboard/chart -> 200
- NO POST request for image generation visible

## Eliminated

- hypothesis: frontend submit guard fires silently (no images or no token)
  evidence: button has `disabled={!sourceImage || !characterImage}`, and both images must be set for the button to be enabled
  timestamp: 2026-03-11

- hypothesis: CORS blocking the POST but not GETs
  evidence: POST requests are cross-origin same as GETs; CORS config allows all methods including POST
  timestamp: 2026-03-11

- hypothesis: upload step fails before generation POST
  evidence: upload failure would show error state in UI; symptom says no error message. Also, if uploads worked, POST would follow.
  timestamp: 2026-03-11

## Evidence

- timestamp: 2026-03-11
  checked: apps/api/package.json scripts
  found: `dev` script runs `tsx watch src/server.ts` (server only). Worker script is separate: `dev:worker` = `tsx watch src/worker.ts`
  implication: running `pnpm dev` does NOT start the worker process

- timestamp: 2026-03-11
  checked: root package.json scripts
  found: `dev` runs `turbo run dev`. `dev:worker` is a separate command `cd apps/api && pnpm dev:worker`. The turbo `dev` pipeline does NOT include worker.
  implication: when developers run `pnpm dev`, the BullMQ worker is never started

- timestamp: 2026-03-11
  checked: turbo.json
  found: `dev` task defined with `cache: false, persistent: true` but only one dev script per package. The API package only has `dev` (server), not `dev:worker`.
  implication: need to either (a) add worker to turbo pipeline, (b) combine server+worker in API dev script, or (c) add worker as a startup step

- timestamp: 2026-03-11
  checked: generation.service.ts create(), worker.ts
  found: when generation POST succeeds, a BullMQ job is added via `addGenerationJob()`. The worker picks this up and calls gemini API. If worker is not running, job stays in Redis queue, generation stays `pending` in DB forever.
  implication: result page shows infinite loading spinner (pending status). This matches the symptom.

- timestamp: 2026-03-11
  checked: apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
  found: loading state is shown when `!generation || generation.status === 'pending' || generation.status === 'processing'`. Polling runs every 2000ms. If status never changes from `pending`, user sees infinite loading.
  implication: confirms the user sees "무한 로딩" from result page, not generation form.

- timestamp: 2026-03-11
  checked: secondary bug: ImageUploader handleRemove
  found: when X button is clicked, only internal localPreview is cleared. Parent's sourceImage/sourcePreview state is NOT cleared via any callback.
  implication: removing an image in the uploader doesn't clear parent state. Minor UX bug, does not cause the main issue.

## Resolution

root_cause: The BullMQ worker process (`src/worker.ts`) is not started by the `pnpm dev` / `turbo run dev` command. The API's `dev` script only starts the Fastify server. Generation jobs are queued in Redis but never picked up by any worker. As a result, generation records stay in `pending` status indefinitely, causing the result page to show infinite loading.

Secondary bug: `ImageUploader.handleRemove` clears internal preview but does NOT call any parent callback, so parent state (sourceImage, characterImage) is never cleared when X button is clicked.

fix:
  PRIMARY: Updated `turbo.json` to add `dev:worker` as a persistent turbo task. Updated root `package.json` `dev` script from `turbo run dev` to `turbo run dev dev:worker`. Now `pnpm dev` starts both the API server AND the BullMQ worker process simultaneously.

  SECONDARY: Added `onRemove` optional callback prop to `ImageUploader`. Updated ip-change and sketch-to-real pages with `handleSourceRemove`/`handleCharacterRemove`/`handleSketchRemove`/`handleTextureRemove` handlers that clear parent state when X button is clicked.

verification: TypeScript type check passes (3/3 packages). `pnpm run type-check` exits 0. Human confirmed fix works end-to-end in real environment.
files_changed:
  - turbo.json (added dev:worker task)
  - package.json (updated dev script to include dev:worker)
  - apps/web/src/components/ui/image-uploader.tsx (added onRemove prop)
  - apps/web/src/app/projects/[id]/ip-change/page.tsx (added remove handlers and onRemove props)
  - apps/web/src/app/projects/[id]/sketch-to-real/page.tsx (added remove handlers and onRemove props)
