# Project Rollout Plan For Parallel OpenAI Menus

This repo already has a clear Gemini pipeline:

- web entry pages for `ip-change` and `sketch-to-real`
- shared generation API client in `apps/web/src/lib/api.ts`
- API routes in `apps/api/src/routes`
- persisted generation records in Prisma
- BullMQ queue and `apps/api/src/worker.ts`
- Gemini runtime in `apps/api/src/services/gemini.service.ts`

## Recommended rollout shape

### 1. Add provider metadata end to end

Add `provider` and `model` at minimum to:

- request payloads
- queue job payloads
- `Generation`
- admin API key records
- history responses

Recommended OpenAI metadata fields on `Generation`:

- `provider`
- `model`
- `openaiRequestId`
- `openaiResponseId`
- `openaiImageCallId`
- `openaiRevisedPrompt`

### 2. Duplicate the menu surface, not the domain model

Current routes suggest these user entry points:

- `apps/web/src/app/projects/[id]/ip-change/page.tsx`
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx`
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`

Preferred UI shape:

- Keep the current Gemini page/action.
- Add an adjacent OpenAI entry.
- Reuse the same form fields and output viewer where possible.
- Show provider badges in history and result pages.

### 3. Split runtime by provider

Preferred backend structure:

- `gemini.service.ts` stays intact.
- Add `openai-image.service.ts`.
- Worker dispatches by `provider`.
- `generation.service.ts` stays orchestration-focused and provider-neutral.

### 4. Split API keys by provider

Current `ApiKey` model is provider-agnostic but operationally Gemini-specific.

Recommended change:

- Add `provider` column to `ApiKey`.
- Activate one key per provider, not one key globally.
- Admin UI should filter or tab by provider.

### 5. Preserve product parity

Keep these options visible for both providers:

- structure preservation
- transparent background
- hardware preservation
- fixed background
- fixed viewpoint
- shadow removal
- user instructions

Implementation may differ:

- OpenAI transparent background -> generate opaque, then use post-process removal
- Gemini style copy -> `thoughtSignature`
- OpenAI style copy -> response/image IDs and explicit preserve prompts

## Final review checklist

- Gemini routes still call Gemini code paths.
- OpenAI routes never touch Gemini-only state assumptions.
- History cards show provider and model.
- Admin API keys are provider-safe.
- Result pages can perform edit/copy-style/regenerate against the same provider that created the image.
