---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: OpenAI GPT Image 2 Dual Provider
status: "Phase 09 PR #4 approved for merge - transparent evidence deferred"
stopped_at: Phase 10 UI-SPEC approved
last_updated: "2026-04-28T07:34:25.674Z"
last_activity: "2026-04-28 -- PR #4 approved for merge; transparent evidence deferred"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 12
  completed_plans: 13
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** 사용자가 원하는 제품 목업을 구조와 디테일을 잃지 않고 빠르게 생성하고 비교할 수 있어야 한다.
**Current focus:** Phase 09 — openai-sketch-to-real-parity

## Current Position

Phase: 09 (openai-sketch-to-real-parity) — SHIPPING
Plan: 4 of 4
Status: Phase 09 PR #4 approved for merge - transparent evidence deferred
Last activity: 2026-04-28 -- PR #4 approved for merge; transparent evidence deferred

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
- [v1.0/auth-foundation]: requireAdmin calls fastify.authenticate first then checks user.role === 'admin' for single responsibility
- [v1.0/auth-foundation]: Named export authPlugin added alongside fp-wrapped default for test registration
- [v1.0/auth-foundation]: getUserFromToken fetches full User from DB so role is always current without re-issuing tokens
- [v1.0/auth-foundation]: AdminGuard uses null-render anti-flash pattern (return null) not loading spinner to prevent admin UI flash
- [v1.0/auth-foundation]: Admin layout is server component wrapping client component guard — standard Next.js App Router pattern
- [v1.0/auth-foundation]: AdminGuard uses null-render (not loading spinner) to prevent admin UI flash before redirect
- [v1.0/auth-foundation]: Admin layout is server component; guard and sidebar are client components for useState/useEffect
- [v1.0/auth-foundation]: Stub pages have no coming soon text — just title heading per plan spec
- [v1.0/dashboard-user-management]: AdminService uses Promise.all for parallel DB queries in getDashboardStats for performance
- [v1.0/dashboard-user-management]: softDeleteUser uses prisma.user.update (not delete) to preserve generation history
- [v1.0/dashboard-user-management]: Auth suspend/delete check placed after getUserFromToken in authenticate decorator — single security boundary per CVE-2025-29927 pattern
- [v1.0/dashboard-user-management P03]: UserActionMenu returns null for self and deleted users to prevent impossible actions
- [v1.0/dashboard-user-management P03]: ConfirmDialog uses stopPropagation on card click to prevent overlay dismiss during loading
- [v1.0/dashboard-user-management]: Used recharts 3.x (not 2.x) — natively supports React 19 without pnpm overrides; react-is pnpm override skipped
- [v1.0/dashboard-user-management]: Dashboard uses useEffect+setInterval polling pattern — TanStack Query provider not yet wired
- [v1.0/dashboard-user-management P04]: Steps 5/7 had no failure data (expected in fresh system), step 10 pagination hidden below 20-user threshold (expected) — all other 22 steps verified
- [v1.0/generation-content-monitoring]: Upload mock uses '../../services/upload.service.js' path to match how admin.service.ts will import it
- [v1.0/generation-content-monitoring]: bulkDeleteImages filter shape uses { ids: string[] } — consistent with deleteMany id-in-array pattern
- [v1.0/generation-content-monitoring P02]: listGenerations uses groupBy for statusCounts tab badges; retryGeneration casts Json fields as Record<string,unknown>; content.routes.ts and adminApi helpers added early by linter
- [v1.0/generation-content-monitoring]: buildImageWhere merges email (nested generation.is.project.is.user.is.email) and projectId into single generation.is clause
- [v1.0/generation-content-monitoring]: listGeneratedImages uses include (not select) to surface userEmail and projectName from generation/project/user join
- [v1.0/generation-content-monitoring]: bulkDeleteImages returns { deletedCount } not void — deleteGeneratedImage never touches Generation table
- [v1.0/generation-content-monitoring]: Staged filter pattern in ContentGrid: UI inputs separate from applied states, filters applied on 검색 click only
- [v1.0/generation-content-monitoring]: Bulk delete button conditionally rendered (hasActiveFilter) to prevent accidental global deletion
- [v1.0/generation-content-monitoring P04]: Direct retry on table row (no confirmation dialog) per CONTEXT.md — GEN-03 retry is low-risk
- [v1.0/generation-content-monitoring P04]: Optimistic pending status update on retry then re-fetch for immediate UI feedback
- [v1.0/generation-content-monitoring P04]: listContentProjects filters to projects with at least one generatedImage to reduce dropdown noise
- [v1.0/generation-content-monitoring]: v1.0 generation/content work declared complete after 41 unit tests passing, TypeScript clean, and human visual approval of generation monitoring and content management UI
- [v1.0/api-key-management]: crypto.test.ts uses fixed 32-zero-byte test key for deterministic behavior; admin.service.test.ts mocks entire crypto module to test DB call shapes only
- [v1.0/api-key-management]: TDD Wave 0: 9 crypto tests + 11 AdminService API key tests written RED before any implementation code
- [v1.0/api-key-management]: activateApiKey captures prisma.apiKey.update promise ref before $transaction, re-awaits after — handles mocked $transaction returning [] while preserving production atomicity
- [v1.0/api-key-management]: listApiKeys uses explicit field destructuring to strip encryptedKey defensively — defense in depth beyond Prisma select
- [v1.0/api-key-management]: Used prisma db push instead of migrate dev — shadow database incompatibility with prior deleted_at migration; db push syncs schema directly
- [v1.0/api-key-management]: GeminiService singleton preserved but stateless — each method creates GoogleGenAI instance locally from passed apiKey param
- [v1.0/api-key-management]: edit.routes.ts updated to fetch active DB key before geminiService.generateEdit() — all callers updated as part of refactor
- [v1.0/api-key-management]: Custom toast state (not sonner) — sonner not installed; matched existing content-grid.tsx pattern
- [v1.0/api-key-management]: Reused ConfirmDialog from earlier v1.0 admin flows for delete/activate confirmations — already has stopPropagation, loading state, danger variant
- [v1.0/api-key-management]: v1.0 API key work declared complete after human visual verification of /admin/api-keys — KEY-01 through KEY-06 all satisfied
- [v1.0/dashboard-active-key-wiring]: subtitle prop renders in same bottom slot as delta — only shows when delta is absent, preserving card layout
- [v1.0/dashboard-active-key-wiring]: callCount used as primary KPI value for active key; delta not passed since cumulative counts are not meaningful as day-over-day delta
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
- [Phase 09 ship]: User accepted merging PR #4 with transparent-background live evidence deferred to follow-up work.
- [Phase 09 ship]: Merging to `main` triggers CI/CD deployment to the remote Mac server; stale pre-merge Tailscale/runtime evidence is not a merge blocker.

