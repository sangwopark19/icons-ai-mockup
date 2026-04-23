---
phase: 04-api-key-management
plan: 03
subsystem: api
tags: [fastify, admin-routes, gemini-service, worker, api-key, refactor]

# Dependency graph
requires:
  - phase: 04-api-key-management
    provides: "Plan 02: AdminService methods (listApiKeys, createApiKey, deleteApiKey, activateApiKey, getActiveApiKey, incrementCallCount)"
provides:
  - 4 REST endpoints under /api/admin/api-keys for CRUD + activation
  - GeminiService with apiKey as first param on all 4 public methods (stateless singleton)
  - Worker fetches active DB key at job start, passes to GeminiService, increments callCount before each Gemini call
affects:
  - 04-04-PLAN (frontend calls these new REST endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GeminiService is now stateless: no constructor state, each method receives apiKey: string and creates local GoogleGenAI instance"
    - "Worker: single getActiveApiKey() DB call at job start (no caching per CONTEXT.md), incrementCallCount before each Gemini API call"
    - "edit.routes.ts: user-facing edit route also updated to fetch active key before generateEdit call"

key-files:
  created:
    - apps/api/src/routes/admin/api-keys.routes.ts
  modified:
    - apps/api/src/routes/admin/index.routes.ts
    - apps/api/src/services/gemini.service.ts
    - apps/api/src/worker.ts
    - apps/api/src/routes/edit.routes.ts

key-decisions:
  - "GeminiService singleton export preserved (export const geminiService = new GeminiService()) but constructor is now empty — stateless pattern"
  - "edit.routes.ts updated alongside worker.ts — all callers of generateEdit must pass apiKey, no silent fallback possible"
  - "incrementCallCount called before each Gemini API call (not after) — matches Google API usage counting for failed calls too"

patterns-established:
  - "Per-method GoogleGenAI instantiation: each public GeminiService method creates const ai = new GoogleGenAI({ apiKey }) locally"
  - "Worker active key pattern: destructure { id: activeKeyId, key: activeApiKey } from getActiveApiKey() at job start"

requirements-completed: [KEY-01, KEY-02, KEY-03, KEY-04, KEY-05]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 4 Plan 03: API key REST endpoints, GeminiService refactor, and Worker DB-based key integration

**4 REST endpoints for API key CRUD + activation, GeminiService fully refactored to accept apiKey parameter on all 4 public methods, Worker fetches active DB key at job start and increments callCount before each Gemini API call**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-12T10:26:00Z
- **Completed:** 2026-03-12T10:29:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `apps/api/src/routes/admin/api-keys.routes.ts` — 4 endpoints: GET /, POST /, DELETE /:id, PATCH /:id/activate
- Registered apiKeysRoutes under `/api-keys` prefix in `index.routes.ts`
- Refactored `GeminiService`: removed `private readonly ai` field and constructor body; all 4 public methods now accept `apiKey: string` as first param and instantiate `new GoogleGenAI({ apiKey })` locally
- Updated `worker.ts`: imports adminService, fetches `{ id: activeKeyId, key: activeApiKey }` at job start before status update, calls `incrementCallCount(activeKeyId)` before each of the 3 `geminiService.*` calls
- All 62 tests passing, TypeScript compiles clean

## Task Commits

1. **Task 1: Create API key routes and register in admin router** - `36c680f` (feat)
2. **Task 2: Refactor GeminiService and Worker for DB-based key usage** - `edb07b4` (feat)

## Files Created/Modified

- `apps/api/src/routes/admin/api-keys.routes.ts` — 4 REST endpoints with zod validation and consistent error response pattern
- `apps/api/src/routes/admin/index.routes.ts` — added apiKeysRoutes registration under /api-keys
- `apps/api/src/services/gemini.service.ts` — stateless refactor: no constructor state, apiKey param injection on all 4 methods
- `apps/api/src/worker.ts` — adminService import, active key fetch at job start, incrementCallCount before each Gemini call
- `apps/api/src/routes/edit.routes.ts` — auto-fixed: updated to fetch active key before geminiService.generateEdit()

## Decisions Made

- `GeminiService` singleton is preserved but now stateless — callers bear the responsibility of providing the apiKey. No silent env var fallback is possible.
- `incrementCallCount` placed BEFORE each `geminiService.*` call (not after) — matches Google API counting behavior where failed calls still consume quota.
- `edit.routes.ts` updated as part of this plan (deviation Rule 3) — the TypeScript compiler enforced the fix immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] edit.routes.ts called geminiService.generateEdit() with 2 args instead of 3**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `src/routes/edit.routes.ts(55,46): error TS2554: Expected 3 arguments, but got 2` — the user-facing edit route was calling `geminiService.generateEdit(originalBase64, body.prompt)` without the new `apiKey` first argument
- **Fix:** Added `import { adminService }` to edit.routes.ts; fetch `const { key: activeApiKey } = await adminService.getActiveApiKey()` before the generateEdit call; pass `activeApiKey` as first argument
- **Files modified:** apps/api/src/routes/edit.routes.ts
- **Verification:** TypeScript compiles clean; 62 tests still pass
- **Committed in:** edb07b4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Required fix — `generateEdit` is a public method and all callers must be updated. Fix is minimal and correct.

## Issues Encountered

None beyond the auto-fixed TypeScript error above.

## User Setup Required

None — all runtime dependencies (ENCRYPTION_KEY env var) were already established in Plan 02.

## Next Phase Readiness

- Plan 04 (frontend UI) can now call all 4 REST endpoints under `/api/admin/api-keys`
- GeminiService is fully DB-driven — no `.env` fallback possible
- Worker correctly tracks per-key call counts and last-used timestamps

---
*Phase: 04-api-key-management*
*Completed: 2026-03-12*

## Self-Check: PASSED

- apps/api/src/routes/admin/api-keys.routes.ts — FOUND
- apps/api/src/services/gemini.service.ts — FOUND
- apps/api/src/worker.ts — FOUND
- .planning/phases/04-api-key-management/04-03-SUMMARY.md — FOUND
- Commit 36c680f (Task 1) — FOUND
- Commit edb07b4 (Task 2) — FOUND
