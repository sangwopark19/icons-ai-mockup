# Phase 10: Provider-Aware Result Continuation - Research

**Researched:** 2026-04-28  
**Domain:** Provider-aware generation continuation across Next.js result/history UI, Fastify routes, Prisma persistence, BullMQ worker routing, and OpenAI GPT Image 2 image workflows. [VERIFIED: `.planning/ROADMAP.md`, `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, codebase grep]  
**Confidence:** HIGH for repo architecture and locked decisions; MEDIUM for live OpenAI Responses behavior until smoke-tested against the active account. [VERIFIED: codebase grep, `pnpm --filter @mockup-ai/api test`, official OpenAI docs]

<user_constraints>
## User Constraints (from CONTEXT.md)

**Source:** Copied verbatim from `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`]

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

- Responses API based iterative partial-edit refinement belongs in a future phase.
- Region mask based precision editing remains out of scope for Phase 10.
- Provider comparison views and cross-provider duplication remain future candidates.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROV-03 | User can see which provider and model produced each generation in the result view and project history. [VERIFIED: `.planning/REQUIREMENTS.md`] | Product UI must show `v1`/`v2` while API records keep raw `provider` and `providerModel`; current result/history pages already receive provider data but need final copy/action alignment. [VERIFIED: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`, `apps/web/src/app/projects/[id]/history/page.tsx`, `apps/api/src/routes/generation.routes.ts`] |
| PROV-04 | User can regenerate a saved generation with the same provider and core options used for the original request. [VERIFIED: `.planning/REQUIREMENTS.md`] | Current `GenerationService.regenerate()` copies provider/model/options for Gemini but rejects OpenAI, so Phase 10 should remove only the OpenAI block and preserve the existing validation/replay spine. [VERIFIED: `apps/api/src/services/generation.service.ts:456`] |
| OED-01 | User can request a partial edit on an OpenAI-generated result from the existing result page. [VERIFIED: `.planning/REQUIREMENTS.md`] | Current edit route is Gemini-only and current result UI returns early for v2 edits, so Phase 10 must add OpenAI Image API edit handling and enable the existing modal for v2. [VERIFIED: `apps/api/src/routes/edit.routes.ts:50`, `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:268`] |
| OED-02 | User can create a style-copy generation from an approved OpenAI result while changing only the named target. [VERIFIED: `.planning/REQUIREMENTS.md`] | Current `copyStyle()` rejects OpenAI and worker rejects OpenAI style references, so Phase 10 needs a dedicated v2 style-copy page plus backend OpenAI lineage/fallback logic. [VERIFIED: `apps/api/src/services/generation.service.ts:590`, `apps/api/src/worker.ts:124`, `apps/api/src/worker.ts:233`] |
| OED-03 | User can iterate on OpenAI edits or style-copy follow-ups without mixing state with Gemini-only style memory. [VERIFIED: `.planning/REQUIREMENTS.md`] | Gemini style copy uses `thoughtSignature`; OpenAI must use `openaiResponseId`/`openaiImageCallId` or selected-image fallback and must never read Gemini signatures for v2. [VERIFIED: `apps/api/src/worker.ts:165`, `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, official OpenAI Responses image docs] |
</phase_requirements>

## Summary

Phase 10 should be planned as a provider-continuation layer over the existing Phase 7-9 provider spine, not as a new provider system. `Generation.provider` and `Generation.providerModel` already exist, queue payloads already carry matching provider/model copies, result/history payloads already expose provider/model, and the worker already validates queue provider/model against the persisted generation before dispatch. [VERIFIED: `apps/api/prisma/schema.prisma`, `apps/api/src/lib/queue.ts`, `apps/api/src/worker.ts`, `apps/api/src/routes/generation.routes.ts`]

The implementation center of gravity is four places: `GenerationService.regenerate()` and `copyStyle()`, `edit.routes.ts`, `openai-image.service.ts`, and the result/history/style-copy UI. Current code intentionally blocks OpenAI continuation: v2 result buttons are disabled, edit returns early for v2, backend edit rejects non-Gemini, regeneration rejects OpenAI, style-copy rejects OpenAI, and worker rejects OpenAI jobs with `styleReferenceId`. [VERIFIED: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`, `apps/api/src/routes/edit.routes.ts`, `apps/api/src/services/generation.service.ts`, `apps/api/src/worker.ts`]

