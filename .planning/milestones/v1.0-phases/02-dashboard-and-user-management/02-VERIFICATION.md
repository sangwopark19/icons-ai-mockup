---
phase: 02-dashboard-and-user-management
verified: 2026-03-11T03:28:00Z
status: human_needed
score: 18/18 must-haves verified
human_verification:
  - test: "Navigate to /admin/dashboard and observe KPI cards on page load"
    expected: "Skeleton loading cards (6 total) appear briefly, then real data fills in within 1-2 seconds"
    why_human: "Animation timing and visual layout cannot be verified programmatically"
  - test: "Observe the FailureChart (Recharts ResponsiveContainer) rendering"
    expected: "Bar chart renders visibly; not blank. The failure-chart.tsx source file contains a NOTE comment that ResponsiveContainer may render blank in some React 19.2.x builds. Verify it works or report blank."
    why_human: "React 19 + Recharts ResponsiveContainer rendering is a runtime/browser issue not detectable via static analysis"
  - test: "Wait 30+ seconds on /admin/dashboard, watch browser DevTools > Network tab"
    expected: "Polling requests to /api/admin/dashboard/stats and /api/admin/dashboard/chart fire every 30 seconds automatically"
    why_human: "Timer-based polling behavior requires runtime observation"
  - test: "On /admin/users, type a partial email in the search box"
    expected: "Table results filter after ~300ms debounce delay"
    why_human: "Debounce timing is a runtime behavior"
  - test: "On /admin/users, click the three-dot action menu on a non-admin user, click 'account suspend', confirm the modal, check the status badge"
    expected: "Status badge changes from 'active' to 'suspended'. The same row's menu now shows 'unsuspend' instead of 'suspend'."
    why_human: "Optimistic UI update and badge re-render require browser observation"
  - test: "Verify admin's own row (admin@example.com) has no action menu"
    expected: "The three-dot button is absent for the currently-logged-in admin user"
    why_human: "Self-protection display logic requires visual confirmation"
---

# Phase 2: Dashboard and User Management — Verification Report

