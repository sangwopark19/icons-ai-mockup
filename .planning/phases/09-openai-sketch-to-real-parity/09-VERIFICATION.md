---
phase: 09-openai-sketch-to-real-parity
verified: 2026-04-30T04:28:47Z
status: human_needed
score: "4/4 requirements mapped; OSR-03 live transparent evidence human_needed"
requirements: [PROV-02, OSR-01, OSR-02, OSR-03]
overrides_applied: 0
human_verification:
  - test: "Live OpenAI Sketch transparent-background output"
    expected: "Final post-processed PNG has alpha/composite metrics proving the background-removal path produced a usable transparent asset."
    why_human: "Requires active OpenAI access, approved sample inputs, and final PNG inspection from a successful transparent run."
  - test: "Authenticated browser visual pass"
    expected: "Project, v2 form, opaque result, history reopen, desktop width, and mobile width show v1/v2 product labels without provider/model leakage or layout overflow."
    why_human: "Phase 9 verified current-branch Docker smoke for core pages and opaque result/history, but remaining browser visual coverage is still human-reviewed."
---

# Phase 9: OpenAI Sketch to Real Parity Verification Report

**Phase Goal:** Add an OpenAI GPT Image 2 version of `스케치 실사화` beside the existing Gemini workflow, with two candidates, sketch-preservation prompts, result/history lifecycle parity, and transparent-background fulfillment through local post-processing.
**Verified:** 2026-04-30T04:28:47Z
**Status:** human_needed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Users can enter `스케치 실사화 v2` from the same project context while keeping `스케치 실사화 v1`. | VERIFIED | `apps/web/src/app/projects/[id]/page.tsx` links `스케치 실사화 v1` to `/sketch-to-real` and `스케치 실사화 v2` to `/sketch-to-real/openai`; Phase 9 Docker browser smoke verified project entries. |
| 2 | OpenAI Sketch v2 creates exactly two candidates from a required sketch and optional texture/material reference. | VERIFIED, transparent live evidence pending | `apps/api/src/services/openai-image.service.ts` implements `generateSketchToReal()` with `client.images.edit()`, `model: 'gpt-image-2'`, `n: 2`, and optional second image; opaque live generation `834cbc00-4523-4150-8ee4-f2220356c236` produced `output_1.png` and `output_2.png`. |
| 3 | The prompt treats the sketch as the locked design spec and the texture image as material/finish guidance only. | VERIFIED, visual quality human review pending | `openai-image.service.ts` prompt sections include `Image roles`, `Must preserve`, `Must add`, and `Hard constraints`; `openai-image.service.test.ts` asserts locked sketch role, material-only texture wording, and preservation constraints. |
| 4 | Transparent-background requests use opaque GPT Image 2 output followed by local background-removal post-processing, not direct model transparency. | PARTIAL - human_needed | `worker.ts` calls `removeUniformLightBackground()` for OpenAI Sketch transparent requests and persists `hasTransparency`; `background-removal.service.test.ts` covers alpha and composite quality gates. Final live transparent PNG alpha/composite evidence is absent. |

