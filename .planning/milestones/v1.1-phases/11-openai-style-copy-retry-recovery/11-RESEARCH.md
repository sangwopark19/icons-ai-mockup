# Phase 11: OpenAI Style-Copy Retry Recovery - Research

**Researched:** 2026-04-29 [VERIFIED: `date +%F`]
**Domain:** Fastify service-layer retry recovery, BullMQ generation queue payloads, Prisma JSON continuation metadata, OpenAI style-copy worker dispatch [VERIFIED: `.planning/ROADMAP.md`, `apps/api/src/services/admin.service.ts`, `apps/api/src/lib/queue.ts`, `apps/api/src/worker.ts`]
**Confidence:** HIGH [VERIFIED: codebase grep, targeted Vitest run, dependency phase artifacts]

## User Constraints

No Phase 11 `CONTEXT.md` exists, and `gsd-sdk query init.phase-op "11"` returned `has_context: false`, so this research is constrained by roadmap, requirements, project history, dependency phases, audit artifacts, and codebase patterns. [VERIFIED: `gsd-sdk query init.phase-op "11"`]

Phase 11 must address `OPS-03`, `OED-02`, and `OED-03`. [VERIFIED: user prompt, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`]

Phase 11 must close the audit blocker where `AdminService.retryGeneration()` requeues failed OpenAI style-copy jobs without persisted `promptData.copyTarget` and `promptData.selectedImageId`. [VERIFIED: user prompt, `.planning/ROADMAP.md`, `.planning/v1.1-INTEGRATION-CHECK.md`, `.planning/v1.1-MILESTONE-AUDIT.md`]

Phase 11 depends on Phase 7 provider foundation and Phase 10 provider-aware result continuation. [VERIFIED: user prompt, `.planning/ROADMAP.md`]

No AI-SPEC is required for this phase because the requested work reconnects retry metadata recovery and does not design a new AI system. [VERIFIED: user prompt]

Security enforcement is enabled for this research because the user explicitly set the security gate to enabled and `.planning/config.json` does not disable security enforcement. [VERIFIED: user prompt, `.planning/config.json`]

Nyquist validation is enabled because `.planning/config.json` sets `workflow.nyquist_validation` to `true`. [VERIFIED: `.planning/config.json`]

### Locked Decisions

- Preserve Gemini behavior and keep OpenAI as a parallel provider lane, not a migration. [VERIFIED: `.planning/STATE.md`, `.planning/OPENAI-SKILL-GUARDRAILS.md`, `.codex/skills/mockup-openai-dual-provider/SKILL.md`]
- `Generation.provider` and `Generation.providerModel` are persisted source-of-truth fields, and queue payload provider/model are validated copies. [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md`, `apps/api/src/worker.ts`]
- OpenAI style-copy continuation metadata uses `styleReferenceId`, `promptData.copyTarget`, and `promptData.selectedImageId`; OpenAI must not use Gemini `thoughtSignature`. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, `apps/api/src/services/generation.service.ts`, `apps/api/src/worker.ts`]
- Admin retry must requeue failed generations with the persisted provider and provider model. [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md`, `apps/api/src/services/admin.service.ts`]
- Phase 11 should not change OpenAI prompts, endpoint selection, style-copy UI, provider labels, or OpenAI service runtime behavior. [VERIFIED: `.planning/ROADMAP.md`, `.planning/phases/10-provider-aware-result-continuation/10-04-SUMMARY.md`, `.planning/phases/10-provider-aware-result-continuation/10-05-SUMMARY.md`, `.planning/phases/10-provider-aware-result-continuation/10-06-SUMMARY.md`, `apps/api/src/services/openai-image.service.ts`]

### the agent's Discretion

- Exact helper name for reading persisted `copyTarget` from `promptData`, as long as it only returns `'ip-change'`, `'new-product'`, or `undefined`. [VERIFIED: `apps/api/src/lib/queue.ts`, `apps/api/src/routes/generation.routes.ts`]
- Exact regression test shape, as long as it proves admin retry enqueues `copyTarget` and `selectedImageId` for failed OpenAI style-copy jobs and preserves existing Gemini/non-style-copy OpenAI retry behavior. [VERIFIED: user prompt, existing `apps/api/src/services/__tests__/admin.service.test.ts` patterns]
- Whether the regression stops at the mocked `addGenerationJob()` payload or additionally invokes `processGenerationJob()` with the retried payload; the stronger plan should include both if the task budget allows. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`]

### Deferred Ideas (OUT OF SCOPE)

- Live OpenAI style-copy smoke remains a Phase 10 human/UAT gate and is not required to prove this admin retry metadata fix. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-SMOKE.md`, `.planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md`]
- IP Change v2 transparent-background documentation cleanup belongs to Phase 13, not Phase 11. [VERIFIED: `.planning/ROADMAP.md`, `.planning/v1.1-INTEGRATION-CHECK.md`]
- Sketch transparent-background evidence closure belongs to Phase 12, not Phase 11. [VERIFIED: `.planning/ROADMAP.md`, `.planning/STATE.md`]

## Project Constraints (from AGENTS.md)

No `./AGENTS.md` file exists in the working tree, but the session supplied AGENTS-style instructions for this project. [VERIFIED: `if [ -f AGENTS.md ]; then ...; else NO_AGENTS; fi`, user prompt]

- Responses to the user must be in Korean, while code identifiers and technical terms can remain English. [VERIFIED: user prompt]
- Claude/`~/.claude` files and workflows must not be modified. [VERIFIED: user prompt]
- GSD completion markers such as `## RESEARCH COMPLETE` must remain exactly in English. [VERIFIED: user prompt]
- For GSD subagents, timeout or empty status is not automatically failure; artifacts must be checked before closing agents. [VERIFIED: user prompt]

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPS-03 | System routes each queued generation job to the correct provider runtime based on the saved generation request. [VERIFIED: `.planning/REQUIREMENTS.md`] | Worker already validates queued provider/model and stored job fields before active-key lookup, so Phase 11 must make admin retry reconstruct the missing continuation fields from persisted prompt data. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/services/admin.service.ts`] |
| OED-02 | User can create a style-copy generation from an approved OpenAI result while changing only the named target. [VERIFIED: `.planning/REQUIREMENTS.md`] | Normal user flow already stores and queues `copyTarget` and `selectedImageId`; admin retry must preserve the same metadata when recovering a failed style-copy generation. [VERIFIED: `apps/api/src/services/generation.service.ts`, `.planning/v1.1-INTEGRATION-CHECK.md`] |
| OED-03 | User can iterate on OpenAI edits or style-copy follow-ups without mixing state with Gemini-only style memory. [VERIFIED: `.planning/REQUIREMENTS.md`] | Worker dispatch uses OpenAI linkage/fallback before the Gemini `thoughtSignature` branch, so the retry payload must not omit the OpenAI-only continuation keys that identify the selected style image and copy target. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`] |