**Phase Goal:** Admin can see system-wide health at a glance and take all user lifecycle actions from one place
**Verified:** 2026-03-11T03:28:00Z
**Status:** human_needed — all automated checks pass; 6 items require human runtime confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/admin/dashboard/stats returns userCount, generationCount, failedJobCount, queueDepth, storageBytes, activeApiKeys=null + yesterday counts | VERIFIED | `admin.service.ts` lines 55-99: full Promise.all query, all 8 fields returned |
| 2 | GET /api/admin/dashboard/stats includes yesterday's counts for day-over-day delta | VERIFIED | Lines 72-83: `userCountYesterday`, `generationCountYesterday`, `failedJobCountYesterday` queried with 24-48h window |
| 3 | GET /api/admin/dashboard/chart returns hourly failure counts for last 24 hours | VERIFIED | `admin.service.ts` lines 102-121: raw SQL `date_trunc('hour')` query on `generations` table |
| 4 | GET /api/admin/users returns paginated user list with total count | VERIFIED | `users.routes.ts` line 32: `adminService.listUsers(query)` returns `{ data, pagination }` |
| 5 | GET /api/admin/users supports email search and role/status filtering | VERIFIED | `admin.service.ts` lines 130-138: `where.email`, `where.role`, `where.status` conditionally set |
| 6 | PATCH /api/admin/users/:id/status toggles user between active and suspended | VERIFIED | `users.routes.ts` lines 44-49 + `admin.service.ts` lines 171-176: prisma.user.update on status |
| 7 | PATCH /api/admin/users/:id/role toggles user between admin and user | VERIFIED | `users.routes.ts` lines 55-60 + `admin.service.ts` lines 178-183: prisma.user.update on role |
| 8 | DELETE /api/admin/users/:id soft-deletes with PII anonymization | VERIFIED | `admin.service.ts` lines 185-195: sets status='deleted', email=`deleted_${id}@anon`, name='삭제된 사용자', passwordHash='DELETED' |
| 9 | Suspended user making authenticated API call receives 403 ACCOUNT_SUSPENDED | VERIFIED | `auth.plugin.ts` lines 42-47: `if (user.status === 'suspended')` → 403 ACCOUNT_SUSPENDED |
| 10 | Deleted user making authenticated API call receives 403 ACCOUNT_DELETED | VERIFIED | `auth.plugin.ts` lines 48-53: `if (user.status === 'deleted')` → 403 ACCOUNT_DELETED |
| 11 | adminApi client functions exist in apps/web/src/lib/api.ts for all admin endpoints | VERIFIED | `api.ts` lines 214-257: `getDashboardStats`, `getFailureChart`, `listUsers`, `updateUserStatus`, `updateUserRole`, `softDeleteUser` all present with correct HTTP methods and body shapes |
| 12 | Admin sees 6 KPI cards in 2x3 grid with skeleton loading | VERIFIED | `dashboard/page.tsx`: grid `grid-cols-2 lg:grid-cols-3`, 6x `KpiSkeleton` while `stats === null`, then 6x `KpiCard` |
| 13 | Each KPI card shows large number and day-over-day delta with arrow and percentage | VERIFIED | `kpi-card.tsx` lines 35-68: `deltaColor`, `DeltaIcon` (ArrowUp/ArrowDown), delta value + percentage formatted |
| 14 | Active API keys card shows N/A placeholder | VERIFIED | `dashboard/page.tsx` line 101-105: `KpiCard value="N/A" placeholder={true}` |
| 15 | Dashboard auto-refreshes every 30 seconds | VERIFIED | `dashboard/page.tsx` line 46: `setInterval(fetchData, 30_000)` with cleanup on unmount |
| 16 | Admin sees user table with required columns and pagination | VERIFIED | `user-table.tsx` lines 82-103: 7 columns (email, name, role, status, 가입일, 마지막로그인, 액션); paginator lines 202-241 |
| 17 | Admin can suspend/unsuspend via overflow menu with confirmation modal for suspend, no modal for unsuspend | VERIFIED | `user-action-menu.tsx` lines 97-115: suspend → `setSuspendDialogOpen(true)`, unsuspend → direct `handleUnsuspend()` |
| 18 | Admin can change role without modal | VERIFIED | `user-action-menu.tsx` lines 116-122: role toggle calls `handleRoleToggle()` directly, no dialog |

**Score: 18/18 truths verified**

---

### Required Artifacts

