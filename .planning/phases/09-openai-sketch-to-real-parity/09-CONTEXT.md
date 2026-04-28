# Phase 9: OpenAI Sketch to Real Parity - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 9 adds a v2 `스케치 실사화` workflow powered by OpenAI GPT Image 2 while preserving the existing Gemini `스케치 실사화` workflow. The phase delivers a parallel v2 entry, expanded OpenAI-specific form controls, request creation, OpenAI worker/runtime execution, two candidate outputs, selected-image saving, history reopen, download, and transparent-background fulfillment through the existing post-process path.

In scope:
- Add a parallel v2 `스케치 실사화` entry from the same project context.
- Keep the current Gemini `스케치 실사화` route and behavior available as v1.
- Build the OpenAI Sketch to Real runtime as provider `openai` with `providerModel = gpt-image-2`.
- Generate two candidates from a required sketch image and optional texture/material reference.
- Preserve sketch layout, silhouette, proportions, face details, product construction, and perspective while adding photorealistic manufacturing detail.
- Keep transparent-background selection available to users, but generate opaque output first and route through background-removal/post-process.

Out of scope:
- Removing or renaming the existing Gemini workflow.
- Exposing model names to end users.
- Direct transparent background output from `gpt-image-2`.
- Full provider comparison views.
- v2 partial edit, style copy, and same-condition regeneration support; those belong to Phase 10 provider continuation work.

</domain>

<decisions>
## Implementation Decisions

### Entry And Labeling
- **D-01:** Add separate v1/v2 `스케치 실사화` cards and sidebar entries, matching the Phase 8 `IP 변경` v1/v2 pattern.
- **D-02:** Keep the existing Gemini route unchanged at `/projects/:id/sketch-to-real`.
- **D-03:** Add the OpenAI v2 route at `/projects/:id/sketch-to-real/openai`.
- **D-04:** Do not show provider/model names like `OpenAI`, `Gemini`, or `GPT Image 2` in the user-facing product workflow label.
- **D-05:** Label the existing workflow as v1 and the new OpenAI workflow as v2 in user-facing surfaces.

### Form Surface And Defaults
- **D-06:** Use an expanded Phase 8 v2-style form surface for `스케치 실사화 v2`, not the minimal current v1 form.
- **D-07:** Include quality mode controls: `빠른모드` -> `quality: "low"`, `균형모드` -> `quality: "medium"`, and `퀄리티모드` -> `quality: "high"`.
- **D-08:** Default to preservation-strong settings: `균형모드`, structure preservation ON, fixed viewpoint ON, and fixed background ON.
- **D-09:** Show the transparent-background option in the same position as v1 for parity.
- **D-10:** Do not send transparent-background options directly to `gpt-image-2`; generate an opaque clean product-review image first, then route through background-removal/post-process.
- **D-11:** Include user instructions, but apply them inside the preservation contract.

### Texture Reference Contract
- **D-12:** Treat the optional texture image as a material/finish reference only.
- **D-13:** Product shape and category come from the sketch and product category input; within that shape/category, the texture reference takes priority for material and finish.
- **D-14:** The texture reference must not import new characters, logos, text, pattern placement, product shape, background/scene, or props.
- **D-15:** If no texture reference is uploaded, infer a suitable material from the product category, sketch, and prompt using natural manufacturing materials such as ceramic, plastic, fabric, acrylic, resin, vinyl, rubber, metal, or transparent material.

### Design Preservation Strictness
- **D-16:** Use a strong preservation contract: preserve layout, silhouette, proportions, face details, product construction, and perspective.
- **D-17:** Realism should add material, lighting, surface finish, form shading, stitching, molded edges, glaze, or other manufacturing detail only.
- **D-18:** Do not allow user instructions to override core sketch details in Phase 9. Additional instructions apply only within the preservation contract.
- **D-19:** Ban new elements entirely: no new characters, text, logos, decorations, props, background objects, or scene staging unless a future phase explicitly expands scope.
- **D-20:** Do not change form, proportions, or face details as part of cleanup.

### Product And Material Guidance
- **D-21:** Collect both product category and material guidance from the user in the v2 form.
- **D-22:** Product category uses a preset dropdown with an `기타` free-text path.
- **D-23:** Category presets should include: `머그`, `텀블러`, `플레이트`, `키링`, `그립톡`, `인형`, `쿠션`, `피규어`, `마그넷`, and `기타`.
- **D-24:** Material uses preset chips or dropdown plus free text for details.
- **D-25:** Material presets should include: `세라믹`, `플라스틱`, `아크릴`, `금속`, `봉제/패브릭`, `레진/비닐`, `고무`, `투명 소재`, and `기타`.
- **D-26:** When category/material inputs and a texture reference are both present, category input takes priority for product structure, texture reference takes priority for material/finish, and material preset/free text helps when no texture exists or texture interpretation needs disambiguation.

### OpenAI Output Quality Contract
- **D-27:** Implement v2 Sketch to Real with the OpenAI Image API edit flow, using Image 1 as the designer sketch and Image 2 as the optional material/texture reference.
- **D-28:** Always return two candidates for v2 Sketch to Real.
- **D-29:** The prompt must name image roles explicitly and separate `Must preserve`, `Must add`, and `Hard constraints`.
- **D-30:** The prompt must state that the sketch is a locked design spec and that the texture reference is not a style/scene reference.