## Summary

Phase 11 is a narrow integration repair, not a new OpenAI workflow phase. [VERIFIED: `.planning/ROADMAP.md`, `.planning/v1.1-INTEGRATION-CHECK.md`] Phase 10 stores OpenAI style-copy continuation metadata in `Generation.promptData` and enqueues it through `GenerationJobData`, while the worker now rejects queue payloads whose `copyTarget` or `selectedImageId` does not match persisted `promptData`. [VERIFIED: `apps/api/src/services/generation.service.ts`, `apps/api/src/lib/queue.ts`, `apps/api/src/worker.ts`]

The break is isolated to `AdminService.retryGeneration()`. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/services/admin.service.ts`] It already reloads the failed `Generation`, validates persisted image paths, copies provider/model/styleReferenceId/source/character/texture/prompt/options, and calls `addGenerationJob()`, but it does not include `copyTarget` or `selectedImageId`. [VERIFIED: `apps/api/src/services/admin.service.ts`] A failed OpenAI style-copy job retried from admin can therefore fail before provider dispatch because queued `undefined` values do not match stored prompt metadata. [VERIFIED: `apps/api/src/worker.ts`, `.planning/v1.1-INTEGRATION-CHECK.md`]

The planner should target a small backend test-first patch: add an admin retry regression for OpenAI style-copy payload reconstruction, add the two fields to the retry queue payload, and add a worker-level or integration-style assertion that the retried payload reaches OpenAI style-copy dispatch without falling into Gemini. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`]

**Primary recommendation:** Update `AdminService.retryGeneration()` to requeue `copyTarget` and `selectedImageId` from persisted `promptData`, using the existing queue contract and tests; do not modify schema, UI, OpenAI prompts, or provider dispatch. [VERIFIED: codebase grep, `.planning/ROADMAP.md`]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Admin retry request handling | API / Backend | Frontend Admin UI | `/api/admin/generations/:id/retry` calls `adminService.retryGeneration(id)`; the UI only triggers retry and refreshes state. [VERIFIED: `apps/api/src/routes/admin/generations.routes.ts`, v1.0 admin verification artifacts] |
| Retry payload reconstruction | API / Backend | Database / Storage | `AdminService.retryGeneration()` reads persisted `Generation.promptData`, `options`, `provider`, `providerModel`, and `styleReferenceId` before calling `addGenerationJob()`. [VERIFIED: `apps/api/src/services/admin.service.ts`] |
| Style-copy continuation metadata persistence | Database / Storage | API / Backend | `Generation.promptData` stores `copyTarget` and `selectedImageId`, and `Generation.styleReferenceId` stores the style reference generation link. [VERIFIED: `apps/api/prisma/schema.prisma`, `apps/api/src/services/generation.service.ts`] |
| Provider dispatch safety | API / Backend Worker | BullMQ / Redis | `processGenerationJob()` validates queued fields against persisted generation data before active-key lookup or provider runtime calls. [VERIFIED: `apps/api/src/worker.ts`] |
| Regression verification | Test Harness | API / Backend | Existing Vitest suites mock Prisma, BullMQ, worker services, and provider runtimes, so the fix can be proven without Redis or live OpenAI credentials. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`, targeted Vitest run] |

## Standard Stack

### Core

| Library | Repo Version | Current Registry Version | Purpose | Why Standard |
|---------|--------------|--------------------------|---------|--------------|
| TypeScript | `^5.7.2` root/app dependency [VERIFIED: `package.json`, `apps/api/package.json`] | not rechecked for this phase [VERIFIED: scope review] | Service, worker, and test implementation language. [VERIFIED: repo files] | Existing monorepo standard; no language/tooling change is needed for a metadata fix. [VERIFIED: repo files] |
| Prisma Client | `^6.2.0` [VERIFIED: `apps/api/package.json`] | `7.8.0`, modified 2026-04-28 [VERIFIED: npm registry] | Reads persisted `Generation.promptData`, `options`, provider fields, and style reference IDs. [VERIFIED: `apps/api/prisma/schema.prisma`, `apps/api/src/services/admin.service.ts`] | Use current project Prisma model and JSON field access; do not migrate schema for this phase. [VERIFIED: phase scope, codebase] |
| BullMQ | `^5.31.0` [VERIFIED: `apps/api/package.json`] | `5.76.3`, modified 2026-04-28 [VERIFIED: npm registry] | Enqueues `GenerationJobData` for async worker execution. [VERIFIED: `apps/api/src/lib/queue.ts`] | Existing queue abstraction already supports typed job data and per-job attempts. [VERIFIED: `apps/api/src/lib/queue.ts`, Context7 `/taskforcesh/bullmq`] |
| OpenAI Node SDK | `^6.34.0` [VERIFIED: `apps/api/package.json`] | `6.35.0`, modified 2026-04-28 [VERIFIED: npm registry] | Existing OpenAI image runtime and Responses style-copy linkage. [VERIFIED: `apps/api/src/services/openai-image.service.ts`] | Do not upgrade or change SDK use in Phase 11; retry recovery should only reconstruct queue metadata. [VERIFIED: phase scope, codebase] |
| Vitest | `^4.0.18` [VERIFIED: `apps/api/package.json`] | `4.1.5`, modified 2026-04-23 [VERIFIED: npm registry] | Unit/regression test runner for admin service and worker tests. [VERIFIED: `apps/api/vitest.config.ts`, targeted Vitest run] | Existing suites already cover the affected service and worker contracts. [VERIFIED: test files, targeted Vitest run] |

### Supporting

| Library | Repo Version | Current Registry Version | Purpose | When to Use |
|---------|--------------|--------------------------|---------|-------------|
| Fastify | `^5.1.0` [VERIFIED: `apps/api/package.json`] | `5.8.5`, modified 2026-04-14 [VERIFIED: npm registry] | Admin retry route and admin `requireAdmin` preHandler. [VERIFIED: `apps/api/src/routes/admin/generations.routes.ts`, `apps/api/src/routes/admin/index.routes.ts`] | No route change is required unless adding route-level regression coverage. [VERIFIED: phase scope, route code] |
| Zod | `^3.24.1` [VERIFIED: `apps/api/package.json`] | `4.3.6`, modified 2026-01-25 [VERIFIED: npm registry] | Existing route input validation for public copy-style creation. [VERIFIED: `apps/api/src/routes/generation.routes.ts`] | Do not add a new public schema for admin retry metadata; retry reads persisted DB data. [VERIFIED: `apps/api/src/services/admin.service.ts`] |
| `@mockup-ai/shared` | workspace package [VERIFIED: `apps/api/package.json`, `packages/shared/src/types/index.ts`] | workspace-only [VERIFIED: pnpm workspace files] | Shared provider/copy-target API types. [VERIFIED: `packages/shared/src/types/index.ts`] | Use only if a test needs shared enum values; the backend queue type already has literal `copyTarget` values. [VERIFIED: `apps/api/src/lib/queue.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Add fields to `AdminService.retryGeneration()` payload | Create a new admin retry service or continuation service | Extra abstraction is not justified because the broken path is one missing queue payload mapping. [VERIFIED: `apps/api/src/services/admin.service.ts`, `.planning/v1.1-INTEGRATION-CHECK.md`] |
| Read `copyTarget`/`selectedImageId` from `promptData` | Read from `providerTrace` | `providerTrace` mirrors support/debug metadata, while worker guard compares against `promptData`, so `promptData` is the source needed for dispatch correctness. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/services/generation.service.ts`] |
| Mock worker dispatch in admin service test only | Add worker `processGenerationJob()` regression using retried payload shape | Worker-level regression is stronger because it proves the recovered payload passes the persisted metadata guard and reaches OpenAI style-copy dispatch. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`] |
| Upgrade OpenAI/BullMQ/Prisma while touching retry | Keep dependency versions unchanged | Dependency upgrades increase blast radius and are unrelated to the metadata omission. [VERIFIED: phase goal, package versions] |

