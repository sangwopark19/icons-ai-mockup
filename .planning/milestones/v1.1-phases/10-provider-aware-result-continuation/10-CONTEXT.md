# Phase 10: Provider-Aware Result Continuation - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 10 makes result pages, history, regenerate, edit, and style-copy flows stay pinned to the originating provider. This phase turns the disabled OpenAI v2 follow-up actions from Phases 8 and 9 into working provider-aware continuations while preserving existing Gemini behavior.

In scope:
- Keep result and history surfaces provider-aware while using `v1`/`v2` as the user-facing signal.
- Make same-condition regeneration replay the original provider, model, inputs, prompt, and options.
- Enable OpenAI v2 partial edit from the existing result page.
- Enable OpenAI v2 style copy for both `IP 변경` and `새 제품 적용`.
- Use OpenAI response/image linkage where it improves style-copy continuity, with a selected-image fallback for missing linkage.
- Preserve provider/model and OpenAI support metadata for debugging.

Out of scope:
- Provider comparison dashboards or side-by-side comparison views.
- Region mask UI for precision editing.
- User-facing provider switching from a saved result.
- Raw provider/model labels in the normal product UI.
- Iterative multi-turn partial-edit refinement; this is deferred.

</domain>

<decisions>
## Implementation Decisions

### Provider And Model Signaling
- **D-01:** Result and history user-facing badges stay `v1`/`v2`, not raw `Gemini`, `OpenAI`, or `gpt-image-2`.
- **D-02:** For this milestone, `v1` is the user-facing signal for the Gemini lane and `v2` is the user-facing signal for the OpenAI GPT Image 2 lane.
- **D-03:** Raw `provider` and `providerModel` remain available in API records, admin/ops/debug surfaces, and test assertions, but are not shown as normal product workflow labels.
- **D-04:** Downstream work must still keep result/history data structurally provider-aware. The UI can be simple, but follow-up actions must route from persisted provider/model, not from badge text.

### OpenAI Same-Condition Regeneration
- **D-05:** OpenAI v2 same-condition regeneration reuses the original `provider`, `providerModel`, stored input asset paths, prompt, and options.
- **D-06:** Regeneration creates a fresh OpenAI request rather than using the selected output image as a seed/reference.
- **D-07:** OpenAI v2 regeneration returns exactly two candidates, matching the Phase 8/9 v2 generation review pattern.
- **D-08:** If required stored inputs are missing or invalid, regeneration should fail clearly rather than falling back to Gemini or inventing replacement inputs.

### OpenAI Partial Edit
- **D-09:** OpenAI v2 partial edit reuses the existing freeform edit modal UX.
- **D-10:** The backend wraps the user's freeform edit request in a strict preserve prompt: change only the requested target and preserve product body, camera angle, crop, background rule, lighting, text, labels, hardware, and non-target details.
- **D-11:** OpenAI v2 partial edit uses Image API edit first, with the selected result image as the input image.
- **D-12:** OpenAI v2 partial edit returns one result image, not two candidates.
- **D-13:** A successful partial edit creates a new generation/result record and navigates to that result, preserving the existing result-page lifecycle.
- **D-14:** Store OpenAI request/debug metadata for partial edits using the existing OpenAI metadata fields and/or `providerTrace`.

### OpenAI Style Copy
- **D-15:** OpenAI v2 style copy supports both existing product actions: `스타일 복사 (IP 변경)` and `스타일 복사 (새 제품 적용)`.
- **D-16:** OpenAI v2 style copy uses a dedicated style-copy page rather than overloading the existing IP Change page or a result-page upload modal. This was chosen because result quality is the priority.
- **D-17:** The dedicated style-copy page must clearly show the approved output being used as the style reference and collect the new target asset for the chosen copy target.
- **D-18:** Use saved OpenAI response/image linkage first for style copy: `openaiResponseId`, `openaiImageCallId`, and related provider trace data where available.
- **D-19:** If OpenAI linkage is missing or insufficient, fall back to the selected result image as the style reference instead of blocking the feature entirely.
- **D-20:** OpenAI v2 style copy returns exactly two candidates.
- **D-21:** OpenAI v2 style copy must not use Gemini `thoughtSignature`; Gemini and OpenAI lineage mechanisms stay separate.
- **D-22:** Style-copy prompts must preserve the approved output's composition, viewpoint, lighting, background, product treatment, and polish while replacing only the named target.

