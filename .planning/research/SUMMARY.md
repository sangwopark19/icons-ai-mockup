# Project Research Summary

**Project:** AI Mockup Generation App — Admin Panel Extension
**Domain:** SaaS admin panel (additive milestone on existing Next.js + Fastify monorepo)
**Researched:** 2026-03-10
**Confidence:** HIGH (architecture is well-understood; one MEDIUM area: Recharts React 19 compatibility)

## Executive Summary

This milestone adds an admin panel to an existing AI mockup generation SaaS app. The codebase is a pnpm monorepo with Next.js 16.1.0 + React 19 on the frontend and Fastify 5.1.0 + Prisma 6.2.0 + BullMQ on the backend. Because the full stack is already locked, research focused only on admin-specific additions: UI primitives (shadcn/ui + TanStack Table), charting (Recharts 2.15.1 pinned), queue monitoring (@bull-board/fastify), and the role/auth extension. No new framework decisions are needed — this is a surgical extension of an already-working system.

The recommended approach is to extend the existing app rather than introduce any admin framework or separate deployment. Admin routes live at `/admin/*` inside `apps/web` (Next.js route group `(admin)/`) and admin API routes live at `/api/admin/*` inside `apps/api` (Fastify sub-plugin with a `requireAdmin` preHandler). Security is layered: Next.js edge middleware handles UX redirect, but the Fastify backend is the authoritative security boundary. A single Prisma migration adds `User.role` and the `ApiKey` table, unlocking all other features.

The dominant risk is auth security: the most common failure mode for admin panels is implementing role checks on the frontend only, leaving backend API endpoints unprotected. CVE-2025-29927 specifically demonstrates that Next.js middleware alone is not sufficient. Every admin endpoint on Fastify must independently enforce `requireAdmin`. A secondary risk is the GeminiService key source switch — migrating from `process.env.GEMINI_API_KEY` to a DB-backed active key is the highest-risk integration point and must be designed carefully to avoid silent fallback to the environment variable.

## Key Findings

### Recommended Stack

The existing stack already provides everything needed for admin UI: shadcn/ui patterns are installed (CVA + tailwind-merge + clsx), TanStack React Query 5.x handles server state, react-hook-form + zod handle forms, and lucide-react provides icons. Three new packages are needed: `recharts@2.15.1` (pinned — 3.x has an active blank-chart regression with React 19), `react-is@19.0.0` (required pnpm override for Recharts compatibility), `sonner` (toast notifications; shadcn/ui deprecated its own toast in Feb 2025), and `@bull-board/api @bull-board/fastify` for queue monitoring. TanStack Table v8.21.3 is the headless table engine — v9 is alpha and must not be used.

**Core technologies:**
- `recharts@2.15.1` (pinned): dashboard charts — pin to 2.x, add `react-is@19.0.0` pnpm override or charts render blank
- `@tanstack/react-table@8.21.3`: user/content/api-key tables — headless, Tailwind-friendly, React 19 compatible
- `@bull-board/fastify@6.20.3`: queue monitoring UI embedded in Fastify at `/admin/queues` — zero custom UI needed
- `sonner`: toast notifications for admin actions — replacement for deprecated shadcn/ui toast
- `shadcn/ui CLI components`: chart, table, badge, dialog, select — copy-paste model, no npm version pinning needed

### Expected Features

The PROJECT.md scope is explicit. All P1 features must ship in v1. The dependency chain is rigid: role system must be complete before any other feature can be tested.

**Must have (table stakes — P1):**
- Role gate (`/admin/*` protected, `requireAdmin` on all Fastify admin endpoints)
- Dashboard overview (user count, generation count, queue depth, failure count, polled every 30s)
- User list with search and pagination
- Account suspend / reactivate (soft suspend via `status` field)
- Account soft delete (anonymize PII, retain generation records)
- Generation job list for all users, filterable by status
- Failed job detail with error reason and retry button
- API key list with alias and active flag
- Add / delete API key
- Activate API key with single-active-key enforcement (triggers GeminiService refactor)

**Should have (differentiators — P2, after core is stable):**
- Per-API-key usage counter
- Content browsing by user (for abuse investigation)
- Storage usage by user
- Generation failure rate trend stat

**Defer to v2+:**
- Bulk image delete (high risk — needs batched approach and background job)
- Queue depth trend chart (requires BullMQ metrics time series infrastructure)
- Audit log / granular RBAC / email notifications

### Architecture Approach