**Installation:**

```bash
# No installation is required for Phase 11. [VERIFIED: package.json, phase scope]
```

**Version verification:** `npm view openai version time.modified`, `npm view bullmq version time.modified`, `npm view vitest version time.modified`, `npm view @prisma/client version time.modified`, `npm view fastify version time.modified`, and `npm view zod version time.modified` were run during research. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Admin clicks retry for failed generation
  -> Fastify admin route /api/admin/generations/:id/retry
     -> requireAdmin preHandler
     -> AdminService.retryGeneration(id)
        -> load failed Generation + Project
        -> read persisted provider/providerModel/styleReferenceId
        -> read promptData.sourceImagePath / characterImagePath / textureImagePath
        -> read promptData.copyTarget / selectedImageId
        -> validate persisted storage paths
        -> update failed Generation back to pending
        -> addGenerationJob(GenerationJobData)
           -> BullMQ generation queue
              -> processGenerationJob()
                 -> load persisted Generation
                 -> compare queued fields against stored Generation/promptData
                 -> if provider=openai and styleReferenceId exists:
                    -> generateOpenAIStyleCopy()
                       -> OpenAI linkage first
                       -> selected-image fallback only for recoverable linkage errors
                 -> if provider=gemini:
                    -> existing Gemini branch stays isolated
```

This diagram reflects current route, service, queue, and worker boundaries; the Phase 11 edit belongs only in the retry payload reconstruction step. [VERIFIED: `apps/api/src/routes/admin/generations.routes.ts`, `apps/api/src/services/admin.service.ts`, `apps/api/src/lib/queue.ts`, `apps/api/src/worker.ts`]

### Recommended Project Structure

```text
apps/api/src/
├── services/
│   ├── admin.service.ts                  # Add retry payload metadata reconstruction. [VERIFIED: current file]
│   └── __tests__/admin.service.test.ts   # Add admin retry regression. [VERIFIED: current file]
├── __tests__/
│   └── worker.provider-continuation.test.ts # Optionally add retried-payload dispatch regression. [VERIFIED: current file]
└── lib/
    └── queue.ts                          # Do not change unless typing needs a helper export. [VERIFIED: current file]
```

No schema, route, web UI, OpenAI service, or queue interface change is required because `GenerationJobData` already includes `copyTarget` and `selectedImageId`. [VERIFIED: `apps/api/src/lib/queue.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/services/openai-image.service.ts`]

### Pattern 1: Reconstruct Queue Payload From Persisted Generation Contract

**What:** Build the admin retry queue payload from the same persisted fields that normal `GenerationService.create()` writes into `Generation.promptData`. [VERIFIED: `apps/api/src/services/generation.service.ts`, `apps/api/src/services/admin.service.ts`]

**When to use:** Use this in `AdminService.retryGeneration()` whenever a failed generation is requeued by an admin. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/routes/admin/generations.routes.ts`]

**Example:**

```ts
function copyTargetValue(value: unknown): GenerationJobData['copyTarget'] | undefined {
  return value === 'ip-change' || value === 'new-product' ? value : undefined;
}

await addGenerationJob({
  generationId: generation.id,
  userId: generation.project.userId,
  projectId: generation.projectId,
  mode: generation.mode as GenerationJobData['mode'],
  provider: generation.provider,
  providerModel: generation.providerModel,
  styleReferenceId: generation.styleReferenceId ?? undefined,
  copyTarget: copyTargetValue(promptData.copyTarget),
  selectedImageId: stringValue(promptData.selectedImageId),
  sourceImagePath,
  characterImagePath,
  textureImagePath,
  prompt: stringValue(promptData.userPrompt),
  options: buildRetryGenerationOptions(options, promptData),
});
```

