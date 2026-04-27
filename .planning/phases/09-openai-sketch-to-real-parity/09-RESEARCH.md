# Phase 9: OpenAI Sketch to Real Parity - Research

**Created:** 2026-04-27
**Status:** Ready for planning

## Research Goal

Plan Phase 9 so `스케치 실사화 v2` is added as an OpenAI GPT Image 2 workflow beside the existing Gemini `스케치 실사화 v1`, without changing the Gemini route or provider foundation from Phases 7 and 8.

## Source Inputs

- `.planning/phases/09-openai-sketch-to-real-parity/09-CONTEXT.md`
- `.planning/phases/09-openai-sketch-to-real-parity/09-UI-SPEC.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/OPENAI-SKILL-GUARDRAILS.md`
- `.planning/phases/07-provider-foundation-and-key-separation/07-*`
- `.planning/phases/08-openai-ip-change-parity/08-CONTEXT.md`
- `.planning/phases/08-openai-ip-change-parity/08-RESEARCH.md`
- `.planning/phases/08-openai-ip-change-parity/08-PATTERNS.md`
- `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md`
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`
- `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md`
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md`

## Current Code State

Phase 8 has already established the OpenAI provider lane for `ip_change`:

- `apps/web/src/app/projects/[id]/page.tsx` already has `IP 변경 v1` and `IP 변경 v2` entries.
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` provides a v2 form pattern with quality mode, preservation defaults, hidden provider/model payload, and two candidates.
- `apps/api/src/services/openai-image.service.ts` has `generateIPChange()` using `client.images.edit()` with `model: 'gpt-image-2'`, `n: 2`, `quality`, request ID capture, and no `background` or `input_fidelity`.
- `apps/api/src/services/generation.service.ts` persists `provider`, `providerModel`, `providerTrace`, OpenAI support IDs, options, and queue payloads.
- `apps/api/src/worker.ts` validates queued `provider` and `providerModel` against the database before dispatch and routes OpenAI `ip_change` to the OpenAI service.
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` treats OpenAI `ip_change` as v2 for loading, badges, exactly two candidate labels, save/download, and disabled follow-ups.
- `apps/web/src/app/projects/[id]/history/page.tsx` shows v1/v2 badges only for `ip_change`; Sketch to Real needs the same provider-aware behavior.

OpenAI `sketch_to_real` is intentionally still blocked:

- `apps/api/src/routes/generation.routes.ts` rejects `provider === 'openai' && mode !== 'ip_change'`.
- `apps/api/src/services/generation.service.ts` rejects `provider === 'openai' && input.mode !== 'ip_change'`.
- `apps/api/src/worker.ts` throws `OpenAI provider는 현재 IP 변경 v2만 지원합니다.` for OpenAI non-`ip_change` jobs.
- `apps/api/src/services/__tests__/generation.service.test.ts` includes tests for the current unsupported behavior and transparent-background rejection.

## Implementation Findings

### Product Entry And Route

Phase 9 should mirror the Phase 8 sibling-entry pattern:

