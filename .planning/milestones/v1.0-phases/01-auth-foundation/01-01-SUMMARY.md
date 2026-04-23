---
phase: 01-auth-foundation
plan: 01
subsystem: auth
tags: [prisma, jwt, fastify, rbac, vitest, postgresql]

# Dependency graph
requires: []
provides:
  - UserRole (user/admin) and UserStatus (active/suspended/deleted) Prisma enums with migration
  - role and status fields on User model
  - JWT access token payload includes role field
  - requireAdmin Fastify decorator (401 no auth, 403 non-admin, pass for admin)
  - GET /api/admin/health endpoint secured by requireAdmin
  - Dev admin seed: admin@example.com role=admin
  - vitest test infrastructure with 6 passing unit tests
affects:
  - 02-admin-ui
  - 03-content-management
  - 04-api-key-management

# Tech tracking
tech-stack:
  added: [vitest@4.0.18]
  patterns: [TDD red-green for auth middleware, fastify.decorate for auth guards, preHandler hook for route-level authorization]

key-files:
  created:
    - apps/api/prisma/seed.ts
    - apps/api/prisma/migrations/20260310080000_add_role_status/migration.sql
    - apps/api/vitest.config.ts
    - apps/api/src/routes/admin/index.routes.ts
    - apps/api/src/plugins/__tests__/auth.plugin.test.ts
    - apps/api/src/services/__tests__/auth.service.test.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/services/auth.service.ts
    - apps/api/src/plugins/auth.plugin.ts
    - apps/api/src/server.ts
    - apps/api/package.json

key-decisions:
  - "requireAdmin calls fastify.authenticate first then checks user.role === 'admin' — ensures single responsibility"
  - "Named export authPlugin added alongside default fp-wrapped export for test registration without fp overhead"
  - "getUserFromToken fetches full User from DB so role is always current even without re-issuing tokens"
  - "Temporary Docker postgres started locally for migration — production uses docker-compose postgres"

patterns-established:
  - "Admin routes use addHook preHandler with fastify.requireAdmin at the route plugin level"
  - "Auth decorators live in auth.plugin.ts as fastify.decorate calls — consumers use fastify.requireAdmin in addHook"
  - "Test mocks for prisma and config use vi.mock with module path relative to test file"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 20min
completed: 2026-03-10
---

# Phase 1 Plan 1: Auth Foundation Backend Summary

**Prisma UserRole/UserStatus enums migrated, JWT payload extended with role, Fastify requireAdmin decorator, and admin route secured with 6 vitest unit tests passing**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-10T17:00:00Z
- **Completed:** 2026-03-10T17:05:30Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Prisma schema migration adds UserRole (user/admin) and UserStatus (active/suspended/deleted) enums with role/status fields on User model (defaults: user, active)
- Dev admin seed script creates/upserts admin@example.com with role=admin (idempotent via upsert)
- JWT access tokens now include `role` field in payload; getUserFromToken fetches full User from DB ensuring role is always current
- requireAdmin Fastify decorator enforces 401 (unauthenticated) and 403 (non-admin) correctly
- GET /api/admin/health secured with requireAdmin, returns `{ success: true, data: { status: 'ok' } }` for admins
- vitest configured and 6 unit tests pass (2 JWT payload, 4 requireAdmin behavior)

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema migration + seed script** - `babc3da` (feat)
2. **Task 2: JWT role extension + requireAdmin + admin routes + tests** - `594130f` (feat)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Added UserRole/UserStatus enums and role/status fields to User model
- `apps/api/prisma/migrations/20260310080000_add_role_status/migration.sql` - Migration SQL
- `apps/api/prisma/seed.ts` - Upserts admin@example.com with role=admin
- `apps/api/src/services/auth.service.ts` - Added role to JWTPayload and generateAccessToken
- `apps/api/src/plugins/auth.plugin.ts` - Added requireAdmin decorator and named export
- `apps/api/src/routes/admin/index.routes.ts` - Admin route plugin with preHandler requireAdmin hook and GET /health
- `apps/api/src/server.ts` - Registered adminRoutes at /api/admin prefix
- `apps/api/vitest.config.ts` - Vitest configuration
- `apps/api/package.json` - Added prisma seed config, test script, vitest dev dependency
- `apps/api/src/plugins/__tests__/auth.plugin.test.ts` - requireAdmin unit tests (4 tests)
- `apps/api/src/services/__tests__/auth.service.test.ts` - JWT role payload tests (2 tests)

## Decisions Made
- Named export `authPlugin` added alongside default fp-wrapped export to allow test registration without fastify-plugin overhead
- `getUserFromToken` fetches full User from DB so old tokens without `role` still work correctly
- Temporary Docker postgres container started for local migration execution (not committed)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restarted Docker Desktop to access Docker daemon**
- **Found during:** Task 1 (Prisma migration)
- **Issue:** Docker daemon not running, preventing postgres container startup for migration
- **Fix:** Opened Docker Desktop app, waited for daemon to start, then proceeded
- **Files modified:** None
- **Verification:** `docker ps` returned successfully after restart
- **Committed in:** N/A (infrastructure setup, no code change)

---

**Total deviations:** 1 auto-fixed (1 blocking infrastructure)
**Impact on plan:** Minor — Docker Desktop startup is a local dev environment issue, no code changes required.

## Issues Encountered
- Prisma deprecated `package.json#prisma` config in favor of `prisma.config.ts` (v7 will remove it). Using current approach for now — migration to prisma.config.ts can be deferred.
- Pre-existing TypeScript errors in unrelated files (edit.routes.ts, generation.routes.ts, lib/prisma.ts, worker.ts) were resolved by regenerating the Prisma client after migration.

## User Setup Required
None - no external service configuration required. Dev admin account (admin@example.com) is created via `pnpm --filter api prisma db seed`.

## Next Phase Readiness
- Backend auth foundation complete: requireAdmin is the authoritative security boundary for all /api/admin routes
- Phase 2 (Admin UI) can build on GET /api/admin/health as the first secured endpoint
- Admin login flow works with existing auth endpoints — admin@example.com can log in and receive JWT with role=admin
- Concern: Existing auth uses localStorage/Zustand for JWT — Next.js edge middleware needs access-token cookie for UX redirect; validate this doesn't break existing clients before implementing

## Self-Check: PASSED

All created files confirmed present. All task commits verified:
- `babc3da`: feat(01-01): Prisma schema + seed
- `594130f`: feat(01-01): JWT role + requireAdmin + tests

---
*Phase: 01-auth-foundation*
*Completed: 2026-03-10*