### Pending Todos

- [Phase 09 follow-up]: Retry transparent-background Sketch v2 live smoke after merge/deployment and record final PNG alpha, transparent pixel ratio, border ratio, dark-composite luma, and composite output evidence.

### Blockers/Concerns

- [v1.0/auth-foundation]: Existing auth uses localStorage/Zustand for JWT — Next.js edge middleware needs access-token cookie; validate this doesn't break existing clients before implementing
- [v1.0/api-key-management]: GeminiService refactor is highest-risk integration — must not silently fall back to process.env.GEMINI_API_KEY; throw clear error if no active DB key found
- [v1.0/dashboard-user-management]: Recharts 2.x + React 19 requires react-is@19.0.0 pnpm override — verify override works in this monorepo before building dashboard charts

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
| verification | v1.0 auth foundation: 01-VERIFICATION.md | human_needed runtime/browser checks |
| verification | v1.0 dashboard/user management: 02-VERIFICATION.md | human_needed runtime/browser checks |
| verification | v1.0 generation/content monitoring: 03-VERIFICATION.md | human_needed runtime/browser checks |
| verification | Phase 09 transparent-background live smoke evidence | deferred after PR #4 merge/deploy; record alpha/ratio/dark-composite evidence |

## Session Continuity

Last session: 2026-04-28T07:34:25.668Z
Stopped at: Phase 10 UI-SPEC approved
Resume file: .planning/phases/10-provider-aware-result-continuation/10-UI-SPEC.md

**Planned Phase:** 8 (OpenAI IP Change Parity) — 4 plans — 2026-04-24T07:32:48.475Z
