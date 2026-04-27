# Phase 8: OpenAI IP Change Parity - Research

**Date:** 2026-04-24
**Status:** Research complete
**Scope:** Plan OpenAI GPT Image 2 `IP 변경 v2` beside the existing Gemini `IP 변경 v1` workflow.

## Research Question

What does the planner need to know to implement Phase 8 without breaking the existing Gemini path?

## Key Findings

### 1. Provider foundation is already in place

Phase 7 already added the first-class provider dimension:

- `apps/api/prisma/schema.prisma` has `Provider` enum values `gemini` and `openai`.
- `Generation` stores `provider`, `providerModel`, `providerTrace`, `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, and `openaiRevisedPrompt`.
- `ApiKey` is provider-scoped.
- `apps/api/src/services/generation.service.ts` validates `providerModel` against provider defaults:
  - `gemini -> gemini-3-pro-image-preview`
  - `openai -> gpt-image-2`
- `apps/api/src/lib/queue.ts` already requires `provider` and `providerModel`.
- `apps/api/src/worker.ts` validates the queued provider/model against the persisted generation before dispatch.

Planning implication: Phase 8 should not add ad hoc `isOpenAI` flags or rework schema unless implementation discovers a missing OpenAI metadata field. The expected backend work is runtime dispatch and metadata population, not schema foundation.

### 2. Current OpenAI runtime blocker is explicit

`apps/api/src/worker.ts` currently has:

```ts
if (provider === 'openai') {
  throw new Error('OpenAI 이미지 런타임은 아직 지원되지 않습니다.');
}
```

Planning implication: the OpenAI path should replace this fail-fast branch only for `provider === "openai"` and `mode === "ip_change"` in Phase 8. Other OpenAI modes should remain blocked until later phases.

### 3. OpenAI IP Change should use Image API edit first

Required local guidance:

- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`
- `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md`
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md`
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md`

Consensus:

- Use Image API edit for Phase 8 `ip_change`.
- Treat Image 1 as the source product photo.
- Treat Image 2 as the character reference.
- Prompt must separate `Task`, `Image roles`, `Must change`, `Must preserve`, and `Hard constraints`.
- Do not send `background: "transparent"` to `gpt-image-2`.
- Do not send `input_fidelity` for `gpt-image-2`.
- Generate opaque output first; transparent-background handling must be implemented through a post-process path if requested.

Planning implication: add a parallel OpenAI service, likely `apps/api/src/services/openai-image.service.ts`, rather than mixing OpenAI logic into `gemini.service.ts`.

### 4. Two candidates are a product contract

The existing Gemini IP Change path loops to generate two images in `apps/api/src/services/gemini.service.ts`. The OpenAI Image API and installed SDK expose `n`, so the v2 path should request two edited images in one `images.edit` call where supported.

Planning implication: Phase 8 plans should make the OpenAI service return exactly two `Buffer` outputs for IP Change. Use one `images.edit` request with `n: 2` and capture request plus per-candidate metadata.

### 5. The existing form is reusable, but v2 defaults differ

`apps/web/src/app/projects/[id]/ip-change/page.tsx` already handles:

- source product upload
- character upload
- `preserveStructure`
- `transparentBackground`
- `preserveHardware`
- `fixedBackground`
- `fixedViewpoint`
- `removeShadows`
- user instructions
- hardware detail input
- create request and navigation to result page

Phase 8 UI-SPEC requires the v2 page to use the same surface with different defaults:

- `preserveStructure = true`
- `fixedViewpoint = true`
- `fixedBackground = true`
- `preserveHardware = false`
- `transparentBackground = false`
- `removeShadows = false`
- quality mode default `균형모드 -> medium`

Planning implication: a shared IP Change form component can reduce duplication, but direct route duplication is acceptable if the plan keeps behavior concrete. The planner should explicitly decide the file split.

### 6. User-facing provider names are forbidden in product screens

Phase 8 context and UI-SPEC require:

- Product workflow labels: `IP 변경 v1`, `IP 변경 v2`
- Badges: `v1`, `v2`
- Do not show `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` in user-facing project workflow screens, result pages, or history.
- Admin screens may continue exposing provider/model for support.

Planning implication: product UI should derive v1/v2 from `generation.provider` internally but map it to version labels only.