| Artifact | Status | Lines | Notes |
|----------|--------|-------|-------|
| `apps/api/src/services/admin.service.ts` | VERIFIED | 198 | AdminService + adminService singleton; all 5 methods fully implemented with real Prisma queries |
| `apps/api/src/routes/admin/dashboard.routes.ts` | VERIFIED | 28 | GET /stats and GET /chart wired to adminService |
| `apps/api/src/routes/admin/users.routes.ts` | VERIFIED | 73 | GET /, PATCH /:id/status, PATCH /:id/role, DELETE /:id all implemented |
| `apps/api/src/routes/admin/index.routes.ts` | VERIFIED | 27 | Registers dashboardRoutes at `/dashboard` and usersRoutes at `/users` |
| `apps/api/src/plugins/auth.plugin.ts` | VERIFIED | 104 | ACCOUNT_SUSPENDED and ACCOUNT_DELETED checks at lines 42-53 |
| `apps/web/src/lib/api.ts` | VERIFIED | 259 | All 6 adminApi functions present with correct types |
| `apps/web/src/app/admin/dashboard/page.tsx` | VERIFIED | 125 | Full page with KPI grid, skeleton, chart, polling |
| `apps/web/src/components/admin/kpi-card.tsx` | VERIFIED | 74 | Reusable KPI card with delta arrows, bytes formatter |
| `apps/web/src/components/admin/kpi-skeleton.tsx` | VERIFIED | 20 | Matching skeleton with pulse animation |
| `apps/web/src/components/admin/failure-chart.tsx` | VERIFIED | 82 | Recharts BarChart with empty-state handler; contains React 19 note (see human checks) |
| `apps/web/src/app/admin/users/page.tsx` | VERIFIED | 112 | Full page wiring listUsers, updateUserStatus, updateUserRole, softDeleteUser |
| `apps/web/src/components/admin/user-table.tsx` | VERIFIED | 244 | Table with 7 columns, smart pagination, loading spinner overlay |
| `apps/web/src/components/admin/user-search-bar.tsx` | VERIFIED | 79 | Email search (300ms debounce) + role/status selects |
| `apps/web/src/components/admin/user-action-menu.tsx` | VERIFIED | 156 | Overflow menu with suspend/unsuspend/role/delete; self-protection guard |
| `apps/web/src/components/admin/confirm-dialog.tsx` | VERIFIED | 92 | Reusable modal with danger/default variant, loading spinner, ESC key handler |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `dashboard.routes.ts` | `admin.service.ts` | `import adminService` | WIRED | Line 2: `import { adminService }` used at lines 13, 22 |
| `users.routes.ts` | `admin.service.ts` | `import adminService` | WIRED | Line 4: `import { adminService }` used at lines 32, 47, 57, 68 |
| `index.routes.ts` | `dashboard.routes.ts` | `fastify.register(dashboardRoutes)` | WIRED | Line 21: `fastify.register(dashboardRoutes, { prefix: '/dashboard' })` |
| `index.routes.ts` | `users.routes.ts` | `fastify.register(usersRoutes)` | WIRED | Line 24: `fastify.register(usersRoutes, { prefix: '/users' })` |
| `auth.plugin.ts` | suspended/deleted user blocking | status check after getUserFromToken | WIRED | Lines 42-53: status checks before setting `request.user` |
| `dashboard/page.tsx` | `api.ts` | `adminApi.getDashboardStats + adminApi.getFailureChart` | WIRED | Lines 33-35: both called in Promise.all, results stored in state |
| `dashboard/page.tsx` | `kpi-card.tsx` | `import KpiCard` | WIRED | Line 7 import, used at lines 71-105 |
| `dashboard/page.tsx` | `failure-chart.tsx` | `import FailureChart` | WIRED | Line 9 import, used at line 119 |
| `users/page.tsx` | `api.ts` | `adminApi.*` | WIRED | Lines 32, 61, 71, 81: all 4 adminApi user methods called |
| `user-action-menu.tsx` | `confirm-dialog.tsx` | `ConfirmDialog` | WIRED | Line 6 import, rendered at lines 134-153 (2 dialogs) |

---

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| DASH-01 | 전체 사용자 수, 전체 생성 건수 KPI 카드 표시 | SATISFIED | `userCount` + `generationCount` in stats API; corresponding KPI cards in dashboard page |
| DASH-02 | 최근 24시간 실패 작업 수, 현재 큐 깊이 표시 | SATISFIED | `failedJobCount` (24h window) + `queueDepth` from BullMQ; KPI cards rendered |
| DASH-03 | 전체 이미지 스토리지 사용량 표시 | SATISFIED | `storageBytes` from `prisma.generatedImage.aggregate._sum.fileSize`; KpiCard with `format="bytes"` |
| DASH-04 | 활성 Gemini API 키 정보 (Phase 4 placeholder) | SATISFIED | `activeApiKeys: null` returned; KpiCard shows "N/A" with `placeholder={true}` — by design |
| DASH-05 | 시간대별 생성 실패율 차트 표시 | SATISFIED | `getHourlyFailureChart()` SQL query; FailureChart Recharts BarChart wired to chart state |
| USER-01 | 관리자가 전체 사용자 목록을 페이지네이션으로 조회 | SATISFIED | `listUsers` with skip/take pagination; UserTable with numeric page buttons |
| USER-02 | 관리자가 이메일로 사용자를 검색하고 상태별 필터링 | SATISFIED | `listUsers` accepts email/role/status; UserSearchBar with debounced input + selects |
| USER-03 | 관리자가 사용자 계정을 정지/해제 (soft suspend) | SATISFIED | PATCH /:id/status; UserActionMenu confirm dialog for suspend, direct unsuspend |
| USER-04 | 관리자가 사용자 계정을 삭제 (soft delete, PII 익명화) | SATISFIED | DELETE /:id anonymizes email + name + passwordHash, sets status='deleted' |
| USER-05 | 관리자가 사용자의 역할을 admin/user로 변경 | SATISFIED | PATCH /:id/role; role toggle in UserActionMenu without confirmation |