Source: existing `GenerationJobData` accepts optional `copyTarget` and `selectedImageId`, normal create enqueues both fields, and worker validates them against `promptData`. [VERIFIED: `apps/api/src/lib/queue.ts`, `apps/api/src/services/generation.service.ts`, `apps/api/src/worker.ts`]

### Pattern 2: Persisted Metadata Guard Before Provider Dispatch

**What:** The worker must validate queued metadata against persisted generation data before loading API keys or calling OpenAI/Gemini. [VERIFIED: `apps/api/src/worker.ts`]

**When to use:** Use this as the regression target for Phase 11; a recovered admin retry payload should pass the guard instead of failing on `copyTarget` or `selectedImageId`. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`, `.planning/v1.1-INTEGRATION-CHECK.md`]

**Example:**

```ts
assertQueuedFieldMatchesStored(
  'copyTarget',
  jobData.copyTarget,
  getOptionalString(promptData.copyTarget)
);
assertQueuedFieldMatchesStored(
  'selectedImageId',
  jobData.selectedImageId,
  getOptionalString(promptData.selectedImageId)
);
```

Source: the current worker implementation uses this pattern for `copyTarget` and `selectedImageId`. [VERIFIED: `apps/api/src/worker.ts`]

### Pattern 3: Test First At The Existing Service Boundary

**What:** Add RED tests in `admin.service.test.ts` before changing `admin.service.ts`, following existing Phase 3/4/10 test style. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`, `.planning/STATE.md`]

**When to use:** Use this for the primary regression because `AdminService.retryGeneration()` is the method with the omission. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/services/admin.service.ts`]

**Example:**

```ts
expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
  expect.objectContaining({
    provider: 'openai',
    providerModel: 'gpt-image-2',
    styleReferenceId: 'source-style-generation',
    copyTarget: 'ip-change',
    selectedImageId: 'style-source-image-2',
  })
);
```

Source: current admin service tests already assert `addGenerationJob()` payloads with `expect.objectContaining`. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`]

### Anti-Patterns to Avoid

- **Do not infer OpenAI style-copy retry from `providerTrace`.** Worker compares queued fields to `promptData`, and Phase 10 writes continuation metadata to `promptData`. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/services/generation.service.ts`]
- **Do not special-case only `provider === 'openai'` if the generic payload copy can safely include optional fields.** `GenerationJobData` already allows the fields, and undefined optional values preserve non-style-copy behavior. [VERIFIED: `apps/api/src/lib/queue.ts`, `apps/api/src/services/admin.service.ts`]
- **Do not add a new public request field or route schema for admin retry.** Admin retry reads existing persisted generation state and has no client body for continuation metadata. [VERIFIED: `apps/api/src/routes/admin/generations.routes.ts`]
- **Do not modify OpenAI prompt construction or Responses/Image API behavior.** Phase 11 fixes retry metadata recovery and should not change output quality/runtime logic. [VERIFIED: `.planning/ROADMAP.md`, `apps/api/src/services/openai-image.service.ts`]
- **Do not loosen worker mismatch checks to make retry pass.** The worker guard is the protection against stale or forged queue payloads; the retry payload must become complete instead. [VERIFIED: `apps/api/src/worker.ts`, `.planning/phases/10-provider-aware-result-continuation/10-REVIEW-FIX.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Queue retry orchestration | A custom retry queue or direct worker invocation from admin service | Existing `addGenerationJob()` and BullMQ queue [VERIFIED: `apps/api/src/lib/queue.ts`] | Existing admin retry already uses BullMQ and worker provider guards. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/worker.ts`] |
| Continuation metadata storage | New columns for `copyTarget` or `selectedImageId` | Existing `Generation.promptData` JSON plus `Generation.styleReferenceId` [VERIFIED: `apps/api/prisma/schema.prisma`, `apps/api/src/services/generation.service.ts`] | Phase 10 already persists and consumes this shape; schema migration is unnecessary for this gap. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-04-SUMMARY.md`] |
| Provider dispatch validation | A second admin-only validation path | Existing worker `assertQueuedJobMatchesStoredGeneration()` [VERIFIED: `apps/api/src/worker.ts`] | The worker guard is already provider-neutral and catches stale queue state before vendor calls. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`] |
| OpenAI style-copy execution | Direct OpenAI service calls from `AdminService` | Existing worker `generateOpenAIStyleCopy()` path [VERIFIED: `apps/api/src/worker.ts`] | Runtime execution requires active-key accounting, selected-image lookup, linkage fallback, metadata persistence, and image saving already implemented in the worker. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/services/openai-image.service.ts`] |
| JSON field parser library | New JSON schema dependency | Small local literal guards plus existing `stringValue()` helper pattern [VERIFIED: `apps/api/src/services/admin.service.ts`] | Only two persisted optional fields need recovery, and the valid `copyTarget` domain is already a two-value literal union. [VERIFIED: `apps/api/src/lib/queue.ts`] |

**Key insight:** The bug exists because normal user flow and admin retry flow reconstruct the same job from different metadata subsets; the fix is to make admin retry use the existing persisted contract, not to weaken worker validation or create a second style-copy runtime. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/services/generation.service.ts`, `apps/api/src/services/admin.service.ts`, `apps/api/src/worker.ts`]

## Common Pitfalls

### Pitfall 1: Fixing The Worker Instead Of The Retry Payload

**What goes wrong:** Removing or relaxing the worker `copyTarget`/`selectedImageId` comparisons would let incomplete or stale jobs reach provider runtime. [VERIFIED: `apps/api/src/worker.ts`, `.planning/phases/10-provider-aware-result-continuation/10-REVIEW-FIX.md`]

**Why it happens:** The retry failure appears at worker execution time, but the missing data is introduced earlier by `AdminService.retryGeneration()`. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`]

