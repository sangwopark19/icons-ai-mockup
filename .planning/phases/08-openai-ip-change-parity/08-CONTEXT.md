# Phase 8: OpenAI IP Change Parity - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 adds a v2 `IP 변경` workflow powered by OpenAI GPT Image 2 while preserving the existing Gemini `IP 변경` workflow. The phase delivers user entry, request creation, OpenAI worker/runtime execution, two candidate outputs, selected-image saving, history reopen, and download through the existing project lifecycle.

In scope:
- Add a parallel v2 `IP 변경` entry from the same project context.
- Keep the current Gemini `IP 변경` route and behavior available.
- Build the OpenAI IP Change runtime as provider `openai` with `providerModel = gpt-image-2`.
- Preserve product structure, viewpoint, background rule, hardware, labels, and non-target details while replacing only the character/IP artwork.
- Return two OpenAI candidates and support select, save to history, reopen, and download.

Out of scope:
- Removing or renaming the existing Gemini workflow.
- Exposing model names to end users.
- Direct transparent background output from `gpt-image-2`.
- Full provider comparison views.
- v2 partial edit, style copy, and same-condition regeneration support; those belong to Phase 10 follow-up provider lineage work.

</domain>

<decisions>
## Implementation Decisions

### Entry And Labeling
- **D-01:** Add a separate v2 `IP 변경` menu/card beside the existing Gemini `IP 변경` entry on the project screen.
- **D-02:** Keep the existing Gemini route unchanged at `/projects/:id/ip-change`.
- **D-03:** Add the OpenAI v2 route at `/projects/:id/ip-change/openai`.
- **D-04:** Do not show provider/model names like `OpenAI`, `Gemini`, or `GPT Image 2` in the user-facing workflow label.
- **D-05:** Label the existing workflow as v1 and the new OpenAI workflow as v2 in user-facing surfaces.
- **D-06:** Give the v2 card equal parity with the v1 card, but visually emphasize v2 slightly because it is the newly added workflow.

### Form Options And Defaults
- **D-07:** Keep the same form surface as the existing `IP 변경` page: source product image, character image, structure preservation, transparent background, hardware preservation, fixed background, fixed viewpoint, shadow removal, and user instructions.
- **D-08:** Use preservation-oriented v2 defaults: `preserveStructure`, `fixedViewpoint`, and `fixedBackground` are enabled by default.
- **D-09:** `preserveHardware` stays disabled until the user explicitly enables it and supplies hardware detail.
- **D-10:** Keep the transparent background UI option for parity, but do not request transparent background from `gpt-image-2`; generate an opaque image first and route through the background-removal/post-process path.
- **D-11:** User instructions apply inside the preservation contract by default. Only explicit override language such as allowing structure changes can loosen preservation rules.

### OpenAI Output Quality Contract
- **D-12:** Implement v2 IP Change with the OpenAI Image API edit flow as a single worker job using the source product image and character reference image.
- **D-13:** Always return two candidates for v2 IP Change.
- **D-14:** Add a user-selectable quality mode control:
  - `빠른모드` maps to `quality: "low"`.
  - `균형모드` maps to `quality: "medium"` and is the default.
  - `퀄리티모드` maps to `quality: "high"`.
- **D-15:** Use a strict replacement prompt contract: edit Image 1 by replacing only the character/IP artwork with the Image 2 character identity.
- **D-16:** The prompt must lock product geometry, dimensions, crop, camera viewpoint, perspective, material, lighting, hardware, label placement, non-character text, and non-target areas.
- **D-17:** The prompt must preserve the Image 2 character's silhouette, proportions, face details, colors, and recognizable motifs.

### Result And History Lifecycle
- **D-18:** Result and history UI should show v1/v2 labels, not model names. Internal records still store `provider = openai` and `providerModel = gpt-image-2`.
- **D-19:** In Phase 8, v2 result pages should enable only candidate selection, save to history, reopen from history, and download.
- **D-20:** Partial edit, style copy, and same-condition regeneration should not run for v2 in this phase. Show disabled/guided actions where useful rather than letting unsupported actions fail at runtime.
- **D-21:** Disabled follow-up copy should be short: `v2 후속 편집은 다음 업데이트에서 지원됩니다`.
- **D-22:** Reuse the existing selected-image lifecycle: the user selects one of two candidates, saves it, and history/detail views reopen the saved generation with a v2 badge.

