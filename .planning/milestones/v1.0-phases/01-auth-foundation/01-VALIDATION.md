---
phase: 1
slug: auth-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed in Wave 0) |
| **Config file** | `apps/api/vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `pnpm --filter api test` |
| **Full suite command** | `pnpm --filter api test && pnpm --filter web test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter api test`
- **After every plan wave:** Run `pnpm --filter api test && pnpm --filter web test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | — | setup | `pnpm --filter api test` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-01 | smoke | `pnpm --filter api test -- schema` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-03 | unit | `pnpm --filter api test -- generateAccessToken` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | AUTH-02 | unit | `pnpm --filter api test -- requireAdmin` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | AUTH-04 | manual | Browser navigation test | N/A | ⬜ pending |
| 01-04-02 | 04 | 2 | AUTH-05 | manual | Browser visual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `pnpm --filter api add -D vitest` — install test framework
- [ ] `apps/api/vitest.config.ts` — vitest configuration for Fastify
- [ ] `apps/api/src/plugins/__tests__/auth.plugin.test.ts` — stubs for AUTH-02 (requireAdmin 401/403)
- [ ] `apps/api/src/services/__tests__/auth.service.test.ts` — stubs for AUTH-03 (JWT payload includes role)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-admin navigating to /admin is redirected to / | AUTH-04 | Next.js layout-level redirect requires browser | 1. Login as non-admin 2. Navigate to /admin 3. Verify redirect to / without admin UI flash |
| Admin sidebar renders with correct nav items | AUTH-05 | UI component visual verification | 1. Login as admin 2. Navigate to /admin 3. Verify sidebar shows 4 menu items with correct icons |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
