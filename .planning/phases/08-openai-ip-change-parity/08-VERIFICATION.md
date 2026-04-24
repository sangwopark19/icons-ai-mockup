---
phase: 08-openai-ip-change-parity
verified: 2026-04-24
status: human_needed
score: 4/4 must-haves verified
requirements:
  - PROV-01
  - OIP-01
  - OIP-02
  - OIP-03
overrides_applied: 0
gaps: []
human_verification:
  - test: Real OpenAI GPT Image 2 IP Change smoke
    expected: Live `gpt-image-2` edit request returns two usable candidates, captures request IDs, and sends no `background: "transparent"` or `input_fidelity`.
    why_human: Requires `OPENAI_API_KEY` and representative source/character sample images.
  - test: Authenticated browser runtime walkthrough
    expected: Project, v2 form, result, and history screens work at desktop/mobile widths, with v1/v2 labels only and no provider/model names visible.
    why_human: Requires authenticated runtime data and visual/browser interaction.
---

# Phase 8: OpenAI IP Change Parity Verification Report

**Phase Goal:** OpenAI GPT Image 2 IP Change v2 parity while preserving Gemini/v1 behavior and hiding provider/model details from product UI.
**Verified:** 2026-04-24
**Status:** human_needed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Users can enter OpenAI IP Change v2 from the same project context as Gemini/v1. | VERIFIED | `apps/web/src/app/projects/[id]/page.tsx` renders `IP 변경 v1`, `IP 변경 v2`, keeps `/ip-change`, and links v2 to `/ip-change/openai`. |
| 2 | OpenAI IP Change creates two candidates and carries structure/viewpoint/background/hardware/quality options. | VERIFIED | `openai-image.service.ts` calls `client.images.edit()` twice with `model: 'gpt-image-2'`, returns two buffers, uses strict `Must change`/`Must preserve` prompt sections, and tests assert no `background` or `input_fidelity`. |
| 3 | v2 outputs can be selected, saved, reopened from history, and downloaded through existing lifecycle. | VERIFIED | Result page uses `/select`, `/save`, authenticated blob download, v2 candidate labels, disabled unsupported follow-ups, and history links back to `/generations/:id` with v1/v2 badges. |
| 4 | Gemini/v1 behavior remains available and product UI hides provider/model details. | VERIFIED | v1 form still submits `mode: 'ip_change'` without OpenAI provider/model fields; worker keeps Gemini branches; product screens show v1/v2 labels while raw provider/model strings remain internal payload/type values. |

**Score:** 4/4 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `apps/api/src/services/openai-image.service.ts` | Parallel OpenAI IP Change runtime | VERIFIED | Dedicated service, `gpt-image-2`, two edit calls, request/support metadata, MIME detection fix from review. |
| `apps/api/src/worker.ts` | Provider-gated dispatch | VERIFIED | Validates queued vs persisted provider/model, allows only OpenAI `ip_change`, blocks other OpenAI modes. |
| `apps/api/src/services/generation.service.ts` | Provider/model, quality, metadata, save lifecycle | VERIFIED | Persists/enqueues quality, validates provider model, stores OpenAI metadata, blocks OpenAI style-copy enqueue. |
| `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` | v2 form | VERIFIED | v2 defaults, two-image requirement, quality radio labels, hidden OpenAI payload, `outputCount: 2`. |
| `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` | v2 result lifecycle | VERIFIED | v2 loading/failure/completed UI, candidate selection, save/download guard, disabled follow-ups, v2 condition route. |
| `apps/web/src/app/projects/[id]/history/page.tsx` | v1/v2 history reopen | VERIFIED | Provider-derived v1/v2 badges and unchanged generation detail link. |
| `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` | Release smoke checklist | VERIFIED | Automated, browser, real OpenAI smoke, and evidence sections exist. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| v2 form | `POST /api/generations` | `apiFetch` create body | WIRED | Sends `provider: 'openai'`, `providerModel: 'gpt-image-2'`, `mode: 'ip_change'`, `outputCount: 2`, and `quality`. |
| Generation API | `GenerationService.create()` | route handler | WIRED | API schema accepts provider/model/quality and returns provider metadata. |
| GenerationService | BullMQ queue | `addGenerationJob` | WIRED | Queue payload includes provider, providerModel, paths, options, and quality. |
| Worker | OpenAI image service | `openaiImageService.generateIPChange` | WIRED | OpenAI `ip_change` dispatch uses active OpenAI key and source/character base64. |
| Worker | storage/history | `saveGeneratedImage` and `updateOpenAIMetadata` | WIRED | Candidate buffers are saved, metadata persisted, status set completed. |
| Result/history pages | existing lifecycle APIs | `/select`, `/save`, `/download`, `/history` | WIRED | Existing endpoints are reused for v2 outputs. |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| v2 form | `sourceImagePath`, `characterImagePath`, `quality`, options | Upload endpoints plus local form state | Yes | FLOWING |
| OpenAI service | `images`, `requestIds`, metadata | `client.images.edit()` response | Yes when live API succeeds; mocked tests cover extraction | FLOWING, live smoke pending |
| Result page | `generation.images`, `generation.provider` | `GET /api/generations/:id` | Yes | FLOWING |
| History page | `history`, `selectedImage`, `provider` | `GET /api/generations/project/:projectId/history` | Yes | FLOWING |