**How to avoid:** Keep the worker guard unchanged and add the missing fields to `addGenerationJob()` in admin retry. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/lib/queue.ts`]

**Warning signs:** Tests start expecting worker mismatches to pass, or `assertQueuedJobMatchesStoredGeneration()` loses `copyTarget`/`selectedImageId` checks. [VERIFIED: `apps/api/src/worker.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`]

### Pitfall 2: Reading The Wrong Prompt Key

**What goes wrong:** Retried jobs can diverge from original jobs if retry reads old or wrong prompt keys. [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-REVIEW.md`]

**Why it happens:** Earlier review already found drift risk because `GenerationService.create()` writes `promptData.userPrompt`, and retry reconstruction must read that stored key. [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-REVIEW.md`, `apps/api/src/services/generation.service.ts`]

**How to avoid:** Keep `prompt: promptData.userPrompt` behavior and add only the missing continuation fields. [VERIFIED: `apps/api/src/services/admin.service.ts`]

**Warning signs:** A Phase 11 diff touches prompt construction, prompt field names, or OpenAI prompt templates. [VERIFIED: `apps/api/src/services/openai-image.service.ts`, phase scope]

### Pitfall 3: Treating `styleReferenceId` As Sufficient For OpenAI Style Copy

**What goes wrong:** OpenAI style-copy execution cannot identify the selected approved style image or target replacement type if only `styleReferenceId` is queued. [VERIFIED: `apps/api/src/worker.ts`]

**Why it happens:** Gemini style copy historically uses `styleReferenceId` plus `thoughtSignature`, while OpenAI Phase 10 requires `copyTarget` and `selectedImageId` as OpenAI-specific continuation state. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, `apps/api/src/worker.ts`]

**How to avoid:** Requeue all three continuation identifiers: `styleReferenceId`, `copyTarget`, and `selectedImageId`. [VERIFIED: `apps/api/src/lib/queue.ts`, `apps/api/src/services/generation.service.ts`]

**Warning signs:** Admin retry tests assert `styleReferenceId` but not `copyTarget` and `selectedImageId`. [VERIFIED: current `apps/api/src/services/__tests__/admin.service.test.ts`]

### Pitfall 4: Breaking Gemini Retry

**What goes wrong:** A narrow OpenAI fix could accidentally change Gemini style-copy or non-style-copy retry payloads. [VERIFIED: user prompt, existing admin retry tests]

**Why it happens:** `AdminService.retryGeneration()` is shared by Gemini and OpenAI generations. [VERIFIED: `apps/api/src/services/admin.service.ts`]

**How to avoid:** Add regression coverage for existing Gemini retry and OpenAI non-style-copy retry behavior staying unchanged. [VERIFIED: current `apps/api/src/services/__tests__/admin.service.test.ts`]

**Warning signs:** Existing admin service retry tests fail or queue payload snapshots change for Gemini fields unrelated to `copyTarget`/`selectedImageId`. [VERIFIED: targeted Vitest run]

### Pitfall 5: Relying On Live OpenAI To Prove A Queue Contract

**What goes wrong:** Planning can become blocked on credentials, approved input images, or a running app stack even though the defect is a deterministic metadata mapping bug. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-SMOKE.md`]

**Why it happens:** Phase 10 live style-copy smoke is still manual-needed, but Phase 11 only needs to prove retry payload recovery and provider dispatch wiring. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-SMOKE.md`, `.planning/ROADMAP.md`]

**How to avoid:** Use mocked `addGenerationJob()` and mocked `processGenerationJob()` provider dispatch tests as the phase gate, with live smoke left to UAT. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`, `apps/api/src/__tests__/worker.provider-continuation.test.ts`]

**Warning signs:** The plan requires an `OPENAI_API_KEY` before any Phase 11 implementation can be accepted. [VERIFIED: environment audit, phase scope]

## Code Examples

Verified patterns from project sources:

### Admin Retry Queue Payload Recovery

```ts
function copyTargetValue(value: unknown): GenerationJobData['copyTarget'] | undefined {
  return value === 'ip-change' || value === 'new-product' ? value : undefined;
}

const promptData = (generation.promptData as StoredGenerationPromptData) ?? {};

await addGenerationJob({
  generationId: generation.id,
  userId: generation.project.userId,
  projectId: generation.projectId,
  mode: generation.mode as GenerationJobData['mode'],
  provider: generation.provider,
  providerModel: generation.providerModel,
  styleReferenceId: generation.styleReferenceId ?? undefined,
  copyTarget: copyTargetValue(promptData.copyTarget),
  selectedImageId: stringValue(promptData.selectedImageId),
  sourceImagePath,
  characterImagePath,
  textureImagePath,
  prompt: stringValue(promptData.userPrompt),
  options: buildRetryGenerationOptions(options, promptData),
});
```

Source: `AdminService.retryGeneration()` already builds this payload except for `copyTarget` and `selectedImageId`; `GenerationJobData` already defines both fields. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/lib/queue.ts`]

### Admin Service Regression Test

```ts
it('requeues failed OpenAI style-copy retry with persisted continuation metadata', async () => {
  vi.mocked(prisma.generation.findUnique).mockResolvedValue({
    ...mockGeneration,
    provider: 'openai',
    providerModel: 'gpt-image-2',
    styleReferenceId: 'source-style-generation',
    promptData: {
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/new-character.png',
      copyTarget: 'ip-change',
      selectedImageId: 'style-source-image-2',
      userPrompt: 'copy the approved treatment',
    },
  } as any);

  await adminService.retryGeneration('gen1');

  expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'source-style-generation',
      copyTarget: 'ip-change',
      selectedImageId: 'style-source-image-2',
    })
  );
});
```

Source: current admin service tests mock Prisma and assert `addGenerationJob()` payloads with `expect.objectContaining`. [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`]

### Worker Dispatch Regression

```ts
const retriedPayload = {
  ...baseOpenAIJob(),
  generationId: 'gen-openai-copy',
  styleReferenceId: 'style-ref-1',
  copyTarget: 'ip-change',
  selectedImageId: 'style-img-2',
};

mockGenerationLookup(generationRecord(), openAIReference());

await processGenerationJob({ data: retriedPayload });

expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalled();
expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
```

