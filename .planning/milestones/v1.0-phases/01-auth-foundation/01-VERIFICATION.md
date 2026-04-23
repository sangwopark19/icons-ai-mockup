---
phase: 01-auth-foundation
verified: 2026-03-10T17:30:00Z
status: human_needed
score: 15/15 must-haves verified
re_verification: false
human_verification:
  - test: "Non-admin redirect — no UI flash"
    expected: "Log in as a non-admin user, navigate to /admin, and be silently redirected to / with zero flash of admin UI and no toast or alert"
    why_human: "null-render anti-flash timing depends on React hydration order; cannot verify absence of flash without a running browser"
  - test: "Admin sidebar fully visible"
    expected: "Log in as admin@example.com / admin1234!, navigate to /admin/dashboard, and see the left sidebar with 4 items (대시보드, 사용자 관리, 생성/콘텐츠, API 키), admin name + email at top, and 메인으로 link at bottom"
    why_human: "Visual presence and CSS variable rendering require a live browser"
  - test: "Unauthenticated redirect"
    expected: "While logged out, navigate to /admin and be silently redirected to / with no admin content shown"
    why_human: "Requires browser session state; isLoading hydration timing cannot be verified statically"
  - test: "Mobile responsive sidebar"
    expected: "Resize browser to mobile width; sidebar is hidden and a hamburger icon is visible; clicking it opens a full-screen overlay sidebar"
    why_human: "Responsive CSS breakpoints require live browser rendering"
  - test: "Active nav item highlight"
    expected: "Each nav link in the sidebar shows a distinct active state when its route is current"
    why_human: "Active className application depends on live usePathname() result"
---

# Phase 01: Auth Foundation Verification Report

