---
phase: 09-openai-sketch-to-real-parity
artifact: release-smoke-summary
status: blocked
updated: 2026-04-28T02:45:33Z
---

# Phase 9 Release Smoke Summary

Phase 9 automated verification passed. Checkpoint continuation on 2026-04-28 received approved sample images and approval to transmit them to OpenAI, but live/browser release smoke remains `blocked` by external runtime and account gates.

## Checkpoint Continuation Attempt

Inputs approved by the user:

- Sketch image: `/Users/sangwopark19/icons_file/3_IPIC/6_모드 B/5 패브릭.png`
- Texture/material reference image: `/Users/sangwopark19/icons_file/3_IPIC/6_모드 B/12 세안밴드 페브릭 질감 참고.png`
- Approved destination: OpenAI Images Edit API for GPT Image 2 smoke.

Results:

- Direct OpenAI Images Edit smoke reached OpenAI but failed with HTTP 403 before generation.
- Request ID: `req_b57b1a36a28c45b09029c3c7890dc2d7`
- Blocker: the OpenAI organization must be verified before using `gpt-image-2`.
- Forbidden parameter check: the smoke request did not include `background: "transparent"` or `input_fidelity`.
- Output count and transparent-background evidence remain unavailable because no image was produced.

Browser/runtime results:

- The user-provided browser URL `http://100.69.75.47:3000` was reachable and authenticated.
- That server is not running the current Phase 09 branch: its served project bundle lacks `sketch-to-real/openai` and `스케치 실사화 v2`, while the current branch source contains both.
- The process on port 3000 belongs to `/Users/sangwopark19/icons/grapit`, not `/Users/sangwopark19/icons/icons-ai-mockup`.
- Attempting to start the current branch API locally failed because local Postgres credentials were invalid and Redis was unavailable.
- Therefore authenticated browser smoke for the current branch could not be completed in this environment.

## Automated Verification

| Check | Status | Evidence |
|---|---|---|
| `pnpm --filter @mockup-ai/api test` | passed | 9 test files, 100 tests passed |
| `pnpm --filter @mockup-ai/api type-check` | passed | `tsc --noEmit` exited 0 |
| `pnpm --filter @mockup-ai/web type-check` | passed | `tsc --noEmit` exited 0 |

Static/source evidence:

- `apps/api/src/services/openai-image.service.ts` has `generateSketchToReal()` using `images.edit`.
- `apps/api/src/services/openai-image.service.ts` contains no `background:` request parameter.
- `apps/api/src/services/openai-image.service.ts` contains no `input_fidelity`.
- `apps/api/src/services/__tests__/openai-image.service.test.ts` asserts Sketch prompt roles, `Must preserve`, `Must add`, `Hard constraints`, and forbidden-parameter omission.
- `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` submits `provider: 'openai'`, `providerModel: 'gpt-image-2'`, and `outputCount: 2` internally.

## Browser Verification

browser verification: `blocked - provided authenticated URL is a stale/non-current build`.

Attempted automation:

- Codex in-app Browser backend was unavailable in this session.
- Playwright opened `http://localhost:3000`, but that port served an unrelated `Grabit - 공연 티켓 예매` app, not this repo's MockupAI web app.
- `localhost:4000` was not listening, so the MockupAI API was not available for authenticated project/result/history flows.
- After user login, Codex in-app Browser opened `http://100.69.75.47:3000/projects/0ab5db3e-ee8e-4840-9480-4750771fe68e`; the visible project page showed only the old `스케치 실사화` entry, not the Phase 09 `스케치 실사화 v1` and `스케치 실사화 v2` entries.
- Static inspection of the served Next chunk from `100.69.75.47:3000` confirmed it lacks `sketch-to-real/openai`; current branch source contains that route and copy.
- Starting this repo's API locally was blocked by invalid local Postgres credentials and unavailable Redis.

Source-reviewed items that still need runtime confirmation:

- Project page source contains `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리`.
- v2 form source contains the expected defaults/copy for `균형모드`, `구조 우선 유지`, `시점 고정`, `배경 고정`, `재질/질감 참조 이미지 (선택)`, and `투명 배경 (누끼)`.
- Result page source contains `후보 1`, `후보 2`, `생성된 이미지 (2개)`, `선택 이미지 다운로드`, and disabled v2 follow-up copy.
- History source renders Sketch/IP `v1`/`v2` badges from `item.provider`.

