---
phase: 08-openai-ip-change-parity
reviewed: 2026-04-27T02:21:19Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - apps/api/package.json
  - apps/api/src/lib/queue.ts
  - apps/api/src/routes/generation.routes.ts
  - apps/api/src/services/__tests__/generation.service.test.ts
  - apps/api/src/services/__tests__/openai-image.service.test.ts
  - apps/api/src/services/generation.service.ts
  - apps/api/src/services/openai-image.service.ts
  - apps/api/src/worker.ts
  - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
  - apps/web/src/app/projects/[id]/history/page.tsx
  - apps/web/src/app/projects/[id]/ip-change/openai/page.tsx
  - apps/web/src/app/projects/[id]/ip-change/page.tsx
  - apps/web/src/app/projects/[id]/page.tsx
  - apps/web/src/lib/api.ts
  - package.json
  - packages/shared/src/types/index.ts
  - scripts/apply-codex-gsd-subagent-patch.mjs
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-27T02:21:19Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the requested phase 08 source scope plus current-PR source files outside the phase summary that affect runtime behavior (`package.json` and `scripts/apply-codex-gsd-subagent-patch.mjs`). Lockfile and planning artifacts were excluded from source review.

The main regressions are that the generation API persists jobs that the worker already knows cannot run, and OpenAI v2 exposes a transparent-background option that is silently ignored. Usage accounting for OpenAI is also undercounted, and the new Codex patch check command can pass despite warnings.

## Critical Issues

### CR-01: [BLOCKER] Generation creation accepts requests that are guaranteed to fail in the worker

**Files:**
- `apps/api/src/routes/generation.routes.ts:8`
- `apps/api/src/services/generation.service.ts:153`
- `apps/api/src/worker.ts:105`
- `apps/api/src/worker.ts:214`

**Issue:** `CreateGenerationSchema` makes `sourceImagePath`, `characterId`, and `characterImagePath` optional for every mode and does not reject `provider: "openai"` with `mode: "sketch_to_real"`. `GenerationService.create` resolves the provider and persists a pending generation before enforcing these mode/provider invariants. The worker later throws for missing IP-change images, missing sketch source images, or unsupported OpenAI non-IP modes. That means invalid authenticated API requests receive `201`, create durable generation records, enqueue jobs, then fail asynchronously instead of returning a synchronous validation error.

**Fix:**
```ts
const CreateGenerationSchema = z
  .object({
    projectId: z.string().uuid(),
    mode: z.enum(['ip_change', 'sketch_to_real']),
    provider: z.enum(['gemini', 'openai']).optional(),
    providerModel: z.string().min(1).optional(),
    sourceImagePath: z.string().optional(),
    characterId: z.string().uuid().optional(),
    characterImagePath: z.string().optional(),
    textureImagePath: z.string().optional(),
    prompt: z.string().max(2000).optional(),
    options: GenerationOptionsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'openai' && value.mode !== 'ip_change') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['provider'],
        message: 'OpenAI provider currently supports only ip_change',
      });
    }

    if (value.mode === 'ip_change' && !value.sourceImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceImagePath'],
        message: 'sourceImagePath is required for ip_change',
      });
    }

    if (value.mode === 'ip_change' && !value.characterId && !value.characterImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['characterImagePath'],
        message: 'characterId or characterImagePath is required for ip_change',
      });
    }

    if (value.mode === 'sketch_to_real' && !value.sourceImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceImagePath'],
        message: 'sourceImagePath is required for sketch_to_real',
      });
    }
  });
```

Add the same defensive checks in `GenerationService.create` before `prisma.generation.create`, so direct service callers cannot bypass route validation.

### CR-02: [BLOCKER] OpenAI v2 transparent-background requests are accepted but always saved as opaque output

**Files:**
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx:112`
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx:267`
- `apps/api/src/worker.ts:116`
- `apps/api/src/services/openai-image.service.ts:178`
- `apps/api/src/services/generation.service.ts:537`

**Issue:** The OpenAI v2 page exposes "투명 배경 (누끼)" and sends `transparentBackground` in the generation options. The worker passes that option into `openaiImageService.generateIPChange`, but the OpenAI prompt explicitly says to generate an opaque image first and there is no downstream background-removal step. The saved `GeneratedImage` is also hard-coded with `hasTransparency: false`. Users can request transparent output and get a completed generation that is always opaque, with metadata claiming no transparency.

**Fix:**
```ts
const result = await openaiImageService.generateIPChange(...);
let outputImages = result.images;
let hasTransparency = false;

if (options.transparentBackground) {
  outputImages = await Promise.all(
    result.images.map((image) => backgroundRemovalService.removeBackground(image))
  );
  hasTransparency = true;
}

generatedImages = outputImages;
```

Thread `hasTransparency` through `saveGeneratedImage`, persist it on `GeneratedImage`, and add a regression test that verifies OpenAI v2 transparent requests run the removal path. If background removal is not available yet, reject or hide the OpenAI transparent option instead of accepting it.

## Warnings

### WR-01: [WARNING] OpenAI API usage is undercounted by 50 percent for each successful v2 generation

**Files:**
- `apps/api/src/worker.ts:115`
- `apps/api/src/services/openai-image.service.ts:67`
- `apps/api/src/services/openai-image.service.ts:79`
- `apps/api/src/services/admin.service.ts:767`

**Issue:** The worker increments the active OpenAI key call count once before `generateIPChange`. That service then loops twice and performs two `client.images.edit` requests to produce two outputs. `AdminService.incrementCallCount` only increments by one, so admin usage/quota data reports one call for two actual OpenAI API calls.

**Fix:** Make the accounting count match the provider calls. For example, add an `amount` parameter to `incrementCallCount` and increment after the OpenAI result returns:

```ts
async incrementCallCount(provider: ApiKeyProvider, id: string, amount = 1): Promise<void> {
  await prisma.apiKey.updateMany({
    where: { id, provider },
    data: {
      callCount: { increment: amount },
      lastUsedAt: new Date(),
    },
  });
}

const result = await openaiImageService.generateIPChange(...);
await adminService.incrementCallCount(provider, activeKeyId, result.providerTrace.calls.length);
```

If failed attempts should also be counted, move the increment into the same per-request boundary that calls `client.images.edit` and make that policy explicit in tests.

### WR-02: [WARNING] `gsd:patch-codex:check` exits successfully when required patch targets are missing

**Files:**
- `package.json:16`
- `scripts/apply-codex-gsd-subagent-patch.mjs:109`
- `scripts/apply-codex-gsd-subagent-patch.mjs:242`
- `scripts/apply-codex-gsd-subagent-patch.mjs:246`

**Issue:** `package.json` exposes `gsd:patch-codex:check` for validation. The script records missing files or missing insertion markers in `warnings`, but in `--check` mode it only sets `process.exitCode = 1` when `changes.length` is non-zero. If a required Codex config or workflow target is missing and no replacement is queued, the command prints warnings and exits 0, so CI or a preflight check can report that the patch is applied even though the script could not verify or apply it.

**Fix:**
```js
if (warnings.length) {
  console.error(`Warnings:\n${warnings.map((w) => `- ${w}`).join('\n')}`);
  if (checkOnly) process.exitCode = 1;
}

if (changes.length) {
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${changes.length} file(s):`);
  for (const file of changes) console.log(`- ${file}`);
  if (checkOnly) process.exitCode = 1;
}
```

Add a small script-level test or fixture run that verifies `--check` fails when a required marker or file is missing.

---

_Reviewed: 2026-04-27T02:21:19Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