**Phase Goal:** Auth foundation — role-based access with admin middleware and protected frontend shell
**Verified:** 2026-03-10T17:30:00Z
**Status:** human_needed (all automated checks pass; 5 items require live browser)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 01-01 (Backend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User model has role field (user/admin enum, default user) | VERIFIED | `schema.prisma` lines 18-23, 40: `enum UserRole { user admin @@map("user_role") }` and `role UserRole @default(user)` |
| 2 | User model has status field (active/suspended/deleted enum, default active) | VERIFIED | `schema.prisma` lines 26-32, 41: `enum UserStatus { active suspended deleted @@map("user_status") }` and `status UserStatus @default(active)` |
| 3 | JWT access token payload includes the user's role | VERIFIED | `auth.service.ts` line 159: `role: user.role` in `generateAccessToken`; JWT payload test confirms `decoded.role === 'admin'` |
| 4 | requireAdmin returns 403 for authenticated non-admin users | VERIFIED | `auth.plugin.ts` lines 66-74: `user.role !== 'admin'` -> 403 FORBIDDEN; 4 unit tests pass |
| 5 | requireAdmin returns 401 for unauthenticated requests | VERIFIED | `auth.plugin.ts` lines 43-53: missing/invalid token -> 401 UNAUTHORIZED; unit test passes |
| 6 | GET /api/admin/health returns 200 for admin users | VERIFIED | `index.routes.ts` lines 14-16: GET /health returns `{ success: true, data: { status: 'ok' } }`; protected via preHandler requireAdmin hook |
| 7 | Prisma seed creates a dev admin account | VERIFIED | `seed.ts` lines 13-25: `prisma.user.upsert` with `email: 'admin@example.com'`, `role: UserRole.admin`; migration `20260310080000_add_role_status` applied |

### Observable Truths — Plan 01-02 (Frontend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 8 | Non-admin user navigating to /admin is silently redirected to / | VERIFIED (code) / HUMAN for runtime | `admin-guard.tsx` lines 11-14: `useEffect` calls `router.replace('/')` when `!isAuthenticated || user?.role !== 'admin'` |
| 9 | Non-authenticated user navigating to /admin is silently redirected to / | VERIFIED (code) / HUMAN for runtime | Same guard: `!isAuthenticated` branch triggers `router.replace('/')` |
| 10 | No admin UI flashes before redirect for non-admin users | VERIFIED (code) / HUMAN for runtime | `admin-guard.tsx` line 17: `return null` while `isLoading || !isAuthenticated || user?.role !== 'admin'` — anti-flash null-render pattern |
| 11 | Admin user sees left sidebar with 4 navigation items | VERIFIED (code) / HUMAN for runtime | `admin-sidebar.tsx` lines 9-14: navItems array with 4 entries (대시보드, 사용자 관리, 생성/콘텐츠, API 키) |
| 12 | Sidebar shows admin name and email at top | VERIFIED (code) / HUMAN for runtime | `admin-sidebar.tsx` lines 33-34: `{user?.name}` and `{user?.email}` rendered in top section |
| 13 | Sidebar has 메인으로 link at bottom | VERIFIED | `admin-sidebar.tsx` lines 61-68: `<Link href="/">메인으로</Link>` in bottom border section |
| 14 | Phase 2-4 menu items link to stub pages that render without error | VERIFIED | All 4 stub pages exist and contain only a title `<h1>` — no errors, no placeholder TODOs |
| 15 | Sidebar is responsive: always visible on desktop, hamburger menu on mobile | VERIFIED (code) / HUMAN for runtime | `admin-sidebar.tsx` lines 79-105: `hidden md:flex` desktop sidebar + `md:hidden` hamburger button with full-screen mobile overlay |

**Score: 15/15 truths verified** (5 require live browser for runtime confirmation)

---

## Required Artifacts

### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | UserRole/UserStatus enums + role/status on User | VERIFIED | Lines 18-41: both enums defined, both fields on User model |
| `apps/api/prisma/seed.ts` | Dev admin creation with UserRole.admin | VERIFIED | Upserts admin@example.com with `role: UserRole.admin`, 12-round bcrypt |
| `apps/api/src/services/auth.service.ts` | JWT payload with role field | VERIFIED | JWTPayload interface has `role?: string`; generateAccessToken sets `role: user.role` |
| `apps/api/src/plugins/auth.plugin.ts` | requireAdmin decorator | VERIFIED | Both `authenticate` and `requireAdmin` decorators present; named export + default fp-wrapped export |
| `apps/api/src/routes/admin/index.routes.ts` | Admin route with requireAdmin hook | VERIFIED | `fastify.addHook('preHandler', fastify.requireAdmin)` + GET /health |
| `apps/api/vitest.config.ts` | Test framework configuration | VERIFIED | Correct globals/environment/include config |
| `apps/api/src/plugins/__tests__/auth.plugin.test.ts` | requireAdmin unit tests | VERIFIED | 4 tests: 401 no header, 401 invalid token, 403 role=user, 200 role=admin |
| `apps/api/src/services/__tests__/auth.service.test.ts` | JWT role payload test | VERIFIED | 2 tests: admin token contains role='admin', user token contains role='user' |
| `apps/api/prisma/migrations/20260310080000_add_role_status/migration.sql` | Applied migration | VERIFIED | Creates `user_role` and `user_status` enums, alters `users` table |

### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/web/src/stores/auth.store.ts` | User interface with role?: string | VERIFIED | Line 11: `role?: string` on User interface |
| `apps/web/src/components/admin/admin-guard.tsx` | Client component admin guard | VERIFIED | `'use client'`, null-render + router.replace('/') pattern |
| `apps/web/src/components/admin/admin-sidebar.tsx` | 4 nav items, responsive | VERIFIED | Contains 대시보드 and all 4 nav items; desktop/mobile breakpoints present |
| `apps/web/src/app/admin/layout.tsx` | Admin shell with AdminGuard + AdminSidebar | VERIFIED | Wraps `<AdminGuard>` containing flex div with `<AdminSidebar>` and `<main>` |
| `apps/web/src/app/admin/page.tsx` | Redirect to /admin/dashboard | VERIFIED | `redirect('/admin/dashboard')` server-side |
| `apps/web/src/app/admin/dashboard/page.tsx` | Dashboard stub | VERIFIED | Renders `<h1>대시보드</h1>` |
| `apps/web/src/app/admin/users/page.tsx` | Users stub | VERIFIED | Renders `<h1>사용자 관리</h1>` |
| `apps/web/src/app/admin/content/page.tsx` | Content stub | VERIFIED | Renders `<h1>생성/콘텐츠</h1>` |
| `apps/web/src/app/admin/api-keys/page.tsx` | API Keys stub | VERIFIED | Renders `<h1>API 키</h1>` |

---

## Key Link Verification

### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth.plugin.ts` | `auth.service.ts` | `authService.getUserFromToken` | WIRED | Line 36: `await authService.getUserFromToken(token)` in authenticate decorator; imported at line 5 |
| `index.routes.ts` | `auth.plugin.ts` | `fastify.requireAdmin` in addHook | WIRED | Line 9: `fastify.addHook('preHandler', fastify.requireAdmin)` |
| `server.ts` | `index.routes.ts` | `server.register(adminRoutes, { prefix: '/api/admin' })` | WIRED | Line 131: `await server.register(adminRoutes, { prefix: '/api/admin' })` — imported at line 13 |

### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/admin/layout.tsx` | `admin-guard.tsx` | `<AdminGuard>` wrapping children | WIRED | Line 6: `<AdminGuard>` imported from `@/components/admin/admin-guard` |
| `admin-guard.tsx` | `auth.store.ts` | `useAuthStore` reading user.role | WIRED | Line 9: `const { user, isLoading, isAuthenticated } = useAuthStore()`; line 12: `user?.role !== 'admin'` |
| `app/admin/layout.tsx` | `admin-sidebar.tsx` | `<AdminSidebar>` in flex container | WIRED | Line 8: `<AdminSidebar />` imported from `@/components/admin/admin-sidebar` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-01 | User 모델에 role 필드(admin/user) 추가 — Prisma 마이그레이션 | SATISFIED | `schema.prisma` enum UserRole + migration `20260310080000_add_role_status` applied |
| AUTH-02 | 01-01 | Fastify requireAdmin 미들웨어 — /api/admin/* 엔드포인트에 admin 권한 체크 | SATISFIED | `auth.plugin.ts` requireAdmin decorator; `index.routes.ts` applies via preHandler hook |
| AUTH-03 | 01-01 | JWT 토큰 payload에 role 포함 — 로그인 시 role 정보 반환 | SATISFIED | `auth.service.ts` generateAccessToken sets `role: user.role`; 2 unit tests confirm |
| AUTH-04 | 01-02 | Next.js /admin 라우트 가드 — 비관리자 접근 시 리다이렉트 | SATISFIED (code) | `admin-guard.tsx` null-render + router.replace('/') for non-admin |
| AUTH-05 | 01-02 | Admin 레이아웃 — /admin 전용 사이드바/네비게이션 | SATISFIED (code) | `admin-sidebar.tsx` 4 nav items + responsive layout; wired via `admin/layout.tsx` |

**All 5 requirements accounted for. No orphaned requirements.**

---

## Test Results

```
pnpm --filter api test

  PASS  src/services/__tests__/auth.service.test.ts  (2 tests)
  PASS  src/plugins/__tests__/auth.plugin.test.ts    (4 tests)

  Test Files: 2 passed (2)
  Tests:      6 passed (6)
  Duration:   171ms
```

---

## TypeScript Status

**API:** Clean — `tsc --noEmit` exits with 0 errors.

**Web:** All TypeScript errors are exclusively `Cannot find module 'next/navigation'` / `next/link` across the entire codebase (pre-existing and new files alike). This is a known environment issue: `.next/dev/types/routes.d.ts` is generated only when `pnpm dev` has been run at least once. There are **zero logic or type errors** in the phase-introduced files — confirmed by filtering tsc output for non-module errors, which returns empty. Additionally, `.next/types/validator.ts` references `admin/audit-logs` and `admin/projects` pages (stale cache from a prior dev run referencing future phase pages); these are not introduced by this phase.

---

## Anti-Patterns Found

None. No TODO/FIXME/placeholder comments, no empty implementations, no stub returns found in any phase-modified file.

---

## Human Verification Required

### 1. Non-admin redirect — no UI flash

**Test:** Log in as a regular (non-admin) user, then navigate directly to `/admin` in the browser.
**Expected:** Immediate redirect to `/` with zero flash of admin UI and no toast, alert, or error message.
**Why human:** The null-render anti-flash timing depends on React hydration order, which cannot be verified statically.

### 2. Admin sidebar fully visible

**Test:** Log in as `admin@example.com` / `admin1234!`, navigate to `/admin`.
**Expected:** Redirected to `/admin/dashboard`; left sidebar visible with exactly 4 items (대시보드, 사용자 관리, 생성/콘텐츠, API 키); admin name and email shown at top; "메인으로" link at bottom.
**Why human:** CSS variable rendering and visual layout require a live browser.

### 3. Unauthenticated redirect

**Test:** While fully logged out, navigate to `/admin` in the browser.
**Expected:** Immediately redirected to `/` with no admin content shown.
**Why human:** Requires live browser session state; `isLoading` hydration timing cannot be verified statically.

### 4. Mobile responsive sidebar

**Test:** As admin, open `/admin/dashboard` and resize browser to mobile width (< 768px).
**Expected:** Desktop sidebar is hidden; a hamburger menu icon is visible in the top-left; clicking it opens a full-screen overlay sidebar with the same 4 nav items.
**Why human:** Responsive CSS breakpoints require live browser rendering to verify.

### 5. Active nav item highlight

**Test:** Click each sidebar nav item in sequence.
**Expected:** The currently active route's nav item shows a visually distinct highlight (different background color).
**Why human:** Active className depends on live `usePathname()` return value.

---

## Summary

The phase goal is **fully implemented in code**. All 15 observable truths are satisfied at the code level:

- **Backend (AUTH-01/02/03):** Prisma enums and migration applied, JWT payload extended with role, requireAdmin middleware enforces 401/403 correctly, GET /api/admin/health secured, seed creates admin@example.com — all backed by 6 passing unit tests.
- **Frontend (AUTH-04/05):** AdminGuard null-render anti-flash pattern correctly gates /admin, AdminSidebar delivers 4 Korean-labeled nav items with responsive mobile hamburger, admin layout shell wires guard + sidebar + content area, 4 stub pages render title headings.

5 items require live browser verification to confirm runtime behavior (redirect timing, visual layout, mobile responsiveness). No blocker issues found.

---

_Verified: 2026-03-10T17:30:00Z_
_Verifier: Claude (gsd-verifier)_