### the agent's Discretion
- Exact route name for the dedicated style-copy page, provided it is reachable from result/history follow-up actions and keeps the style reference explicit.
- Exact Korean microcopy for `v1`/`v2`, partial edit, same-condition regeneration, and style-copy actions.
- Exact internal service method names and provider trace JSON shape, provided support identifiers remain recoverable for OpenAI runs.
- Whether OpenAI partial edit is implemented through the existing edit route or a shared provider-aware generation continuation service, provided provider fallback is impossible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` - Phase 10 goal, requirements, success criteria, required skills, and dependency on Phases 8 and 9.
- `.planning/REQUIREMENTS.md` - `PROV-03`, `PROV-04`, `OED-01`, `OED-02`, and `OED-03`.
- `.planning/PROJECT.md` - v1.1 milestone rule: OpenAI is added beside Gemini, not as a migration.
- `.planning/STATE.md` - accumulated provider/runtime decisions, Phase 9 follow-up state, and no-fallback expectations.
- `.planning/OPENAI-SKILL-GUARDRAILS.md` - mandatory skill-use matrix for Phase 10 provider continuation work.

### Prior Phase Contracts
- `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md` - provider/model persistence, provider-scoped keys, OpenAI trace metadata, and worker fail-fast decisions.
- `.planning/phases/08-openai-ip-change-parity/08-CONTEXT.md` - v1/v2 labeling, two-candidate v2 generation, disabled Phase 10 follow-up behavior, and OpenAI IP Change runtime contract.
- `.planning/phases/09-openai-sketch-to-real-parity/09-CONTEXT.md` - v1/v2 labeling for Sketch to Real, two-candidate v2 generation, transparent post-process behavior, and disabled Phase 10 follow-up behavior.
- `.planning/phases/08-openai-ip-change-parity/08-UI-SPEC.md` - result/history UX and v1/v2 display patterns established for OpenAI IP Change.
- `.planning/phases/09-openai-sketch-to-real-parity/09-UI-SPEC.md` - result/history UX and v2 Sketch to Real expectations.

### OpenAI Workflow Guidance
- `.codex/skills/mockup-openai-dual-provider/SKILL.md` - keep Gemini intact and add OpenAI as a parallel provider lane.
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md` - provider metadata, runtime split, history shape, and same-provider follow-up checklist.
- `.codex/skills/mockup-openai-workflows/SKILL.md` - workflow behavior mapping for regeneration, partial edit, and style copy.
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md` - endpoint choices: Image API edit for partial edit, Responses linkage for style copy, fresh request for regeneration.
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md` - prompt structure rules and preservation invariants.
- `.codex/skills/mockup-openai-image-runtime/SKILL.md` - OpenAI image runtime implementation guidance.
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md` - Image API vs Responses API guidance and provider-specific traps.
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md` - OpenAI Node SDK usage and request ID capture guidance.
- `.codex/skills/mockup-precision-edit/SKILL.md` - precision edit, style copy, and regeneration prompt behavior.
- `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md` - strict edit invariants, style-copy linkage, transparent-background constraint, and `input_fidelity` constraint.
- `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - smoke-test guidance for real OpenAI continuation calls and request ID capture.

### Official OpenAI Docs Checked During Discussion
- `https://developers.openai.com/api/docs/guides/image-generation` - Image API is best for single-turn image generation/editing; Responses API is useful for conversational and iterative cases.
- `https://developers.openai.com/api/docs/guides/tools-image-generation` - Responses image tool supports prior response/image linkage for multi-turn image workflows.
- `https://developers.openai.com/api/docs/models/gpt-image-2` - GPT Image 2 model capabilities and constraints.

