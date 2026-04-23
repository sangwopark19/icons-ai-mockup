---
phase: 03-generation-and-content-monitoring
plan: 01
subsystem: testing
tags: [vitest, tdd, admin-service, prisma, generation, content-management]

# Dependency graph
requires:
  - phase: 02-dashboard-and-user-management
    provides: AdminService class with getDashboardStats, listUsers, softDeleteUser methods and test infrastructure
provides:
  - Red (failing) test stubs for listGenerations, retryGeneration, listGeneratedImages, deleteGeneratedImage, countImages, bulkDeleteImages
  - Extended prisma mock covering generation and generatedImage CRUD
  - uploadService.deleteFile mock
  - addGenerationJob mock
affects:
  - 03-02-PLAN.md (will implement generation monitoring methods to make these green)
  - 03-03-PLAN.md (will implement content management methods to make these green)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Wave 0: RED tests written before implementation — 20 failing tests define expected behavior"
    - "vi.mock path must match exact import path in service (upload.service.js not uploadService)"

key-files:
  created: []
  modified:
    - apps/api/src/services/__tests__/admin.service.test.ts

key-decisions:
  - "Upload mock uses '../../services/upload.service.js' path to match how admin.service.ts will import it"
  - "bulkDeleteImages filter shape uses { ids: string[] } — consistent with deleteMany { where: { id: { in: ids } } } pattern"
  - "retryGeneration mock setup uses prisma.generation.findUnique then update, not updateOrThrow, for explicit not-found guard"

patterns-established:
  - "Phase 3 mock data: mockGeneration includes full project.user join for email access"
  - "Phase 3 mock data: mockGeneratedImage includes both filePath and thumbnailPath for deletion tests"

requirements-completed:
  - GEN-01
  - GEN-02
  - GEN-03
  - CONT-01
  - CONT-02
  - CONT-04

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 3 Plan 01: RED Tests for Generation Monitoring and Content Management Summary

**20 failing TDD stubs written across 6 describe blocks covering generation listing/retry and image CRUD before any implementation exists**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T14:02:19Z
- **Completed:** 2026-03-11T14:10:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Extended prisma mock with 9 new generation/generatedImage model methods
- Added addGenerationJob and uploadService.deleteFile mocks
- Wrote 20 new failing tests across 6 describe blocks: listGenerations (5), retryGeneration (4), listGeneratedImages (4), deleteGeneratedImage (4), countImages (1), bulkDeleteImages (2)
- All 15 existing Phase 2 tests continue passing — no regression

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend mock setup and write RED tests for all Phase 3 AdminService methods** - `82ba08a` (test)

**Plan metadata:** (docs commit follows)

_Note: TDD Wave 0 — only RED (failing) tests written. GREEN phase happens in Plans 02 and 03._

## Files Created/Modified
- `apps/api/src/services/__tests__/admin.service.test.ts` - Extended with Phase 3 mock setup and 20 failing test cases

## Decisions Made
- Used `'../../services/upload.service.js'` path for the uploadService mock to ensure it matches the import path admin.service.ts will use in Plans 02/03
- `bulkDeleteImages` params shape defined as `{ ids: string[] }` to align with Prisma deleteMany id-in-array pattern
- `retryGeneration` tests expect findUnique + explicit not-found throw rather than Prisma's `findUniqueOrThrow` to allow custom error messages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RED tests ready for Plan 02 (listGenerations + retryGeneration GREEN implementation)
- RED tests ready for Plan 03 (listGeneratedImages + deleteGeneratedImage + countImages + bulkDeleteImages GREEN implementation)
- Mock data shapes established: mockGeneration and mockGeneratedImage defined at file scope for reuse across all describe blocks

---
*Phase: 03-generation-and-content-monitoring*
*Completed: 2026-03-11*
