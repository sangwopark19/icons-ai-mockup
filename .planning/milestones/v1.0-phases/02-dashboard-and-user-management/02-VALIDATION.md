---
phase: 2
slug: dashboard-and-user-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `cd apps/api && pnpm test` |
| **Full suite command** | `cd apps/api && pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test`
- **After every plan wave:** Run `cd apps/api && pnpm test && cd ../web && pnpm type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | DASH-01..05, USER-01..05 | unit (stubs) | `cd apps/api && pnpm test -- --reporter=verbose src/services/__tests__/admin.service.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | DASH-01 | unit | same | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | DASH-02 | unit | same | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | DASH-03 | unit | same | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | DASH-04 | unit | same | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 1 | DASH-05 | unit | same | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 1 | USER-01 | unit | same | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | USER-02 | unit | same | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 1 | USER-03 | unit | same | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 1 | USER-04 | unit | same | ❌ W0 | ⬜ pending |
| 02-03-05 | 03 | 1 | USER-05 | unit | same | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/services/__tests__/admin.service.test.ts` — stubs for DASH-01 through USER-05
- [ ] Mock setup for `../../lib/queue.js` (`generationQueue.getJobCounts`) alongside existing prisma mock

*Wave 0 creates test stubs that initially fail, then turn green as implementation lands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| KPI cards render with skeleton loading | DASH-01 | Visual/CSS behavior | Load dashboard page; observe skeleton shimmer before data loads |
| Recharts bar chart renders correctly | DASH-05 | React 19 + Recharts compat | Load dashboard; verify chart is visible with bars (not blank) |
| Confirmation dialog for suspend/delete | USER-03, USER-04 | UI interaction flow | Click ⋮ menu → Suspend → verify modal appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
