---
phase: 09-openai-sketch-to-real-parity
artifact: release-smoke-summary
status: accepted_with_deferred_followup
updated: 2026-04-28T06:23:30Z
---

# Phase 9 Release Smoke Summary

Phase 9 automated verification passed. Checkpoint continuation on 2026-04-28 received approved sample images and approval to transmit them to OpenAI. A fresh local Docker stack for the current branch was brought up, authenticated browser/API smoke reached the OpenAI worker path, and the opaque Sketch v2 live smoke produced two outputs. On 2026-04-28, the user accepted merging with transparent-background live evidence deferred to follow-up work. Deployment-target freshness is handled by merging to `main`, which triggers CI/CD deployment to the remote Mac server.

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
- After the user completed organization verification, app-level worker smoke was retried with generation `834cbc00-4523-4150-8ee4-f2220356c236`; the first worker attempt still returned HTTP 403 with request ID `req_3ab87964ac324ed9ab39600dcbe6b68b`, but a BullMQ retry later completed successfully.
- Successful app-level opaque Sketch v2 generation: `834cbc00-4523-4150-8ee4-f2220356c236`.
- Successful OpenAI request ID recorded in DB: `req_b78ef6875e7e4b889486726a42e304fc`.
- Opaque output paths:
  - `generations/b82dead3-b8a7-47d3-9182-d6934c1027e2/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/834cbc00-4523-4150-8ee4-f2220356c236/output_1.png`
  - `generations/b82dead3-b8a7-47d3-9182-d6934c1027e2/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/834cbc00-4523-4150-8ee4-f2220356c236/output_2.png`
- Authenticated result page verified `후보 1`, `후보 2`, selected-candidate state, and save-to-history behavior.
- Candidate order evidence: `output_1.png -> 후보 1`, `output_2.png -> 후보 2`; after selecting candidate 2, saving, reloading, opening history, and reopening the result, `후보 2` remained selected and candidate order was unchanged.
- Transparent-background retry generation `7418ceef-19cf-41fa-b317-cbf5cf711dfe` still failed with OpenAI HTTP 403 during propagation.

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

browser verification: `partial - current branch Docker browser smoke verified project page, v2 form, opaque result page, candidate order, and history; transparent-result evidence remains blocked`.

Attempted automation:

- The stale authenticated URL `http://100.69.75.47:3000` was inspected first; it did not contain Phase 09 Sketch v2.
- A current-branch Docker stack was then launched on isolated loopback ports to avoid the unrelated `grapit` runtime.
- In-app Browser opened `http://127.0.0.1:13000/projects/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/sketch-to-real/openai`.
- The project page and v2 form were verified against the current build.
- After organization verification propagated, opaque result and history pages were verified with generation `834cbc00-4523-4150-8ee4-f2220356c236`.
- Transparent result/history pages could not be verified because transparent generation `7418ceef-19cf-41fa-b317-cbf5cf711dfe` returned OpenAI 403 before producing images.

Source-reviewed items that still need runtime confirmation:

- Project page runtime contains `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리`.
- v2 form runtime contains the expected defaults/copy for `균형모드`, `구조 우선 유지`, `시점 고정`, `배경 고정`, `재질/질감 참조 이미지 (선택)`, and `투명 배경 (누끼)`.
- Result page runtime contains `후보 1`, `후보 2`, `생성된 이미지 (2개)`, `선택 이미지 다운로드`, and disabled v2 follow-up copy.
- History runtime renders `스케치 실사화` with a `v2` badge.

Manual browser checklist still required:

- Desktop-width visual pass still required.
- Additional narrow/mobile pass remains recommended, though the in-app browser narrow viewport did not show obvious button/chip/badge overflow during the verified flow.
- Product UI did not visibly show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` in the verified project/form/result/history flow.
- Sketch v2 result/history did not show `IP 변경`, `캐릭터`, or `character` in the verified flow.

## Real OpenAI Sketch Smoke

OpenAI Sketch real smoke: `partial - opaque Sketch v2 live smoke passed; transparent-background live smoke still blocked by intermittent organization verification 403`.

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
- Post-verification retry generation `834cbc00-4523-4150-8ee4-f2220356c236` initially failed with organization verification request ID `req_3ab87964ac324ed9ab39600dcbe6b68b`, then completed on BullMQ retry.
- Successful opaque retry request ID: `req_b78ef6875e7e4b889486726a42e304fc`.
- Opaque retry produced exactly two output images: `output_1.png` and `output_2.png`.
- Result/history candidate-order persistence was verified in browser.

Opaque live evidence captured:

- Request ID: `req_b78ef6875e7e4b889486726a42e304fc`.
- Sketch image path: `/Users/sangwopark19/icons_file/3_IPIC/6_모드 B/5 패브릭.png`.
- Texture image path: `/Users/sangwopark19/icons_file/3_IPIC/6_모드 B/12 세안밴드 페브릭 질감 참고.png`.
- Selected quality value: `medium`.
- Two output image paths captured.
- Candidate order evidence: `output_1.png -> 후보 1`, `output_2.png -> 후보 2`, unchanged after candidate 2 selection, reload, save, history open, and reopen.
- Source checks confirm `background: "transparent"` was not sent.
- Source checks confirm `input_fidelity` was not sent.

## Transparent-Background Verification

transparent-background verification: `blocked - live transparent output and dark-composite evidence unavailable because transparent generation still hit OpenAI 403`.

Attempted transparent generation:

- Generation ID: `7418ceef-19cf-41fa-b317-cbf5cf711dfe`
- Request IDs observed during retry failures: `req_5e3e30e9b855443691e4fdacc148c216`, `req_17c851718d45451e8279160ffdf63975`, `req_06becc0fe71c4ac7aa2a46e8d2803333`
- Final status: `failed`
- Error category: organization verification required for `gpt-image-2`

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
| Browser result page | passed for opaque Sketch v2 output on local Docker current branch |
| Browser history page | passed for saved opaque Sketch v2 output on local Docker current branch |
| Provider/model visible-copy audit | passed for verified project/form/result/history flow |
| Sketch-vs-IP visible-copy audit | passed for verified result/history flow |
| Candidate order persistence | passed for opaque generation `834cbc00-4523-4150-8ee4-f2220356c236` |
| OpenAI request ID | opaque success captured: `req_b78ef6875e7e4b889486726a42e304fc`; earlier/transparent failures also captured |
| Transparent final asset alpha/ratio/composite | blocked because transparent generation `7418ceef-19cf-41fa-b317-cbf5cf711dfe` hit OpenAI 403 before output creation |

## Release Decision

Automated release verification is green, the current branch can run locally through Docker, and opaque Sketch v2 live smoke passed. On 2026-04-28, the user approved proceeding with merge under these release assumptions:

1. Transparent-background live smoke evidence is deferred to follow-up work and must still record alpha/ratio/dark-composite evidence before Phase 09 is claimed fully live-smoke verified.
2. Deployment-target freshness is not a pre-merge blocker because merging to `main` triggers CI/CD deployment to the remote Mac server.
3. Desktop and additional mobile-width browser passes remain optional follow-up evidence if release policy requires visual coverage beyond the current in-app browser smoke.