### the agent's Discretion
- Exact visual styling for the v2 card/sidebar emphasis, as long as v1/v2 parity remains clear.
- Exact Korean microcopy around quality mode, preservation controls, product category, and material guidance.
- Whether the v2 page reuses shared components from `ip-change/openai/page.tsx` or duplicates first and refactors later.
- Exact internal field names for product category/material, provided they persist into generation options and prompt construction unambiguously.
- Exact disabled-button treatment for Phase 10 actions, provided users do not hit broken OpenAI follow-up paths.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` - Phase 9 goal, requirements, success criteria, required skills, and dependency on Phase 7.
- `.planning/REQUIREMENTS.md` - `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03`.
- `.planning/PROJECT.md` - v1.1 milestone rule: add OpenAI beside Gemini, not as a migration.
- `.planning/STATE.md` - current state after Phase 8 and accumulated provider/runtime decisions.
- `.planning/OPENAI-SKILL-GUARDRAILS.md` - mandatory skill-use matrix for OpenAI phases; Phase 9 must use dual-provider, workflow, runtime, Sketch Realization, and CLI smoke guidance.

### Prior Phase Contracts
- `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md` - provider/model persistence, provider-scoped keys, OpenAI trace metadata, and worker fail-fast decisions.
- `.planning/phases/07-provider-foundation-and-key-separation/07-RESEARCH.md` - provider-aware runtime and worker routing research.
- `.planning/phases/07-provider-foundation-and-key-separation/07-PATTERNS.md` - closest code analogs for generation service, worker, queue, admin metadata, and web API contracts.
- `.planning/phases/07-provider-foundation-and-key-separation/07-VERIFICATION.md` - confirms Phase 7 provider foundation is complete.
- `.planning/phases/08-openai-ip-change-parity/08-CONTEXT.md` - v1/v2 labeling, quality controls, opaque-first transparent handling, disabled Phase 10 follow-up behavior, and OpenAI runtime decisions to carry forward.
- `.planning/phases/08-openai-ip-change-parity/08-RESEARCH.md` - OpenAI image runtime and prompt research from the first v2 workflow.
- `.planning/phases/08-openai-ip-change-parity/08-PATTERNS.md` - code analogs for v2 route, worker dispatch, OpenAI service, result/history badges, and smoke checks.
- `.planning/phases/08-openai-ip-change-parity/08-UI-SPEC.md` - v1/v2 project entry and result-view UX patterns.
- `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` - OpenAI runtime smoke validation pattern and request ID capture expectations.
- `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` - validates Phase 8 shipped OpenAI IP Change parity and should guide regression checks.

### OpenAI Workflow Guidance
- `.codex/skills/mockup-openai-dual-provider/SKILL.md` - project rule: add OpenAI as a parallel provider and keep Gemini intact.
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md` - recommended parallel menu, runtime split, metadata, and history shape.
- `.codex/skills/mockup-openai-dual-provider/references/official-source-map.md` - official OpenAI docs map and practical constraints.
- `.codex/skills/mockup-openai-image-runtime/SKILL.md` - runtime implementation guidance for a parallel OpenAI image service, worker dispatch, OpenAI request IDs, and metadata capture.
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md` - confirms Image API edit is the right first-pass endpoint for Sketch to Real.
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md` - OpenAI Node SDK usage, request ID capture, and service-file guidance.
- `.codex/skills/mockup-openai-workflows/SKILL.md` - workflow behavior mapping for Sketch to Real, edits, style copy, and regeneration.
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md` - recommends Image API edit for Sketch to Real and names sketch/texture input roles.
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md` - structured prompt rules for multi-image edits and preservation constraints.
- `.codex/skills/mockup-sketch-realization/SKILL.md` - Sketch to Real prompt contract, material guidance, project defaults, and failure checks.
- `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md` - GPT Image 2 notes for sketch realization, quality, texture references, transparent-background constraint, and `input_fidelity` constraint.
- `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - smoke-test guidance for real OpenAI edit calls, request ID capture, and transparent-background constraint checks.

### Official OpenAI Docs Checked During Discussion
- `https://developers.openai.com/api/docs/models/gpt-image-2` - GPT Image 2 supports image generation/editing, high-fidelity image inputs, Image API edit endpoint, and snapshot metadata.
- `https://developers.openai.com/api/docs/guides/image-generation` - output options, quality modes, size constraints, and transparent-background limitations.
- `https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide` - sketch/product prompt guidance summarized in local skill references.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` - current generation request flow and async worker architecture.
- `.planning/codebase/STACK.md` - monorepo stack, Next.js/Fastify/BullMQ/Prisma/OpenAI SDK context.
- `.planning/codebase/INTEGRATIONS.md` - current Gemini/BullMQ/Prisma/file-storage integration.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/app/projects/[id]/page.tsx` - project entry screen where v1 and v2 `스케치 실사화` cards/sidebar entries should be added.
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx` - existing Gemini v1 form; keep route and behavior intact.
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` - Phase 8 v2 form pattern for quality mode, preservation defaults, v2 copy, and provider/model request payload.
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - result polling, candidate selection, save, download, and disabled follow-up actions; currently treats OpenAI v2 mainly as `ip_change` and should be generalized for Sketch to Real v2.
- `apps/web/src/app/projects/[id]/history/page.tsx` - selected-image history grid already shows v1/v2 badge behavior based on provider.
- `apps/web/src/lib/api.ts` - frontend API client and types; add product category/material option fields where needed.
- `apps/api/src/routes/generation.routes.ts` - create/get/select/regenerate/history API surface already carries provider/model.
- `apps/api/src/services/generation.service.ts` - creates generation records, validates uploaded paths, persists options, and enqueues provider-aware jobs.
- `apps/api/src/lib/queue.ts` - `GenerationJobData` already carries provider/providerModel and mode data.
- `apps/api/src/worker.ts` - validates queue provider/model against database and dispatches OpenAI only for `ip_change` today.
- `apps/api/src/services/openai-image.service.ts` - existing OpenAI service for IP Change; add a parallel `generateSketchToReal` method rather than mixing into Gemini code.
- `apps/api/src/services/gemini.service.ts` - existing Sketch to Real prompt option semantics to mirror without reusing Gemini-only primitives.
- `apps/api/prisma/schema.prisma` - `Generation` already has provider/model/OpenAI trace fields from Phase 7.
- `packages/shared/src/types/index.ts` - shared provider, generation option, and generation response contracts.

