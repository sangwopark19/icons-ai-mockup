---
phase: 4
slug: api-key-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `cd apps/api && npx vitest run src/lib/__tests__/crypto.test.ts` |
| **Full suite command** | `cd apps/api && npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npm test`
- **After every plan wave:** Run `cd apps/api && npm test && npm run type-check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | crypto | unit | `cd apps/api && npx vitest run src/lib/__tests__/crypto.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | KEY-01..06 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | KEY-01 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | KEY-02 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | KEY-03 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 1 | KEY-04 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-05 | 02 | 1 | KEY-05 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |
| 04-02-06 | 02 | 1 | KEY-06 | unit | `cd apps/api && npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/lib/__tests__/crypto.test.ts` — stubs for crypto round-trip, tamper detection, wrong-key rejection
- [ ] Extend `apps/api/src/services/__tests__/admin.service.test.ts` — add apiKey mock + describe blocks for KEY-01..KEY-06
- [ ] `ENCRYPTION_KEY` test env setup — `process.env.ENCRYPTION_KEY = '0'.repeat(64)` in test files

*Existing Vitest infrastructure covers framework needs — no new install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Key switching affects live generation | KEY-04/KEY-05 | Requires running worker + real Gemini call | 1. Add key A (active), add key B. 2. Activate key B. 3. Submit generation job. 4. Verify job uses key B (check callCount increment). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
