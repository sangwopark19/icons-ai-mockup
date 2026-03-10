---
phase: 01-auth-foundation
plan: 02
subsystem: auth
tags: [zustand, next.js, admin, route-guard, responsive-ui]

# Dependency graph
requires:
  - phase: 01-auth-foundation/01-01
    provides: requireAdmin middleware, role field in JWT and DB User model

provides:
  - AdminGuard client component blocking non-admin users from /admin routes
  - AdminSidebar with 4 nav items, responsive hamburger for mobile
  - Admin layout shell wrapping guard + sidebar + content area
  - Stub pages for /admin/dashboard, /admin/users, /admin/content, /admin/api-keys
  - role?: string field on User interface in Zustand auth store
affects:
  - 02-user-management (uses admin layout and stub page infrastructure)
  - 03-content-management (uses admin layout)
  - 04-api-key-management (uses admin layout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - null-render anti-flash pattern in AdminGuard (return null while loading/unauthorized)
    - Server component layout wrapping client component guard
    - Responsive sidebar: always-visible desktop, full-screen overlay on mobile

key-files:
  created:
    - apps/web/src/components/admin/admin-guard.tsx
    - apps/web/src/components/admin/admin-sidebar.tsx
    - apps/web/src/app/admin/layout.tsx
    - apps/web/src/app/admin/page.tsx
    - apps/web/src/app/admin/dashboard/page.tsx
    - apps/web/src/app/admin/users/page.tsx
    - apps/web/src/app/admin/content/page.tsx
    - apps/web/src/app/admin/api-keys/page.tsx
  modified:
    - apps/web/src/stores/auth.store.ts

key-decisions:
  - "AdminGuard uses null-render (not loading spinner) to prevent admin UI flash before redirect"
  - "Admin layout is server component; guard and sidebar are client components for useState/useEffect"
  - "Stub pages have no 'coming soon' text — just title heading per plan spec"

patterns-established:
  - "Anti-flash pattern: return null while isLoading || !isAuthenticated || role !== admin"
  - "Server component layout + client component guard pattern for Next.js App Router"

requirements-completed: [AUTH-04, AUTH-05]

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 1 Plan 02: Admin Frontend Shell Summary

**Zustand role field + AdminGuard null-render anti-flash + AdminSidebar responsive layout with 4 nav items and admin layout shell**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T08:07:36Z
- **Completed:** 2026-03-10T08:12:00Z
- **Tasks:** 2 of 3 (Task 3 is human-verify checkpoint — pending user verification)
- **Files modified:** 9

## Accomplishments
- Added `role?: string` to User interface in Zustand auth store — backward compatible with existing localStorage data
- Created AdminGuard with null-render anti-flash pattern: renders nothing until confirmed admin, triggers silent router.replace('/') for non-admin/unauthenticated users
- Created AdminSidebar with 4 Korean-labeled nav items (대시보드, 사용자 관리, 생성/콘텐츠, API 키), admin user info at top, 메인으로 link at bottom, and responsive hamburger toggle for mobile
- Created admin layout shell (server component) wrapping AdminGuard + AdminSidebar + content area
- /admin root redirects to /admin/dashboard via server-side redirect
- All 4 stub pages created with title headings ready for future phase content

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth store update + AdminGuard + AdminSidebar** - `34091da` (feat)
2. **Task 2: Admin layout + stub pages** - `3a10b97` (feat)
3. **Task 3: Verify complete admin auth flow** - Pending human-verify checkpoint

## Files Created/Modified
- `apps/web/src/stores/auth.store.ts` - Added role?: string to User interface
- `apps/web/src/components/admin/admin-guard.tsx` - Client component blocking non-admins with null render + silent redirect
- `apps/web/src/components/admin/admin-sidebar.tsx` - Responsive sidebar with 4 nav items, user info, mobile hamburger
- `apps/web/src/app/admin/layout.tsx` - Server component layout wrapping guard + sidebar
- `apps/web/src/app/admin/page.tsx` - Server-side redirect to /admin/dashboard
- `apps/web/src/app/admin/dashboard/page.tsx` - Dashboard stub page
- `apps/web/src/app/admin/users/page.tsx` - Users stub page
- `apps/web/src/app/admin/content/page.tsx` - Content stub page
- `apps/web/src/app/admin/api-keys/page.tsx` - API Keys stub page

## Decisions Made
- AdminGuard uses null-render (not loading spinner) to prevent admin UI flash before redirect
- Admin layout is server component; guard and sidebar are client components for useState/useEffect
- Stub pages have no "coming soon" text — just title heading per plan spec

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript environment issue: `.next/dev/types/routes.d.ts` does not exist (dev server has never run), causing `Cannot find module 'next/navigation'` errors across ALL project files. This is out of scope — same errors existed before this plan. A `pnpm dev` run would generate this file.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Admin frontend shell is complete and ready for feature phases 2-4
- Stub pages at /admin/dashboard, /admin/users, /admin/content, /admin/api-keys are ready to receive content
- Human verification (Task 3) needed to confirm non-admin redirect, admin sidebar, and API security work end-to-end

---
*Phase: 01-auth-foundation*
*Completed: 2026-03-10*