- Existing route remains `/projects/:id/sketch-to-real`.
- New v2 route is `/projects/:id/sketch-to-real/openai`.
- Product UI labels are `스케치 실사화 v1` and `스케치 실사화 v2`.
- Product UI must not show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`.

The project sidebar order from UI-SPEC is:

1. `IP 변경 v1`
2. `IP 변경 v2`
3. `스케치 실사화 v1`
4. `스케치 실사화 v2`
5. `히스토리`

### V2 Form Contract

The OpenAI Sketch to Real form should reuse the expanded Phase 8 v2 form style, with different inputs:

- Required sketch uploader: `스케치 이미지`
- Optional texture/material uploader: `재질/질감 참조 이미지 (선택)`
- Product category control with presets: `머그`, `텀블러`, `플레이트`, `키링`, `그립톡`, `인형`, `쿠션`, `피규어`, `마그넷`, `기타`
- Material guidance control with presets: `세라믹`, `플라스틱`, `아크릴`, `금속`, `봉제/패브릭`, `레진/비닐`, `고무`, `투명 소재`, `기타`
- Quality radio group: `빠른모드 -> low`, `균형모드 -> medium`, `퀄리티모드 -> high`
- Defaults: `quality = "medium"`, `preserveStructure = true`, `fixedViewpoint = true`, `fixedBackground = true`, `transparentBackground = false`
- Submit payload must include `provider: "openai"`, `providerModel: "gpt-image-2"`, `mode: "sketch_to_real"`, `outputCount: 2`, and the Sketch-specific option fields.

### Backend Contract

The existing schema can store Phase 9 data without a database migration:

- `Generation.provider` and `providerModel` are already present.
- `promptData` can store `sourceImagePath`, `textureImagePath`, `userPrompt`, product category, material guidance, and any detail fields.
- `options` can store preservation toggles, quality, output count, product category, material guidance, and transparency request.
- `GeneratedImage.hasTransparency` already exists and defaults to false.
- OpenAI trace fields are already present.

The backend still needs typed option support for Sketch-specific fields:

- `productCategory`
- `productCategoryOther`
- `materialPreset`
- `materialOther`
- `textureImagePath`
- `quality`
- preservation booleans
- `transparentBackground`
- `outputCount: 2`

### OpenAI Runtime Contract

Use `client.images.edit()` for `sketch_to_real`:

- Image 1 is the required designer sketch.
- Image 2 is optional texture/material reference.
- The prompt must explicitly state image roles.
- Texture reference is material/finish/color behavior only.
- Product shape and category come from the sketch plus product category input.
- The prompt must separate `Must preserve`, `Must add`, and `Hard constraints`.
- Do not send `background: "transparent"` to `gpt-image-2`.
- Do not send `input_fidelity`.
- Always request two candidates with `n: 2`.
- Store request IDs, response ID, image call IDs, revised prompt, and providerTrace.

### Transparent Background Path

The current code has no dedicated background-removal service. `upload.service.ts` uses `sharp`, stores generated PNG files, and records `hasTransparency: false` in `generation.service.ts`.

Phase 9 must implement transparent-background fulfillment without sending unsupported OpenAI parameters. The safest plan is:

1. Generate opaque clean product-review images through GPT Image 2.
2. If `transparentBackground` is requested, run a deterministic post-process step before saving final outputs.
3. The post-process can be implemented as a conservative background-removal helper near `upload.service.ts` or as a dedicated API service file.
4. The implementation must set `GeneratedImage.hasTransparency = true` only when the final saved PNG actually has an alpha channel.
5. If post-processing fails, the worker should fail the generation with the UI copy from UI-SPEC rather than silently saving an opaque image as transparent.

This is a higher-risk task than simple prompt wiring. It needs tests that assert no OpenAI request contains `background`, plus post-process behavior for a simple white-background image.

### Result And History Lifecycle

The result page currently computes:

```ts
const isV2 = Boolean(generation && generation.provider === 'openai' && generation.mode === 'ip_change');
```

Phase 9 should generalize this to OpenAI `ip_change` or `sketch_to_real`, while keeping workflow-specific copy:

- v2 Sketch loading copy: `v2 목업을 생성하고 있습니다...`
- body: `스케치 구조를 보존한 두 후보를 준비 중입니다. 완료되면 바로 선택할 수 있습니다.`
- failed copy: `v2 스케치 실사화 생성에 실패했습니다. 스케치와 재질 정보를 확인한 뒤 다시 시도해주세요.`
- failed retry target: `/projects/:id/sketch-to-real/openai`
- condition edit target: `/projects/:id/sketch-to-real/openai`
- candidate label: `생성된 이미지 (2개)`
- candidate alt labels: `v2 스케치 실사화 후보 1`, `v2 스케치 실사화 후보 2`
- selected image alt: `선택된 v2 스케치 실사화 결과`
- unsupported follow-ups stay disabled with `v2 후속 편집은 다음 업데이트에서 지원됩니다`.

History should show `v1`/`v2` badges for Sketch to Real as well as IP Change and use the UI-SPEC empty-state copy for Sketch to Real saved results.

## Recommended Plan Breakdown

1. **Backend runtime and post-process**: unblock OpenAI `sketch_to_real`, add typed option fields, implement `generateSketchToReal()`, route worker dispatch, and implement transparent-background post-processing.
2. **Project entry and v2 form**: add sibling `스케치 실사화 v1/v2` entries and create `/sketch-to-real/openai`.
3. **Result/history lifecycle**: generalize v2 state beyond `ip_change`, add Sketch-specific loading/failure/route/candidate/history behavior.
4. **Smoke and regression validation**: document and/or add smoke checks for live OpenAI edits, two outputs, prompt constraints, request IDs, and forbidden parameters.

## Validation Architecture

### Automated Checks

- `pnpm --filter @mockup-ai/api test`
- `pnpm --filter @mockup-ai/api type-check`
- `pnpm --filter @mockup-ai/web type-check`
- targeted Vitest coverage for:
  - route schema allows OpenAI `sketch_to_real`.
  - route schema still rejects unsupported OpenAI non-Phase-9 modes if any remain.
  - `GenerationService.create()` accepts OpenAI `sketch_to_real` with two outputs and Sketch-specific options.
  - OpenAI transparent-background requests are no longer rejected at create time for `sketch_to_real`; they are routed to post-process.
  - `openaiImageService.generateSketchToReal()` calls `client.images.edit()` with `model: 'gpt-image-2'`, `n: 2`, `quality`, role-named images, no `background`, and no `input_fidelity`.
  - post-process marks `hasTransparency` only for alpha outputs.
  - worker routes OpenAI `sketch_to_real` to `generateSketchToReal()` and keeps provider/model mismatch guards.

### Static Checks

- `rg "provider === 'openai' && value.mode !== 'ip_change'" apps/api/src/routes/generation.routes.ts` should no longer match after Phase 9.
- `rg "provider === 'openai' && input.mode !== 'ip_change'" apps/api/src/services/generation.service.ts` should no longer match after Phase 9.
- `rg "OpenAI provider는 현재 IP 변경 v2만 지원합니다" apps/api/src/worker.ts apps/api/src/services/generation.service.ts apps/api/src/routes/generation.routes.ts` should be updated to allow `sketch_to_real`.
- `rg "background:" apps/api/src/services/openai-image.service.ts` must not show an OpenAI request parameter for GPT Image 2.
- `rg "input_fidelity" apps/api/src/services/openai-image.service.ts` must not match.
- Product workflow UI should not render `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` as visible text.

### Manual / Live Smoke

When `OPENAI_API_KEY` is available:

1. Create a v2 Sketch to Real generation with a sketch only.
2. Create a v2 Sketch to Real generation with a sketch plus texture reference.
3. Confirm exactly two outputs each.
4. Record OpenAI request ID and output files.
5. Confirm prompt text preserves sketch layout, silhouette, proportions, face details, product construction, and perspective.
6. Confirm transparent option generates opaque first and then post-processed transparent PNG.

## Risks

- **Prompt drift:** texture reference may be interpreted as shape/scene reference unless prompt explicitly constrains it to material/finish only.
- **Route leakage:** result and history v2 logic is currently `ip_change`-specific and can silently omit Sketch v2 badges.
- **Transparent output:** direct OpenAI transparent background is unsupported for this model, and the local post-process path must be explicit and tested.
- **Provider fallback:** OpenAI failures must not fall back to Gemini.
- **UI scope creep:** Phase 10 follow-ups must remain disabled/guided for v2.
- **Schema false positive:** `apps/api/prisma/schema.prisma` is a canonical reference, but Phase 9 should not require schema changes unless implementation discovers missing fields.

## RESEARCH COMPLETE