### the agent's Discretion
- Exact visual styling for the v2 emphasis, as long as v1/v2 parity remains clear.
- Exact Korean microcopy around v1/v2 labels and the quality mode control.
- Whether the v2 page reuses the existing `ip-change/page.tsx` internals through shared components or duplicates first and refactors later.
- Exact internal type names for quality mode, provided they map unambiguously to OpenAI `low`, `medium`, and `high`.
- Exact disabled-button treatment for Phase 10 actions, provided users do not hit broken OpenAI follow-up paths.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` - Phase 8 goal, requirements, success criteria, and dependency on Phase 7.
- `.planning/REQUIREMENTS.md` - `PROV-01`, `OIP-01`, `OIP-02`, and `OIP-03`.
- `.planning/PROJECT.md` - v1.1 milestone rule: add OpenAI beside Gemini, not as a migration.
- `.planning/STATE.md` - current state after Phase 7 and accumulated provider-foundation decisions.
- `.planning/research/SUMMARY.md` - milestone research summary for OpenAI dual-provider rollout.

### Prior Phase Contracts
- `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md` - provider/model persistence, provider-scoped keys, OpenAI trace metadata, and worker fail-fast decisions.
- `.planning/phases/07-provider-foundation-and-key-separation/07-RESEARCH.md` - provider-aware runtime and worker routing research.
- `.planning/phases/07-provider-foundation-and-key-separation/07-PATTERNS.md` - closest code analogs for generation service, worker, queue, admin metadata, and web API contracts.
- `.planning/phases/07-provider-foundation-and-key-separation/07-VERIFICATION.md` - confirms Phase 7 provider foundation is complete and OpenAI runtime intentionally unsupported until Phase 8.

### OpenAI Workflow Guidance
- `.planning/OPENAI-SKILL-GUARDRAILS.md` - mandatory skill-use matrix for OpenAI phases; Phase 8 must use dual-provider, workflow, runtime, IP Change, and CLI smoke guidance.
- `.codex/skills/mockup-openai-dual-provider/SKILL.md` - project rule: add OpenAI as a parallel provider and keep Gemini intact.
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md` - recommended parallel menu, runtime split, metadata, and history shape.
- `.codex/skills/mockup-openai-dual-provider/references/official-source-map.md` - official OpenAI docs map and practical constraints.
- `.codex/skills/mockup-openai-image-runtime/SKILL.md` - runtime implementation guidance for a parallel OpenAI image service, worker dispatch, OpenAI request IDs, and metadata capture.
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md` - confirms Image API edit is the right first-pass endpoint for IP Change and documents later follow-up workflow choices.
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md` - OpenAI Node SDK usage, request ID capture, and service-file guidance.
- `.codex/skills/mockup-openai-workflows/SKILL.md` - workflow behavior mapping for IP Change, edits, style copy, and regeneration.
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md` - recommends Image API edit for IP Change.
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md` - structured prompt rules for multi-image edits and preservation constraints.
- `.codex/skills/mockup-ip-change/SKILL.md` - IP replacement prompt contract and option mapping.
- `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md` - GPT Image 2 notes for IP Change, quality, sizing, transparent-background constraint, and Image API vs Responses API choice.
- `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - smoke-test guidance for real OpenAI edit calls, request ID capture, and transparent-background constraint checks.

### Official OpenAI Docs Checked During Discussion
- `https://developers.openai.com/api/docs/models/gpt-image-2` - GPT Image 2 supports image generation/editing, high-fidelity image inputs, Image API edit endpoint, and model snapshot metadata.
- `https://developers.openai.com/api/docs/guides/image-generation` - output options, quality modes, size constraints, and `gpt-image-2` transparent-background limitation.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` - current generation request flow and async worker architecture.
- `.planning/codebase/STRUCTURE.md` - key file locations for web pages, API routes, services, queue, worker, and shared types.
- `.planning/codebase/INTEGRATIONS.md` - current Gemini/BullMQ/Prisma/file-storage integration.
- `.planning/codebase/CONVENTIONS.md` - route/service, Zod, Tailwind, and response-shape conventions.
- `.planning/codebase/CONCERNS.md` - fragile areas around worker, JSON casts, thought signatures, upload paths, and result polling.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/app/projects/[id]/page.tsx` - project entry screen where v1 and v2 `IP 변경` cards/menu items should appear.
- `apps/web/src/app/projects/[id]/ip-change/page.tsx` - existing Gemini `IP 변경` form; v2 should reuse the same form surface and option semantics.
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - result polling, candidate selection, save, download, and follow-up action surface.
- `apps/web/src/app/projects/[id]/history/page.tsx` - selected-image history grid that should show v1/v2 badges and reopen v2 generations.
- `apps/web/src/lib/api.ts` - frontend API client and types; add provider/version fields where result/history UI needs them.
- `apps/api/src/routes/generation.routes.ts` - create/get/select/regenerate/history API surface already carries provider/model in backend responses.
- `apps/api/src/services/generation.service.ts` - creates generation records, validates uploaded paths, persists options, and enqueues provider-aware jobs.
- `apps/api/src/lib/queue.ts` - `GenerationJobData` already requires `provider` and `providerModel`.
- `apps/api/src/worker.ts` - validates queue provider/model against the database; currently fails OpenAI jobs explicitly until this phase adds runtime support.
- `apps/api/src/services/gemini.service.ts` - existing prompt option semantics and two-candidate generation behavior to mirror without mixing provider code.
- `apps/api/prisma/schema.prisma` - `Generation` already has provider/model/OpenAI trace fields from Phase 7.
- `packages/shared/src/types/index.ts` - shared provider, generation option, and generation response contracts.

