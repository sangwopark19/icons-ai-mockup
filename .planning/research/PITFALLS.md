# Domain Pitfalls

**Domain:** Existing Gemini-based mockup product adding OpenAI GPT Image 2 as a second provider  
**Researched:** 2026-04-23  
**Confidence:** HIGH

## Current Repo Signals

- `apps/api/src/worker.ts` is hard-wired to `geminiService` and branches only on `mode`, not `provider`.
- `apps/api/prisma/schema.prisma` stores `Generation.mode` and a provider-agnostic `ApiKey`, but no `provider`, `model`, or OpenAI request metadata.
- `apps/api/src/routes/edit.routes.ts` always calls `geminiService.generateEdit(...)`.
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` routes `edit`, `regenerate`, and `style copy` only by `mode`.
- `apps/web/src/app/projects/[id]/history/page.tsx` and admin key UI show no provider badge or provider-specific controls.

This repo’s main risk is not “adding one more SDK.” It is letting existing Gemini assumptions leak through schema, queue, admin key management, and follow-up UX.

## Critical Pitfalls

### Pitfall 1: Adding OpenAI Without a First-Class `provider` Dimension

**What goes wrong:**  
OpenAI jobs enter a system that only understands `mode`. The worker, history API, result page, regenerate flow, and admin tooling cannot reliably tell whether a generation came from Gemini or OpenAI.

**Why it happens:**  
Today `Generation`, `GenerationJobData`, and API responses all center on `mode` (`ip_change`, `sketch_to_real`). That was fine when Gemini was the only runtime. It becomes a structural bug the moment two providers share the same product surface.

**Consequences:**  
- OpenAI jobs can be routed into Gemini-only code paths.
- History and result pages cannot preserve provider identity.
- Follow-up actions become nondeterministic.
- Debugging and support become guesswork.

**Prevention:**  
- Add `provider` and `model` everywhere before adding new UI entry points:
  - request payloads
  - queue payloads
  - `Generation`
  - history/detail responses
  - admin generation views
- Make worker dispatch `provider -> service` first, then `mode -> method`.
- Treat `provider` as required, not inferred.

**Detection:**  
- A completed generation record exists with no `provider` or `model`.
- Worker code still imports only `geminiService`.
- History cards cannot answer “Gemini or OpenAI?”

**Roadmap handling:**  
Phase 1: schema and API contract foundation. Do this before any OpenAI menu is exposed.

### Pitfall 2: Reusing One Global “Active API Key” Across Both Providers

**What goes wrong:**  
Activating an OpenAI key deactivates Gemini, or vice versa. A job asks for “the active key” and gets a valid key for the wrong provider.

**Why it happens:**  
Current `ApiKey` has no `provider`. `activateApiKey()` deactivates all rows globally, and `getActiveApiKey()` returns exactly one decrypted key with a Gemini-specific error message.

**Consequences:**  
- Gemini jobs can break when OpenAI is activated.
- OpenAI jobs can fetch a Gemini key and fail at runtime.
- Admin UI cannot safely rotate keys per provider.
- Dashboard KPI becomes misleading because it implies a single runtime.

**Prevention:**  
- Add `ApiKey.provider`.
- Enforce one active key per provider, not one active key globally.
- Replace `getActiveApiKey()` with `getActiveApiKey(provider)`.
- Split admin screens by provider tab or filter.
- Show active key alias and usage per provider.

**Detection:**  
- Activating one key flips `isActive` on every row.
- Error text still says `Gemini API 키가 설정되지 않았습니다` on OpenAI paths.
- Dashboard has only one “active key” slot.

**Roadmap handling:**  
Phase 2: admin/provider control plane before OpenAI runtime wiring.

### Pitfall 3: Follow-Up Actions Drift Back to Gemini

**What goes wrong:**  
A user creates an image with OpenAI, then clicks `부분 수정`, `동일 조건 재생성`, or `스타일 복사`. The follow-up flow silently runs on Gemini because the repo currently routes follow-ups by `mode`, not by originating provider.

**Why it happens:**  
- `edit.routes.ts` always uses `geminiService`.
- `generationService.regenerate()` and `copyStyle()` preserve `mode` only.
- The result page routes `handleModifyConditions()` and `handleStyleCopy()` to provider-agnostic pages.
- History responses return no provider metadata.

**Consequences:**  
- Same-user same-screen workflows produce different engines unexpectedly.
- Style continuity breaks.
- Users believe OpenAI is “inconsistent” when the system actually switched providers.
- Support cannot reproduce bugs from history alone.

**Prevention:**  
- Persist provider on every generation.
- Default every downstream action to the source generation’s provider.
- Carry provider through detail/history APIs and UI state.
- If a cross-provider follow-up is not supported, block it explicitly instead of silently falling back.

**Detection:**  
- OpenAI-generated result page triggers Gemini edit/regenerate.
- Style copy from an OpenAI result jumps to the current Gemini page without warning.
- Result/history payloads lack provider info.

**Roadmap handling:**  
Phase 3: result page, history, regenerate, edit, and style-copy parity.

### Pitfall 4: Assuming `transparentBackground` Works Natively on `gpt-image-2`

**What goes wrong:**  
The UI offers the same transparency checkbox for both providers, but OpenAI’s model does not natively support transparent backgrounds. Requests either fail or return opaque images while the product implies parity.

**Why it happens:**  
The current product already exposes `transparentBackground` in UI and stores it in `options`. Gemini prompt-building also treats it as a direct generation instruction. OpenAI’s current image docs explicitly state that `gpt-image-2` does not support transparent backgrounds.

**Consequences:**  
- Broken parity between Gemini and OpenAI.
- User trust drops because the same checkbox means different things.
- Saved metadata like `hasTransparency` becomes wrong if not post-processed.

**Prevention:**  
- Keep the checkbox for UX parity, but implement OpenAI as:
  1. generate opaque image
  2. run downstream background removal
  3. persist actual transparency metadata
- Do not send unsupported transparent-background options to OpenAI and hope for graceful handling.
- Adjust UI copy to reflect implementation if needed.

**Detection:**  
- OpenAI path errors when transparency is enabled.
- Generated PNG is opaque even though the option was selected.
- `hasTransparency` remains `false` for supposed transparent outputs.

**Roadmap handling:**  
Phase 4: OpenAI runtime plus post-processing.

### Pitfall 5: Porting Gemini `thoughtSignature` Lineage Into OpenAI

**What goes wrong:**  
OpenAI style-copy and follow-up generation are implemented using Gemini’s `thoughtSignature` model, or OpenAI generations are forced into `thoughtSignatures` storage even though the provider uses different continuation primitives.

**Why it happens:**  
Current style-copy logic depends on:
- `Generation.thoughtSignatures`
- `buildConversationHistory()`
- `signatureBypass`
- `styleReferenceId` that assumes Gemini-style continuation

OpenAI’s documented continuation model is different: `previous_response_id`, `image_generation_call.id`, and revised prompt tracking.

**Consequences:**  
- OpenAI style-copy and iterative flows either fail outright or degrade silently.
- Cross-provider style references become corrupt.
- Future debugging is impossible because the wrong lineage artifact was stored.

**Prevention:**  
- Keep Gemini lineage and OpenAI lineage separate.
- Add OpenAI-specific fields on `Generation`:
  - `openaiRequestId`
  - `openaiResponseId`
  - `openaiImageCallId`
  - `openaiRevisedPrompt`
- Treat `styleReferenceId` as provider-scoped lineage.
- Do not attempt to reuse Gemini `thoughtSignatures` in OpenAI code.

**Detection:**  
- OpenAI code reads `generation.thoughtSignatures`.
- A style-copy flow requires a Gemini signature even when source generation was OpenAI.
- Cross-provider reference reuse is allowed without explicit conversion logic.

**Roadmap handling:**  
Phase 4: lineage model and provider-specific style-copy implementation.

### Pitfall 6: Using the Wrong OpenAI API Surface for the Current Worker Model

**What goes wrong:**  
The team uses the Responses API for the initial rollout just because it seems more general, or sets `model: "gpt-image-2"` on a Responses call, which is not valid there.

**Why it happens:**  
This repo’s current shape is a single-request, queued worker pipeline. That maps naturally to the Image API for first rollout. OpenAI docs reserve Responses image generation for tool-based flows and require a text-capable mainline `model` such as `gpt-5.4`, not `gpt-image-2`.

**Consequences:**  
- Invalid requests in production.
- Extra implementation complexity for no user benefit.
- Slower rollout because the team debugs API-shape mistakes instead of product logic.

**Prevention:**  
- Use Image API first for the current worker-driven rollout.
- Use Responses API only for genuinely iterative OpenAI-only workflows later.
- If Responses is used, enforce:
  - text-capable top-level `model`
  - persisted `response.id`
  - persisted `image_generation_call.id`

**Detection:**  
- Code contains `responses.create({ model: 'gpt-image-2' ... })`.
- A non-conversational worker job is implemented on Responses by default.
- Runtime design cannot explain why Responses is needed for the first milestone.

**Roadmap handling:**  
Phase 4: runtime implementation decision. Lock this before coding service adapters.

### Pitfall 7: Shipping OpenAI Without Request IDs, Revised Prompts, and Model Metadata

**What goes wrong:**  
OpenAI produces an unexpected output, rate-limits, or safety denial, but the repo stores only generic status/error text. There is no request ID, no revised prompt, and no model snapshot to debug against.

**Why it happens:**  
Current generation persistence was designed around Gemini. It does not store provider-debug metadata, and current admin/history views do not expose it. OpenAI’s SDK and docs provide `_request_id`, `.withResponse()`, and `revised_prompt`, but these are easy to omit in a “just make it work” rollout.

**Consequences:**  
- Support cannot escalate vendor issues.
- Output drift cannot be explained to users.
- Rate limit and safety incidents look like random failures.
- You lose the main debugging benefits OpenAI already exposes.

**Prevention:**  
- Persist at least:
  - `provider`
  - `model`
  - `_request_id`
  - `response.id` where applicable
  - `image_generation_call.id` where applicable
  - `revised_prompt` where available
- Surface provider/model/request ID in admin generation detail.
- Log request IDs on both success and failure paths.

**Detection:**  
- An OpenAI failure log has no request ID.
- Admin generation detail cannot show which model/version produced the output.
- Support cannot answer “what prompt revision did the provider actually use?”

**Roadmap handling:**  
Phase 5: observability and admin diagnostics, but the schema fields must exist earlier.

## Moderate Pitfalls

### Pitfall 1: Retry and Timeout Multiplication Causes Queue Starvation and Cost Spikes

**What goes wrong:**  
One failing OpenAI job consumes multiple SDK retries, then BullMQ retries the whole job again. With default SDK timeout at 10 minutes and current queue attempts at 3, a single bad request can monopolize the worker and multiply spend.

**Why it happens:**  
This repo already has BullMQ retries. The OpenAI Node SDK also retries certain failures by default and allows very long default timeouts.

**Prevention:**  
- Set explicit OpenAI `timeout`.
- Reduce or disable SDK retries when BullMQ already retries.
- Make retry policy provider-specific.
- Separate retryable errors from permanent request-shape errors.

**Roadmap handling:**  
Phase 5: runtime hardening and ops safety.

### Pitfall 2: OpenAI Cost and Latency Are Underestimated

**What goes wrong:**  
The team assumes OpenAI cost roughly matches Gemini behavior, but `gpt-image-2` always processes image inputs at high fidelity, and reference-image workflows increase input image token cost. Current product defaults also aim for two outputs, which can multiply spend fast.

**Why it happens:**  
Current UX already expects multiple outputs. Current Gemini service hardcodes two generation loops. IP change and style-copy flows also involve multiple reference images by design.

**Prevention:**  
- Launch OpenAI with conservative defaults.
- Budget per-provider separately.
- Add provider-specific metrics, not only call counts.
- Re-evaluate whether OpenAI should ship with `outputCount` parity immediately.

**Roadmap handling:**  
Phase 5: cost controls, quotas, and provider-specific SLOs.

### Pitfall 3: Upload and MIME Assumptions Break on OpenAI Paths

**What goes wrong:**  
Users upload JPG or WEBP, but the generation pipeline labels inputs as `image/png` or otherwise assumes PNG semantics. Gemini may tolerate this. OpenAI edit/reference flows can be less forgiving, especially when masks and multipart uploads enter the picture.

**Why it happens:**  
Uploads already accept `image/jpeg`, `image/png`, and `image/webp`, but current runtime code hardcodes `image/png` when building upstream requests.

**Prevention:**  
- Persist actual upload MIME and format.
- Use real MIME when sending to provider APIs.
- If OpenAI uses file uploads, preserve original format or normalize intentionally in one place.
- Validate transparency and mask format from actual file metadata, not assumptions.

**Roadmap handling:**  
Phase 4: input pipeline and OpenAI request construction.

### Pitfall 4: UI and Admin Surfaces Hide Provider Identity

**What goes wrong:**  
The product ships dual-provider generation, but project menus, history cards, result views, and admin key screens still look single-provider. Users and operators cannot tell what they are using.

**Why it happens:**  
Current UI was built for one provider, so all surface area is “mode-first.” Provider does not exist in response contracts yet.

**Prevention:**  
- Add adjacent OpenAI entry points, not hidden switches.
- Add badges in history and result pages.
- Split admin API key management and dashboard metrics by provider.

**Roadmap handling:**  
Phase 3 for user-facing parity, Phase 5 for admin observability.

## Minor Pitfalls

### Pitfall 1: Promising Precise Partial Edit Parity Without Mask Support

**What goes wrong:**  
The UI implies “부분 수정” parity, but OpenAI’s surgical mask-based edit path has extra input requirements: mask must match image size/format and include an alpha channel. The current edit UI does not capture any mask at all.

**Prevention:**  
- Scope initial OpenAI edit as prompt-only whole-image edit, or
- explicitly plan a later mask UI and backend validation phase
- avoid shipping copy that implies pixel-precise selective edit before mask support exists

### Pitfall 2: Gemini-Specific Copy and Errors Leak Into OpenAI UX

**What goes wrong:**  
Users and admins see Gemini-specific error strings, labels, or metrics while operating OpenAI features. It makes the rollout look half-migrated even if runtime works.

**Prevention:**  
- Replace provider-specific strings in shared paths.
- Make provider explicit in error messages, admin labels, and support screens.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema and API contracts | Adding OpenAI pages before `provider` and `model` exist in DB/API | Add provider/model/OpenAI metadata fields first; worker and history must consume them |
| Admin key management | One global active key breaks both runtimes | Provider-scope keys and activation rules before any OpenAI traffic |
| OpenAI runtime | Wrong API surface, unsupported transparent background, missing request IDs | Use Image API first, post-process background removal, persist request metadata |
| Follow-up flows | OpenAI result actions silently fall back to Gemini | Route `edit`, `regenerate`, `copy-style` by originating provider |
| Cost and reliability | SDK retries + BullMQ retries + high-fidelity inputs multiply cost | Explicit timeout/retry policy and conservative output defaults |
| UI rollout | Users cannot tell which provider produced a result | Add provider badges and adjacent menu entries, not hidden switches |

## Sources

### Repo evidence

- `apps/api/prisma/schema.prisma`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/services/gemini.service.ts`
- `apps/api/src/services/generation.service.ts`
- `apps/api/src/services/admin.service.ts`
- `apps/api/src/services/upload.service.ts`
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/edit.routes.ts`
- `apps/api/src/routes/upload.routes.ts`
- `apps/api/src/worker.ts`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/app/projects/[id]/ip-change/page.tsx`
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx`
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- `apps/web/src/app/projects/[id]/history/page.tsx`
- `apps/web/src/app/admin/api-keys/page.tsx`
- `.codex/skills/mockup-openai-dual-provider/references/project-rollout.md`
- `.codex/skills/mockup-openai-dual-provider/references/official-source-map.md`
- `.codex/skills/mockup-openai-cli-smoke/references/official-cli-notes.md`

### Official sources

- OpenAI GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- OpenAI image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- OpenAI Node SDK: https://github.com/openai/openai-node
- OpenAI system card for image safety context: https://deploymentsafety.openai.com/chatgpt-images-2-0

