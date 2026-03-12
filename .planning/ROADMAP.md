# Roadmap: AI Mockup Admin Panel

## Overview

This milestone adds a secure admin panel to an existing AI mockup generation SaaS app. Starting from zero admin infrastructure, each phase builds on the previous: the role system comes first (because nothing else can be secured without it), then operational visibility (dashboard and user management), then generation and content oversight, and finally the highest-risk integration — Gemini API key management which refactors the live generation pipeline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Auth Foundation** - Role system, requireAdmin middleware, and /admin route guards (completed 2026-03-10)
- [ ] **Phase 2: Dashboard and User Management** - System health overview and full user CRUD
- [ ] **Phase 3: Generation and Content Monitoring** - Job monitoring, queue visibility, and content browsing/deletion
- [x] **Phase 4: API Key Management** - Multi-key Gemini management with GeminiService refactor (completed 2026-03-12)
- [x] **Phase 5: Dashboard Active Key Display Wiring** - DASH-04 frontend placeholder → real active key data (gap closure) (completed 2026-03-12)
- [x] **Phase 6: Edit-Mode API Call Count Fix** - edit.routes.ts edit-mode Gemini 호출 카운트 누락 수정 (gap closure) (completed 2026-03-12)

## Phase Details

### Phase 1: Auth Foundation
**Goal**: Admin access is secured at both the backend and frontend — only accounts with role=admin can reach any /admin route or /api/admin endpoint
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A non-admin user who navigates to /admin is redirected away without seeing any admin UI
  2. An authenticated non-admin calling any /api/admin/* endpoint receives 403 Forbidden
  3. An admin user can log in and see the /admin layout with sidebar navigation
  4. The JWT token returned on login includes the user's role
  5. Setting a DB account to role=admin immediately grants that account access on next login
**Plans:** 2/2 plans complete
Plans:
- [ ] 01-01-PLAN.md — Backend: Prisma schema migration (role+status), JWT role extension, requireAdmin middleware, admin routes, test infrastructure
- [ ] 01-02-PLAN.md — Frontend: Zustand role field, AdminGuard route protection, AdminSidebar navigation, admin layout, stub pages

### Phase 2: Dashboard and User Management
**Goal**: Admin can see system-wide health at a glance and take all user lifecycle actions from one place
**Depends on**: Phase 1
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, USER-01, USER-02, USER-03, USER-04, USER-05
**Success Criteria** (what must be TRUE):
  1. Admin can view a dashboard showing total users, total generations, failed job count, queue depth, storage usage, and active API key info — all auto-refreshing every 30 seconds
  2. Admin can browse all users with pagination and filter/search by email or account status
  3. Admin can suspend a user account, after which that user's API calls are rejected with a clear error
  4. Admin can soft-delete a user account, which anonymizes PII while retaining generation records
  5. Admin can change a user's role between admin and user
**Plans:** 4 plans
Plans:
- [ ] 02-01-PLAN.md — Backend: AdminService, dashboard/user routes, auth suspend check, adminApi client
- [ ] 02-02-PLAN.md — Dashboard frontend: KPI cards, failure chart, Recharts setup, 30s polling
- [ ] 02-03-PLAN.md — User management frontend: table, search/filter, action menu, confirm dialogs
- [ ] 02-04-PLAN.md — Visual and functional verification checkpoint

### Phase 3: Generation and Content Monitoring
**Goal**: Admin can monitor all generation jobs across users, diagnose failures, retry jobs, and browse or delete generated content
**Depends on**: Phase 2
**Requirements**: GEN-01, GEN-02, GEN-03, CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. Admin can view all generation jobs across all users with status filtering (pending, processing, completed, failed)
  2. Admin can open a failed job and see its full error reason, then trigger a retry from the admin UI
  3. Admin can browse all generated images searchable by user, date range, and project
  4. Admin can delete an individual image (removes both DB record and file from storage)
  5. Admin can view a specific user's complete generation history and execute a bulk delete by date/user/project filter
**Plans:** 5/6 plans executed
Plans:
- [ ] 03-01-PLAN.md — TDD Wave 0: RED tests for all AdminService generation/content methods
- [ ] 03-02-PLAN.md — Backend: AdminService generation methods + routes (GREEN tests for GEN-01/02/03)
- [ ] 03-03-PLAN.md — Backend: AdminService content methods + routes + adminApi client (GREEN tests for CONT-01/02/03/04)
- [ ] 03-04-PLAN.md — Frontend: Generation monitoring UI (tabbed page, table, detail modal, retry)
- [ ] 03-05-PLAN.md — Frontend: Content browsing/delete UI (image grid, lightbox, bulk delete)
- [ ] 03-06-PLAN.md — Visual and functional verification checkpoint

### Phase 4: API Key Management
**Goal**: Admin can manage multiple Gemini API keys in the DB and activate one at a time; GeminiService reads the active key from DB instead of the environment variable
**Depends on**: Phase 3
**Requirements**: KEY-01, KEY-02, KEY-03, KEY-04, KEY-05, KEY-06
**Success Criteria** (what must be TRUE):
  1. Admin can view all registered API keys showing alias, masked value (last 4 chars only), status, and call count
  2. Admin can add a new API key with an alias; the key is stored encrypted and never returned in full via API
  3. Admin can delete an API key (only if it is not currently active)
  4. Admin can activate a different key; only one key is active at a time and new generation jobs immediately use the newly active key
  5. Image generation continues to work end-to-end after switching the active key (no env var fallback)
**Plans:** 5/5 plans complete
Plans:
- [ ] 04-01-PLAN.md — TDD Wave 0: RED tests for crypto utility and AdminService API key methods
- [ ] 04-02-PLAN.md — Backend: Prisma ApiKey model, crypto utility, AdminService API key methods (GREEN)
- [ ] 04-03-PLAN.md — Backend: API key routes, GeminiService refactor, Worker integration (KEY-05)
- [ ] 04-04-PLAN.md — Frontend: API key management page (table, add/delete/activate modals)
- [ ] 04-05-PLAN.md — Visual and functional verification checkpoint

### Phase 5: Dashboard Active Key Display Wiring
**Goal**: Dashboard KPI 카드가 백엔드의 활성 API 키 데이터를 실제로 표시한다 — Phase 4 백엔드와 Phase 2 프론트엔드 간 DASH-04 연결 완성
**Depends on**: Phase 4
**Requirements**: DASH-04
**Gap Closure:** Closes gaps from v1.0 milestone audit
**Success Criteria** (what must be TRUE):
  1. `DashboardStats.activeApiKeys` 타입이 `{ alias: string; callCount: number } | null`이다
  2. 활성 키가 있을 때 KPI 카드에 alias와 callCount가 표시된다
  3. 활성 키가 없을 때 KPI 카드에 "없음" 또는 적절한 fallback이 표시된다
Plans:
- [ ] 05-01-PLAN.md — Type fix + KPI card wiring

### Phase 6: Edit-Mode API Call Count Fix
**Goal**: edit.routes.ts의 edit-mode Gemini API 호출이 incrementCallCount()를 호출하여 KEY-06 요구사항을 완전히 충족한다
**Depends on**: Phase 4
**Requirements**: KEY-06
**Gap Closure:** Closes gaps from v1.0 milestone audit (re-audit)
**Success Criteria** (what must be TRUE):
  1. edit.routes.ts에서 getActiveApiKey() 호출 시 id를 destructuring한다
  2. Gemini edit API 호출 전에 incrementCallCount(activeKeyId)가 실행된다
  3. edit-mode 호출 후 해당 API 키의 callCount가 증가한다
Plans:
- [ ] 06-01-PLAN.md — Fix edit.routes.ts to increment call count for edit-mode Gemini calls

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Foundation | 2/2 | Complete   | 2026-03-10 |
| 2. Dashboard and User Management | 0/4 | Planning complete | - |
| 3. Generation and Content Monitoring | 5/6 | In Progress|  |
| 4. API Key Management | 5/5 | Complete   | 2026-03-12 |
| 5. Dashboard Active Key Wiring | 1/1 | Complete   | 2026-03-12 |
| 6. Edit-Mode Call Count Fix | 1/1 | Complete   | 2026-03-12 |
