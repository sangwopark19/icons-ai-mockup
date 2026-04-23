---
phase: 02-dashboard-and-user-management
plan: "03"
subsystem: admin-frontend-users
tags: [admin, user-management, table, pagination, modal, search]
dependency_graph:
  requires: [02-01-backend-api]
  provides: [user-management-page, user-table, user-search-bar, user-action-menu, confirm-dialog]
  affects: []
tech_stack:
  added: []
  patterns: [debounced-search, overflow-menu, modal-confirmation, badge-styling, ellipsis-pagination]
key_files:
  created:
    - apps/web/src/components/admin/confirm-dialog.tsx
    - apps/web/src/components/admin/user-search-bar.tsx
    - apps/web/src/components/admin/user-action-menu.tsx
    - apps/web/src/components/admin/user-table.tsx
  modified:
    - apps/web/src/app/admin/users/page.tsx
key_decisions:
  - "UserActionMenu returns null for self (isSelf) and deleted users to prevent impossible actions"
  - "Empty state shown both in table tbody and at page level when pagination.totalPages === 0"
  - "Loading overlay uses absolute positioning within tbody relative container"
  - "ConfirmDialog uses stopPropagation on card click to prevent overlay dismiss during loading"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_changed: 5
  tests_added: 0
---

# Phase 2 Plan 03: User Management Frontend Summary

**One-liner:** Searchable/filterable user table with debounced email search, role/status badges, ellipsis pagination, and per-row overflow menu with confirm dialogs for suspend and delete.

## What Was Built

### ConfirmDialog (`apps/web/src/components/admin/confirm-dialog.tsx`)
Reusable modal with:
- `danger` variant renders red confirm button (`bg-red-600`) vs brand-colored default
- Escape key listener via `useEffect` on `open` prop
- Overlay click dismisses; card click stops propagation
- Loading spinner on confirm button while action is in progress

### UserSearchBar (`apps/web/src/components/admin/user-search-bar.tsx`)
Horizontal filter row:
- Email text input with 300ms debounce using `setTimeout`/`clearTimeout` ref pattern
- Native `<select>` for role (전체/admin/user) and status (전체/active/suspended/deleted)
- Responsive: `flex-col sm:flex-row`
- Any change fires `onSearch` with combined current state

### UserActionMenu (`apps/web/src/components/admin/user-action-menu.tsx`)
Per-row MoreVertical icon button:
- Dropdown closes on outside click via `mousedown` + `ref`
- Context-sensitive items: suspend (active only), unsuspend (suspended only), role toggle (always), delete (always)
- `isSelf` or `isDeleted` → component returns null entirely
- Both suspend and delete route through `ConfirmDialog`; unsuspend and role-toggle are direct calls

### UserTable (`apps/web/src/components/admin/user-table.tsx`)
Seven-column table:
- Columns: 이메일, 이름, 역할, 상태, 가입일, 마지막 로그인, 액션
- Role badge: blue for admin, gray for user
- Status badge: green/yellow/red for active/suspended/deleted
- Dates via `Intl.DateTimeFormat`, null lastLoginAt shows `-`
- Loading: semi-transparent overlay with spinner (absolute inset within `relative tbody`)
- Empty state: single colspan row "사용자가 없습니다"
- Pagination: ellipsis pattern for `totalPages > 7`, boundary prev/next disable

### Users Page (`apps/web/src/app/admin/users/page.tsx`)
Full replacement of stub:
- `useCallback` + `useEffect` pattern for `fetchUsers`
- `searchParams` state reset `currentPage` to 1 on new search
- All three action handlers (`handleStatusChange`, `handleRoleChange`, `handleDelete`) call API then refetch
- Passes `user?.id ?? ''` as `currentAdminId` to prevent self-actions

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Created files exist:
- apps/web/src/components/admin/confirm-dialog.tsx: FOUND
- apps/web/src/components/admin/user-search-bar.tsx: FOUND
- apps/web/src/components/admin/user-action-menu.tsx: FOUND
- apps/web/src/components/admin/user-table.tsx: FOUND
- apps/web/src/app/admin/users/page.tsx: FOUND (modified)

### Commits:
- 750118e: feat(02-03): create ConfirmDialog, UserSearchBar, and UserActionMenu components
- b5d041e: feat(02-03): create UserTable and full users management page

## Self-Check: PASSED
