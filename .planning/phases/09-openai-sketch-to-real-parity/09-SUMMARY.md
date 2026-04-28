---
phase: 09-openai-sketch-to-real-parity
artifact: release-smoke-summary
status: blocked
updated: 2026-04-28T03:10:11Z
---

# Phase 9 Release Smoke Summary

Phase 9 automated verification passed. Checkpoint continuation on 2026-04-28 received approved sample images and approval to transmit them to OpenAI. A fresh local Docker stack for the current branch was brought up and authenticated browser/API smoke reached the OpenAI worker path, but live output evidence remains `blocked` by OpenAI organization verification for `gpt-image-2`.

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
- Initial local start attempts were blocked by stale/invalid default runtime state.
- A fresh Docker Compose project `icons-ai-mockup-phase09` was started with isolated ports and volumes: web `http://127.0.0.1:13000`, API `http://127.0.0.1:14000`.
- Fresh DB migration succeeded for all 6 Prisma migrations.
- Seed admin login succeeded.
- Authenticated browser smoke on the current branch verified the project page entries `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리`.
- Authenticated browser smoke on `/sketch-to-real/openai` verified the v2 form and default options: `균형모드`, `구조 우선 유지`, `시점 고정`, and `배경 고정`.
- App API upload accepted both approved sample images, generation creation returned `provider: openai`, `providerModel: gpt-image-2`, and the worker reached OpenAI.
- App worker generation ID `36061eae-6559-48ea-bc3d-d943b0ca69c1` failed with OpenAI HTTP 403 because the organization must be verified for `gpt-image-2`.
- Worker OpenAI request IDs observed during retry: `req_ed6f526471d44adfbee781588c51cc90`, `req_e36c700853544b7a87a4145844909ae6`.

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

browser verification: `partial - current branch Docker browser smoke verified project page and v2 form; result/history remain blocked because OpenAI 403 produced no outputs`.

Attempted automation:

- The stale authenticated URL `http://100.69.75.47:3000` was inspected first; it did not contain Phase 09 Sketch v2.
- A current-branch Docker stack was then launched on isolated loopback ports to avoid the unrelated `grapit` runtime.
- In-app Browser opened `http://127.0.0.1:13000/projects/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/sketch-to-real/openai`.
- The project page and v2 form were verified against the current build.
- Result and history pages could not be verified with generated outputs because OpenAI returned 403 before producing images.

Source-reviewed items that still need runtime confirmation:

- Project page runtime contains `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리`.
- v2 form runtime contains the expected defaults/copy for `균형모드`, `구조 우선 유지`, `시점 고정`, `배경 고정`, `재질/질감 참조 이미지 (선택)`, and `투명 배경 (누끼)`.
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
- Authenticated app/project runtime for the current branch was later verified through the isolated Docker stack.
- App-level worker smoke created generation `36061eae-6559-48ea-bc3d-d943b0ca69c1` and reached OpenAI through the real worker.
- Worker OpenAI request IDs observed during retry: `req_ed6f526471d44adfbee781588c51cc90`, `req_e36c700853544b7a87a4145844909ae6`.
- App-level error category remained organization verification required for `gpt-image-2`.

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
| Browser project page | passed on local Docker current branch; stale provided Tailscale URL still non-current |
| Browser v2 form | passed on local Docker current branch |
| Browser result page | blocked because OpenAI 403 prevented live outputs |
| Browser history page | blocked because OpenAI 403 prevented live outputs |
| Provider/model visible-copy audit | partial; project/v2 form runtime did not expose provider/model labels, result/history blocked |
| Sketch-vs-IP visible-copy audit | partial; project/v2 form runtime copy verified, result/history blocked |
| Candidate order persistence | blocked because live generation did not produce outputs |
| OpenAI request ID | captured: `req_b57b1a36a28c45b09029c3c7890dc2d7`; worker retries captured `req_ed6f526471d44adfbee781588c51cc90`, `req_e36c700853544b7a87a4145844909ae6` |
| Transparent final asset alpha/ratio/composite | blocked because OpenAI 403 prevented output creation |

## Release Decision

Automated release verification is green and the current branch can run locally through Docker, but Phase 9 should not be marked fully live-smoke verified until:

1. The deployment target users will actually access is updated to the current `gsd/phase-09-openai-sketch-to-real-parity` branch or an equivalent build containing `sketch-to-real/openai`.
2. The OpenAI organization is verified for `gpt-image-2`.
3. A new live smoke produces two outputs and records request ID, candidate order, browser reopen evidence, and transparent-background alpha/ratio/dark-composite evidence.
