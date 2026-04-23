---
phase: 5
slug: dashboard-active-key-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (apps/api), 웹 앱에 별도 테스트 프레임워크 없음 |
| **Config file** | apps/api/vitest.config.* |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck` + 브라우저 수동 확인
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DASH-04 | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | DASH-04 | manual (visual) | 브라우저에서 `/admin` 확인 | ❌ no web tests | ⬜ pending |
| 05-01-03 | 01 | 1 | DASH-04 | manual (visual) | 브라우저에서 `/admin` 확인 | ❌ no web tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

`npm run typecheck`가 타입 정확성을 자동 검증. 웹 앱에 테스트 프레임워크가 없으므로 UI 검증은 수동.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 활성 키 있을 때 callCount 표시 | DASH-04 | 웹 앱에 테스트 프레임워크 없음 | 브라우저에서 `/admin` 접속 → 활성 API 키가 있는 상태에서 KPI 카드에 callCount와 alias 표시 확인 |
| 활성 키 없을 때 "없음" 표시 | DASH-04 | 웹 앱에 테스트 프레임워크 없음 | 활성 키가 없는 상태에서 KPI 카드에 "없음" 텍스트 표시 확인 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