### 7. Result and history lifecycle already exist but need provider-aware UI behavior

Relevant files:

- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- `apps/web/src/app/projects/[id]/history/page.tsx`
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/image.routes.ts`
- `apps/web/src/lib/api.ts`

Existing APIs already return `provider` and `providerModel` for generation detail and history. The result page local `GenerationData` type currently omits them. History local `HistoryItem` also omits them.

Planning implication:

- Extend web local types to include `provider` and `providerModel`.
- Render v2 badges for `provider === "openai"` without exposing raw provider/model names.
- Disable unsupported v2 follow-ups in Phase 8:
  - partial edit
  - style copy
  - same-condition regeneration
- `조건 수정` for v2 IP Change should route back to `/projects/:id/ip-change/openai`.
- Candidate selection, save to history, reopen, and download should keep using existing endpoints.

### 8. Transparent background has no existing standalone removal service

Code search found `sharp` use in `apps/api/src/services/upload.service.ts`, but no dedicated background-removal service. Existing Gemini prompts ask the model for transparent background directly when selected. GPT Image 2 must not receive `background: "transparent"`.

Planning implication:

- Phase 8 must not falsely claim an existing background-removal service exists.
- If `transparentBackground` is selected for v2, implementation must either:
  - add a concrete post-process path using available tooling, or
  - safely return opaque output and mark transparency unsupported only if that is explicitly accepted.
- Because Phase 8 context says keep the transparent option and route through post-process, planner should include a task to verify and implement the post-process path rather than relying on prompt text.

### 9. OpenAI SDK dependency is not installed yet

`apps/api/package.json` currently includes `@google/genai` but not `openai`.

Planning implication: include a backend dependency task to add `openai` to `apps/api`, update lockfile, and verify `apps/api` type-checks. Use the official Node SDK pattern from `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md`.

### 10. Smoke validation must be planned, not improvised

The project includes:

- `.codex/skills/mockup-openai-cli-smoke/scripts/images-edit.sh`
- `.codex/skills/mockup-openai-cli-smoke/scripts/images-generate.sh`
- `.codex/skills/mockup-openai-cli-smoke/scripts/responses-image.mjs`

Planning implication:

- Include a smoke-test or operator-validation task for real OpenAI edit behavior.
- Smoke checks must capture request IDs and confirm `background: "transparent"` is not sent to `gpt-image-2`.
- Tests should not require a real API key in CI; real smoke can be documented/manual or gated on `OPENAI_API_KEY`.

## Recommended Implementation Slices

### Slice A: OpenAI runtime foundation for IP Change

Likely files:

- `apps/api/package.json`
- `pnpm-lock.yaml`
- `apps/api/src/services/openai-image.service.ts`
- `apps/api/src/services/__tests__/openai-image.service.test.ts`
- `apps/api/src/worker.ts`
- `apps/api/src/services/generation.service.ts`

Tasks:

- Add OpenAI SDK dependency.
- Add OpenAI image service using `client.images.edit()`.
- Build strict IP Change prompt.
- Generate exactly two candidate images.
- Capture request IDs and response metadata.
- Keep OpenAI `sketch_to_real`, edit, style-copy, and regenerate unsupported unless Phase 8 explicitly implements them.

### Slice B: v2 entry and form

Likely files:

- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/app/projects/[id]/ip-change/page.tsx`
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx`
- possible shared component under `apps/web/src/components/projects/`
- `apps/web/src/lib/api.ts`

Tasks:

- Add `IP 변경 v1` and `IP 변경 v2` entries.
- Keep v1 route unchanged.
- Add v2 route with OpenAI create payload:
  - `provider: "openai"`
  - `providerModel: "gpt-image-2"`
  - `mode: "ip_change"`
  - `options.outputCount: 2`
  - `options.qualityMode` or equivalent quality value if shared types are extended
- Add Korean quality segmented control:
  - `빠른모드 -> low`
  - `균형모드 -> medium`
  - `퀄리티모드 -> high`

### Slice C: result/history provider-aware lifecycle

Likely files:

- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- `apps/web/src/app/projects/[id]/history/page.tsx`
- `apps/web/src/lib/api.ts`
- possible backend response adjustments in `apps/api/src/routes/generation.routes.ts`

Tasks:

- Add v1/v2 labels from provider.
- Enforce exactly two candidate labels for v2 UI.
- Disable unsupported v2 follow-ups with `v2 후속 편집은 다음 업데이트에서 지원됩니다`.
- Route condition edit for v2 IP Change to `/projects/:id/ip-change/openai`.
- Preserve save, reopen, and download endpoints.

### Slice D: verification and regression coverage

Likely commands:

- `pnpm --filter @mockup-ai/api test`
- `pnpm --filter @mockup-ai/api type-check`
- `pnpm --filter @mockup-ai/web type-check`
- `pnpm lint` if touched files are lint-sensitive

Likely tests:

- OpenAI service prompt/options tests.
- Worker dispatch tests or service-level tests verifying OpenAI IP Change no longer hits the unsupported-runtime branch.
- Generation service tests for OpenAI quality/options persistence if shared schema changes.
- Web tests are currently absent; rely on type-check plus targeted component-friendly structure unless a test harness is added.
- Manual/open-key smoke test with `OPENAI_API_KEY` for real Image API edit.

## Risks And Plan Requirements

| Risk | Planning requirement |
|------|----------------------|
| Gemini regression | Every plan touching project entry, worker, result, or history must include a v1/Gemini preservation acceptance criterion. |
| Wrong endpoint | OpenAI IP Change must use Image API edit, not Responses API. |
| Transparent-background API error | Do not send `background: "transparent"` or `input_fidelity` to `gpt-image-2`. |
| One candidate only | Plan must assert exactly two v2 candidates. |
| Unsupported follow-ups executing | Result UI must disable v2 partial edit, style copy, and same-condition regeneration. |
| User-facing provider leakage | Product UI must show only v1/v2 labels. |
| Raw vendor data leakage | Store support IDs safely; do not display raw provider trace in product UI. |
| Long-running real API tests | Keep CI tests mocked; make real smoke explicit and gated. |

## Validation Architecture

### Goal-Backward Checks

Each plan must prove one or more Phase 8 success criteria:

- PROV-01: both v1 and v2 IP Change entries are reachable from the same project context.
- OIP-01: v2 creates an OpenAI `ip_change` generation and produces exactly two candidates.
- OIP-02: prompt/options preserve structure, viewpoint, background, and hardware constraints.
- OIP-03: selected v2 output can be saved, reopened from history, and downloaded.
- Gemini preservation: existing `/projects/:id/ip-change` and provider `gemini` dispatch remain available.

### Test Layers

1. Static/code tests:
   - Type-check API and web.
   - Unit tests for OpenAI service prompt mapping and forbidden parameters.
   - Unit tests for worker dispatch to OpenAI service on `provider === "openai"` and `mode === "ip_change"`.
2. Contract tests:
   - `providerModel` remains `gpt-image-2` for OpenAI.
   - quality labels map to `low`, `medium`, `high`.
   - v2 request body includes `provider: "openai"` and does not expose provider names in visible product copy.
3. UI lifecycle checks:
   - v1/v2 entries visible.
   - v2 result shows two candidates and `v2` badge.
   - unsupported follow-up buttons are disabled for v2.
   - history card shows v2 badge and reopens the result page.
4. Optional real-provider smoke:
   - Run only with `OPENAI_API_KEY`.
   - Use Image API edit smoke with source and character sample images.
   - Capture request IDs.
   - Confirm no `background: "transparent"` and no `input_fidelity` are sent.

### Acceptance Evidence

Planner should require concrete acceptance criteria such as:

- `apps/api/src/worker.ts` no longer throws `OpenAI 이미지 런타임은 아직 지원되지 않습니다.` for `provider === "openai"` and `mode === "ip_change"`.
- `apps/api/src/services/openai-image.service.ts` contains `client.images.edit`.
- OpenAI prompt tests assert `Edit Image 1`, `Image 2`, `Must change`, `Must preserve`, and `Hard constraints`.
- v2 create payload contains `provider: 'openai'` and `providerModel: 'gpt-image-2'`.
- Product UI files do not render `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` on project workflow, result, and history surfaces.
- Result page disables unsupported v2 follow-ups with `v2 후속 편집은 다음 업데이트에서 지원됩니다`.

## Research Complete

This research supports planning Phase 8 into backend runtime, v2 entry/form, result/history lifecycle, and validation/smoke slices.

## RESEARCH COMPLETE
