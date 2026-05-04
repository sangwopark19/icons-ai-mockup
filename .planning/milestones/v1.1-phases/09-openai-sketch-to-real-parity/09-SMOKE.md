---
phase: 09-openai-sketch-to-real-parity
artifact: smoke-checklist
status: ready
created: 2026-04-28
---

# Phase 9 Smoke Checklist

OpenAI Sketch to Real v2 smoke checklist for automated release checks, authenticated browser verification, gated real OpenAI execution, transparent-background evidence, and release sign-off evidence.

## Automated Verification

Run these commands from the repo root before release sign-off:

```bash
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

Acceptance:

- API tests pass without weakening provider-routing, prompt, forbidden-parameter, or transparent-background assertions.
- API type-check exits 0.
- Web type-check exits 0.
- Static/source review confirms Sketch v2 uses `provider: "openai"`, `providerModel: "gpt-image-2"`, `mode: "sketch_to_real"`, and `outputCount: 2`.
- Static/source review confirms `background: "transparent"` is not sent to GPT Image 2.
- Static/source review confirms `input_fidelity` is not sent to GPT Image 2.

## Browser Verification

Run at desktop width and at 360px mobile width with an authenticated user and a project that allows image uploads.

- Project page shows `스케치 실사화 v1` and `스케치 실사화 v2` as sibling entries.
- Project page keeps `IP 변경 v1`, `IP 변경 v2`, `스케치 실사화 v1`, `스케치 실사화 v2`, and `히스토리` reachable without provider/model labels.
- v2 form defaults to `균형모드`, `구조 우선 유지`, `시점 고정`, and `배경 고정`.
- v2 form requires sketch, product category, and material guidance before create request.
- v2 form rejects WebP/non-PNG/non-JPEG and >10MB files before create request.
- Texture/material reference copy says it is used only for material, texture, finish, and color behavior, not as a style or scene reference.
- Result page shows `v2`, two candidates, save, selected-image download, and disabled follow-ups.
- Result page does not show IP Change-specific copy: `IP 변경`, `캐릭터`, or `character`.
- Select candidate 2, reload the result page, save, open history, reopen the result, and verify candidate order remains `후보 1` then `후보 2`.
- History shows a `v2` badge for Sketch to Real and reopens the result page.
- No product screen visibly shows `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`.
- At 360px mobile width, no button, chip, badge, candidate label, or navigation text overflows its container.

## Real OpenAI Sketch Smoke

Prerequisites:

- `OPENAI_API_KEY`
- one sketch image
- optional texture/material reference image
- one project with upload access

Run through the app when the project/auth/browser environment is available. If app flow is unavailable but credentials and sample assets are available, use `.codex/skills/mockup-openai-cli-smoke/scripts/images-edit.sh` or equivalent Image API edit smoke guidance, then record that the app lifecycle still requires browser verification.

Real smoke checklist:

- Image API edit uses Image 1 as the designer sketch.
- Image API edit uses Image 2 only when an optional texture/material reference image is provided.
- Prompt/review evidence includes image roles, `Must preserve`, `Must add`, and `Hard constraints`.
- Sketch is treated as a locked design spec.
- `texture reference used only for material/finish behavior`.
- Exactly two OpenAI Sketch candidates are produced.
- request IDs captured.
- selected quality value recorded.
- `background: "transparent"` not sent.
- `input_fidelity` not sent.
- two output file paths recorded.
- output order recorded as `output_1.png -> 후보 1` and `output_2.png -> 후보 2`.
- candidate order remains `후보 1`/`후보 2` after selecting candidate 2, reloading, saving, opening history, and reopening.
- Sketch v2 result/history screens do not show `IP 변경`, `캐릭터`, or `character`.

## Transparent Background Verification

Transparent output must be verified as post-processed output after opaque GPT Image 2 generation. Do not treat direct GPT Image 2 transparency as supported behavior.

Required evidence when `transparentBackground` is enabled:

- OpenAI request evidence confirms `background: "transparent"` was not sent.
- OpenAI request evidence confirms `input_fidelity` was not sent.
- Final downloaded transparent PNG has `metadata.hasAlpha === true` or equivalent alpha-channel evidence.
- `transparentPixelRatio >= 0.15`.
- `transparentPixelRatio <= 0.95`.
- `transparentBorderRatio >= 0.85`.
- `darkCompositeBorderLuma <= 40` when composited over `#0A0A0B`.
- A dark/contrasting-background composite screenshot or output path is recorded so a human can see there is no opaque white rectangle or obvious white halo.
- Generated image record or release note identifies the transparent asset as post-processed final output, not direct model background output.

## Evidence To Record

Record this evidence in `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md`:

- Automated command, status, and execution timestamp for each command.
- Browser verification status for project page, v2 form, result page, history page, provider/model copy audit, Sketch-vs-IP copy audit, candidate order persistence, and 360px mobile overflow.
- OpenAI Sketch real smoke status: `passed` with request ID evidence, or `manual_needed - OPENAI_API_KEY unavailable`, or another precise blocker.
- Sketch image path used for smoke, if available and safe to record.
- Texture image path or `none`.
- Request ID.
- Selected quality value.
- Two output file paths.
- Candidate order evidence: `output_1.png -> 후보 1`, `output_2.png -> 후보 2`, and reload/history reopen result.
- Confirmation that `background: "transparent"` was not sent.
- Confirmation that `input_fidelity` was not sent.
- Confirmation that the texture reference affected only material/finish behavior.
- Transparent-background status: alpha evidence, `transparentPixelRatio`, `transparentBorderRatio`, `darkCompositeBorderLuma`, and dark/contrasting-background composite evidence path, or explicit `manual_needed`.
- Confirmation that product UI did not visibly show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`.
- Confirmation that Sketch v2 result/history did not show `IP 변경`, `캐릭터`, or `character`.