### Established Patterns
- Backend route handlers use Zod validation and `{ success, data/error }` responses.
- `GenerationService.create()` owns persistence plus BullMQ enqueue; v2 should enter through this same orchestration path with `provider = openai`.
- Worker status transitions remain centralized in `apps/api/src/worker.ts`.
- Provider routing must fail fast; no implicit Gemini fallback is allowed for OpenAI jobs.
- Existing result page polls every 2 seconds until `completed` or `failed`.
- Existing history uses selected output image as the saved/reopened artifact.
- Current transparent-background behavior appears as a generation option and prompt constraint; no standalone background-removal service was obvious in the quick scout, so planning must verify the post-process path before assuming it exists.

### Integration Points
- Add the v2 route/page under `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` or equivalent file-based route.
- Add project-screen v1/v2 entry cards in `apps/web/src/app/projects/[id]/page.tsx`.
- Extend the create request from the v2 page with `provider: "openai"`, `providerModel: "gpt-image-2"`, and quality mode mapping.
- Add `openai-image.service.ts` beside `gemini.service.ts` for Image API edit execution.
- Update worker provider dispatch to call OpenAI runtime for `provider === "openai"` and `mode === "ip_change"`.
- Store OpenAI support identifiers in `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, `openaiRevisedPrompt`, and/or `providerTrace` without exposing raw vendor payloads to users.
- Ensure result/history payloads expose enough version/provider data for v1/v2 badges while keeping user-facing labels model-free.

</code_context>

<skill_guardrails>
## Required Skill Usage For Phase 8

Planning, execution, review, and verification for this phase must use:

- `.planning/OPENAI-SKILL-GUARDRAILS.md`
- `mockup-openai-dual-provider`
- `mockup-openai-workflows`
- `mockup-openai-image-runtime`
- `mockup-ip-change`
- `mockup-openai-cli-smoke` when validating real OpenAI runtime behavior or command-line smoke checks

The phase plan should list these skills and the following prompting references in `read_first` before touching route, service, worker, prompt, or smoke-test implementation:

- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`
- `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md`

</skill_guardrails>

<specifics>
## Specific Ideas

- User explicitly said not to show model names to users.
- User explicitly wants the newly created OpenAI workflow called `v2`.
- v2 should be a little more visually emphasized than v1, while still appearing as a parity workflow.
- Quality control should be user-facing as `빠른모드`, `균형모드`, and `퀄리티모드`, not raw OpenAI quality values.
- `균형모드` should be the default.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 8 scope. Phase 10 follow-up actions are not a deferred idea from this discussion; they are already roadmap-scoped later work and should remain disabled/guided for v2 in Phase 8.

</deferred>

---

*Phase: 08-openai-ip-change-parity*
*Context gathered: 2026-04-24*