The admin panel is a pure extension of the existing system. Two new structural additions are required: a `(admin)/` route group in Next.js with a `layout.tsx` containing `AdminGuard` (client-side double-check), and `admin.routes.ts` + `admin.service.ts` in Fastify. All cross-user queries live exclusively in `AdminService` — existing user-scoped services are never modified to add cross-user variants. The Fastify `requireAdmin` decorator runs after `authenticate` in every admin route's `preHandler` array. Next.js edge middleware provides only a fast UX redirect, not security enforcement.

**Major components:**
1. `middleware.ts` (Next.js edge) — UX redirect for non-admins attempting `/admin/*` routes; reads JWT from `access-token` cookie
2. `(admin)/layout.tsx` + `AdminGuard` — client-side role double-check using Zustand auth store; prevents flash of admin UI
3. `requireAdmin` Fastify decorator — authoritative backend role check; must run after `authenticate` on every `/api/admin/*` route
4. `admin.routes.ts` — all admin endpoints in one file; registered under `/api/admin` prefix; enables full audit of admin surface
5. `AdminService` — all cross-user Prisma queries isolated here; `GenerationService` and other user services remain user-scoped
6. `ApiKey` Prisma model — stores Gemini keys with encryption; `GeminiService` reads active key from DB instead of env var
7. `User.role` enum migration — single Prisma migration adds `role: 'user' | 'admin'`; JWT payload includes role; no extra DB lookup per request because existing `getUserFromToken` re-queries DB

### Critical Pitfalls

1. **Middleware-only admin protection (CVE-2025-29927 class)** — Next.js middleware is bypassed in known attack classes. Mitigate by treating middleware as UX-only and enforcing `requireAdmin` on every Fastify admin route. Pin to Next.js >= 15.2.3. Strip `x-middleware-subrequest` at nginx.

2. **Missing `requireAdmin` on any single Fastify admin route (IDOR)** — Copying `preHandler: [fastify.authenticate]` from existing routes and forgetting the role check exposes all admin data to any authenticated user. Mitigate by registering admin routes as a sub-plugin with `fastify.addHook('preHandler', fastify.requireAdmin)` so the check is impossible to skip.

3. **Gemini API keys stored as plaintext in DB** — DB backups, Prisma Studio, and query logs expose keys. Mitigate by encrypting key values at rest (AES-256-GCM, key from env var). Never return full key value in API responses — return only last 4 characters.

4. **GeminiService fallback to `process.env.GEMINI_API_KEY`** — Silent fallback hides misconfiguration and bypasses the key management system. Throw a clear error if no active DB key is found; never silently fall back.

5. **Bulk admin delete causing DB lock and file orphaning** — `prisma.generation.deleteMany` on unbounded sets causes table locks; cascade deletes remove DB rows but leave files on disk. Mitigate by batching deletions (100 rows at a time), collecting file paths before deleting DB rows, and running file cleanup after DB commit or in a background BullMQ job.

## Implications for Roadmap

Based on the dependency graph from FEATURES.md and the build order from ARCHITECTURE.md, four phases are recommended. The constraint is strict: Phase 1 is the prerequisite for everything. No admin feature can be built or tested without the role system in place.

### Phase 1: Foundation — Role System and Auth Gates

**Rationale:** The role system is the hard prerequisite for all admin features. Without `User.role` in the DB, the JWT payload, and the `requireAdmin` Fastify decorator, no admin endpoint can be created safely. This phase has the highest security stakes — getting it wrong creates vulnerabilities that are expensive to remediate.

**Delivers:** A secure admin access control layer. After this phase, admin API endpoints exist and are protected. No UI exists yet — this phase is backend + auth infrastructure only.

**Addresses features from FEATURES.md:**
- Role gate (P1): Prisma migration for `User.role`, `requireAdmin` Fastify decorator, `middleware.ts` Next.js edge guard, `AdminGuard` component, `(admin)/layout.tsx`
- JWT role payload: update `authService.login()` and `getUserFromToken` to include and select `role`
- Auth store role extension: add `role` to Zustand `User` type, set `access-token` cookie on login for edge middleware

**Avoids:**
- CVE-2025-29927 class (Pitfall 1): backend check is authoritative, middleware is UX-only
- IDOR via missing role check (Pitfall 4): `requireAdmin` registered as sub-plugin hook, impossible to skip
- Stale role in JWT (Pitfall 2): `getUserFromToken` re-queries DB; `role` field must be in SELECT

