---
phase: 07-provider-foundation-and-key-separation
plan: 02
subsystem: api
tags: [fastify, prisma, api-keys, provider-routing, vitest]

requires:
  - phase: 07-01-provider-foundation-contracts
    provides: Provider enum and ApiKey.provider schema field
provides:
  - Provider-scoped admin API key service methods
  - Provider-validating admin key routes
  - Provider-isolation regression tests for active key behavior
  - Provider-scoped active key dashboard stats
affects: [07-03-admin-provider-ui, 07-04-worker-routing, phase-08-openai-runtime]

tech-stack:
  added: []
  patterns:
    - Admin key operations accept explicit provider and constrain every Prisma lookup by provider
    - Activation deactivates only the selected provider lane

key-files:
  created:
    - .planning/phases/07-provider-foundation-and-key-separation/07-02-SUMMARY.md
  modified:
    - apps/api/src/services/admin.service.ts
    - apps/api/src/routes/admin/api-keys.routes.ts
    - apps/api/src/services/__tests__/admin.service.test.ts

key-decisions:
  - "Gemini remains the default provider for existing internal callers until worker/edit paths are fully provider-aware in 07-04."
  - "Admin routes require explicit provider input so UI/API key management cannot accidentally operate on the wrong provider lane."

patterns-established:
  - "Use provider-scoped where clauses for all ApiKey reads, deletes, activation updates, active-key reads, and call-count increments."
  - "Expose dashboard active key state as activeApiKeysByProvider.gemini and activeApiKeysByProvider.openai."

requirements-completed:
  - OPS-01

duration: 11 min
completed: 2026-04-24
---

# Phase 07 Plan 02: Provider-Scoped Admin Keys Summary

**Admin API key management now separates Gemini and OpenAI key lanes across service logic, routes, and regression tests.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-24T02:15:00Z
- **Completed:** 2026-04-24T02:26:30Z
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments

- Refactored admin key service methods so list/create/delete/activate/active-key/call-count operations are provider-scoped.
- Replaced singular dashboard active key state with `activeApiKeysByProvider` for independent Gemini/OpenAI visibility.
- Updated admin key routes so GET/POST/DELETE/PATCH validate and pass `provider: 'gemini' | 'openai'`.
- Expanded Vitest coverage to prove provider-filtered listing, provider-specific creation/deletion, independent activation, provider-specific missing-key messages, and provider-scoped call counts.

## Task Commits

1. **Task 1: Make admin service methods and dashboard stats provider-scoped** - `65db9dd` (feat)
2. **Task 2: Require provider in admin key routes and add provider-isolation tests** - `af1e63e` (test)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/api/src/services/admin.service.ts` - Added provider-scoped API key operations and `activeApiKeysByProvider`.
- `apps/api/src/routes/admin/api-keys.routes.ts` - Added `ProviderSchema` and provider validation for all admin key handlers.
- `apps/api/src/services/__tests__/admin.service.test.ts` - Added provider isolation tests and updated legacy key assertions for provider-aware behavior.

## Decisions Made

- Kept Gemini defaults for internal backend callers that are still Gemini-only until 07-04 updates worker and edit routing.
- Required provider at the admin route boundary so admin UI calls must choose a provider lane explicitly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Preserved existing Gemini worker/edit callers during provider service refactor**
- **Found during:** Task 1 (Make admin service methods and dashboard stats provider-scoped)
- **Issue:** Existing worker and edit paths still call `getActiveApiKey()` and `incrementCallCount(id)` without provider until 07-04.
- **Fix:** Added Gemini-default overloads for internal service compatibility while enforcing explicit provider in admin routes.
- **Files modified:** `apps/api/src/services/admin.service.ts`
- **Verification:** `pnpm --filter @mockup-ai/api type-check`
- **Committed in:** `65db9dd`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The backend route contract is provider-required, while existing Gemini runtime paths remain stable until their planned 07-04 provider-aware refactor.

## Issues Encountered

- Initial provider-isolation tests needed updates from legacy `findUnique/delete/update` mocks to provider-scoped `findFirst/deleteMany/updateMany` behavior. The final targeted suite passes.

## Verification

- `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` - PASS, 50 tests
- `pnpm --filter @mockup-ai/api type-check` - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 07-03 admin web work. Backend routes now require provider on every admin key operation, and dashboard stats expose provider-scoped active key data for the UI to render as separate Gemini/OpenAI lanes.

## Self-Check: PASSED

- SUMMARY file exists.
- Key modified files exist.
- Task commits `65db9dd` and `af1e63e` exist in git history.
- Targeted Vitest suite and API type-check pass.

---
*Phase: 07-provider-foundation-and-key-separation*
*Completed: 2026-04-24*
