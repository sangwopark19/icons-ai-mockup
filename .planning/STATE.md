---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: OpenAI GPT Image 2 Dual Provider
status: "Phase 08 shipped - PR #3"
stopped_at: Shipped Phase 08 - PR #3
last_updated: "2026-04-27T00:42:45.661Z"
last_activity: 2026-04-27
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 8
  completed_plans: 8
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** 사용자가 원하는 제품 목업을 구조와 디테일을 잃지 않고 빠르게 생성하고 비교할 수 있어야 한다.
**Current focus:** Phase 08 — openai-ip-change-parity

## Current Position

Phase: 08 (openai-ip-change-parity) — SHIPPED
Plan: 4 of 4
Status: Phase 08 shipped - PR #3
Last activity: 2026-04-27

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 07 | 4 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
| Phase 01-auth-foundation P01 | 20 | 2 tasks | 11 files |
| Phase 01-auth-foundation P02 | 5 | 2 tasks | 9 files |
| Phase 01-auth-foundation P02 | 5 | 2 tasks | 9 files |
| Phase 02 P01 | 8 | 3 tasks | 7 files |
| Phase 02 P03 | 8 | 2 tasks | 5 files |
| Phase 02-dashboard-and-user-management P02 | 12 | 2 tasks | 5 files |
| Phase 02-dashboard-and-user-management P04 | 5 | 1 tasks | 0 files |
| Phase 03-generation-and-content-monitoring P01 | 8 | 1 tasks | 1 files |
| Phase 03-generation-and-content-monitoring P02 | 4 | 2 tasks | 5 files |
| Phase 03-generation-and-content-monitoring P03 | 6 | 2 tasks | 5 files |
| Phase 03-generation-and-content-monitoring P05 | 3 | 2 tasks | 6 files |
| Phase 03-generation-and-content-monitoring P04 | 3 | 2 tasks | 6 files |
| Phase 03-generation-and-content-monitoring P06 | 5 | 2 tasks | 0 files |
| Phase 04-api-key-management P01 | 8 | 2 tasks | 2 files |
| Phase 04-api-key-management P02 | 10 | 2 tasks | 3 files |
| Phase 04-api-key-management P03 | 4 | 2 tasks | 5 files |
| Phase 04-api-key-management P04 | 7 | 2 tasks | 4 files |
| Phase 04-api-key-management P05 | 2 | 1 tasks | 0 files |
| Phase 04-api-key-management P05 | 2 | 2 tasks | 0 files |
| Phase 05-dashboard-active-key-wiring P01 | 5 | 2 tasks | 3 files |
| Phase 07-provider-foundation-and-key-separation P01 | 9 min | 3 tasks | 6 files |
| Phase 07-provider-foundation-and-key-separation P02 | 11 min | 2 tasks | 3 files |
| Phase 07-provider-foundation-and-key-separation P03 | 6 min | 3 tasks | 5 files |
| Phase 07-provider-foundation-and-key-separation P04 | 7 min | 3 tasks | 5 files |

## Accumulated Context

### Decisions

