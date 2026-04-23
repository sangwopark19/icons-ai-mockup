---
phase: 03-generation-and-content-monitoring
plan: 04
subsystem: web
tags: [react, nextjs, admin, generation-monitoring, content-management, typescript]

requires:
  - phase: 03-02
    provides: listGenerations and retryGeneration backend endpoints
  - phase: 03-03
    provides: listImages, bulkDeleteImages, deleteImage backend endpoints

provides:
  - ContentPage: tabbed layout switching between generations and content views
  - GenerationTable: generation list with status tabs/count badges, email search, 30s polling, retry
  - GenerationDetailModal: failed job error detail with JSON blocks and retry button
  - ContentGrid: image grid with filters, bulk delete, lightbox integration (from prior 03-05 session)
  - ImageLightbox: full-size image viewer with metadata and individual delete (from prior 03-05 session)
  - AdminService.listContentProjects: projects with generated images for filter dropdown
  - GET /api/admin/content/projects: endpoint for project dropdown

affects:
  - 03-05 (content management frontend — ContentGrid/ImageLightbox already implemented)

tech-stack:
  added: []
  patterns:
    - useCallback + useEffect + setInterval 30s polling pattern (consistent with dashboard)
    - Status tab filter with count badges using statusCounts from API
    - Modal overlay with stopPropagation + Escape key handler (ConfirmDialog pattern)
    - Optimistic status update on retry then background re-fetch

key-files:
  created:
    - apps/web/src/components/admin/generation-table.tsx
    - apps/web/src/components/admin/generation-detail-modal.tsx
  modified:
    - apps/web/src/app/admin/content/page.tsx
    - apps/api/src/services/admin.service.ts
    - apps/api/src/routes/admin/content.routes.ts
    - apps/web/src/lib/api.ts

key-decisions:
  - "Direct retry on table row (no confirmation dialog) per CONTEXT.md decision — GEN-03"
  - "Optimistic pending status update on retry then fetchData re-sync"
  - "listContentProjects added to AdminService as simple Prisma findMany with generated image filter"

metrics:
  duration: 3min
  completed: 2026-03-11
  tasks: 2
  files: 6
---

# Phase 3 Plan 04: Generation Monitoring Frontend

**Tabbed /admin/content page with GenerationTable (status tabs, email search, 30s polling, retry) and GenerationDetailModal (error details, JSON prompt/options, retry)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-11T05:10:36Z
- **Completed:** 2026-03-11T05:13:39Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- ContentPage tabbed layout with "생성 작업" / "콘텐츠" tabs wired to GenerationTable and ContentGrid
- GenerationTable with 5 status filter tabs (전체/대기중/처리중/완료/실패), count badges from statusCounts, Enter-key email search, 30-second polling, status-colored badges, and action column (상세보기 + 재시도 for failed rows)
- GenerationDetailModal with error message (red box), mode, retryCount, createdAt, userEmail, pretty-printed JSON options/promptData, retry button with loading spinner
- AdminService.listContentProjects + GET /api/admin/content/projects for ContentGrid project filter dropdown
- adminApi.listContentProjects client helper added

## Task Commits

Each task was committed atomically:

1. **Task 1: Tabbed content page and GenerationTable** - `4185974` (feat)
2. **Task 2: GenerationDetailModal** - `942bff3` (feat)

## Files Created/Modified

- `apps/web/src/app/admin/content/page.tsx` - Replaced stub with tabbed layout using activeTab state
- `apps/web/src/components/admin/generation-table.tsx` - NEW: GenerationTable with all monitoring features
- `apps/web/src/components/admin/generation-detail-modal.tsx` - NEW: Failed job detail modal
- `apps/api/src/services/admin.service.ts` - Added listContentProjects method
- `apps/api/src/routes/admin/content.routes.ts` - Added GET /projects endpoint
- `apps/web/src/lib/api.ts` - Added adminApi.listContentProjects helper

## Decisions Made

- Retry from table row uses direct API call without confirmation dialog per CONTEXT.md decision (GEN-03 — retry is low-risk, no irreversible side effect)
- Optimistic pending status update on retry call (before re-fetch) for immediate UI feedback
- listContentProjects queries only projects that have at least one generated image (reduces noise in dropdown)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing uncommitted changes from prior sessions**
- **Found during:** Task 1 pre-execution check
- **Issue:** apps/api/src/services/admin.service.ts, content.routes.ts, and apps/web/src/lib/api.ts had uncommitted additions (listContentProjects method/route) from a prior 03-05 session; content-grid.tsx and image-lightbox.tsx were also untracked
- **Fix:** Staged and committed all related files together with Task 1 commit since they are dependencies for the content page tab
- **Files modified:** 4 previously-modified, 2 untracked
- **Commit:** 4185974

**2. [Rule 3 - Blocking] content/page.tsx auto-updated by linter**
- **Found during:** Task 1 completion
- **Issue:** Linter auto-imported ContentGrid from content-grid.tsx and updated the content tab render
- **Fix:** Accepted the linter change — it correctly wires ContentGrid into the content tab ahead of plan 03-05
- **Impact:** Plan 03-05 frontend task is partially pre-complete

---

**Total deviations:** 2 (both auto-handled per Rule 3)

## Self-Check

### Files exist:
- [x] apps/web/src/components/admin/generation-table.tsx — FOUND
- [x] apps/web/src/components/admin/generation-detail-modal.tsx — FOUND
- [x] apps/web/src/app/admin/content/page.tsx — FOUND

### Commits exist:
- [x] 4185974 — FOUND (feat(03-04): tabbed content page...)
- [x] 942bff3 — FOUND (feat(03-04): create GenerationDetailModal...)

## Self-Check: PASSED

## Next Phase Readiness

- Generation monitoring frontend complete — GEN-01/02/03 requirements satisfied from UI perspective
- Content tab already wired to ContentGrid (plan 03-05 ContentGrid/ImageLightbox were pre-created)
- Plan 03-05 may only need to verify and commit what already exists, or add missing pieces (API key management)

---
*Phase: 03-generation-and-content-monitoring*
*Completed: 2026-03-11*