**All 10 requirements satisfied.**

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `failure-chart.tsx` | 56-57 | `NOTE: ResponsiveContainer may render blank in some React 19.2.x builds` | Warning | Recharts ResponsiveContainer has a known compatibility issue with React 19. `react-is@19.2.4` override is present in `apps/web/package.json` which should address this, but visual confirmation is required (see human verification #2). |

No blockers found. The one warning is a documented React 19 compatibility concern that requires human runtime confirmation.

---

### Human Verification Required

#### 1. Dashboard skeleton loading animation

**Test:** Navigate to `/admin/dashboard` in a browser (or open DevTools > Network > Throttle to "Slow 3G")
**Expected:** Six KPI skeleton cards pulse briefly, then transition to real data cards with numbers and delta indicators
**Why human:** CSS animation and state transition timing cannot be verified via static analysis

#### 2. Recharts bar chart renders (React 19 compatibility)

**Test:** Scroll to the failure chart section on `/admin/dashboard`
**Expected:** The bar chart renders with axes and bars (or the empty-state message "최근 24시간 실패 없음" if no failures exist). It must NOT be a blank/invisible area.
**Why human:** Recharts ResponsiveContainer has a known React 19.2.x rendering bug. The `react-is@19.2.4` dependency in `apps/web/package.json` is the documented fix, but actual rendering must be confirmed in a browser. If blank, the workaround noted in the source comment (replace ResponsiveContainer with explicit width/height on BarChart) should be applied.

#### 3. Dashboard auto-polling (30-second interval)

**Test:** Open `/admin/dashboard`, open DevTools > Network tab, wait 30+ seconds
**Expected:** Requests to `/api/admin/dashboard/stats` and `/api/admin/dashboard/chart` repeat automatically every ~30 seconds
**Why human:** `setInterval` behavior requires runtime observation

#### 4. User search debounce

**Test:** On `/admin/users`, type a partial email address character by character
**Expected:** Table does not re-fetch on every keystroke; waits ~300ms after last keystroke before sending request
**Why human:** Debounce timing is a runtime behavior

#### 5. Suspend flow and status badge update

**Test:** On `/admin/users`, click the three-dot action menu on a non-admin active user. Click "계정 정지". Confirm the modal. Observe the user's status badge.
**Expected:** Status badge changes from green "active" to yellow "suspended". The action menu on the same row now shows "정지 해제" instead of "계정 정지".
**Why human:** UI re-render after optimistic API call requires visual confirmation

#### 6. Admin self-protection

**Test:** Find the row for the currently-logged-in admin user (admin@example.com) on `/admin/users`
**Expected:** No three-dot action button is rendered for that row (the `isSelf` guard returns null from `UserActionMenu`)
**Why human:** Requires knowing which row corresponds to the current user to visually confirm button absence

---

### Summary

Phase 2 backend and frontend are fully implemented with no stubs or orphaned artifacts. All 18 automated must-haves pass across all three verification levels (exists, substantive, wired). All 10 requirements (DASH-01 through DASH-05, USER-01 through USER-05) are satisfied. TypeScript type checks pass cleanly across the entire workspace.

The only open item is 6 human-verification tests covering visual rendering, animation timing, and runtime behavior — none of which can be assessed through static analysis. One of these (Recharts React 19 compatibility) carries a warning because of the documented potential for a blank chart, though the `react-is@19.2.4` dependency is the prescribed fix.

**Phase 2 goal is effectively achieved.** Proceed to human verification to confirm rendering and interactive flows.

---

_Verified: 2026-03-11T03:28:00Z_
_Verifier: Claude (gsd-verifier)_
