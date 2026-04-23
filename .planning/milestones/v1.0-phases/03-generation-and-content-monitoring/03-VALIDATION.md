---
phase: 3
slug: generation-and-content-monitoring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` |
| **Full suite command** | `cd apps/api && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts`
- **After every plan wave:** Run `cd apps/api && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | GEN-01 | unit | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` | Wave 0 | ⬜ pending |
| 3-01-02 | 01 | 0 | GEN-02 | unit | same | Wave 0 | ⬜ pending |
| 3-01-03 | 01 | 0 | GEN-03 | unit | same | Wave 0 | ⬜ pending |
| 3-01-04 | 01 | 0 | CONT-01 | unit | same | Wave 0 | ⬜ pending |
| 3-01-05 | 01 | 0 | CONT-02 | unit | same | Wave 0 | ⬜ pending |
| 3-01-06 | 01 | 0 | CONT-04 | unit | same | Wave 0 | ⬜ pending |
| 3-02-01 | 02 | 1 | GEN-01 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-02-02 | 02 | 1 | GEN-02 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-02-03 | 02 | 1 | GEN-03 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-03-01 | 03 | 1 | CONT-01 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-03-02 | 03 | 1 | CONT-02 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-03-03 | 03 | 1 | CONT-03 | unit | same | ✅ (Wave 0) | ⬜ pending |
| 3-03-04 | 03 | 1 | CONT-04 | unit | same | ✅ (Wave 0) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New `describe` blocks in `apps/api/src/services/__tests__/admin.service.test.ts` — stubs for GEN-01 through CONT-04
  - Mock `prisma.generation.findMany`, `prisma.generation.groupBy`, `prisma.generation.update`
  - Mock `prisma.generatedImage.findMany`, `prisma.generatedImage.findUnique`, `prisma.generatedImage.delete`, `prisma.generatedImage.deleteMany`, `prisma.generatedImage.count`
  - Mock `addGenerationJob` from `../../lib/queue.js`
  - Mock `uploadService.deleteFile` from `../../services/upload.service.js`

*No new test file needed — extend existing `admin.service.test.ts`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Image lightbox preview renders correctly | CONT-01 | Visual UI behavior | Open content page → click image → verify lightbox shows full-size image with metadata |
| Status filter tab badges update on polling | GEN-01 | Polling + visual | Open generation page → wait 30s → verify badge counts update |
| Bulk delete confirmation shows correct count | CONT-04 | Visual modal | Apply filters → click bulk delete → verify modal shows correct "N건" count |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