Source: worker provider-continuation tests already use this structure to prove OpenAI style-copy linkage/fallback and Gemini isolation. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gemini-only retry reconstruction with prompt/options paths | Provider-aware retry reconstruction with provider/model and style reference [VERIFIED: Phase 7 artifacts] | Phase 7 [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-04-SUMMARY.md`] | Phase 11 must extend the existing reconstruction to Phase 10 OpenAI style-copy metadata. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`] |
| OpenAI style-copy blocked or missing in continuation flows | OpenAI style-copy creation and worker dispatch with linkage-first and selected-image fallback [VERIFIED: Phase 10 artifacts] | Phase 10 [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-04-SUMMARY.md`, `10-05-SUMMARY.md`] | Admin retry now needs the same `copyTarget` and `selectedImageId` that normal style-copy creation enqueues. [VERIFIED: `apps/api/src/services/generation.service.ts`, `apps/api/src/services/admin.service.ts`] |
| Worker trusted queue continuation fields | Worker validates queued `projectId`, `mode`, `styleReferenceId`, input paths, prompt, `copyTarget`, and `selectedImageId` against persisted data [VERIFIED: review fix artifact] | Phase 10 review fix [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-REVIEW-FIX.md`] | Missing admin retry fields now fail safely before provider dispatch, revealing the Phase 11 gap. [VERIFIED: `apps/api/src/worker.ts`, `.planning/v1.1-INTEGRATION-CHECK.md`] |
| OpenAI jobs could use package default SDK retries | OpenAI image service sets SDK `maxRetries = 0`, and OpenAI queue jobs use `attempts: 1` [VERIFIED: `apps/api/src/services/openai-image.service.ts`, `apps/api/src/lib/queue.ts`] | Quick task 260428 and current code [VERIFIED: `.planning/STATE.md`, codebase] | Retried admin jobs are explicit operator retries, not hidden SDK/BullMQ retries. [VERIFIED: codebase] |

**Deprecated/outdated:**

- Treating `styleReferenceId` as provider-neutral style memory is outdated for OpenAI style-copy because OpenAI uses response/image-call linkage or selected-image fallback, while Gemini uses `thoughtSignature`. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, `apps/api/src/worker.ts`]
- Assuming admin retry only needs source/character/texture paths is outdated because Phase 10 added continuation-only metadata that worker dispatch requires. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/services/generation.service.ts`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| - | No `[ASSUMED]` claims are used in this research; all implementation-relevant claims were verified from code, planning artifacts, npm registry output, targeted tests, Context7, or official OpenAI documentation. [VERIFIED: research process] | All sections | No user confirmation is required before planning the code fix. [VERIFIED: source coverage] |

## Open Questions (RESOLVED)

1. **RESOLVED: Phase 11 does not add enqueue-failure compensation to admin retry unless separately planned later.** [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/services/generation.service.ts`]
   - What we know: `GenerationService.create()` compensates a failed `addGenerationJob()` by marking the new generation failed after Phase 10 review fixes. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-REVIEW-FIX.md`, `apps/api/src/services/generation.service.ts`]
   - Scope evidence: `AdminService.retryGeneration()` still updates a failed generation to pending before `addGenerationJob()`, and this broader retry durability issue is not part of the Phase 11 success criteria. [VERIFIED: `apps/api/src/services/admin.service.ts`, `.planning/ROADMAP.md`]
   - Resolution: Enqueue-failure compensation is out of Phase 11 scope because this phase remains focused on persisted style-copy continuation metadata recovery. [VERIFIED: `.planning/ROADMAP.md`, `.planning/v1.1-INTEGRATION-CHECK.md`]
   - Recommendation: Do not include compensation unless a separate later phase or small hardening task explicitly plans it after the required metadata regression is locked. [VERIFIED: scope analysis]

2. **RESOLVED: Phase 11 does not require live OpenAI style-copy retry smoke in its automated gate.** [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-SMOKE.md`]
   - What we know: Phase 10 live partial-edit/style-copy smoke remains `manual_needed` due to missing running stack, approved target images, and available completed OpenAI style reference. [VERIFIED: `10-SMOKE.md`]
   - Scope evidence: End-to-end human UAT for the whole v1.1 OpenAI flow may still be wanted later, but it remains in existing Phase 10/manual follow-up artifacts. [VERIFIED: `.planning/STATE.md`]
   - Resolution: Live OpenAI style-copy retry smoke is out of Phase 11's automated gate; mocked dispatch regression is sufficient for this deterministic queue metadata fix, with live UAT remaining in existing Phase 10/manual follow-up artifacts. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-SMOKE.md`, `.planning/STATE.md`]
   - Recommendation: Phase 11 should require automated mocked dispatch regression, not live OpenAI smoke, because this phase fixes deterministic queue metadata recovery. [VERIFIED: phase scope, targeted test feasibility]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript/Vitest execution | yes [VERIFIED: `node --version`] | `v25.9.0` [VERIFIED: `node --version`] | Project requires `>=22.0.0`, so current Node satisfies the declared engine. [VERIFIED: `package.json`, environment audit] |
