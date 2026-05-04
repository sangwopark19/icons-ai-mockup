---
phase: 07-provider-foundation-and-key-separation
plan: 04
subsystem: runtime-monitoring
tags: [worker, fastify, admin-monitoring, provider-routing, support-metadata]

requires:
  - phase: 07-01-provider-contracts
    provides: Generation provider/providerModel persistence and queue payload contracts
  - phase: 07-02-provider-scoped-admin-keys
    provides: Provider-scoped active key lookup and call-count updates
  - phase: 07-03-provider-aware-admin-web
    provides: AdminGeneration provider metadata client contracts
provides:
  - Provider lineage validation in generation worker jobs
  - Explicit OpenAI runtime unsupported guard before Gemini dispatch
  - Provider-scoped edit route key lookup and cloned edit metadata
  - Safe provider/model/OpenAI support metadata on admin generation payloads
  - Provider/model/support metadata display in generation monitoring UI
affects: [phase-08-openai-provider-entry, admin-content-monitoring, generation-worker]

tech-stack:
  added: []
  patterns:
    - Worker trusts persisted generation provider as source of truth and validates queue provider before execution
    - Admin monitoring exposes safe support identifiers without leaking providerTrace
    - Provider metadata is visible in operational tables and collapsible detail support panels

key-files:
  created:
    - .planning/phases/07-provider-foundation-and-key-separation/07-04-SUMMARY.md
  modified:
    - apps/api/src/worker.ts
    - apps/api/src/routes/edit.routes.ts
    - apps/api/src/services/admin.service.ts
    - apps/web/src/components/admin/generation-table.tsx
    - apps/web/src/components/admin/generation-detail-modal.tsx

key-decisions:
  - "The worker rejects jobs when the queue provider does not match the persisted generation provider."
  - "OpenAI jobs fail with an explicit unsupported-runtime error until Phase 08 adds the image runtime."
  - "Admin monitoring surfaces OpenAI request/response/image call IDs and revised prompt, but never providerTrace."

patterns-established:
  - "Use `getActiveApiKey(provider)` and `incrementCallCount(provider, keyId)` on runtime paths."
  - "Use provider/model badges in generation monitoring rows and a collapsed support panel for low-frequency troubleshooting metadata."

requirements-completed:
  - OPS-01
  - OPS-02

duration: 7 min
completed: 2026-04-24
---

# Phase 07 Plan 04: Provider-Aware Worker and Monitoring Summary

**Worker execution, edit routes, and generation monitoring now preserve provider lineage and expose safe support metadata.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-24T02:34:00Z
- **Completed:** 2026-04-24T02:41:00Z
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments

- Updated the generation worker to load the persisted generation before dispatch, validate queue provider lineage, and route active key lookup/call counts by provider.
- Added an explicit OpenAI unsupported-runtime guard so Phase 08 can attach the OpenAI image runtime without hidden Gemini fallback behavior.
- Updated partial edit creation to reject non-Gemini generations and copy the original generation provider/providerModel onto edited generations.
- Extended admin generation list payloads with provider/model and safe OpenAI support identifiers.
- Added Provider/model columns to the generation monitoring table and a collapsed `지원 정보` panel with copy actions in the detail modal.

## Task Commits

1. **Task 1: Validate provider lineage and provider-scoped key usage in runtime paths** - `7c73309` (feat)
2. **Task 2: Expose safe provider metadata in admin generation monitoring payloads** - `45ac42a` (feat)
3. **Task 3: Render provider support metadata in admin monitoring UI** - `bc4fc67` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/api/src/worker.ts` - Validates queue/provider lineage and rejects OpenAI jobs until runtime support lands.
- `apps/api/src/routes/edit.routes.ts` - Restricts partial edit to Gemini generations and preserves provider metadata on cloned edit records.
- `apps/api/src/services/admin.service.ts` - Adds provider/model/OpenAI support identifiers to admin generation payloads.
- `apps/web/src/components/admin/generation-table.tsx` - Adds provider badge/model display to generation monitoring rows.
- `apps/web/src/components/admin/generation-detail-modal.tsx` - Adds provider/model metadata and collapsed support details with copy buttons.

## Decisions Made

- Failed OpenAI runtime attempts use an explicit product-facing error instead of falling through to Gemini code paths.
- `providerTrace` remains backend-only and is not exposed through admin monitoring payloads.
- Support identifiers are hidden behind a collapsed panel to keep the generation detail modal readable for normal monitoring work.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Browser smoke required mocked admin generation data because the API server was not running on `localhost:4000`. The mocked payload included OpenAI support metadata and verified the rendered admin workflow.

## Verification

- `pnpm --filter @mockup-ai/api type-check` - PASS
- `pnpm --filter @mockup-ai/web type-check` - PASS
- `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` - PASS (50 tests)
- Browser smoke `/admin/content` on `http://localhost:3002` with mocked OpenAI generation - PASS; Provider/model displayed in table and support metadata displayed in the detail modal.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 08 OpenAI provider entry. Phase 07 now provides provider-scoped keys, persisted generation lineage, queue payload contracts, explicit OpenAI runtime guardrails, and admin support metadata.

## Self-Check: PASSED

- SUMMARY file exists.
- Key modified files exist.
- Task commits `7c73309`, `45ac42a`, and `bc4fc67` exist in git history.
- API type-check, web type-check, admin service tests, and browser smoke checks pass.

---
*Phase: 07-provider-foundation-and-key-separation*
*Completed: 2026-04-24*
