# Phase 7: Provider Foundation and Key Separation - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Make generation persistence, admin API key management, and queue/worker routing provider-aware before exposing OpenAI user workflows. This phase delivers the foundation for `gemini` and `openai` providers while keeping existing Gemini generation behavior intact.

In scope:
- Provider-aware `Generation` and `ApiKey` schema/data migration
- Provider/model metadata persisted on generation records
- Provider-scoped API key activation and usage tracking
- Provider included in generation request/queue payloads
- Worker dispatch by provider before mode-specific execution
- Admin/debug surfaces exposing provider/model and safe OpenAI trace identifiers

Out of scope:
- OpenAI IP Change user workflow implementation
- OpenAI Sketch to Real user workflow implementation
- Provider comparison views
- API key auto-rotation
- Cross-provider style memory compatibility

</domain>

<decisions>
## Implementation Decisions

### Existing Data Transition
- **D-01:** Backfill all existing `Generation` records to `provider = gemini`.
- **D-02:** Backfill all existing `ApiKey` records to `provider = gemini`; current keys are operationally Gemini keys.
- **D-03:** `providerModel` is required for generation records.
- **D-04:** Existing Gemini generation records use `providerModel = gemini-3-pro-image-preview`.
- **D-05:** OpenAI generation records should store the model actually used, starting with `gpt-image-2` or the selected snapshot/alias used by the runtime.

### Provider-Aware API Key Management
- **D-06:** `/admin/api-keys` uses provider tabs: `Gemini` and `OpenAI`.
- **D-07:** Each provider has exactly one active key at a time.
- **D-08:** Phase 4 API key lifecycle rules apply per provider: active key cannot be deleted, activation requires confirmation, successful actions show toast feedback, and `callCount`/`lastUsedAt` are tracked separately per provider.
- **D-09:** No global active key remains. Gemini and OpenAI active keys must not deactivate each other.

### OpenAI Trace Metadata
- **D-10:** Store shared provider fields as first-class generation fields: `provider` and `providerModel`.
- **D-11:** Store OpenAI core support identifiers in dedicated fields: `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, and `openaiRevisedPrompt`.
- **D-12:** Store extra or evolving provider-specific metadata in `providerTrace` JSON.
- **D-13:** Admin/debug UI exposes operational identifiers only: provider, model, request ID, response ID, image call ID, and revised prompt in a safe summary/collapsible area.
- **D-14:** Admin/debug UI must not expose raw API keys, uploaded image bytes/base64, or full raw vendor response bodies.

### Worker Routing Safeguards
- **D-15:** Provider routing errors fail fast. Missing provider, unknown provider, missing provider key, or provider mismatch should mark the generation failed with a clear error.
- **D-16:** No implicit fallback is allowed. OpenAI jobs must never silently run through Gemini, and Gemini jobs must never silently run through OpenAI.
- **D-17:** `Generation.provider` in the database is the source of truth.
- **D-18:** Queue payloads must also include provider as a required copy for inspection and routing, but worker startup must compare payload provider against database provider and fail on mismatch.
- **D-19:** Admin retry must read the failed generation's database provider/model and requeue with the same provider.

### the agent's Discretion
- Exact enum/type names for provider values, as long as values are unambiguous and shared across API, worker, and frontend.
- Exact Prisma migration mechanics for backfill and constraints.
- Whether OpenAI-specific trace fields are nullable columns, provided they are available for OpenAI records and do not block Gemini records.
- Exact tab styling, badge styling, and microcopy in `/admin/api-keys`.
- Test organization and mocking strategy, provided provider separation and fail-fast behavior are covered.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope
- `.planning/ROADMAP.md` - Phase 7 goal, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` - `OPS-01`, `OPS-02`, `OPS-03`, and `OPS-04` traceability for Phase 7.
- `.planning/PROJECT.md` - v1.1 milestone constraints: parallel provider rollout, Gemini preservation, provider/model/debug metadata.
- `.planning/STATE.md` - prior decisions and current milestone state, including no `.env` Gemini fallback and admin key management behavior.
- `.planning/research/SUMMARY.md` - v1.1 research summary and recommended provider/schema/runtime direction.

### Prior Phase Contracts
- `.planning/milestones/v1.0-phases/04-api-key-management/04-CONTEXT.md` - Existing API key lifecycle, encryption, call count, active-key behavior, and no `.env` fallback policy.
- `.planning/milestones/v1.0-phases/05-dashboard-active-key-wiring/05-CONTEXT.md` - Current dashboard active-key display contract.
- `.planning/milestones/v1.0-phases/03-generation-and-content-monitoring/03-CONTEXT.md` - Admin generation monitoring, retry behavior, polling, and table/detail patterns.
- `.planning/milestones/v1.0-phases/02-dashboard-and-user-management/02-CONTEXT.md` - Admin table, confirmation modal, toast, pagination, and polling UI patterns.