**Score:** 4/4 requirements mapped; 3 source/opaque-smoke satisfied, `OSR-03` remains human-needed for final transparent PNG evidence.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/web/src/app/projects/[id]/page.tsx` | Project-level v1/v2 Sketch entries | VERIFIED | Sidebar and workflow cards expose `스케치 실사화 v1` and `스케치 실사화 v2`; product UI uses v1/v2 labels rather than provider/model names. |
| `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx` | Existing Gemini v1 route preserved | VERIFIED | The existing route still submits `mode: 'sketch_to_real'` without forcing OpenAI provider/model fields. |
| `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` | OpenAI Sketch v2 form | VERIFIED | Submits `provider: 'openai'`, `providerModel: 'gpt-image-2'`, `mode: 'sketch_to_real'`, `outputCount: 2`, quality, product/material fields, and `transparentBackground`. |
| `apps/api/src/routes/generation.routes.ts` | Create-route validation for OpenAI Sketch | VERIFIED | Requires `gpt-image-2`, exactly two outputs, product category, and material preset for OpenAI Sketch v2. |
| `apps/api/src/services/generation.service.ts` | Provider/model persistence, queue payload, and output metadata | VERIFIED | Persists provider/model/options, validates OpenAI Sketch input, enqueues provider-aware job data, sorts output paths, and persists optional `hasTransparency`. |
| `apps/api/src/services/openai-image.service.ts` | GPT Image 2 Sketch runtime | VERIFIED | Uses Image API edit, `n: 2`, role-named prompt, material-only texture guidance, request IDs, and provider trace metadata. |
| `apps/api/src/worker.ts` | OpenAI Sketch dispatch and transparent post-process | VERIFIED | Validates stored vs queued fields, dispatches OpenAI Sketch, saves OpenAI metadata, and applies local background removal only for transparent Sketch requests. |
| `apps/api/src/services/background-removal.service.ts` | Transparent-background post-process | VERIFIED, live asset pending | Implements uniform light-background removal, alpha analysis, transparent-pixel ratio, border ratio, center opacity, and dark-composite luma gates. |
| `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` | Release smoke checklist | VERIFIED | Lists automated checks, browser checklist, real OpenAI smoke, request ID capture, forbidden-parameter checks, and transparent metric requirements. |
| `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` | Phase 9 release smoke evidence | VERIFIED | Records automated pass, current-branch Docker browser smoke, opaque live OpenAI success, output paths, candidate order, and blocked transparent evidence. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Project page | OpenAI Sketch v2 form | `/projects/:id/sketch-to-real/openai` | WIRED | Source and Docker browser smoke show the v2 route is reachable beside the v1 route. |
| OpenAI Sketch form | `POST /api/generations` | `apiFetch` body | WIRED | Sends `provider: 'openai'`, `providerModel: 'gpt-image-2'`, `mode: 'sketch_to_real'`, `sourceImagePath`, optional `textureImagePath`, and `outputCount: 2`. |
| Generation route | `GenerationService.create()` | validated request body | WIRED | Route validation rejects wrong model, unsupported output counts, and missing product/material fields. |
| GenerationService | BullMQ queue | `addGenerationJob` | WIRED | Queue payload carries provider, providerModel, source/texture paths, quality, product/material options, and transparent flag. |
| Worker | OpenAI image service | `openaiImageService.generateSketchToReal()` | WIRED | Worker dispatches OpenAI Sketch when persisted and queued provider/model match; no Gemini fallback is used for OpenAI Sketch. |
| Worker | Background removal service | `removeUniformLightBackground()` | WIRED, live asset pending | Transparent Sketch requests post-process opaque outputs before saving; final live transparent output evidence remains missing. |
| Worker/storage | Generation records | `saveGeneratedImage()` | WIRED | Saved output paths preserve `output_1.png` / `output_2.png` order and can persist `hasTransparency`. |
| Result/history pages | Existing lifecycle APIs | result detail, select, save, download, history reopen | WIRED | Phase 9 browser smoke verified opaque result page, candidate order, save to history, and reopen with selected candidate preserved. |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| Project page | `projectId`, v1/v2 route links | Next.js route params and source links | Yes | FLOWING |
| OpenAI Sketch form | `sourceImagePath`, `textureImagePath`, `quality`, product/material options, `transparentBackground` | Upload API and form state | Yes | FLOWING |
| Generation API/service | `provider`, `providerModel`, `options`, `promptData` | `POST /api/generations` body | Yes | FLOWING |
| Worker/OpenAI service | `images`, `requestIds`, `providerTrace` | `client.images.edit()` response | Yes for opaque live smoke; transparent live output pending | FLOWING, transparent evidence pending |
| Background removal | `hasTransparency`, alpha/composite quality | `removeUniformLightBackground()` on opaque output buffer | Yes in unit tests; no successful live transparent asset yet | SOURCE/TEST COVERED, live evidence pending |
| Result/history | ordered candidates and selected image | `GET /api/generations/:id`, history APIs | Yes | FLOWING |

### Automated Checks

| Command | Result |
|---|---|
| `pnpm --filter @mockup-ai/api test` | PASS in Phase 9 release smoke: 9 test files / 100 tests; Phase 12 research later observed the expanded API suite passing. |
| `pnpm --filter @mockup-ai/api type-check` | PASS in Phase 9 release smoke. |
| `pnpm --filter @mockup-ai/web type-check` | PASS in Phase 9 release smoke. |
| `rg -n "background:\\s*['\\\"]transparent|input_fidelity" apps/api/src/services/openai-image.service.ts` | PASS by absence for request parameters; tests assert both forbidden fields are undefined for Sketch calls. |
| `node -e` task assertions in Phase 12 Plan 12-01 | PASS required before this verification artifact can be accepted. |

### Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| PROV-02 | SATISFIED | Project source exposes `스케치 실사화 v1` and `스케치 실사화 v2`; current-branch Docker browser smoke verified project page entries and `/sketch-to-real/openai` form defaults while preserving the Gemini v1 route. |
| OSR-01 | SATISFIED, transparent live smoke pending | `generateSketchToReal()` uses `gpt-image-2` Image API edit with `n: 2`; route/service enforce `outputCount: 2`; opaque live generation `834cbc00-4523-4150-8ee4-f2220356c236` recorded request ID `req_b78ef6875e7e4b889486726a42e304fc` and produced `generations/b82dead3-b8a7-47d3-9182-d6934c1027e2/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/834cbc00-4523-4150-8ee4-f2220356c236/output_1.png` plus `generations/b82dead3-b8a7-47d3-9182-d6934c1027e2/49a2fa60-5010-47e9-a4f2-6bfc0b9c1ca8/834cbc00-4523-4150-8ee4-f2220356c236/output_2.png`. |
| OSR-02 | SATISFIED, visual quality human review pending | Prompt source/test evidence names Image 1 as locked sketch, treats optional Image 2 as material/texture reference only, preserves layout/silhouette/proportions/face/product construction/perspective, adds only manufacturing realism, and places `Hard constraints` after user instructions. |
| OSR-03 | PARTIAL - human_needed | Source/tests prove transparent requests are opaque-first and post-processed through `removeUniformLightBackground()` with `hasTransparency` persistence and quality gates. Final live transparent PNG alpha/composite evidence is missing, so this requirement is not marked fully passed. |

### OSR-03 Transparent Background Disposition

**Status:** `PARTIAL_WITH_MILESTONE_EXCEPTION` and `human_needed`

`OSR-03` is source/test covered but not fully live-passed. Phase 9 attempted transparent-background live evidence through generation `7418ceef-19cf-41fa-b317-cbf5cf711dfe`, but the run failed before final output creation. Observed transparent failure request IDs:

- `req_5e3e30e9b855443691e4fdacc148c216`
- `req_17c851718d45451e8279160ffdf63975`
- `req_06becc0fe71c4ac7aa2a46e8d2803333`

Source and tests prove the post-process path through `removeUniformLightBackground()` and `hasTransparency` persistence:

- `apps/api/src/worker.ts` calls `removeUniformLightBackground()` for OpenAI `sketch_to_real` jobs when `options.transparentBackground` is true.
- `apps/api/src/services/background-removal.service.ts` returns `{ buffer, hasTransparency: true, quality }` only after transparent-output quality gates pass.
- `apps/api/src/services/generation.service.ts` persists `GeneratedImage.hasTransparency` from the worker save options.
- `apps/api/src/services/__tests__/background-removal.service.test.ts` asserts alpha, transparent border, transparent pixel ratio, and dark-composite luma gates.

Missing final live evidence before `OSR-03` can be marked fully passed:

- `metadata.hasAlpha === true`
- `transparentPixelRatio >= 0.15`
- `transparentPixelRatio <= 0.95`
- `transparentBorderRatio >= 0.85`
- `darkCompositeBorderLuma <= 40`
- dark composite output evidence

Forbidden-parameter discipline:

- GPT Image 2 requests do not send `background: "transparent"`; transparency is post-processed output from local background removal.
- GPT Image 2 requests do not send `input_fidelity`; `gpt-image-2` image inputs are treated as high fidelity by the model and the project omits this unsupported parameter.

### Evidence Hygiene

This artifact stores request IDs, sanitized relative output paths, status, and derived metrics only. It must not store API keys, raw approved images, base64 payloads, or raw vendor response bodies.

### Human Verification Required

1. **Live OpenAI Sketch transparent-background output**
   - Test: Run the app or approved CLI smoke with OpenAI Sketch v2 `transparentBackground=true`, active OpenAI access, and approved sample inputs.
   - Expected: Final post-processed PNG has alpha-channel evidence, acceptable transparent pixel ratio, transparent border ratio, dark-composite luma, and a dark/contrasting composite output path.
   - Why human: Phase 9 transparent generation failed before output creation, so no final PNG metrics or composite evidence exist.

2. **Remaining authenticated browser visual pass**
   - Test: Open project page, Sketch v2 form, result page, and history page at desktop and mobile widths in a current build.
   - Expected: Product UI shows v1/v2 labels only, no provider/model leakage, no Sketch/IP copy mix-up, and no mobile overflow.
   - Why human: Phase 9 Docker smoke verified core current-branch pages and opaque result/history, but desktop/additional mobile visual pass remains a release evidence item.

### Residual Risks

- `OSR-03` remains partial until a final transparent PNG with alpha/composite metrics is captured or accepted as a documented milestone exception.
- Visual quality for `OSR-02` depends on human review of actual outputs even though prompt/source/test evidence enforces the intended preservation contract.
- Stale deployment evidence must not be counted as current-branch proof; Phase 9 explicitly rejected the stale Tailscale runtime as non-current.

### Next Action

Run Phase 12 follow-up verification after this artifact exists. If no live transparent evidence is available, keep `OSR-03` in `human_needed` / exception scope and make the missing alpha/composite metrics explicit.

---

_Verified: 2026-04-30T04:28:47Z_
_Verifier: Codex (gsd-executor)_