Manual browser checklist still required:

- Project page, v2 form, result page, and history page at desktop width.
- Same flow at 360px mobile width with no button/chip/badge text overflow.
- Product UI did not visibly show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`: not verified in browser; `manual_needed`.
- Sketch v2 result/history did not show `IP 변경`, `캐릭터`, or `character`: not verified in browser; `manual_needed`.
- Select candidate 2, reload result page, save, open history, reopen result, and confirm `후보 1`/`후보 2` order is preserved.

## Real OpenAI Sketch Smoke

OpenAI Sketch real smoke: `blocked - OpenAI organization verification required for gpt-image-2`.

Additional blockers and evidence:

- The user explicitly provided representative sketch and texture/material sample paths and approved OpenAI transmission.
- Direct OpenAI Images Edit smoke was attempted with `model=gpt-image-2`, `quality=medium`, `n=2`, the approved sketch image as Image 1, and the approved texture image as Image 2.
- OpenAI returned HTTP 403 before generation.
- Request ID: `req_b57b1a36a28c45b09029c3c7890dc2d7`
- Error category: organization verification required for `gpt-image-2`.
- Authenticated app/project runtime for the current branch remained unavailable.

Required live evidence before marking this passed:

- Request ID.
- Sketch image path.
- Texture image path or `none`.
- Selected quality value.
- Two output image paths.
- Candidate order evidence: `output_1.png -> 후보 1`, `output_2.png -> 후보 2`, unchanged after candidate 2 selection, reload, save, history open, and reopen.
- Confirmation that `background: "transparent"` was not sent.
- Confirmation that `input_fidelity` was not sent.
- Confirmation that the texture reference affected only material/finish behavior.

## Transparent-Background Verification

transparent-background verification: `manual_needed - live transparent output and dark-composite evidence unavailable`.

Required evidence before marking this passed:

- Final downloaded transparent PNG alpha-channel evidence, such as `metadata.hasAlpha === true`.
- `transparentPixelRatio >= 0.15`.
- `transparentPixelRatio <= 0.95`.
- `transparentBorderRatio >= 0.85`.
- `darkCompositeBorderLuma <= 40` when composited over `#0A0A0B`.
- Dark/contrasting-background composite screenshot or output path showing no opaque white rectangle or obvious white halo.
- Confirmation that transparency was created by post-processing after opaque GPT Image 2 generation, not by sending `background: "transparent"`.

## Evidence Status

| Evidence | Status |
|---|---|
| Automated API test | passed |
| Automated API type-check | passed |
| Automated web type-check | passed |
| Forbidden parameter source check | passed |
| Prompt structure source/test check | passed |
| Browser project page | blocked; provided URL serves stale/non-current build without Sketch v2 |
| Browser v2 form | blocked by stale/non-current build and local runtime DB/Redis prerequisites |
| Browser result page | blocked by stale/non-current build and no live generation |
| Browser history page | blocked by stale/non-current build and no live generation |
| Provider/model visible-copy audit | blocked in browser; source review found only internal identifiers, not runtime visual evidence |
| Sketch-vs-IP visible-copy audit | blocked in browser |
| Candidate order persistence | blocked because live generation did not produce outputs |
| OpenAI request ID | captured: `req_b57b1a36a28c45b09029c3c7890dc2d7` |
| Transparent final asset alpha/ratio/composite | blocked because OpenAI 403 prevented output creation |

## Release Decision

Automated release verification is green, but Phase 9 should not be marked fully live-smoke verified until:

1. The served web/API runtime is updated to the current `gsd/phase-09-openai-sketch-to-real-parity` branch or an equivalent build containing `sketch-to-real/openai`.
2. Local/runtime dependencies are healthy: Postgres credentials valid, Redis available, API worker running.
3. The OpenAI organization is verified for `gpt-image-2`.
4. A new live smoke produces two outputs and records request ID, candidate order, browser reopen evidence, and transparent-background alpha/ratio/dark-composite evidence.
