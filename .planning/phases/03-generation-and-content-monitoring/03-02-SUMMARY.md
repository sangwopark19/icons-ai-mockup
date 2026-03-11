---
phase: 03-generation-and-content-monitoring
plan: 02
subsystem: api
tags: [admin, generation-monitoring, content-management, tdd-green, bullmq]
dependency_graph:
  requires: [03-01]
  provides: [GEN-01-api, GEN-02-api, GEN-03-api, CONT-01-api, CONT-02-api, CONT-04-api]
  affects: [03-04-frontend]
tech_stack:
  added: []
  patterns:
    - AdminService method extension following listUsers pattern
    - BullMQ retry via addGenerationJob
    - Fastify route files with Zod query schema validation
    - TDD Green implementation against failing RED tests
key_files:
  created:
    - apps/api/src/routes/admin/generations.routes.ts
    - apps/api/src/routes/admin/content.routes.ts
  modified:
    - apps/api/src/services/admin.service.ts
    - apps/api/src/routes/admin/index.routes.ts
    - apps/web/src/lib/api.ts
decisions:
  - listGenerations uses prisma.generation.groupBy for statusCounts tab badges
  - retryGeneration casts promptData/options as Record<string,unknown> per Pitfall 1 in RESEARCH.md
  - listGeneratedImages uses optional chaining for generation.project.user.email to handle mocked data
  - content.routes.ts registered in this plan (scope from 03-03) since linter added it cleanly
  - adminApi frontend helpers added to web/src/lib/api.ts in advance for 03-04
metrics:
  duration_minutes: 4
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_modified: 5
---

# Phase 3 Plan 02: Generation Monitoring API Summary

One-liner: AdminService generation monitoring with listGenerations (statusCounts, email/status filter), retryGeneration (BullMQ re-enqueue), and content management methods (listGeneratedImages, deleteGeneratedImage, bulkDeleteImages, countImages) plus Fastify routes at /api/admin/generations and /api/admin/content.

## What Was Built

### Task 1: AdminService Generation Methods (TDD GREEN)

Implemented against the RED tests written in plan 03-01:

**listGenerations(params):**
- Paginated results with userEmail from `project.user` join (via `include`)
- Dynamic `where` clause: `status` direct filter, `email` via nested `project.is.user.is.email` contains insensitive
- statusCounts via `prisma.generation.groupBy({ by: ['status'], _count: { _all: true } })`
- Returns `{ generations, pagination, statusCounts }`

**retryGeneration(id):**
- Finds generation with `include: { project: true }`
- Throws `'Generation not found'` if missing
- Throws `'Only failed generations can be retried'` if status !== 'failed'
- Updates: `{ status: 'pending', errorMessage: null, retryCount: { increment: 1 } }`
- Casts `promptData` and `options` as `Record<string, unknown>` (Pitfall 1)
- Calls `addGenerationJob` to re-enqueue via BullMQ

**Content management methods (also implemented):**
- `listGeneratedImages`: paginated with email/projectId/date range filters, includes `userEmail` and `projectName` via generation→project→user join
- `deleteGeneratedImage`: finds image, deletes files via uploadService (silent error), deletes DB record (Generation PRESERVED)
- `countImages`: count matching filters for bulk delete confirmation
- `bulkDeleteImages`: find+delete files loop then `deleteMany`

Extracted `buildImageWhere()` helper function for DRY filter construction.

### Task 2: Generations Routes

Created `generations.routes.ts`:
- `GET /api/admin/generations` — parse query with Zod (page, limit, status enum, email), return `{ success, data, pagination, statusCounts }`
- `POST /api/admin/generations/:id/retry` — try/catch with 404 (not found), 400 (not failed), 500 error codes

Registered in `index.routes.ts`:
```typescript
fastify.register(generationsRoutes, { prefix: '/generations' });
```

## Deviations from Plan

### Auto-added (Linter)

**[Rule 2 - Missing functionality] content.routes.ts created and registered**
- **Found during:** Task 2 (linter added it alongside generations.routes.ts)
- **Issue:** content.routes.ts was in scope for plan 03-03 but linter created it
- **Result:** All content management routes are already wired at /api/admin/content
- **Files:** `apps/api/src/routes/admin/content.routes.ts`, `apps/api/src/routes/admin/index.routes.ts`

**[Rule 2 - Missing functionality] Frontend adminApi helpers added**
- **Found during:** Task 2 (linter updated web/src/lib/api.ts)
- **Result:** AdminGeneration, AdminImage, StatusCounts interfaces + listGenerations, retryGeneration, listImages, countImages, deleteImage, bulkDeleteImages added to adminApi
- **Files:** `apps/web/src/lib/api.ts`

**[Rule 1 - Bug] Optional chaining fix in listGeneratedImages**
- **Found during:** Verification (test failure)
- **Issue:** `img.generation.project.user.email` threw TypeError when mock data lacked generation join
- **Fix:** Changed to `img.generation?.project?.user?.email ?? ''`

## Test Results

All 35 tests pass:
- 26 existing Phase 2 tests: PASS (no regression)
- 9 new Phase 3 tests (listGenerations x5, retryGeneration x4): PASS
- `npx vitest run src/services/__tests__/admin.service.test.ts` — 35/35 PASS

TypeScript: `npx tsc --noEmit` — clean (0 errors)

## Self-Check: PASSED

Files verified:
- `apps/api/src/services/admin.service.ts` — FOUND
- `apps/api/src/routes/admin/generations.routes.ts` — FOUND
- `apps/api/src/routes/admin/content.routes.ts` — FOUND
- `apps/api/src/routes/admin/index.routes.ts` — FOUND (generationsRoutes + contentRoutes registered)

Commits verified:
- `486d0a5` feat(03-02): implement AdminService generation and content management methods
- `bc73075` feat(03-02): create generations routes and register in admin index
- `0bffc5d` feat(03-02): fix optional chaining in listGeneratedImages and add content routes
