# Phase 7: Provider Foundation and Key Separation - Research

**Researched:** 2026-04-24
**Domain:** provider-aware Prisma schema, admin API key separation, queue/worker routing, support metadata surfaces
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Existing data transition**
- D-01: Backfill all existing `Generation` records to `provider = gemini`.
- D-02: Backfill all existing `ApiKey` records to `provider = gemini`.
- D-03: `providerModel` is required for generation records.
- D-04: Existing Gemini records use `providerModel = gemini-3-pro-image-preview`.
- D-05: OpenAI records store the actual runtime model used, starting with `gpt-image-2` or the selected snapshot/alias.

**Provider-aware API key management**
- D-06: `/admin/api-keys` uses provider tabs: `Gemini` and `OpenAI`.
- D-07: Each provider has exactly one active key at a time.
- D-08: Phase 4 API key lifecycle rules apply per provider: active key cannot be deleted, activation requires confirmation, successful actions show toast feedback, and `callCount` / `lastUsedAt` are tracked separately per provider.
- D-09: No global active key remains. Gemini and OpenAI active keys must not deactivate each other.

**OpenAI trace metadata**
- D-10: Store shared provider fields as first-class generation fields: `provider` and `providerModel`.
- D-11: Store OpenAI core support identifiers in dedicated fields: `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, and `openaiRevisedPrompt`.
- D-12: Store extra or evolving provider-specific metadata in `providerTrace` JSON.
- D-13: Admin/debug UI exposes operational identifiers only: provider, model, request ID, response ID, image call ID, and revised prompt in a safe summary/collapsible area.
- D-14: Admin/debug UI must not expose raw API keys, uploaded image bytes/base64, or full raw vendor response bodies.

**Worker routing safeguards**
- D-15: Missing provider, unknown provider, missing provider key, or provider mismatch must fail fast with a clear error and mark the generation failed.
- D-16: No implicit fallback is allowed. OpenAI jobs must never run through Gemini, and Gemini jobs must never run through OpenAI.
- D-17: `Generation.provider` in the database is the source of truth.
- D-18: Queue payloads must also include provider as a required copy, but worker startup must compare payload provider against database provider and fail on mismatch.
- D-19: Admin retry must read the failed generation's database provider/model and requeue with the same provider.

### the agent's Discretion
- Exact enum/type names for provider values, as long as values are unambiguous and shared across API, worker, and frontend.
- Exact Prisma migration mechanics for backfill and constraints.
- Whether OpenAI-specific trace fields are nullable columns, provided they are available for OpenAI records and do not block Gemini records.
- Exact tab styling, badge styling, and microcopy in `/admin/api-keys`.
- Test organization and mocking strategy, provided provider separation and fail-fast behavior are covered.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPS-01 | Admin can store and activate OpenAI API keys separately from Gemini API keys | Add provider-scoped `ApiKey.provider`, service methods that require provider, provider-tabbed admin UI, and dashboard data keyed by provider |
| OPS-02 | Admin can view provider-aware generation metadata for OpenAI runs, including provider, model, and request identifiers needed for support | Add `Generation.provider`, `providerModel`, OpenAI ID columns, safe `providerTrace`, and admin list/detail payloads that expose only support-safe fields |
| OPS-03 | System routes each queued generation job to the correct provider runtime based on the saved generation request | Add required `provider` to queue payloads, persist provider on create/regenerate/edit, validate payload-vs-DB provider at worker start, and dispatch by `provider -> mode` |
| OPS-04 | System stores the OpenAI response linkage needed for OpenAI regenerate, style-copy, and multi-turn edit flows | Add dedicated OpenAI lineage fields plus `providerTrace` so later phases can attach Responses/Image API linkage without reworking schema again |
</phase_requirements>

---

## Summary

Phase 7 is the control-plane foundation for the whole dual-provider milestone. The repo is currently operationally Gemini-only in four places: `ApiKey` assumes one global active key, `Generation` has no provider/model lineage, `GenerationJobData` has no provider dimension, and `worker.ts` always loads the global active Gemini key then executes Gemini logic directly. Planning must break those assumptions without changing the existing Gemini user experience.

The safest implementation order is:

1. Add a first-class provider contract to schema and shared types.
2. Make admin key CRUD and dashboard stats provider-scoped.
3. Persist provider/model metadata at generation creation and retry time.
4. Route worker execution by provider, failing fast on mismatch rather than falling back.
5. Expose provider/model/support identifiers in admin monitoring surfaces only after the backend contract is stable.

The critical design choice is to make `Generation.provider` the single source of truth and treat queue `provider` as a copied routing hint that must be validated against the DB record on worker startup. That preserves D-17 and D-18 while preventing silent drift during retries or future OpenAI flows.

**Primary recommendation:** plan Phase 7 as four focused execution plans: schema/contracts, provider-scoped admin key backend, provider-aware admin UI/dashboard, and generation/worker routing plus admin support metadata.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma / `@prisma/client` | `^6.2.0` | Schema changes for `Generation` and `ApiKey`, typed DB access | Existing ORM and migration path |
| Fastify 5 + Zod | existing | Provider-aware route schemas and admin route contracts | Existing backend pattern in `generation.routes.ts`, `edit.routes.ts`, `admin/*.routes.ts` |
| BullMQ | `^5.31.0` | Provider-aware `GenerationJobData` and worker dispatch | Existing queue system in `lib/queue.ts` and `worker.ts` |
| Vitest 4 | `^4.0.18` | Service and worker-adjacent unit coverage | Existing API-side test runner |
| Next.js 16 + React 19 | existing | Admin provider tabs, dashboard provider cards, monitoring metadata UI | Existing admin UI stack |
| `@mockup-ai/shared` + local `api.ts` types | workspace | Shared provider/model contracts across API and web | Existing type-sharing pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Official `openai` Node SDK | downstream milestone dependency | OpenAI runtime wiring in later phases | Phase 7 can defer actual runtime calls, but schema and metadata must be ready for it |
| Existing `ConfirmDialog`, toast state, Tailwind tokens | existing | Provider tab actions and safe support-info UI | Reuse instead of adding UI libraries |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| First-class `provider` enum/field | ad hoc `isOpenAI` booleans | Booleans do not scale to queue routing, history, retry, or future providers |
| Dedicated OpenAI lineage columns + `providerTrace` | single opaque JSON blob | Admin support surfaces and later regenerate/edit flows need queryable first-class fields |
| Provider-scoped active key lookup | one global `isActive` row | Violates D-07 through D-09 and makes routing ambiguous |

**Installation:** No new package is required to complete the Phase 7 foundation itself. The `openai` SDK becomes mandatory only when a later phase actually executes OpenAI image requests.

---

## Architecture Patterns

### Recommended Project Structure

```text
apps/api/prisma/schema.prisma                         # MODIFY: provider enums/fields for Generation and ApiKey
packages/shared/src/types/index.ts                   # MODIFY: provider/model enums and response contracts
apps/api/src/lib/queue.ts                            # MODIFY: required provider in GenerationJobData
apps/api/src/services/admin.service.ts               # MODIFY: provider-scoped key methods, dashboard stats, generation metadata
apps/api/src/routes/admin/api-keys.routes.ts         # MODIFY: provider query/body/param validation
apps/api/src/routes/generation.routes.ts             # MODIFY: provider-aware create/get/regenerate responses
apps/api/src/routes/edit.routes.ts                   # MODIFY: preserve/guard provider lineage on edits
apps/api/src/services/generation.service.ts          # MODIFY: persist provider/model and requeue same provider
apps/api/src/worker.ts                               # MODIFY: provider dispatch + fail-fast mismatch checks
apps/web/src/lib/api.ts                              # MODIFY: provider-aware admin/generation types and payloads
apps/web/src/app/admin/api-keys/page.tsx             # MODIFY: provider tabs and provider-scoped add/activate/delete flows
apps/web/src/app/admin/dashboard/page.tsx            # MODIFY: provider-scoped active key display
apps/web/src/components/admin/generation-table.tsx   # MODIFY: provider/model columns or stacked cell
apps/web/src/components/admin/generation-detail-modal.tsx # MODIFY: safe support metadata section
```

### Pattern 1: Provider as a First-Class Persistence Contract

Use one shared provider enum across schema, queue payloads, service inputs, and frontend types. The current repo already uses explicit enums for `GenerationMode`, `GenerationStatus`, and `ImageType`; Phase 7 should follow the same pattern with a `Provider` enum whose current values are `gemini` and `openai`.

Recommended `Generation` additions:

- `provider Provider @default(gemini)`
- `providerModel String @map("provider_model")`
- `providerTrace Json? @map("provider_trace")`
- `openaiRequestId String? @map("openai_request_id")`
- `openaiResponseId String? @map("openai_response_id")`
- `openaiImageCallId String? @map("openai_image_call_id")`
- `openaiRevisedPrompt String? @map("openai_revised_prompt")`

Recommended `ApiKey` additions:

- `provider Provider @default(gemini)`
- `@@index([provider, isActive])`

Because this repo currently uses `prisma db push`, the plan must include a blocking schema push step plus a verification step that confirms existing rows were backfilled to Gemini-safe defaults rather than left nullable.

### Pattern 2: Provider-Scoped Admin Service Methods

`admin.service.ts` currently exposes global methods such as `listApiKeys()`, `createApiKey(alias, rawKey)`, `activateApiKey(id)`, and `getActiveApiKey()`. Phase 7 should convert them to provider-scoped contracts so the call site cannot accidentally operate on the wrong provider.

Recommended signatures:

```ts
type Provider = 'gemini' | 'openai';

async listApiKeys(provider: Provider): Promise<ApiKeyListItem[]>
async createApiKey(provider: Provider, alias: string, rawKey: string): Promise<ApiKeyListItem>
async deleteApiKey(provider: Provider, id: string): Promise<void>
async activateApiKey(provider: Provider, id: string): Promise<ApiKeyListItem>
async getActiveApiKey(provider: Provider): Promise<{ id: string; provider: Provider; key: string }>
async incrementCallCount(provider: Provider, id: string): Promise<void>
```

Dashboard stats should no longer imply a single active key. Replace the singular field with a provider-keyed object such as:

```ts
activeApiKeysByProvider: {
  gemini: { alias: string; callCount: number } | null;
  openai: { alias: string; callCount: number } | null;
}
```

### Pattern 3: Queue Payload as Validated Copy, Not Source of Truth

`lib/queue.ts` currently enqueues `GenerationJobData` with no provider. Add:

```ts
provider: 'gemini' | 'openai';
providerModel: string;
```

At worker startup:

1. Load the `Generation` record by `generationId`.
2. Compare `job.data.provider` against `generation.provider`.
3. Fail with a clear routing error if they differ.
4. Fetch the active API key for `generation.provider`.
5. Dispatch by `provider -> mode`.

That structure preserves D-15 through D-19 and keeps wrong-provider execution impossible by design.

### Pattern 4: Admin Monitoring Surfaces Must Be Support-Safe

The admin monitoring table/detail UI already shows `mode`, `status`, `errorMessage`, `promptData`, and `options`. Extend that payload with provider-safe metadata only:

- list rows: `provider`, `providerModel`
- detail view: `provider`, `providerModel`, `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, `openaiRevisedPrompt`

Do not expose:

- `encryptedKey`
- raw uploaded image bytes/base64
- full raw vendor response bodies
- full `providerTrace` JSON by default

The UI-SPEC’s collapsed “지원 정보” area is the correct pattern for optional support identifiers.

### Pattern 5: Preserve Gemini Runtime and Guard Future OpenAI Edits

`edit.routes.ts` currently always loads the global active key and calls `geminiService.generateEdit(...)`. Phase 7 does not need to ship OpenAI edit generation, but it must stop silent provider drift. Recommended behavior:

- If the source generation is `gemini`, continue the current Gemini path with provider-scoped key lookup.
- If the source generation is `openai` before OpenAI edit runtime is implemented, fail with a clear provider-specific error instead of falling back to Gemini.

That satisfies D-16 and keeps later phases honest.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Provider separation | scattered boolean flags | shared enum/union + typed payloads | keeps DB, queue, API, and UI aligned |
| Admin confirmation flows | new modal system | existing `ConfirmDialog` pattern | already matches admin UX and loading behavior |
| Dashboard/provider badges | new design system | existing Tailwind token system + UI-SPEC | keeps admin UI consistent |
| Queue retry plumbing | custom requeue format | existing `addGenerationJob(...)` plus richer payload | reuse existing queue entry point |

---

## Common Pitfalls

### Pitfall 1: Keeping One Global Active Key

If `activateApiKey()` still updates all rows instead of all rows within the selected provider, activating OpenAI will silently deactivate Gemini and break existing Gemini flows. This is a blocker against D-07 through D-09.

### Pitfall 2: Adding `provider` to the Queue but Not to `Generation`

Queue-only provider state is not enough. Retries, admin inspection, result history, and provider mismatch detection all require `Generation.provider` and `Generation.providerModel` to be persisted first.

### Pitfall 3: Trusting Queue Provider More Than the DB Record

The queue payload is mutable operational state. `Generation.provider` is the durable contract. If the worker does not compare them, wrong-provider execution can still happen during retries or manual queue tampering.

### Pitfall 4: Leaving Existing Rows Nullable Instead of Backfilled

If old Gemini rows keep `provider = null` or `providerModel = null`, Phase 7 will appear to compile while Phase 10 history/regenerate flows later have no reliable lineage. Backfill is part of Phase 7 scope, not cleanup.

### Pitfall 5: Exposing Raw OpenAI Trace Blobs

`providerTrace` should be available for future debugging, but the admin UI must surface only curated identifiers and revised prompts. Raw vendor blobs or image bytes violate D-14 and add support noise.

### Pitfall 6: Forgetting Provider on Retry and Edit Paths

`retryGeneration()` and `edit.routes.ts` are easy drift points because they reconstruct a new generation from an old one. If they default to Gemini instead of copying the saved provider/model, Phase 7 fails D-19 even if normal create paths are correct.

### Pitfall 7: Dashboard Still Rendering a Single “활성 API 키”

The current KPI card implies one global runtime key. Leaving that unchanged creates an operational lie even if the backend is provider-safe.

---

## Code Examples

### Current global active key assumption to remove

```ts
// apps/api/src/services/admin.service.ts
prisma.apiKey.findFirst({
  where: { isActive: true },
  select: { alias: true, callCount: true },
});
```

Target state: scope this lookup by provider everywhere it is used, and return a provider-keyed dashboard object rather than one global record.

### Current queue payload missing provider

```ts
// apps/api/src/lib/queue.ts
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  // no provider or providerModel yet
}
```

Target state: add required `provider` and `providerModel`, then verify them against the DB generation record inside `worker.ts`.

### Current worker hard-wired to Gemini

```ts
// apps/api/src/worker.ts
const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey();
await adminService.incrementCallCount(activeKeyId);
const result = await geminiService.generateIPChange(activeApiKey, ...);
```

Target state: `getActiveApiKey(generation.provider)`, `incrementCallCount(generation.provider, activeKeyId)`, and a provider switch before mode-specific execution.

### Current admin API key page has no provider state

```tsx
// apps/web/src/app/admin/api-keys/page.tsx
const [keys, setKeys] = useState<AdminApiKey[]>([]);
await adminApi.listApiKeys(accessToken);
```

Target state: selected provider tab drives fetch/create/activate/delete calls, and the modal inherits provider from the active tab rather than taking free-form input.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 for `apps/api`; web app has no dedicated UI test runner |
| Config file | `apps/api/vitest.config.ts` |
| Quick run command | `cd apps/api && pnpm test src/services/__tests__/admin.service.test.ts` is not a valid project script, so use `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` |
| Full suite command | `cd apps/api && pnpm test && pnpm type-check && cd ../.. && pnpm type-check` |
| Estimated runtime | ~20 seconds for API tests + type checks |

### Phase Requirements -> Test Map

| Requirement | Automated coverage target | Manual coverage target |
|-------------|---------------------------|------------------------|
| OPS-01 | `admin.service.test.ts` provider-scoped key CRUD/activation guards | `/admin/api-keys` provider tabs, add/activate/delete UX |
| OPS-02 | API route/service tests for provider/model/support metadata payload shapes | `/admin/content` table/detail safe support info rendering |
| OPS-03 | service/worker-adjacent tests for provider copy, mismatch failure, retry requeue provider preservation | worker run with Gemini still succeeds after provider refactor |
| OPS-04 | service tests asserting OpenAI lineage fields persist on generation records | manual inspection of admin detail support panel for OpenAI-safe fields once runtime data exists |

### Sampling Rate

- After every backend task: run the narrowest `vitest` command for touched API service/route files, then `pnpm --filter @mockup-ai/api type-check`
- After every frontend task: run `pnpm --filter @mockup-ai/web type-check`
- After every plan wave: run `pnpm type-check` from repo root
- Before verification: run `cd apps/api && pnpm test` plus a manual admin UI smoke check

### Wave 0 Gaps

- No existing worker-specific test file covers provider mismatch or provider-preserving retry behavior.
- No existing web UI test runner covers provider tabs, dashboard provider cards, or support metadata rendering.
- Plans should therefore add or extend API-side tests and keep explicit manual verification steps for the admin UI.

---

## Sources

### Repo evidence

- `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md`
- `.planning/phases/07-provider-foundation-and-key-separation/07-UI-SPEC.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/services/admin.service.ts`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/worker.ts`
- `apps/api/src/services/generation.service.ts`
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/edit.routes.ts`
- `apps/api/src/routes/admin/api-keys.routes.ts`
- `apps/api/src/routes/admin/generations.routes.ts`
- `apps/web/src/app/admin/api-keys/page.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/components/admin/generation-table.tsx`
- `apps/web/src/components/admin/generation-detail-modal.tsx`
- `apps/web/src/lib/api.ts`
- `packages/shared/src/types/index.ts`

### Project-local official source map

- `.codex/skills/mockup-openai-dual-provider/SKILL.md`
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md`
- `.codex/skills/mockup-openai-dual-provider/references/official-source-map.md`
- `.codex/skills/mockup-openai-image-runtime/SKILL.md`
- `.codex/skills/mockup-openai-image-runtime/references/endpoint-matrix.md`
- `.codex/skills/mockup-openai-image-runtime/references/node-runtime.md`

---
*Last updated: 2026-04-24*