### Automated Checks

| Command | Result |
|---|---|
| `pnpm --filter @mockup-ai/api test` | PASS, 82 tests |
| `pnpm --filter @mockup-ai/api type-check` | PASS |
| `pnpm --filter @mockup-ai/web type-check` | PASS |
| `pnpm type-check` | PASS, 3 packages successful |
| `pnpm --filter @mockup-ai/api db:generate` | PASS, Prisma Client generated |
| `git diff -- apps/api/prisma` | PASS, empty diff |

### Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| PROV-01 | SATISFIED | Project screen exposes v1 and v2 sibling IP Change entries; v1 route remains Gemini-default and v2 route submits OpenAI internally. |
| OIP-01 | SATISFIED, live smoke pending | v2 form creates OpenAI `ip_change` jobs and OpenAI service returns exactly two candidate buffers in tests. |
| OIP-02 | SATISFIED, live smoke pending | v2 request carries preserve structure, fixed viewpoint/background, hardware, shadows, user instructions, and quality; prompt locks product/character invariants and forbidden GPT Image 2 params are omitted. |
| OIP-03 | SATISFIED, browser walkthrough pending | Result/history pages reuse selection, save, reopen, and authenticated download lifecycle with v2 labels. |

### Anti-Patterns Found

No blocking implementation anti-patterns found. Static scan found expected operational `console.log` calls in queue/worker and normal `return null`/empty-array initialization patterns; these do not affect Phase 8 goal achievement.

### Human Verification Required

1. **Real OpenAI GPT Image 2 smoke**
   - Test: Run the Phase 8 `images-edit.sh` smoke with `OPENAI_API_KEY`, one product source image, and one character reference image.
   - Expected: Two usable candidates or two successful service calls, request IDs recorded, no `background: "transparent"` or `input_fidelity` sent.
   - Why human: Credentials and representative images are unavailable in this environment.

2. **Authenticated browser walkthrough**
   - Test: In an authenticated session, open project page, v2 form, result page, and history page at desktop/mobile widths.
   - Expected: v1/v2 entries visible, v2 defaults correct, result has two candidates/save/download/disabled follow-ups, history reopens result, and no product screen visibly shows `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`.
   - Why human: Requires runtime auth, data, viewport, and visual interaction.

### Residual Risks

- Real OpenAI behavior is still unproven without live request IDs and sample outputs.
- Browser UX is statically verified but not runtime-authenticated.
- The transparent-background checkbox is carried through as an option and OpenAI requests stay opaque as required; final transparent-output quality should be manually confirmed if transparency is expected as an end-user deliverable.

### Next Action

Run the two manual verification items above. No implementation gaps requiring code changes were found in automated/source verification.

---

_Verified: 2026-04-24_
_Verifier: Claude (gsd-verifier)_