### Codebase Maps
- `.planning/codebase/STACK.md` - monorepo stack, Next.js/Fastify/BullMQ/Prisma/OpenAI SDK context.
- `.planning/codebase/INTEGRATIONS.md` - current Gemini, BullMQ, Prisma, Redis, upload, and API contract integrations.
- `.planning/codebase/ARCHITECTURE.md` - generation request flow, worker flow, edit flow, and layer boundaries.
- `.planning/codebase/CONCERNS.md` - fragile areas around worker routing, regeneration validation, JSON casts, and Gemini thought signatures.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - result page already shows `v1`/`v2`, handles selected image, save/download, and currently disables OpenAI v2 follow-up actions.
- `apps/web/src/app/projects/[id]/history/page.tsx` - history grid already uses `v1`/`v2` badge behavior based on provider.
- `apps/api/src/services/generation.service.ts` - `regenerate` and `copyStyle` already preserve provider/model for Gemini paths but explicitly reject OpenAI today.
- `apps/api/src/routes/edit.routes.ts` - current partial edit route is Gemini-only and synchronously creates a completed edit generation; it is the main provider-awareness target for OpenAI partial edit.
- `apps/api/src/services/openai-image.service.ts` - existing OpenAI Image API edit service for IP Change and Sketch to Real; extend it with precision edit and style-copy helpers rather than modifying `gemini.service.ts`.
- `apps/api/src/worker.ts` - validates queued provider/model against persisted generation provider/model and dispatches OpenAI for `ip_change` and `sketch_to_real`; currently rejects OpenAI style references.
- `apps/api/src/lib/queue.ts` - `GenerationJobData` already includes provider, providerModel, styleReferenceId, input asset paths, prompt, and options.
- `apps/api/prisma/schema.prisma` - `Generation` already stores provider/model, OpenAI request/response/image-call IDs, revised prompt, and providerTrace.
- `packages/shared/src/types/index.ts` and `apps/web/src/lib/api.ts` - shared/frontend generation types already expose provider/model and OpenAI identifiers.

### Established Patterns
- `Generation.provider` in the database is the source of truth. Queue payload provider is a required routing copy that must match the database record.
- OpenAI and Gemini must fail fast on wrong-provider execution; no implicit fallback is allowed.
- Result pages poll `/api/generations/:id` until `completed` or `failed`, then use selected image state for download/save/follow-up actions.
- Phase 8 and Phase 9 established two-candidate OpenAI v2 generation review and selected-image history lifecycle.
- Backend routes use Zod validation and `{ success, data/error }` responses.
- Existing style-copy surface is incomplete: result page passes `styleRef`/`copyTarget` query params to the IP Change page, but `apps/web/src/app/projects/[id]/ip-change/page.tsx` does not currently read those params.

### Integration Points
- Enable OpenAI follow-up buttons in `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` according to the decisions above.
- Add a dedicated OpenAI style-copy page reachable from result/history actions, with explicit style reference display and target asset upload.
- Update `apps/api/src/services/generation.service.ts` so OpenAI regeneration replays stored inputs/options/prompt through a fresh OpenAI request and returns two candidates.
- Update `apps/api/src/routes/edit.routes.ts` or route edit through a shared provider-aware continuation service so OpenAI partial edit uses selected image + Image API edit and returns one result.
- Extend `apps/api/src/services/openai-image.service.ts` with precision edit and style-copy prompt/runtime methods.
- Add Responses API style-copy support where linkage exists, and an Image API selected-image fallback where linkage is missing.
- Update worker dispatch to allow OpenAI style-copy jobs only through OpenAI lineage/reference logic; keep Gemini `thoughtSignature` handling isolated to Gemini.
- Add/adjust tests for provider-pinned regenerate, edit, style copy, missing-linkage fallback, no Gemini fallback, and raw provider/model visibility boundaries.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly prioritized output quality over the smallest implementation footprint for style copy.
- Dedicated style-copy page was selected because it best separates approved style reference, new target asset, and target-specific prompt contracts.
- The user accepted Image API edit for OpenAI partial edit after comparing result quality and implementation feasibility against Responses API continuation.
- `v1`/`v2` remains the normal user-facing provider/model signal; raw vendor/model text is operational metadata.

</specifics>

<deferred>
## Deferred Ideas

- Responses API based iterative partial-edit refinement belongs in a future phase.
- Region mask based precision editing remains out of scope for Phase 10.
- Provider comparison views and cross-provider duplication remain future candidates.

</deferred>

---

*Phase: 10-provider-aware-result-continuation*
*Context gathered: 2026-04-28*