### OpenAI Rollout Guidance
- `.codex/skills/mockup-openai-dual-provider/SKILL.md` - Project-specific rule: add OpenAI as parallel provider, not Gemini migration.
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md` - Recommended data, admin key, runtime, history, and worker rollout shape.
- `.codex/skills/mockup-openai-dual-provider/references/official-source-map.md` - Official OpenAI docs map and practical constraints for `gpt-image-2`.
- `.codex/skills/mockup-openai-image-runtime/SKILL.md` - Runtime implementation guidance for OpenAI image service, endpoint choice, request IDs, and metadata capture.
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md` - Endpoint choices for IP Change, Sketch to Real, edit, regenerate, style copy, and 2-candidate behavior.
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md` - OpenAI Node SDK usage, request ID capture, and service-file guidance.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` - Existing layers and generation data flow.
- `.planning/codebase/STRUCTURE.md` - File locations for schema, services, routes, worker, web pages, and shared types.
- `.planning/codebase/INTEGRATIONS.md` - Current Gemini integration, BullMQ queue, Redis, Prisma, and deployment context.
- `.planning/codebase/CONVENTIONS.md` - TypeScript, route/service, Zod, error handling, and UI conventions.
- `.planning/codebase/CONCERNS.md` - Known fragile areas around worker, JSON casts, regeneration validation, and thought signature handling.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/prisma/schema.prisma` - Current `Generation` and `ApiKey` models are the primary schema targets for provider fields and backfill.
- `apps/api/src/services/admin.service.ts` - Existing API key list/create/delete/activate/get-active/increment behavior should be generalized by provider.
- `apps/api/src/routes/admin/api-keys.routes.ts` - Existing admin key routes can accept provider query/body/params while preserving the current route family.
- `apps/web/src/app/admin/api-keys/page.tsx` - Existing API key page owns table data, add modal, confirm modal, toast, and refresh behavior.
- `apps/web/src/app/admin/api-keys/ApiKeyTable.tsx` - Existing table can be reused inside provider tabs.
- `apps/api/src/lib/queue.ts` - `GenerationJobData` must add required provider and likely providerModel.
- `apps/api/src/worker.ts` - Current worker always loads Gemini key and calls `geminiService`; this becomes provider dispatch before mode handling.
- `apps/api/src/services/generation.service.ts` - `create`, `regenerate`, `copyStyle`, and history response paths must persist and propagate provider/model.
- `apps/api/src/routes/generation.routes.ts` - Create/regenerate/select/copy-style responses need provider/model where user or downstream code depends on lineage.
- `apps/api/src/routes/edit.routes.ts` - Current edit route directly calls Gemini; Phase 7 should at least prevent provider drift for future OpenAI edits.
- `apps/web/src/lib/api.ts` and `packages/shared/src/types/index.ts` - Shared/frontend types need provider-aware request and response shapes.

### Established Patterns
- Backend uses Fastify route handlers with Zod validation and service-layer orchestration.
- Admin UI uses tables, confirmation dialogs, local toast state, and existing design tokens.
- Phase 4 established encrypted API key storage and defensive stripping of `encryptedKey`.
- Phase 4 established no `process.env.GEMINI_API_KEY` runtime fallback once DB key management exists.
- Worker currently increments API key call count immediately before vendor calls; keep this pattern provider-scoped.
- Admin retry currently requeues failed jobs; update this path to preserve provider/model.

### Integration Points
- Prisma migration/backfill touches `Generation` and `ApiKey`.
- Admin key API and UI must filter/manage keys by provider.
- Dashboard active key display must become provider-aware or avoid implying a single global active key.
- Generation creation must persist provider/model and enqueue provider/model.
- Worker must load provider-specific active key, dispatch to provider-specific service, and fail on provider mismatch.
- Admin generation monitoring should include provider/model and safe trace identifiers for support.

</code_context>

<specifics>
## Specific Ideas

- Provider tabs should make it visually clear that Gemini and OpenAI each have their own active key.
- OpenAI request identifiers are for support/debugging; they should be visible enough to copy for investigation without exposing sensitive raw payloads.
- Existing Gemini records and jobs should remain understandable as Gemini records after migration.
- Phase 7 should make wrong-provider execution impossible by structure, not by operator convention.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 7 scope.

</deferred>

---

*Phase: 07-provider-foundation-and-key-separation*
*Context gathered: 2026-04-23*