**Research flag:** Standard patterns — no phase-level research needed. Fastify decorator chain and Next.js middleware patterns are well-documented in ARCHITECTURE.md.

### Phase 2: Dashboard and User Management

**Rationale:** The dashboard overview and user management features are the first things an admin needs to operate the service. They share no complex new infrastructure — the dashboard queries existing tables with aggregate counts, and user management is CRUD on the `User` model. Building these together delivers a functional admin panel with operational value.

**Delivers:** Admin can see system health at a glance, find users, suspend/reactivate accounts, and delete users with proper soft-delete semantics.

**Addresses features from FEATURES.md:**
- Dashboard overview (P1): stats API endpoint, shadcn/ui Cards + Recharts chart, React Query polling at 30s interval
- User list with search + filter + pagination (P1): TanStack Table v8, server-side pagination
- Account suspend / reactivate (P1): `status` field on User, auth middleware rejects suspended tokens with `ACCOUNT_SUSPENDED` code
- Account soft delete (P1): `deletedAt` timestamp, PII anonymization, referential integrity preserved

**Uses from STACK.md:** `recharts@2.15.1` with `react-is@19.0.0` pnpm override, `@tanstack/react-table@8.21.3`, shadcn/ui chart + table + badge + dialog, `sonner`

**Avoids:**
- Dashboard stats performance trap: use indexed `COUNT` queries; add DB indexes on `generations.status` and `generations.created_at`; cache stats in Redis with 60s TTL
- User list pagination: always use `skip` / `take` — never `prisma.user.findMany()` without bounds
- User suspension must be enforced at API level (not just UI): check `status !== 'suspended'` in `getUserFromToken`

**Research flag:** Standard patterns — well-documented SaaS user management. No additional research needed.

### Phase 3: Generation Jobs and Queue Monitoring

**Rationale:** Generation job visibility is required for diagnosing failures. This phase delivers the generation job list, failed job detail with retry, and queue monitoring via Bull Board. These three features are tightly coupled (all relate to BullMQ) so building them together avoids duplicate queue connection setup.

**Delivers:** Admin can see all generation jobs across all users, inspect failed job error reasons, retry failed jobs, and monitor queue depth via Bull Board UI.

**Addresses features from FEATURES.md:**
- Generation job list for all users, filterable by status (P1): `AdminService.listGenerations()` cross-user query
- Failed job detail with error reason and retry (P1): `queue.getJob(id).retry()` pattern, BullMQ queue instance reused from `apps/api/src/lib/queue.ts`
- Queue monitoring via Bull Board (P1): mount `@bull-board/fastify` at `/admin/queues`, protect with `requireAdmin` preHandler, iframe or redirect from Next.js admin

**Avoids:**
- Do not instantiate a new `Queue` object in route handlers — reuse the existing instance to avoid creating redundant Redis connections
- Use `getJobCounts()` for queue counts on the dashboard; only fetch individual job objects on demand — avoid fetching all jobs
- Gemini key switch mid-request: the active key must be read and pinned at job start; key switch only affects new enqueued jobs

**Research flag:** Standard patterns for BullMQ + Bull Board. Fastify adapter is well-documented. No additional research needed.

### Phase 4: Gemini API Key Management

**Rationale:** This phase is deferred to last because it requires a GeminiService refactor (switching from env var to DB-backed active key). This is the highest-risk integration point — a bug here breaks all image generation for all users. Building it last means the admin panel is otherwise functional and the risk is isolated.

**Delivers:** Admin can register multiple Gemini API keys, activate one at a time, and rotate keys manually. GeminiService reads the active key from DB instead of from `process.env.GEMINI_API_KEY`.

**Addresses features from FEATURES.md:**
- API key list with alias and active flag (P1)
- Add / delete API key (P1)
- Activate API key with single-active-key enforcement (P1)
- GeminiService refactor: `AdminService.getActiveApiKey()`, short in-memory TTL (30s) or per-job DB read

**Avoids:**
- Plaintext key storage (Pitfall 3): encrypt at rest with AES-256-GCM, key from env var; return only last 4 chars in API responses
- Silent env var fallback (Pitfall 4): throw clear error if no active DB key found
- Key switching mid-request (integration gotcha): worker pins active key at job start

**Research flag:** Needs careful implementation review during planning — encryption pattern (AES-256-GCM with `node:crypto`) and GeminiService refactor have non-trivial integration details. Consider requesting a focused planning session on the encryption approach.

