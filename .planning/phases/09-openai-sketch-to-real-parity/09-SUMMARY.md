---
phase: 09-openai-sketch-to-real-parity
artifact: release-smoke-summary
status: checkpoint
updated: 2026-04-28T02:31:08Z
---

# Phase 9 Release Smoke Summary

Phase 9 automated verification passed. Real OpenAI Sketch smoke, authenticated browser verification, and transparent-background visual evidence remain `manual_needed` because live/runtime prerequisites were not fully available in this executor environment.

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

browser verification: `manual_needed - authenticated target app runtime unavailable`.

Attempted automation:

- Codex in-app Browser backend was unavailable in this session.
- Playwright opened `http://localhost:3000`, but that port served an unrelated `Grabit - 공연 티켓 예매` app, not this repo's MockupAI web app.
- `localhost:4000` was not listening, so the MockupAI API was not available for authenticated project/result/history flows.

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

OpenAI Sketch real smoke: `manual_needed - OPENAI_API_KEY unavailable in the executed shell environment`.

Additional blockers:

- `.env` appears to contain an `OPENAI_API_KEY` entry, but it was not used because the smoke command environment did not export it.
- No representative sketch image and optional texture/material reference image were explicitly provided for live smoke.
- Existing local uploaded/generated image files were not treated as representative sample inputs and were not uploaded to OpenAI.
- Explicit approval to transmit selected local sample image files to OpenAI was not available.
- Authenticated app/project state for upload access was not available.

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
| Browser project page | manual_needed |
| Browser v2 form | manual_needed |
| Browser result page | manual_needed |
| Browser history page | manual_needed |
| Provider/model visible-copy audit | manual_needed; source review found only internal identifiers, not runtime visual evidence |
| Sketch-vs-IP visible-copy audit | manual_needed |
| Candidate order persistence | manual_needed because live/browser evidence was unavailable |
| OpenAI request ID | manual_needed |
| Transparent final asset alpha/ratio/composite | manual_needed |

## Release Decision

Automated release verification is green. Phase 9 should not be marked fully live-smoke verified until a human or authenticated runtime executor provides the real OpenAI request evidence, browser walkthrough evidence, and transparent-background composite evidence listed above.