### Established Patterns
- Backend route handlers use Zod validation and `{ success, data/error }` responses.
- `GenerationService.create()` owns persistence plus BullMQ enqueue; v2 should enter through this same orchestration path with `provider = openai`.
- Worker status transitions remain centralized in `apps/api/src/worker.ts`.
- Provider routing must fail fast; no implicit Gemini fallback is allowed for OpenAI jobs.
- Existing result page polls every 2 seconds until `completed` or `failed`.
- Existing history uses selected output image as the saved/reopened artifact.
- Phase 8 established user-facing `v1`/`v2` labels instead of provider/model labels.
- Phase 8 established OpenAI quality mode labels and default `균형모드`.

### Integration Points
- Add the v2 route/page under `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx`.
- Add project-screen v1/v2 `스케치 실사화` entries in `apps/web/src/app/projects/[id]/page.tsx`.
- Extend the v2 create request with `provider: "openai"`, `providerModel: "gpt-image-2"`, `quality`, product category, material preset/free text, preservation options, transparent option, source sketch path, and optional texture path.
- Update `GenerationService` validation to allow `provider === "openai"` for `mode === "sketch_to_real"` while preserving the existing fail-fast behavior for unsupported OpenAI modes.
- Add OpenAI Sketch to Real execution to `openai-image.service.ts` using Image API edit with sketch and optional texture reference.
- Update worker provider dispatch to call OpenAI runtime for `provider === "openai"` and `mode === "sketch_to_real"`.
- Store OpenAI support identifiers in `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, `openaiRevisedPrompt`, and/or `providerTrace` without exposing raw vendor payloads to users.
- Ensure result/history payloads expose enough version/provider data for v1/v2 badges while keeping user-facing labels model-free.
- Verify or implement the background-removal/post-process path for OpenAI transparent-background requests; do not assume direct model transparency.

</code_context>

<skill_guardrails>
## Required Skill Usage For Phase 9

Planning, execution, review, and verification for this phase must use:

- `.planning/OPENAI-SKILL-GUARDRAILS.md`
- `mockup-openai-dual-provider`
- `mockup-openai-workflows`
- `mockup-openai-image-runtime`
- `mockup-sketch-realization`
- `mockup-openai-cli-smoke` when validating real OpenAI runtime behavior or command-line smoke checks

The phase plan should list these skills and the following prompting references in `read_first` before touching route, service, worker, prompt, or smoke-test implementation:

- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`
- `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`

</skill_guardrails>

<specifics>
## Specific Ideas

- User selected the expanded Phase 8 v2-style form for Sketch to Real v2.
- User wants preservation-strong defaults: `균형모드`, structure preservation ON, fixed viewpoint ON, and fixed background ON.
- User selected separate v1/v2 project cards and sidebar entries.
- User selected texture reference priority for material/finish, while product shape and category remain controlled by sketch/category.
- User selected strong sketch preservation and no added visual elements.
- User selected explicit product category and material inputs, not pure inference.
- Product category presets: `머그`, `텀블러`, `플레이트`, `키링`, `그립톡`, `인형`, `쿠션`, `피규어`, `마그넷`, `기타`.
- Material presets: `세라믹`, `플라스틱`, `아크릴`, `금속`, `봉제/패브릭`, `레진/비닐`, `고무`, `투명 소재`, `기타`.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 9 scope. Phase 10 follow-up actions are already roadmap-scoped later work and should remain disabled/guided for v2 in Phase 9.

</deferred>

---

*Phase: 09-openai-sketch-to-real-parity*
*Context gathered: 2026-04-27*