| pnpm | Workspace scripts | yes [VERIFIED: `pnpm --version`] | `9.15.0` [VERIFIED: `pnpm --version`] | Matches `packageManager: pnpm@9.15.0`. [VERIFIED: `package.json`] |
| npm | Registry verification | yes [VERIFIED: `npm --version`] | `11.12.1` [VERIFIED: `npm --version`] | Used only for `npm view` research. [VERIFIED: npm registry commands] |
| Redis / `redis-cli` | Real BullMQ worker runtime | no for local probe [VERIFIED: `redis-cli ping` probe] | unavailable or not running [VERIFIED: environment audit] | Unit tests mock queue/worker, so Redis is not required for Phase 11 automated regression. [VERIFIED: targeted Vitest run] |
| OpenAI API key | Live OpenAI style-copy smoke | not required for Phase 11 automated tests [VERIFIED: phase scope, targeted Vitest run] | not probed for secrets [VERIFIED: security practice] | Mock `openaiImageService` in worker tests; live UAT remains manual. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`, `10-SMOKE.md`] |

**Missing dependencies with no fallback:**

- None for the required Phase 11 automated implementation and regression tests. [VERIFIED: targeted Vitest run]

**Missing dependencies with fallback:**

- Redis is not running locally, but existing tests mock BullMQ and import `processGenerationJob()` without a live Redis worker. [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`, targeted Vitest run]
- Live OpenAI credentials/data are not required for this phase's automated gate; Phase 10 already documents live-smoke prerequisites separately. [VERIFIED: `10-SMOKE.md`, phase scope]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.18` in repo; current npm registry version is `4.1.5`. [VERIFIED: `apps/api/package.json`, npm registry] |
| Config file | `apps/api/vitest.config.ts` with globals, Node environment, and `src/**/__tests__/**/*.test.ts` include pattern. [VERIFIED: `apps/api/vitest.config.ts`] |
| Quick run command | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` [VERIFIED: targeted Vitest run] |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-07-SUMMARY.md`] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| OPS-03 | Admin retry requeues failed OpenAI style-copy job with persisted provider/model/styleReferenceId/copyTarget/selectedImageId, and worker accepts the payload before provider dispatch. [VERIFIED: `.planning/ROADMAP.md`, `apps/api/src/worker.ts`] | unit + worker integration-style mock | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` [VERIFIED: targeted run] | yes, extend existing files [VERIFIED: `rg --files`] |
| OED-02 | Failed OpenAI style-copy retry keeps the named target (`copyTarget`) and selected approved image (`selectedImageId`). [VERIFIED: `.planning/REQUIREMENTS.md`, `apps/api/src/services/generation.service.ts`] | service unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "retryGeneration"` [VERIFIED: existing test runner] | yes, extend existing file [VERIFIED: `apps/api/src/services/__tests__/admin.service.test.ts`] |
| OED-03 | Retried OpenAI style-copy job reaches OpenAI style-copy dispatch and does not call Gemini `generateWithStyleCopy`. [VERIFIED: `.planning/REQUIREMENTS.md`, `apps/api/src/worker.ts`] | worker mock test | `pnpm --filter @mockup-ai/api test -- src/__tests__/worker.provider-continuation.test.ts -t "style copy"` [VERIFIED: existing test runner] | yes, extend existing file [VERIFIED: `apps/api/src/__tests__/worker.provider-continuation.test.ts`] |

### Sampling Rate

- **Per task commit:** Run `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts`. [VERIFIED: targeted Vitest run]
- **Per wave merge:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check`. [VERIFIED: package scripts, Phase 10 summary]
- **Phase gate:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` before `$gsd-verify-work`. [VERIFIED: Phase 10 release gate pattern]

### Wave 0 Gaps

