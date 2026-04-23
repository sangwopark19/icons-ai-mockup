---
phase: 03-generation-and-content-monitoring
plan: 03
subsystem: api
tags: [prisma, fastify, zod, typescript, content-management, admin]

requires:
  - phase: 03-01
    provides: RED test stubs for CONT-* AdminService methods
  - phase: 03-02
    provides: listGenerations and retryGeneration implementations (GEN-*)

provides:
  - AdminService.listGeneratedImages with generation/project/user join (userEmail, projectName)
  - AdminService.deleteGeneratedImage (DB record + filesystem cleanup, Generation preserved)
  - AdminService.countImages for bulk delete preview
  - AdminService.bulkDeleteImages returning { deletedCount }
  - content.routes.ts at /api/admin/content/images with GET, GET/count, DELETE/:id, DELETE (bulk)
  - adminApi client extensions: listGenerations, retryGeneration, listImages, countImages, deleteImage, bulkDeleteImages

affects:
  - 03-04 (content management frontend pages)
  - 03-05 (generation monitoring frontend pages)

tech-stack:
  added: []
  patterns:
    - buildImageWhere helper for composable Prisma where clauses (email via nested generation.project.user)
    - Content routes follow users.routes.ts pattern (Zod validation, adminService delegation)
    - Date params accepted as ISO string in routes, converted to Date objects before service call

key-files:
  created:
    - apps/api/src/routes/admin/content.routes.ts
  modified:
    - apps/api/src/services/admin.service.ts
    - apps/api/src/routes/admin/index.routes.ts
    - apps/web/src/lib/api.ts
    - apps/api/src/services/__tests__/admin.service.test.ts

key-decisions:
  - "buildImageWhere handles both email (nested) and projectId in single generation.is clause — merges correctly"
  - "bulkDeleteImages returns { deletedCount } to give caller confirmation count"
  - "listGeneratedImages uses include (not select) to join generation.project.user for email and projectName"
  - "deleteGeneratedImage never touches Generation table — only generatedImage.delete"

requirements-completed: [CONT-01, CONT-02, CONT-03, CONT-04]

duration: 6min
completed: 2026-03-11
---

# Phase 3 Plan 03: Content Management — AdminService + Routes + API Client

**Image browsing, individual delete, count preview, and bulk delete via Prisma joins, Fastify routes, and frontend adminApi**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-11T05:02:55Z
- **Completed:** 2026-03-11T05:08:05Z
- **Tasks:** 2
- **Files modified:** 4 (+ 1 created)

## Accomplishments

- AdminService content methods GREEN: all 11 CONT-* tests passing alongside 15 existing Phase 2 tests
- content.routes.ts created with 4 endpoints at /api/admin/content/images
- adminApi extended with 6 new methods (listGenerations, retryGeneration, listImages, countImages, deleteImage, bulkDeleteImages)

## Task Commits

Each task was committed atomically:

1. **Task 1: AdminService content methods (GREEN)** - `6a6b35d` (feat)
2. **Task 2: Content routes + adminApi extension** - `0bffc5d` (feat)

## Files Created/Modified

- `apps/api/src/services/admin.service.ts` - Added buildImageWhere helper, listGeneratedImages, deleteGeneratedImage, countImages, bulkDeleteImages
- `apps/api/src/routes/admin/content.routes.ts` - NEW: GET/DELETE /images, GET /images/count, DELETE /images (bulk)
- `apps/api/src/routes/admin/index.routes.ts` - Registered contentRoutes at /content prefix
- `apps/web/src/lib/api.ts` - Added AdminGeneration, AdminImage, StatusCounts types; extended adminApi with 6 methods
- `apps/api/src/services/__tests__/admin.service.test.ts` - Updated mockGeneratedImage to include generation join fields

## Decisions Made

- `buildImageWhere` helper merges `email` (nested `generation.is.project.is.user.is.email`) and `projectId` (`generation.is.projectId`) into a single `generation.is` clause to avoid overwriting each other
- `listGeneratedImages` uses `include` rather than `select` to traverse the generation->project->user join and surface `userEmail` and `projectName` in the result
- `bulkDeleteImages` returns `{ deletedCount: number }` not `void` to give callers confirmation
- `deleteGeneratedImage` calls `uploadService.deleteFile` for both `filePath` and `thumbnailPath` before `generatedImage.delete`; never touches `Generation` table

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ListImagesResult missing userEmail/projectName fields**
- **Found during:** Task 1 (implementing listGeneratedImages)
- **Issue:** Original ListImagesResult interface didn't include userEmail or projectName; plan spec requires them
- **Fix:** Updated interface and implemented include join with mapping
- **Files modified:** apps/api/src/services/admin.service.ts
- **Verification:** Tests assert pagination shape; type-check passes
- **Committed in:** 6a6b35d (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added buildImageWhere helper to prevent where-clause overwrite**
- **Found during:** Task 1 (listGeneratedImages, countImages, bulkDeleteImages all had duplicated where-building)
- **Issue:** Naive where-building would overwrite `generation` key when both email and projectId are present
- **Fix:** Extracted shared `buildImageWhere` function that merges email and projectId into one `generation.is` clause
- **Files modified:** apps/api/src/services/admin.service.ts
- **Verification:** All 11 CONT-* tests GREEN
- **Committed in:** 6a6b35d (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 correctness, 1 missing critical)
**Impact on plan:** Both fixes necessary for type-correct and behaviorally-correct implementation. No scope creep.

## Issues Encountered

- Previous session had already implemented some methods; re-verified, improved types, and cleaned up the implementation by extracting the buildImageWhere helper

## Next Phase Readiness

- Content management backend is complete — all CONT-01/02/03/04 requirements satisfied
- adminApi client is ready for frontend pages (plan 03-04)
- Generation monitoring backend also complete (listGenerations, retryGeneration from plan 03-02) — plan 03-05 frontend can proceed

---
*Phase: 03-generation-and-content-monitoring*
*Completed: 2026-03-11*
