---
phase: 02-dashboard-and-user-management
plan: "01"
subsystem: backend-api
tags: [admin, service, routes, auth, api-client]
dependency_graph:
  requires: [01-auth-foundation]
  provides: [admin-service, dashboard-routes, user-routes, adminApi-client]
  affects: [02-02-dashboard-frontend, 02-03-user-management-frontend]
tech_stack:
  added: []
  patterns: [singleton-service, fastify-sub-plugin, tdd-red-green, soft-delete, pii-anonymization]
key_files:
  created:
    - apps/api/src/services/admin.service.ts
    - apps/api/src/services/__tests__/admin.service.test.ts
    - apps/api/src/routes/admin/dashboard.routes.ts
    - apps/api/src/routes/admin/users.routes.ts
  modified:
    - apps/api/src/routes/admin/index.routes.ts
    - apps/api/src/plugins/auth.plugin.ts
    - apps/web/src/lib/api.ts
key_decisions:
  - "AdminService uses Promise.all for parallel DB queries in getDashboardStats for performance"
  - "softDeleteUser uses prisma.user.update (not delete) to preserve generation history"
  - "Auth suspend/delete check placed after getUserFromToken in authenticate decorator — single security boundary"
  - "activeApiKeys returns null with Phase 4 comment — ApiKey model does not exist yet"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-11"
  tasks_completed: 3
  files_changed: 7
  tests_added: 15
---

# Phase 2 Plan 01: Backend API for Dashboard and User Management Summary

**One-liner:** AdminService singleton with 6 methods, Fastify admin routes for dashboard/users, suspended/deleted auth gate, and typed adminApi client.

## What Was Built

### AdminService (`apps/api/src/services/admin.service.ts`)
Six methods covering all dashboard and user management requirements:
1. `getDashboardStats()` — parallel Promise.all queries returning userCount (excluding deleted), generationCount, failedJobCount (last 24h), storageBytes, queueDepth (waiting+active+delayed), activeApiKeys (null), and yesterday deltas
2. `getHourlyFailureChart()` — raw SQL with `date_trunc('hour')` returning `{ hour: ISO string, count: number }[]`, bigint safely converted to Number
3. `listUsers(params)` — paginated with case-insensitive email filter, role/status filters, same where applied to findMany and count
4. `updateUserStatus(id, status)` — sets active or suspended
5. `updateUserRole(id, role)` — sets admin or user
6. `softDeleteUser(id)` — sets status='deleted', anonymizes email/name/passwordHash, never calls prisma.user.delete

### Dashboard Routes (`apps/api/src/routes/admin/dashboard.routes.ts`)
- `GET /api/admin/dashboard/stats` — returns `{ success: true, data: DashboardStats }`
- `GET /api/admin/dashboard/chart` — returns `{ success: true, data: HourlyChartPoint[] }`

### User Management Routes (`apps/api/src/routes/admin/users.routes.ts`)
- `GET /api/admin/users` — paginated list with Zod query validation
- `PATCH /api/admin/users/:id/status` — toggle active/suspended
- `PATCH /api/admin/users/:id/role` — toggle admin/user
- `DELETE /api/admin/users/:id` — soft delete with PII anonymization

### Admin Index Routes (`apps/api/src/routes/admin/index.routes.ts`)
Registered dashboard and users as sub-plugins under `/dashboard` and `/users` prefixes.

### Auth Plugin (`apps/api/src/plugins/auth.plugin.ts`)
Added status check after `getUserFromToken` in the `authenticate` decorator:
- `status === 'suspended'` → 403 `ACCOUNT_SUSPENDED`
- `status === 'deleted'` → 403 `ACCOUNT_DELETED`

This is the authoritative security boundary — every authenticated request checks status.

### Admin API Client (`apps/web/src/lib/api.ts`)
Added `adminApi` namespace with 6 typed functions: `getDashboardStats`, `getFailureChart`, `listUsers`, `updateUserStatus`, `updateUserRole`, `softDeleteUser`. Added TypeScript interfaces: `DashboardStats`, `HourlyChartPoint`, `AdminUser`, `Pagination`. Updated default export to include `adminApi`.

## Test Results
- 15 new tests for AdminService (all pass)
- 2 existing auth.service tests (still pass)
- 4 existing auth.plugin tests (still pass)
- **21 total tests pass**

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Created files exist:
- apps/api/src/services/admin.service.ts: FOUND
- apps/api/src/services/__tests__/admin.service.test.ts: FOUND
- apps/api/src/routes/admin/dashboard.routes.ts: FOUND
- apps/api/src/routes/admin/users.routes.ts: FOUND

### Commits:
- 2f5159a: feat(02-01): create AdminService with all 6 business logic methods
- f88bb82: feat(02-01): create dashboard and user admin routes, register sub-plugins
- 04027b5: feat(02-01): add suspended/deleted auth gate and adminApi client

## Self-Check: PASSED