- [Init]: /admin routes use existing Next.js app, no separate admin deployment
- [Init]: Admin role granted by direct DB update, no invite flow
- [Init]: API keys stored encrypted in DB (AES-256-GCM), manual rotation only in v1
- [Init]: Next.js middleware is UX-only redirect; Fastify requireAdmin is the authoritative security boundary (CVE-2025-29927 mitigation)
- [Phase 01-auth-foundation]: requireAdmin calls fastify.authenticate first then checks user.role === 'admin' for single responsibility
- [Phase 01-auth-foundation]: Named export authPlugin added alongside fp-wrapped default for test registration
- [Phase 01-auth-foundation]: getUserFromToken fetches full User from DB so role is always current without re-issuing tokens
- [Phase 01-auth-foundation]: AdminGuard uses null-render anti-flash pattern (return null) not loading spinner to prevent admin UI flash
- [Phase 01-auth-foundation]: Admin layout is server component wrapping client component guard — standard Next.js App Router pattern
- [Phase 01-auth-foundation]: AdminGuard uses null-render (not loading spinner) to prevent admin UI flash before redirect
- [Phase 01-auth-foundation]: Admin layout is server component; guard and sidebar are client components for useState/useEffect
- [Phase 01-auth-foundation]: Stub pages have no coming soon text — just title heading per plan spec
- [Phase 02]: AdminService uses Promise.all for parallel DB queries in getDashboardStats for performance
- [Phase 02]: softDeleteUser uses prisma.user.update (not delete) to preserve generation history
- [Phase 02]: Auth suspend/delete check placed after getUserFromToken in authenticate decorator — single security boundary per CVE-2025-29927 pattern
- [Phase 02-03]: UserActionMenu returns null for self and deleted users to prevent impossible actions
- [Phase 02-03]: ConfirmDialog uses stopPropagation on card click to prevent overlay dismiss during loading
- [Phase 02-dashboard-and-user-management]: Used recharts 3.x (not 2.x) — natively supports React 19 without pnpm overrides; react-is pnpm override skipped
- [Phase 02-dashboard-and-user-management]: Dashboard uses useEffect+setInterval polling pattern — TanStack Query provider not yet wired
- [Phase 02-04]: Steps 5/7 had no failure data (expected in fresh system), step 10 pagination hidden below 20-user threshold (expected) — all other 22 steps verified
- [Phase 03-generation-and-content-monitoring]: Upload mock uses '../../services/upload.service.js' path to match how admin.service.ts will import it
- [Phase 03-generation-and-content-monitoring]: bulkDeleteImages filter shape uses { ids: string[] } — consistent with deleteMany id-in-array pattern
- [Phase 03-02]: listGenerations uses groupBy for statusCounts tab badges; retryGeneration casts Json fields as Record<string,unknown>; content.routes.ts and adminApi helpers added early by linter
- [Phase 03-generation-and-content-monitoring]: buildImageWhere merges email (nested generation.is.project.is.user.is.email) and projectId into single generation.is clause
- [Phase 03-generation-and-content-monitoring]: listGeneratedImages uses include (not select) to surface userEmail and projectName from generation/project/user join
- [Phase 03-generation-and-content-monitoring]: bulkDeleteImages returns { deletedCount } not void — deleteGeneratedImage never touches Generation table
- [Phase 03-generation-and-content-monitoring]: Staged filter pattern in ContentGrid: UI inputs separate from applied states, filters applied on 검색 click only
- [Phase 03-generation-and-content-monitoring]: Bulk delete button conditionally rendered (hasActiveFilter) to prevent accidental global deletion
- [Phase 03-04]: Direct retry on table row (no confirmation dialog) per CONTEXT.md — GEN-03 retry is low-risk
- [Phase 03-04]: Optimistic pending status update on retry then re-fetch for immediate UI feedback
- [Phase 03-04]: listContentProjects filters to projects with at least one generatedImage to reduce dropdown noise
- [Phase 03-generation-and-content-monitoring]: Phase 3 declared complete after 41 unit tests passing, TypeScript clean, and human visual approval of generation monitoring and content management UI
- [Phase 04-api-key-management]: crypto.test.ts uses fixed 32-zero-byte test key for deterministic behavior; admin.service.test.ts mocks entire crypto module to test DB call shapes only
- [Phase 04-api-key-management]: TDD Wave 0: 9 crypto tests + 11 AdminService API key tests written RED before any implementation code
- [Phase Phase 04-api-key-management]: activateApiKey captures prisma.apiKey.update promise ref before $transaction, re-awaits after — handles mocked $transaction returning [] while preserving production atomicity
- [Phase Phase 04-api-key-management]: listApiKeys uses explicit field destructuring to strip encryptedKey defensively — defense in depth beyond Prisma select
- [Phase Phase 04-api-key-management]: Used prisma db push instead of migrate dev — shadow database incompatibility with prior deleted_at migration; db push syncs schema directly
- [Phase 04-api-key-management]: GeminiService singleton preserved but stateless — each method creates GoogleGenAI instance locally from passed apiKey param
- [Phase 04-api-key-management]: edit.routes.ts updated to fetch active DB key before geminiService.generateEdit() — all callers updated as part of refactor
- [Phase 04-api-key-management]: Custom toast state (not sonner) — sonner not installed; matched existing content-grid.tsx pattern
- [Phase 04-api-key-management]: Reused ConfirmDialog from Phase 2/3 for delete/activate confirmations — already has stopPropagation, loading state, danger variant
- [Phase 04-api-key-management]: Phase 4 declared complete after human visual verification of /admin/api-keys — KEY-01 through KEY-06 all satisfied
- [Phase 05-dashboard-active-key-wiring]: subtitle prop renders in same bottom slot as delta — only shows when delta is absent, preserving card layout
- [Phase 05-dashboard-active-key-wiring]: callCount used as primary KPI value for active key; delta not passed since cumulative counts are not meaningful as day-over-day delta
- Generation.provider defaults to gemini and providerModel defaults to gemini-3-pro-image-preview for existing records.
- Queue provider/providerModel fields are required copied routing data, not a replacement for the database generation record.
- Explicit OpenAI create requests default providerModel to gpt-image-2 until the runtime supplies a more precise model.
- Admin key routes require explicit provider input so UI/API key management cannot operate on the wrong provider lane.
- Gemini remains the default provider for internal backend callers until worker/edit paths are fully provider-aware in Phase 07-04.
- Admin API key UI uses Gemini/OpenAI tabs; provider is inherited from the selected tab rather than user-entered.
- Dashboard active key state renders Gemini and OpenAI as separate KPI cards using activeApiKeysByProvider.
- Worker jobs validate that the queued provider matches the persisted Generation.provider before any runtime dispatch.
- OpenAI generation jobs intentionally fail with an explicit unsupported-runtime error until Phase 08 adds the image runtime.
- Admin monitoring exposes safe provider/model/OpenAI support identifiers while keeping providerTrace backend-only.
- OpenAI phases must use `.planning/OPENAI-SKILL-GUARDRAILS.md`; Phase 8 requires dual-provider, workflow, image-runtime, IP Change, and CLI smoke skill guidance.
- GPT Image 2 prompt work must also read workflow-specific prompt references: prompt-playbook/workflow-matrix plus the relevant `gpt-image-2-notes.md` for IP Change, Sketch Realization, or Precision Edit.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Existing auth uses localStorage/Zustand for JWT — Next.js edge middleware needs access-token cookie; validate this doesn't break existing clients before implementing
- [Phase 4]: GeminiService refactor is highest-risk integration — must not silently fall back to process.env.GEMINI_API_KEY; throw clear error if no active DB key found
- [Phase 2]: Recharts 2.x + React 19 requires react-is@19.0.0 pnpm override — verify override works in this monorepo before building dashboard charts

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | admin 대시보드 흰배경 흰글자 색상 수정 | 2026-03-12 | 7238c61 | [1-admin](./quick/1-admin/) |
| 2 | Mac 서버 ENCRYPTION_KEY 배포 누락 및 admin 대시보드 빈 상태 수정 | 2026-04-23 | 6de9087 | [260423-l20-mac-encryption-key-api-admin-dashboard](./quick/260423-l20-mac-encryption-key-api-admin-dashboard/) |
| 3 | Mac 서버 로그인 만료 시간 1일 및 자동 refresh 처리 | 2026-04-24 | e41c6ba | [260424-eex-auth-session-refresh](./quick/260424-eex-auth-session-refresh/) |

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-23:

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 01: 01-VERIFICATION.md | human_needed runtime/browser checks |
| verification | Phase 02: 02-VERIFICATION.md | human_needed runtime/browser checks |
| verification | Phase 03: 03-VERIFICATION.md | human_needed runtime/browser checks |

## Session Continuity

Last session: --stopped-at
Stopped at: Completed 08-04-PLAN.md
Resume file: --resume-file

**Planned Phase:** 8 (OpenAI IP Change Parity) — 4 plans — 2026-04-24T07:32:48.475Z