### Phase Ordering Rationale

- **Security gates before features:** Phase 1 must precede everything. The `requireAdmin` infrastructure must exist before any admin endpoint is created — building endpoints before the gate is in place creates a window of vulnerability.
- **Low-risk before high-risk:** Phases 2 and 3 operate on existing data models (User, Generation) with read-heavy queries. Phase 4 modifies the live generation pipeline and carries the highest blast radius. Deferring it to last minimizes risk.
- **BullMQ features grouped:** Phases 3 and 4 both touch BullMQ / GeminiService. Grouping queue monitoring (Phase 3) before key management (Phase 4) means the admin already has visibility into generation failures before making changes to the generation pipeline.
- **GeminiService dependency:** Phase 4 depends on Phase 3's queue visibility to validate that key switches are working correctly. The admin can watch the generation queue after switching a key to confirm jobs are succeeding.

### Research Flags

Needs focused planning attention:
- **Phase 4:** Gemini API key encryption implementation — AES-256-GCM with `node:crypto`, migration from existing env-var keys to DB-stored encrypted keys, GeminiService refactor boundary

Standard patterns (no additional research needed):
- **Phase 1:** Fastify decorator chain and Next.js middleware RBAC are well-documented in ARCHITECTURE.md
- **Phase 2:** SaaS user management CRUD is established; Recharts + pnpm override is documented in STACK.md
- **Phase 3:** Bull Board Fastify adapter has complete documentation; BullMQ retry patterns are standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Recharts 2.x + React 19 compatibility requires pnpm override (MEDIUM — fix is documented but not from official Recharts docs). All other stack decisions are HIGH confidence from official sources. |
| Features | HIGH | PROJECT.md provides explicit scope. SaaS admin panel patterns are well-established. Feature priority and dependency graph are unambiguous. |
| Architecture | HIGH | Existing codebase was reviewed directly (`auth.plugin.ts`, `schema.prisma`, `server.ts`). Build order derived from actual dependency graph. |
| Pitfalls | HIGH | CVE-2025-29927 is documented from multiple security sources. Other pitfalls are derived from existing codebase analysis and established security patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **Recharts fix durability:** The `react-is@19.0.0` pnpm override fix is documented in a community blog post, not official Recharts docs. Verify the override works in this specific monorepo setup before building chart-heavy dashboard pages. Test immediately after installation.

- **Gemini key encryption approach:** Research identified AES-256-GCM via `node:crypto` as the approach but did not specify the exact implementation pattern (IV storage, key derivation from env var). This needs a focused planning-phase decision before Phase 4 implementation begins.

- **`access-token` cookie strategy:** The existing app uses localStorage/Zustand for JWT storage. Next.js edge middleware cannot read localStorage. The architecture plan requires setting an `access-token` cookie on login. This is a change to the existing auth flow and needs validation that it doesn't break existing mobile or API clients.

- **First admin bootstrap:** The stated approach is `UPDATE "User" SET role = 'admin' WHERE email = '...'` directly in the DB. This should be documented as a runbook step in the codebase.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/plugins/auth.plugin.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/server.ts`, `apps/api/src/routes/generation.routes.ts`
- Next.js middleware matcher docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
- shadcn/ui Tailwind v4 docs: https://ui.shadcn.com/docs/tailwind-v4
- shadcn/ui React 19 docs: https://ui.shadcn.com/docs/react-19
- TanStack Table releases (v8.21.3 stable, v9 alpha): https://github.com/TanStack/table/releases
- @bull-board/fastify npm (v6.20.3): https://www.npmjs.com/package/@bull-board/fastify
- Bull Board GitHub: https://github.com/felixmosh/bull-board
- CVE-2025-29927 Next.js Middleware Authorization Bypass: ProjectDiscovery, Datadog Security Labs, JFrog Blog
- Prisma Migrate Dev vs. Deploy: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production

### Secondary (MEDIUM confidence)
- Recharts + React 19 pnpm override fix: https://www.bstefanski.com/blog/recharts-empty-chart-react-19
- Fastify preHandler authorization pattern: https://www.permit.io/blog/how-to-create-an-authorization-middleware-for-fastify
- Next.js RBAC App Router: https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router

### Tertiary (LOW-MEDIUM confidence)
- Recharts issue #6857 (blank chart React 19 regression): https://github.com/recharts/recharts/issues/6857 — confirmed active Jan 2026, fix status may have changed by implementation time; verify before proceeding

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
