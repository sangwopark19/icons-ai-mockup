---
phase: 03-generation-and-content-monitoring
plan: 05
subsystem: web
tags: [react, next.js, admin, content-management, image-grid, lightbox, bulk-delete]

requires:
  - phase: 03-03
    provides: content routes + adminApi (listImages, countImages, deleteImage, bulkDeleteImages)

provides:
  - ContentGrid component with email/date/project filter bar, responsive image grid, pagination, bulk delete with count confirmation
  - ImageLightbox component with full-size preview, metadata panel, individual delete
  - GET /api/admin/content/projects route for project dropdown
  - AdminService.listContentProjects() Prisma query
  - adminApi.listContentProjects() client helper

affects:
  - Content tab in admin panel (apps/web/src/app/admin/content/page.tsx)

tech-stack:
  added: []
  patterns:
    - useCallback + useEffect + setInterval for polling (30s) — matches dashboard pattern
    - Applied vs staged filter state — search button triggers applied state copy, not real-time
    - ConfirmDialog (danger variant) reused for both bulk delete and individual delete
    - ImageLightbox is zero-dependency hand-rolled overlay (no library needed)

key-files:
  created:
    - apps/web/src/components/admin/content-grid.tsx
    - apps/web/src/components/admin/image-lightbox.tsx
  modified:
    - apps/web/src/app/admin/content/page.tsx
    - apps/web/src/lib/api.ts
    - apps/api/src/routes/admin/content.routes.ts
    - apps/api/src/services/admin.service.ts

key-decisions:
  - "Staged filter pattern (emailSearch/startDate/endDate/projectId vs appliedEmail/appliedStartDate/appliedEndDate/appliedProjectId) — filter only applies on 검색 click, preventing API spam on each keystroke"
  - "listContentProjects added to AdminService (not inline in route) for testability and consistency with existing service pattern"
  - "ImageLightbox uses z-40 overlay and z-50 card — ConfirmDialog uses z-50 overlay so delete confirm renders on top"
  - "Bulk delete button only appears when hasActiveFilter is true — prevents accidental global delete"

metrics:
  duration: "~3 min"
  tasks: 2
  files: 6

completed: 2026-03-11
---

# Phase 3 Plan 05: Content Grid and Lightbox — Frontend Image Management UI

**Responsive image grid with filter bar, lightbox preview, individual delete, and bulk delete with count confirmation for the admin Content tab**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-11T05:10:52Z
- **Completed:** 2026-03-11T05:13:22Z
- **Tasks:** 2
- **Files modified:** 4 (+ 2 created)

## Accomplishments

- ContentGrid component with email/date-range/project filters, 5-column responsive grid, 30s polling, bulk delete with count preview
- ImageLightbox component with full-size preview, metadata panel (resolution, file size, date, user, project), delete with confirmation
- GET /api/admin/content/projects endpoint added to backend + adminApi.listContentProjects() client helper
- Content tab now renders ContentGrid inside existing tab structure (preserves GenerationTable in "생성 작업" tab)
- All 41 API tests still passing

## Task Commits

Each task was committed atomically:

1. **Task 1: ContentGrid component with filter bar, image grid, pagination, and bulk delete** - `99b6ee6` (feat)
2. **Task 2: ImageLightbox component with metadata display and individual delete** - `3addb2f` (feat)

## Files Created/Modified

- `apps/web/src/components/admin/content-grid.tsx` - NEW: image grid with filter bar, pagination, bulk delete confirm, lightbox integration
- `apps/web/src/components/admin/image-lightbox.tsx` - NEW: full-size overlay with metadata panel and delete button
- `apps/web/src/app/admin/content/page.tsx` - Added ContentGrid import, replaced placeholder div with `<ContentGrid />`
- `apps/web/src/lib/api.ts` - Added `adminApi.listContentProjects()`
- `apps/api/src/routes/admin/content.routes.ts` - Added `GET /projects` route
- `apps/api/src/services/admin.service.ts` - Added `listContentProjects()` method

## Decisions Made

- Staged filter pattern: UI inputs (emailSearch/startDate/endDate/projectId) are separate from applied states — filters only applied on 검색 click to prevent API spam per keystroke
- `listContentProjects` added as AdminService method for consistency with the rest of the service pattern; not inlined in route
- ImageLightbox uses z-40 for backdrop, z-50 for card — delete ConfirmDialog renders above both at z-50
- Bulk delete button is conditionally rendered only when `hasActiveFilter` is true to prevent accidental deletion of all images

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Additional Work

**Added GET /api/admin/content/projects endpoint and adminApi.listContentProjects()** (plan specified this as conditional "if no endpoint exists" — it did not exist):
- Added Prisma query using `generations.some.images.some` filter to only return projects with generated images
- Added route handler in content.routes.ts (inline, no Zod schema needed — no user input)
- Added client helper in api.ts

## Self-Check: PASSED

- content-grid.tsx: FOUND
- image-lightbox.tsx: FOUND
- SUMMARY.md: FOUND
- Commit 99b6ee6 (Task 1): FOUND
- Commit 3addb2f (Task 2): FOUND