The OpenAI API choice should be split by workflow: same-condition regeneration is a fresh Image API request using the original stored inputs/options; one-shot partial edit is Image API edit with the selected result image; style copy should prefer Responses API image generation when persisted `openaiResponseId`/`openaiImageCallId` linkage exists and fall back to selected-image Image API edit when linkage is missing. [VERIFIED: `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md`; CITED: https://developers.openai.com/api/docs/guides/image-generation, https://developers.openai.com/api/docs/guides/tools-image-generation]

**Primary recommendation:** Implement one provider-aware continuation service boundary that backs regenerate, partial edit, and style copy, while keeping product UI labels as `v1`/`v2` and backend routing from persisted provider/model only. [VERIFIED: `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md`, codebase grep]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Result/history version display | Browser / Client | API / Backend | UI renders `v1`/`v2`, but the value must be derived from persisted API `provider`, not from route/query/client guesses. [VERIFIED: `10-UI-SPEC.md`, `generation.routes.ts`, result/history pages] |
| Provider-pinned regeneration | API / Backend | Queue / Worker | Regeneration must replay original persisted inputs/options into a new `Generation` and queue job; the browser only triggers the action. [VERIFIED: `generation.service.ts:456`, `queue.ts`, `worker.ts`] |
| OpenAI one-shot partial edit | API / Backend | OpenAI Image API / Storage | The backend must read the selected result file, call OpenAI Image API edit, create a completed child generation, save one output, and store OpenAI metadata. [VERIFIED: `edit.routes.ts`; CITED: https://developers.openai.com/api/docs/guides/image-generation] |
| OpenAI style-copy target collection | Browser / Client | API / Backend | Dedicated page owns style reference preview and target upload; backend owns provider lineage, prompt construction, queueing, and fallback execution. [VERIFIED: `10-UI-SPEC.md`, `ImageUploader`, `upload.routes.ts`] |
| OpenAI style-copy execution | API / Backend | OpenAI Responses / Image API | Style-copy should use stored OpenAI linkage first and selected-image fallback second; both paths must create two candidates without Gemini `thoughtSignature`. [VERIFIED: `10-CONTEXT.md`, `workflow-matrix.md`; CITED: https://developers.openai.com/api/docs/guides/tools-image-generation] |
| Provider drift prevention | Database / Storage | Queue / Worker | `Generation.provider` is the source of truth, and worker already rejects mismatched queue provider/model before vendor dispatch. [VERIFIED: `07-CONTEXT.md`, `worker.ts:79`] |
| OpenAI debug/lineage metadata | Database / Storage | API / Backend | `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, `openaiRevisedPrompt`, and `providerTrace` already exist and should be populated for continuation runs. [VERIFIED: `schema.prisma:155`, `generation.service.ts:430`] |

## Project Constraints (from AGENTS.md)

No `./AGENTS.md` file exists in the repo root, but the user supplied AGENTS.md directives in the request and they apply to this research output. [VERIFIED: `find .. -name AGENTS.md`, user-provided AGENTS.md block]

- User-facing assistant responses must be written in Korean, while technical terms and code identifiers stay in English. [VERIFIED: user-provided AGENTS.md block]
- Do not modify Claude, `~/.claude`, or Claude workflow settings for Codex GSD subagent handling. [VERIFIED: user-provided AGENTS.md block]
- GSD subagent `wait_agent` timeout or empty status is not automatically failure; artifact contracts such as `RESEARCH.md`, `PLAN.md`, `PATTERNS.md`, commits, or markers are the completion evidence. [VERIFIED: user-provided AGENTS.md block]
- If native Codex subagents cannot start, inline sequential fallback is allowed only with a clear fallback reason. [VERIFIED: user-provided AGENTS.md block]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | Repo `^16.1.0`; npm latest `16.2.4`, modified 2026-04-27. [VERIFIED: `apps/web/package.json`, npm registry] | Result, history, and dedicated style-copy page in App Router. [VERIFIED: codebase file layout] | Use the existing frontend stack; no Phase 10 requirement needs a Next upgrade. [VERIFIED: `10-UI-SPEC.md`] |
| `react` / `react-dom` | Repo `^19.0.0`; npm latest `19.2.5`, modified 2026-04-24. [VERIFIED: `apps/web/package.json`, npm registry] | Client-side result actions, modal state, upload state, and style-copy page state. [VERIFIED: current web pages] | Existing pages are React client components and should be extended rather than replaced. [VERIFIED: codebase grep] |
| `fastify` | Repo `^5.1.0`; npm latest `5.8.5`, modified 2026-04-14. [VERIFIED: `apps/api/package.json`, npm registry] | Authenticated generation/edit/copy-style HTTP routes. [VERIFIED: `generation.routes.ts`, `edit.routes.ts`] | Current API routes use Fastify plugin patterns and `fastify.authenticate`. [VERIFIED: `apps/api/src/routes/*.ts`] |
| `@prisma/client` / `prisma` | Repo `^6.2.0`; npm latest `7.8.0`, modified 2026-04-27. [VERIFIED: `apps/api/package.json`, npm registry] | Generation persistence, provider metadata, lineage fields, images, history. [VERIFIED: `schema.prisma`] | Existing schema already contains the provider/OpenAI fields needed for Phase 10, so no new ORM is needed. [VERIFIED: `schema.prisma`] |
| `bullmq` | Repo `^5.31.0`; npm latest `5.76.2`, modified 2026-04-25. [VERIFIED: `apps/api/package.json`, npm registry] | Async regeneration and style-copy jobs that return two candidates. [VERIFIED: `queue.ts`, `worker.ts`] | Current generation runtime is queue/worker based; provider-matching guard already lives there. [VERIFIED: `worker.ts:79`] |
| `openai` | Repo `^6.34.0`; npm latest `6.34.0`, modified 2026-04-08. [VERIFIED: `apps/api/package.json`, npm registry] | OpenAI Image API edit and Responses image tool calls. [VERIFIED: `openai-image.service.ts`; CITED: https://github.com/openai/openai-node] | Official SDK exposes file upload helpers, request IDs, retry/timeout controls, and typed API access. [CITED: https://github.com/openai/openai-node] |
| `zod` | Repo `^3.24.1`; npm latest `4.3.6`, modified 2026-01-25. [VERIFIED: package files, npm registry] | Route input validation and shared types. [VERIFIED: `generation.routes.ts`, `packages/shared/src/types/index.ts`] | Current API route style is Zod validation before service calls. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | Repo `^0.468.0`; npm latest `1.11.0`, modified 2026-04-24. [VERIFIED: `apps/web/package.json`, npm registry] | New utility icons if Phase 10 adds icon controls. [VERIFIED: `10-UI-SPEC.md`, `ImageUploader`] | Use only where existing local UI uses icon buttons; existing emoji labels may remain where already established. [VERIFIED: `10-UI-SPEC.md`] |
| `sharp` | Repo `^0.33.5`. [VERIFIED: `apps/api/package.json`] | Existing image storage/metadata/background-removal support. [VERIFIED: `upload.service.ts`, `background-removal.service.test.ts`] | Keep using existing upload/image pipeline for saved OpenAI outputs. [VERIFIED: codebase grep] |
| `vitest` | Repo `^4.0.18`; npm latest `4.1.5`, modified 2026-04-23. [VERIFIED: `apps/api/package.json`, npm registry] | API/service/route unit tests. [VERIFIED: `apps/api/vitest.config.ts`] | Add Phase 10 backend tests under `apps/api/src/**/__tests__/**/*.test.ts`. [VERIFIED: `vitest.config.ts`] |
| Local `Button`, `Input`, `ImageUploader` | Local components. [VERIFIED: `apps/web/src/components/ui/*.tsx`] | Result actions, edit modal input, style-copy target upload. [VERIFIED: `10-UI-SPEC.md`] | Use local manual Tailwind UI; do not initialize shadcn. [VERIFIED: `10-UI-SPEC.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Fastify/Prisma/BullMQ flow | A separate continuation microservice | Not recommended because provider source-of-truth, auth, storage, and queue validation already exist in the current API/worker. [VERIFIED: codebase grep] |
| OpenAI Node SDK | Raw `fetch` calls | Not recommended because SDK already installed and official SDK exposes request IDs, retry, timeout, and `toFile` helpers. [VERIFIED: `apps/api/package.json`; CITED: https://github.com/openai/openai-node] |
| Local UI components | shadcn registry components | Not allowed by UI-SPEC because `components.json` is absent and the phase must use existing manual Tailwind product UI. [VERIFIED: `10-UI-SPEC.md`] |
| Gemini `thoughtSignature` reuse | OpenAI `openaiResponseId` / `openaiImageCallId` | `thoughtSignature` is Gemini-only and must not be used by OpenAI continuation flows. [VERIFIED: `10-CONTEXT.md`, `worker.ts`] |

**Installation:**

No new package install is required for the recommended Phase 10 plan because `openai` is already installed in `apps/api`. [VERIFIED: `apps/api/package.json`, npm registry]

```bash
# Only if the dependency is missing in another branch:
pnpm --filter @mockup-ai/api add openai@6.34.0
```

**Version verification:** `npm view` verified `openai@6.34.0`, `next@16.2.4`, `react@19.2.5`, `fastify@5.8.5`, `@prisma/client@7.8.0`, `bullmq@5.76.2`, `zod@4.3.6`, `vitest@4.1.5`, `@google/genai@1.50.1`, and `lucide-react@1.11.0` on 2026-04-28. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Result / History page
  |
  | fetch generation detail/history
  v
Fastify generation routes
  |
  | read persisted Generation(provider, providerModel, options, promptData, OpenAI IDs)
  v
Continuation service boundary
  |
  |-- Same-condition regenerate
  |     -> clone original provider/model/input paths/prompt/options
  |     -> create pending Generation
  |     -> enqueue BullMQ job
  |
  |-- Partial edit
  |     -> require selected result image
  |     -> if gemini: existing Gemini edit path
  |     -> if openai: Image API edit with selected image
  |     -> create completed one-result Generation
  |
  |-- Style copy
        -> dedicated style-copy page uploads target asset
        -> create pending Generation with styleReferenceId + copyTarget
        -> enqueue BullMQ job
              |
              v
        Worker validates queue provider/model == DB provider/model
              |
              |-- Gemini -> thoughtSignature style copy
              |-- OpenAI with linkage -> Responses image tool
              |-- OpenAI missing linkage -> selected-image Image API edit fallback
              v
        Save outputs + OpenAI metadata + status
```

This data flow keeps provider decisions in API/database/worker tiers and keeps the browser responsible only for display, uploads, and action triggers. [VERIFIED: `10-CONTEXT.md`, `worker.ts`, `generation.service.ts`]

### Recommended Project Structure

```text
apps/api/src/
├── routes/
│   ├── edit.routes.ts                  # provider-aware partial edit entry
│   └── generation.routes.ts            # regenerate and copy-style endpoints
├── services/
│   ├── generation.service.ts           # create/regenerate/copy-style orchestration
│   ├── generation-continuation.service.ts # optional shared boundary if edits get too large
│   ├── openai-image.service.ts         # Image API + Responses helper methods
│   └── __tests__/                      # Phase 10 service/route tests
└── worker.ts                           # provider dispatch and style-copy execution

apps/web/src/app/projects/[id]/
├── generations/[genId]/page.tsx        # enable provider-aware v2 follow-up actions
├── history/page.tsx                    # v1/v2 provider badge consistency
└── style-copy/openai/page.tsx          # dedicated v2 style-copy page
```

The optional `generation-continuation.service.ts` should be introduced only if it reduces duplication between edit, regenerate, and copy-style; otherwise keep the existing route/service structure. [VERIFIED: `10-CONTEXT.md` discretion, codebase patterns]

### Pattern 1: Persisted Provider Is The Only Runtime Source

**What:** Every continuation action must fetch the source `Generation` and branch on `generation.provider`/`generation.providerModel`, never on UI badge text or query params. [VERIFIED: `07-CONTEXT.md`, `10-CONTEXT.md`, `worker.ts:79`]  
**When to use:** Result page actions, history reopen, edit, regenerate, style-copy, admin retry. [VERIFIED: `generation.routes.ts`, `admin.service.ts`, `10-UI-SPEC.md`]  
**Example:**

```ts
// Source: local worker provider guard.
if (job.data.provider !== generation.provider) {
  throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
}

if (job.data.providerModel !== generation.providerModel) {
  throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
}
```

### Pattern 2: Fresh Regeneration Reuses Stored Inputs

**What:** Regeneration should create a new `Generation` using original `promptData`, `options`, `provider`, and `providerModel`, then enqueue a normal provider-aware job. [VERIFIED: `generation.service.ts:456`, `10-CONTEXT.md`]  
**When to use:** `POST /api/generations/:id/regenerate` for both Gemini and OpenAI. [VERIFIED: `generation.routes.ts:326`]  
**Example:**

```ts
// Source: current GenerationService.regenerate shape; remove the OpenAI block, keep replay.
return this.create(userId, {
  projectId: original.projectId,
  mode: original.mode,
  provider: original.provider,
  providerModel: original.providerModel,
  sourceImagePath: promptData.sourceImagePath as string | undefined,
  characterImagePath: promptData.characterImagePath as string | undefined,
  textureImagePath: promptData.textureImagePath as string | undefined,
  prompt: promptData.userPrompt as string | undefined,
  options: { ...replayedOptions, outputCount: 2 },
});
```

### Pattern 3: OpenAI Partial Edit Is One-Shot Image API Edit

**What:** OpenAI partial edit should read the selected generated image, call Image API edit with a strict preserve prompt, save exactly one output, and store OpenAI metadata. [VERIFIED: `10-CONTEXT.md`, `workflow-matrix.md`; CITED: https://developers.openai.com/api/docs/guides/image-generation]  
**When to use:** Existing result-page freeform `부분 수정` modal for `provider === "openai"`. [VERIFIED: `10-UI-SPEC.md`]  
**Example:**

```ts
// Source: official openai-node file upload pattern + existing openai-image.service.ts pattern.
const response = await client.images.edit({
  model: 'gpt-image-2',
  image: await toFile(selectedImageBuffer, 'selected-result.png', { type: 'image/png' }),
  prompt: buildPartialEditPrompt(userPrompt),
  quality: 'medium',
  n: 1,
  size: '1024x1024',
  output_format: 'png',
});
```

### Pattern 4: Style Copy Uses Linkage First, Selected Image Fallback Second

**What:** OpenAI style-copy should first use `openaiResponseId`/`openaiImageCallId` or `providerTrace` linkage; when linkage is absent, use the selected result image as Image 1 reference and uploaded target as Image 2. [VERIFIED: `10-CONTEXT.md`; CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]  
**When to use:** Dedicated `/projects/:id/style-copy/openai` route for both `copyTarget=ip-change` and `copyTarget=new-product`. [VERIFIED: `10-UI-SPEC.md`]  
**Example:**

```ts
// Source: official Responses image generation follow-up pattern.
const response = await client.responses.create({
  model: 'gpt-5.5',
  input: [
    { role: 'user', content: [{ type: 'input_text', text: styleCopyPrompt }] },
    { type: 'image_generation_call', id: sourceOpenAIImageCallId },
  ],
  tools: [{ type: 'image_generation', action: 'edit', quality: 'high' }],
});
```

Use `providerModel: "gpt-image-2"` on the persisted generation record even when the Responses top-level `model` is a text-capable model, because official docs state GPT Image models are not valid top-level Responses `model` values for the hosted image tool. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]

### Anti-Patterns To Avoid

- **Routing from `v2` badge text:** Badge text is a display artifact; persisted provider/model is the runtime contract. [VERIFIED: `10-CONTEXT.md`, `10-UI-SPEC.md`]
- **Letting OpenAI fallback to Gemini:** Wrong-provider fallback violates Phase 7 and Phase 10 no-fallback decisions. [VERIFIED: `07-CONTEXT.md`, `10-CONTEXT.md`]
- **Using Gemini `thoughtSignature` for OpenAI:** The current worker signature parsing is Gemini-only and must stay isolated. [VERIFIED: `worker.ts:165`, `10-CONTEXT.md`]
- **Sending `background: "transparent"` or `input_fidelity` to `gpt-image-2`:** Official docs say `input_fidelity` must be omitted for `gpt-image-2`, and local guardrails prohibit direct transparent background for this model. [CITED: https://developers.openai.com/api/docs/guides/image-generation; VERIFIED: `OPENAI-SKILL-GUARDRAILS.md`]
- **Adding raw provider/model labels to product UI:** Product UI must show `v1`/`v2`; raw provider/model remains for API/admin/debug/tests. [VERIFIED: `10-CONTEXT.md`, `10-UI-SPEC.md`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAI HTTP calls | Custom raw `fetch` wrapper | Official `openai` Node SDK | SDK provides `toFile`, request IDs, retries, timeouts, and typed API surface. [CITED: https://github.com/openai/openai-node] |
| Provider routing | `isOpenAI` booleans or route-based branching | `Generation.provider` + `providerModel` + worker guard | The source-of-truth schema and guard already exist. [VERIFIED: `schema.prisma`, `worker.ts`] |
| Style lineage | Custom cross-provider memory format | Gemini `thoughtSignature` only for Gemini; OpenAI response/image IDs for OpenAI | The mechanisms are incompatible and explicitly separated by Phase 10. [VERIFIED: `10-CONTEXT.md`, `worker.ts`] |
| Upload/storage validation | Ad hoc path concatenation | `uploadService` and `assertStoragePathWithinPrefixes` | Existing storage helper validates ownership/path prefixes. [VERIFIED: `generation.service.ts:67`, `upload.service.test.ts`] |
| Async generation lifecycle | Synchronous long-running route for two-candidate jobs | Existing `GenerationService.create()` + BullMQ worker | Existing result page polls generated status and worker saves outputs. [VERIFIED: `generation.service.ts`, `worker.ts`, result page] |
| Prompt preservation | Freeform prompt concatenation | Structured `Task`, `Image roles`, `Must change`, `Must preserve`, `Hard constraints` builders | Project skills and prior OpenAI runtime tests rely on structured preservation prompts. [VERIFIED: `prompt-playbook.md`, `openai-image.service.ts`] |
| Validation framework | Manual request checks only | Zod route schemas plus service validation | Existing routes use Zod and service-level validation for provider constraints. [VERIFIED: `generation.routes.ts`, `generation.service.ts`] |

**Key insight:** Phase 10 is high risk because it touches continuation state, not because it needs new infrastructure; custom shortcuts around provider, lineage, upload, or prompt contracts would bypass the protections Phases 7-9 already added. [VERIFIED: prior phase contexts, codebase grep]

## Common Pitfalls

### Pitfall 1: UI Badge Becomes Runtime Truth

**What goes wrong:** A result with `v2` text triggers an OpenAI path because the button inferred provider from UI copy. [VERIFIED: `10-UI-SPEC.md`]  
**Why it happens:** Badge text is easy to read from React state, but Phase 10 requires persisted provider/model routing. [VERIFIED: `10-CONTEXT.md`]  
**How to avoid:** Always fetch generation detail and call backend endpoints that branch on persisted `Generation.provider`. [VERIFIED: `generation.routes.ts`, `worker.ts`]  
**Warning signs:** Code checks label text, route suffix, query params, or local `isV2` as the backend routing authority. [VERIFIED: current result page uses `isV2` for UI gating only]

### Pitfall 2: OpenAI Continuation Still Blocked In One Layer

**What goes wrong:** UI enables v2 follow-up but backend still throws `OpenAI ... 지원하지 않습니다`, or backend supports it but UI still returns early. [VERIFIED: current result page, `edit.routes.ts`, `generation.service.ts`, `worker.ts`]  
**Why it happens:** Phase 8/9 disabled v2 follow-ups in multiple layers intentionally. [VERIFIED: `08-CONTEXT.md`, `09-CONTEXT.md`]  
**How to avoid:** Plan a vertical slice per continuation action: UI enablement, route validation, service behavior, worker dispatch, tests, and failure copy. [VERIFIED: codebase architecture]  
**Warning signs:** `rg "isV2\\) return|지원하지 않습니다|styleReferenceId" apps` still finds OpenAI continuation blockers after implementation. [VERIFIED: codebase grep]

### Pitfall 3: Regeneration Accidentally Uses Selected Output As Seed

**What goes wrong:** OpenAI regeneration starts from the selected result image instead of the original input assets. [VERIFIED: `10-CONTEXT.md`]  
**Why it happens:** Selected-image state is available on result pages, but locked decision D-06 says regeneration must create a fresh request from original inputs/options. [VERIFIED: `10-CONTEXT.md`]  
**How to avoid:** Keep regeneration entirely backend replay from `promptData` and `options`; send no editable form data from the browser. [VERIFIED: `10-UI-SPEC.md`, `generation.service.ts:456`]  
**Warning signs:** `regenerate` request body includes `selectedImageId` or a result image path. [VERIFIED: `10-UI-SPEC.md`]

### Pitfall 4: Style Copy Uses Gemini Signature For OpenAI

**What goes wrong:** OpenAI style-copy worker path tries to parse `thoughtSignatures` or calls `geminiService.generateWithStyleCopy`. [VERIFIED: current Gemini style-copy worker code]  
**Why it happens:** Existing Gemini style-copy implementation is the only style-copy code path today. [VERIFIED: `worker.ts:150`]  
**How to avoid:** Add an OpenAI branch before Gemini signature parsing and use OpenAI linkage/fallback logic. [VERIFIED: `10-CONTEXT.md`]  
**Warning signs:** OpenAI style-copy tests pass with a `thoughtSignature` fixture or fail when `thoughtSignatures` is null. [VERIFIED: current test gap]

### Pitfall 5: Responses API Uses `gpt-image-2` As Top-Level Model

**What goes wrong:** Style-copy Responses calls fail because `gpt-image-2` is passed as `responses.create({ model })`. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]  
**Why it happens:** Persisted `providerModel` is correctly `gpt-image-2`, but Responses API top-level model must be text-capable. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]  
**How to avoid:** Persist `providerModel = "gpt-image-2"` for the image workflow and store the Responses top-level model in `providerTrace.responsesModel`. [VERIFIED: schema supports `providerTrace`; CITED: OpenAI docs]  
**Warning signs:** `client.responses.create({ model: 'gpt-image-2' })` appears in code. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]

### Pitfall 6: One-Result Partial Edit Renders As Two Empty Candidates

**What goes wrong:** OpenAI partial edit creates one image but result page title still says `생성된 이미지 (2개)`. [VERIFIED: `10-UI-SPEC.md`]  
**Why it happens:** Current v2 result rendering hardcodes two-candidate label for all OpenAI generations. [VERIFIED: `page.tsx:520`]  
**How to avoid:** Store/derive the continuation type from `promptData` or `options.outputCount` and render `수정 결과` for one-result edits. [VERIFIED: `10-UI-SPEC.md`, `generation.service.ts` options shape]  
**Warning signs:** Partial edit result page has two thumbnail slots or candidate labels. [VERIFIED: `10-UI-SPEC.md`]

## Code Examples

### OpenAI Partial Edit Prompt Builder

```ts
// Source: mockup-precision-edit + Phase 10 locked preserve list.
function buildPartialEditPrompt(userPrompt: string) {
  return `Task:
Edit the image by changing only this requested target:
${userPrompt}

Must preserve exactly:
- Product body, camera angle, crop, background rule, lighting, text, labels, hardware, and non-target details.
- Overall composition, scale, saturation, contrast, sharpness, and image quality.

Hard constraints:
- Do not add or remove objects.
- Do not restyle the image.
- Do not change surrounding areas.`;
}
```

This pattern is supported by project prompt rules that require `Must change`, `Must preserve`, and `Hard constraints` sections for surgical edits. [VERIFIED: `.codex/skills/mockup-precision-edit/SKILL.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`]

### OpenAI Style-Copy Fallback Prompt

```ts
// Source: mockup-precision-edit style-copy prompt.
function buildStyleCopyPrompt(copyTarget: 'ip-change' | 'new-product', extra?: string) {
  const target = copyTarget === 'ip-change' ? 'character/IP artwork' : 'product';
  return `Task:
Edit Image 1 by preserving its composition, placement, product styling, viewpoint, lighting, background, and overall mockup treatment. Replace only the ${target} using Image 2.

Image roles:
- Image 1: approved style/result reference.
- Image 2: new ${target} reference.

Must change:
- Replace only the ${target}.

Must preserve:
- Everything else from Image 1, including product geometry, camera viewpoint, background, hardware, labels, and non-target details.

Additional instructions:
${extra?.trim() || 'None.'}`;
}
```

This fallback should be used only when OpenAI response/image linkage is unavailable or insufficient. [VERIFIED: `10-CONTEXT.md`]

### Frontend Style-Copy Route Construction

```ts
// Source: Phase 10 UI-SPEC route contract.
const query = new URLSearchParams({
  styleRef: generation.id,
  copyTarget,
  imageId: selectedImageId,
});

router.push(`/projects/${projectId}/style-copy/openai?${query.toString()}`);
```

The dedicated style-copy page route is locked in the UI contract as `/projects/:id/style-copy/openai?styleRef=:generationId&copyTarget=ip-change|new-product&imageId=:selectedImageId`. [VERIFIED: `10-UI-SPEC.md`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gemini `thoughtSignature` for style memory | OpenAI response/image linkage for OpenAI style-copy, with selected-image fallback | Phase 10 context on 2026-04-28. [VERIFIED: `10-CONTEXT.md`] | Planner must create separate Gemini and OpenAI lineage branches. [VERIFIED: `worker.ts`, `10-CONTEXT.md`] |
| One-shot Image API for every OpenAI workflow | Image API for single-turn generation/edit; Responses image tool for multi-turn/linkage-aware flows | Official docs checked 2026-04-28. [CITED: https://developers.openai.com/api/docs/guides/image-generation, https://developers.openai.com/api/docs/guides/tools-image-generation] | Style-copy can use Responses linkage, while regeneration and partial edit can stay Image API first. [VERIFIED: skill refs; CITED: official docs] |
| Top-level Responses `model = gpt-image-2` | Top-level Responses model must be text-capable; GPT Image models are used by the hosted image tool internally | Official docs checked 2026-04-28. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation] | Store `providerModel = gpt-image-2`; store Responses model separately in trace/config. [VERIFIED: schema supports trace] |
| Adjustable `input_fidelity` for image edits | Omit `input_fidelity` for `gpt-image-2` because image inputs are already high fidelity | Official docs checked 2026-04-28. [CITED: https://developers.openai.com/api/docs/guides/image-generation] | Tests should assert no `input_fidelity` parameter in OpenAI service calls. [VERIFIED: `openai-image.service.test.ts`] |

**Deprecated/outdated:**
- Treating Phase 8/9 disabled v2 follow-up copy as current behavior is outdated for Phase 10; Phase 10 explicitly turns these flows on. [VERIFIED: `08-CONTEXT.md`, `09-CONTEXT.md`, `10-CONTEXT.md`]
- Assuming product UI can show raw `OpenAI`/`Gemini` names is superseded by the locked `v1`/`v2` product-label contract. [VERIFIED: `10-CONTEXT.md`, `10-UI-SPEC.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The OpenAI account used for live smoke has access to the current docs-supported Responses top-level model `gpt-5.5`. [ASSUMED] | Open Questions / Style Copy | Style-copy Responses linkage may need a configured alternative text-capable model such as another supported GPT model, while preserving `providerModel = gpt-image-2`. |

## Open Questions

1. **Which Responses top-level model should the app use for OpenAI style-copy linkage?**  
   - What we know: Official docs list `gpt-5.5` among models that support the image generation tool, and state GPT Image models are not valid Responses `model` values. [CITED: https://developers.openai.com/api/docs/guides/tools-image-generation]  
   - What's unclear: The active OpenAI account's model access and cost preference were not verified. [ASSUMED]  
   - Recommendation: Use a backend constant such as `OPENAI_RESPONSES_IMAGE_MODEL = "gpt-5.5"` or a code constant default, store it in `providerTrace`, and fail clearly if unavailable rather than falling back to Gemini. [VERIFIED: no-fallback decisions in `10-CONTEXT.md`]

2. **Should partial edit stay synchronous like current Gemini edit or move to queue?**  
   - What we know: Current edit route synchronously calls Gemini and creates a completed generation, and Phase 10 allows either existing edit route or shared provider-aware service if fallback is impossible. [VERIFIED: `edit.routes.ts`, `10-CONTEXT.md`]  
   - What's unclear: OpenAI Image API latency for one-output partial edit under the active account was not smoke-tested during research. [ASSUMED]  
   - Recommendation: Keep the existing synchronous route for parity only if timeout and UX are acceptable; otherwise create a queued pending generation and reuse result-page polling. [VERIFIED: existing result-page polling pattern]

3. **No AI-SPEC.md exists for Phase 10.**  
   - What we know: The user explicitly said no phase AI-SPEC was found. [VERIFIED: user prompt]  
   - What's unclear: There is no separate AI acceptance rubric for prompt quality beyond CONTEXT, UI-SPEC, skill references, and smoke requirements. [VERIFIED: files read]  
   - Recommendation: Planner should make prompt review and smoke evidence explicit tasks, especially for style-copy quality and OpenAI linkage fallback. [VERIFIED: `OPENAI-SKILL-GUARDRAILS.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Build/test/API runtime | ✓ | `v24.13.0`; project requires `>=22.0.0`. [VERIFIED: `node --version`, `package.json`] | — |
| pnpm | Workspace scripts | ✓ | `9.15.0`. [VERIFIED: `pnpm --version`, `package.json`] | — |
| npm registry access | Version verification | ✓ | `npm 11.6.2`; `npm view` succeeded. [VERIFIED: shell] | — |
| Docker | Local full-stack services | ✓ | Docker CLI/server `29.1.3`. [VERIFIED: `docker --version`, `docker info --format`] | Use unit/type checks without full local stack. |
| PostgreSQL service | Local API integration/E2E | ✗ running | No `mockup-postgres` container running; `pg_isready` CLI not installed. [VERIFIED: `docker ps`, `command -v pg_isready`] | Start `docker compose up postgres redis` for local E2E. |
| Redis service | BullMQ worker integration/E2E | ✗ running | No `mockup-redis` container running; `redis-cli` not installed. [VERIFIED: `docker ps`, `command -v redis-cli`] | Start `docker compose up redis`; unit tests mock worker-adjacent behavior. |
| OpenAI API key | Live smoke | Partially | `.env` contains `OPENAI_API_KEY=<set>`, but runtime uses DB-managed active provider keys. [VERIFIED: sanitized `.env` grep, Phase 7 key policy] | Use mocked unit tests; run live smoke only after active OpenAI API key exists in DB/admin. |
| `curl` / `jq` / `base64` | CLI smoke scripts | ✓ / ✓ / ✓ | `curl 8.7.1`, `jq 1.7.1`; BSD `base64` present. [VERIFIED: shell] | Node SDK smoke script. |

**Missing dependencies with no fallback:**
- None for research and unit/type planning. [VERIFIED: tests and type-check completed]

**Missing dependencies with fallback:**
- PostgreSQL and Redis are not currently running; planner should include Docker startup for manual/E2E validation or keep automated tests mocked. [VERIFIED: `docker ps`]
- Live OpenAI continuation smoke depends on DB active OpenAI key state, not just `.env`; planner should verify or seed an active provider key before smoke. [VERIFIED: Phase 7 key management, `adminService.getActiveApiKey(provider)` calls]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.0.18` in `apps/api`; latest npm `4.1.5`. [VERIFIED: `apps/api/package.json`, npm registry] |
| Config file | `apps/api/vitest.config.ts`, includes `src/**/__tests__/**/*.test.ts`. [VERIFIED: config file] |
| Quick run command | `pnpm --filter @mockup-ai/api test` [VERIFIED: package script] |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` [VERIFIED: scripts; commands passed 2026-04-28] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PROV-03 | Result/history use persisted provider/model to render `v1`/`v2` and hide raw provider/model in product UI. [VERIFIED: `10-UI-SPEC.md`] | frontend type/static + API route unit | `pnpm --filter @mockup-ai/web type-check` plus targeted `rg` checks. [VERIFIED: no frontend test framework] | ❌ Wave 0 for frontend static checks |
| PROV-04 | Regenerate replays provider/model/input paths/options and allows OpenAI two-candidate fresh request. [VERIFIED: `10-CONTEXT.md`] | service unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts` | ✅ extend existing |
| OED-01 | OpenAI partial edit uses selected result image, returns one output, creates new result, stores metadata. [VERIFIED: `10-CONTEXT.md`] | route/service unit | `pnpm --filter @mockup-ai/api test -- src/routes/__tests__/edit.routes.test.ts src/services/__tests__/openai-image.service.test.ts` | ❌ add `edit.routes.test.ts`; ✅ extend OpenAI service test |
| OED-02 | OpenAI style-copy supports IP-change and new-product targets with linkage-first/fallback behavior and two candidates. [VERIFIED: `10-CONTEXT.md`] | service + worker-adjacent unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts` | ✅ extend existing; ❌ worker unit gap |
| OED-03 | Gemini/OpenAI follow-ups never mix `thoughtSignature` and OpenAI linkage. [VERIFIED: `10-CONTEXT.md`] | service/worker unit + static grep | `pnpm --filter @mockup-ai/api test && rg "thoughtSignature" apps/api/src/worker.ts` | ✅ extend existing; ❌ explicit OpenAI isolation tests missing |

### Sampling Rate

- **Per task commit:** `pnpm --filter @mockup-ai/api test` for backend changes or `pnpm --filter @mockup-ai/web type-check` for frontend-only changes. [VERIFIED: commands passed]
- **Per wave merge:** `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`. [VERIFIED: commands passed]
- **Phase gate:** Full suite green plus manual/live OpenAI smoke if active DB OpenAI key is available. [VERIFIED: `mockup-openai-cli-smoke` guidance]

### Wave 0 Gaps

- [ ] `apps/api/src/routes/__tests__/edit.routes.test.ts` — covers OED-01 Gemini preservation plus OpenAI partial edit routing. [VERIFIED: file absent]
- [ ] Worker provider-continuation tests or extracted worker helper tests — covers OED-02/OED-03 style-copy provider isolation. [VERIFIED: current worker has no direct test file]
- [ ] Frontend static/interaction checks for result page and style-copy page — no frontend test runner is configured, so planner should use type-check plus targeted `rg` and manual browser verification. [VERIFIED: no web test files/config detected]
- [ ] OpenAI style-copy smoke artifact — use CLI/Node smoke only when an active OpenAI provider key exists. [VERIFIED: `mockup-openai-cli-smoke`, environment audit]

**Current verification baseline:** `pnpm --filter @mockup-ai/api test` passed 9 files / 112 tests, and both API and web type-check passed on 2026-04-28. [VERIFIED: shell]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Keep `fastify.authenticate` on edit/generation routes. [VERIFIED: `edit.routes.ts:21`, `generation.routes.ts:188`] |
| V3 Session Management | limited | Existing JWT/Zustand token flow is unchanged; do not add token-in-query continuation APIs. [VERIFIED: codebase architecture, `CONCERNS.md`] |
| V4 Access Control | yes | `generationService.getById(user.id, id)` and storage path prefix validation must gate source generation and target uploads. [VERIFIED: `generation.service.ts`, `upload.service.test.ts`] |
| V5 Input Validation | yes | Use Zod route schemas and service validation for `copyTarget`, image paths, prompt length, output count, provider/model. [VERIFIED: `generation.routes.ts`, `edit.routes.ts`] |
| V6 Cryptography | yes, existing | Do not change encrypted DB API key storage; load provider keys via `adminService.getActiveApiKey(provider)`. [VERIFIED: Phase 7 state, `worker.ts:91`, `edit.routes.ts:65`] |

### Known Threat Patterns For This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Provider confusion causing wrong vendor execution | Tampering / Elevation of privilege | Persisted provider/model source-of-truth plus queue-vs-DB guard. [VERIFIED: `worker.ts:79`] |
| Cross-user file path reuse in style-copy target uploads | Information disclosure / Tampering | Validate paths through `assertStoragePathWithinPrefixes` before creating jobs. [VERIFIED: `generation.service.ts:67`, `upload.service.test.ts`] |
| Prompt injection causing unintended broad edit | Tampering | Wrap user prompt inside strict `Must change`/`Must preserve`/`Hard constraints`; do not let instructions override core invariants. [VERIFIED: prompt skill refs] |
| Raw OpenAI trace or key leakage | Information disclosure | Store safe IDs in dedicated fields/trace; never expose raw keys, uploaded bytes/base64, or raw vendor bodies in product UI. [VERIFIED: `07-CONTEXT.md`, `OPENAI-SKILL-GUARDRAILS.md`] |
| Sensitive/deceptive image edits | Spoofing / Abuse | Preserve existing safety boundaries and avoid prompts that enable deceptive real-person imagery; OpenAI Images 2.0 system card highlights heightened realism risk. [CITED: https://deploymentsafety.openai.com/chatgpt-images-2-0] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/10-provider-aware-result-continuation/10-CONTEXT.md` — locked implementation decisions and scope. [VERIFIED: local file]
- `.planning/phases/10-provider-aware-result-continuation/10-UI-SPEC.md` — UI route, copy, layout, accessibility, and raw metadata boundaries. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/OPENAI-SKILL-GUARDRAILS.md` — requirement IDs, prior decisions, phase scope, skill rules. [VERIFIED: local files]
- `.codex/skills/mockup-openai-dual-provider/*`, `.codex/skills/mockup-openai-workflows/*`, `.codex/skills/mockup-openai-image-runtime/*`, `.codex/skills/mockup-precision-edit/*`, `.codex/skills/mockup-openai-cli-smoke/*` — required project skill contracts and prompt/runtime rules. [VERIFIED: local files]
- Codebase files under `apps/api`, `apps/web`, and `packages/shared` cited above. [VERIFIED: codebase grep and file reads]
- OpenAI official docs: `https://developers.openai.com/api/docs/models/gpt-image-2`, `https://developers.openai.com/api/docs/guides/image-generation`, `https://developers.openai.com/api/docs/guides/tools-image-generation`. [CITED: official OpenAI docs]
- OpenAI Node SDK README: `https://github.com/openai/openai-node`. [CITED: official GitHub]

### Secondary (MEDIUM confidence)

- NPM registry package version checks for installed/recommended packages. [VERIFIED: npm registry]
- Environment probes for Node, pnpm, Docker, `.env` key presence, and missing running local DB/Redis containers. [VERIFIED: shell]

### Tertiary (LOW confidence)

- Account-level access to `gpt-5.5` for Responses image tool is not verified; official docs support it, but active account access can still vary. [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package files and npm registry were checked; no new dependency is required. [VERIFIED: package files, npm registry]
- Architecture: HIGH — codebase already contains provider schema, queue fields, OpenAI runtime, result/history pages, and explicit continuation blockers. [VERIFIED: codebase grep]
- OpenAI endpoint choice: MEDIUM-HIGH — Image API and Responses guidance is official, but style-copy linkage needs live smoke against the active account. [CITED: OpenAI docs; VERIFIED: local skills]
- Pitfalls: HIGH — pitfalls map directly to current code blockers and prior locked decisions. [VERIFIED: codebase grep, phase contexts]

**Research date:** 2026-04-28  
**Valid until:** 2026-05-05 for OpenAI API details; 2026-05-28 for local architecture findings unless Phase 10 implementation changes the codebase. [ASSUMED]

## RESEARCH COMPLETE