- [ ] `apps/api/src/services/__tests__/admin.service.test.ts` - add RED regression for OpenAI style-copy admin retry payload containing `copyTarget` and `selectedImageId`. [VERIFIED: current file lacks this specific test, `.planning/v1.1-INTEGRATION-CHECK.md`]
- [ ] `apps/api/src/__tests__/worker.provider-continuation.test.ts` - optional but recommended RED/GREEN regression proving a recovered retry payload reaches OpenAI style-copy dispatch and not Gemini. [VERIFIED: existing file supports mocked worker dispatch]
- No new test framework install is needed. [VERIFIED: `apps/api/package.json`, targeted Vitest run]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Admin routes use `fastify.requireAdmin` as a preHandler on the admin route tree. [VERIFIED: `apps/api/src/routes/admin/index.routes.ts`, auth plugin grep] |
| V3 Session Management | no direct change | Phase 11 does not modify tokens, cookies, or session lifetimes. [VERIFIED: phase scope, codebase grep] |
| V4 Access Control | yes | Retry endpoint remains admin-only, and worker style-reference lookup uses `generationService.getById(userId, styleReferenceId)`. [VERIFIED: `apps/api/src/routes/admin/index.routes.ts`, `apps/api/src/worker.ts`] |
| V5 Input Validation | yes | Persisted image paths are validated against user/project prefixes before retry requeue, and `copyTarget` should be literal-guarded before queueing. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/lib/queue.ts`] |
| V6 Cryptography | no direct change | Phase 11 does not alter API key encryption/decryption or secret storage. [VERIFIED: phase scope, `apps/api/src/services/admin.service.ts`] |
| V10 Malicious Code | yes | Queue payloads are a trust boundary; worker validates queued data against persisted DB data before provider dispatch. [VERIFIED: `apps/api/src/worker.ts`, `.planning/phases/10-provider-aware-result-continuation/10-REVIEW-FIX.md`] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged or stale BullMQ payload changes style reference or selected image | Tampering | Keep worker persisted-metadata guard and fix admin retry to provide matching fields. [VERIFIED: `apps/api/src/worker.ts`] |
| Cross-user style image reuse through retry | Information Disclosure | Resolve style reference with `generationService.getById(userId, styleReferenceId)` and selected image from that record only. [VERIFIED: `apps/api/src/worker.ts`] |
| Retried OpenAI style-copy falls into Gemini `thoughtSignature` path | Elevation of Privilege / Tampering | Preserve provider/model from persisted `Generation` and keep OpenAI style-copy branch before Gemini branch. [VERIFIED: `apps/api/src/worker.ts`, `07-CONTEXT.md`, `10-CONTEXT.md`] |
| Path traversal in persisted retry image paths | Tampering / Information Disclosure | Continue using `validateRetryStoragePath()` and `assertStoragePathWithinPrefixes()` before enqueue. [VERIFIED: `apps/api/src/services/admin.service.ts`, `apps/api/src/services/upload.service.ts`] |
| Raw vendor responses or image bytes exposed in admin retry debugging | Information Disclosure | Do not add new admin UI payloads; Phase 7 exposes only safe OpenAI support identifiers and keeps `providerTrace` backend-only. [VERIFIED: `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md`, `apps/api/src/services/admin.service.ts`] |

## Sources

### Primary (HIGH confidence)

- `.planning/ROADMAP.md` - Phase 11 goal, dependencies, requirements, gap closure, success criteria. [VERIFIED: local file read]
- `.planning/REQUIREMENTS.md` - `OPS-03`, `OED-02`, `OED-03` requirement definitions and traceability. [VERIFIED: local file read]
- `.planning/STATE.md` - accumulated provider/runtime decisions and Phase 10 shipped state. [VERIFIED: local file read]
- `.planning/v1.1-INTEGRATION-CHECK.md` - exact blocker analysis for admin retry missing `copyTarget` and `selectedImageId`. [VERIFIED: local file read]
- `.planning/v1.1-MILESTONE-AUDIT.md` - audit blocker and suggested fix. [VERIFIED: local file read]
- `.planning/phases/07-provider-foundation-and-key-separation/07-CONTEXT.md` and `07-04-SUMMARY.md` - provider foundation, admin retry provider/model contract, worker guardrail pattern. [VERIFIED: local file read]
- `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, `10-04-SUMMARY.md`, `10-05-SUMMARY.md`, `10-REVIEW-FIX.md`, `10-SMOKE.md`, and `10-VERIFICATION.md` - OpenAI style-copy continuation contract and remaining live-smoke state. [VERIFIED: local file read]
- `apps/api/src/services/admin.service.ts` - affected retry method and helper patterns. [VERIFIED: codebase grep/read]
- `apps/api/src/services/generation.service.ts` - normal create/regenerate/style-copy persistence and queue payload shape. [VERIFIED: codebase grep/read]
- `apps/api/src/lib/queue.ts` - `GenerationJobData` contract and OpenAI attempts override. [VERIFIED: codebase grep/read]
- `apps/api/src/worker.ts` - persisted metadata guard and OpenAI/Gemini dispatch isolation. [VERIFIED: codebase grep/read]
- `apps/api/src/services/__tests__/admin.service.test.ts` and `apps/api/src/__tests__/worker.provider-continuation.test.ts` - existing regression test harness. [VERIFIED: codebase grep/read, targeted Vitest run]
- npm registry - current versions and modified timestamps for `openai`, `bullmq`, `vitest`, `@prisma/client`, `fastify`, and `zod`. [VERIFIED: npm registry]
- Context7 `/openai/openai-node` - OpenAI Node SDK retries, timeout, request IDs, API errors, Responses and Images API snippets. [CITED: https://github.com/openai/openai-node/blob/master/README.md]
- Context7 `/taskforcesh/bullmq` - BullMQ `attempts` and `backoff` job options. [CITED: https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/retrying-failing-jobs.md]
- Context7 `/prisma/web` - Prisma JSON field read/write patterns and typed JSON guidance. [CITED: https://github.com/prisma/web/blob/main/apps/docs/content/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields.mdx]
- OpenAI official docs - image generation guide and GPT Image 2 model documentation checked during web verification. [CITED: https://developers.openai.com/api/docs/guides/image-generation]

### Secondary (MEDIUM confidence)

- `.codex/skills/mockup-openai-dual-provider/*`, `.codex/skills/mockup-openai-workflows/*`, `.codex/skills/mockup-openai-image-runtime/*`, `.codex/skills/mockup-precision-edit/*`, and `.codex/skills/mockup-openai-cli-smoke/*` - project-specific OpenAI workflow and runtime guardrails. [VERIFIED: local skill files]
- `.planning/OPENAI-SKILL-GUARDRAILS.md` - phase skill matrix and non-negotiable OpenAI constraints. [VERIFIED: local file read]

### Tertiary (LOW confidence)

- None. [VERIFIED: source audit]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing package versions, current registry versions, and no-new-dependency recommendation were verified from `package.json`, npm registry, and code scope. [VERIFIED: npm registry, package files]
- Architecture: HIGH - route/service/queue/worker data flow was traced directly in source and dependency phase artifacts. [VERIFIED: codebase grep/read]
- Pitfalls: HIGH - the blocker is explicitly documented by v1.1 integration/audit artifacts and reproduced by reading the worker guard versus admin retry payload. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/worker.ts`, `apps/api/src/services/admin.service.ts`]
- Validation: HIGH - targeted tests passed: `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts`, 2 files / 64 tests. [VERIFIED: targeted Vitest run]
- Security: MEDIUM-HIGH - admin auth, path validation, worker payload guard, and provider isolation were verified; no live runtime threat test was run. [VERIFIED: codebase grep/read]

**Research date:** 2026-04-29 [VERIFIED: `date +%F`]
**Valid until:** 2026-05-06 for OpenAI/BullMQ/npm version details and 2026-05-29 for local architecture findings, unless Phase 11 or related retry/worker files change first. [VERIFIED: current-date, source volatility assessment]

## RESEARCH COMPLETE

**Phase:** 11 - OpenAI Style-Copy Retry Recovery [VERIFIED: `gsd-sdk query init.phase-op "11"`]
**Confidence:** HIGH [VERIFIED: local source audit, targeted tests, dependency artifacts]

### Key Findings

- `AdminService.retryGeneration()` is the only confirmed broken integration point for this phase; it omits `promptData.copyTarget` and `promptData.selectedImageId` when rebuilding `GenerationJobData`. [VERIFIED: `.planning/v1.1-INTEGRATION-CHECK.md`, `apps/api/src/services/admin.service.ts`]
- `GenerationJobData` already supports `copyTarget` and `selectedImageId`, so no queue type expansion is required. [VERIFIED: `apps/api/src/lib/queue.ts`]
- The worker intentionally validates queued `copyTarget` and `selectedImageId` against persisted `promptData` before provider dispatch, so the correct fix is payload recovery, not guard relaxation. [VERIFIED: `apps/api/src/worker.ts`]
- Existing tests provide the right harness: admin service tests assert `addGenerationJob()` payloads, and worker continuation tests prove OpenAI dispatch without Gemini fallback. [VERIFIED: test files, targeted Vitest run]
- No schema, UI, OpenAI prompt, OpenAI SDK, or live OpenAI credential change is needed for the required Phase 11 acceptance criteria. [VERIFIED: phase scope, codebase audit]

### File Created

`.planning/phases/11-openai-style-copy-retry-recovery/11-RESEARCH.md` [VERIFIED: this file]

### Ready for Planning

Research complete. Planner can now create PLAN.md files. [VERIFIED: artifact complete]
