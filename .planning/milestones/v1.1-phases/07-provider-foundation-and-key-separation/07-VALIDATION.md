---
phase: 7
slug: provider-foundation-and-key-separation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 in `apps/api`; web app has no dedicated UI test runner |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` |
| **Full suite command** | `cd apps/api && pnpm test && pnpm type-check && cd ../.. && pnpm type-check` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run the narrowest relevant `vitest` command for touched API files, then the matching package `type-check`
- **After every plan wave:** Run `pnpm type-check`
- **Before `$gsd-verify-work`:** Run `cd apps/api && pnpm test` and manually smoke-check `/admin/api-keys`, `/admin/dashboard`, and `/admin/content`
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | OPS-02, OPS-04 | typecheck | `pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | OPS-03, OPS-04 | typecheck | `pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 07-01-03 | 01 | 1 | OPS-01, OPS-02, OPS-03, OPS-04 | schema | `pnpm --filter @mockup-ai/api db:push && pnpm --filter @mockup-ai/api db:generate` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 2 | OPS-01 | unit | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | OPS-01 | typecheck | `pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 3 | OPS-01 | typecheck | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 07-03-02 | 03 | 3 | OPS-01 | manual (UI) | `/admin/api-keys`, `/admin/dashboard` browser smoke check | ❌ no web tests | ⬜ pending |
| 07-04-01 | 04 | 4 | OPS-03 | unit / typecheck | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts && pnpm type-check` | ✅ | ⬜ pending |
| 07-04-02 | 04 | 4 | OPS-02, OPS-04 | typecheck | `pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 07-04-03 | 04 | 4 | OPS-02 | manual (UI) | `/admin/content` browser smoke check | ❌ no web tests | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `apps/api/src/services/__tests__/admin.service.test.ts` for provider-scoped API key CRUD/activation and retry-provider preservation
- [ ] Add at least one API-side assertion path for provider/model/support metadata payload shapes
- [ ] Keep explicit manual verification steps for admin UI provider tabs, dashboard provider cards, and support metadata because the web app has no UI test runner

*Existing Vitest infrastructure covers framework needs — no new install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Provider tabs isolate Gemini and OpenAI key lists and activation | OPS-01 | Web app has no UI test runner | Visit `/admin/api-keys`, switch between `Gemini` and `OpenAI`, add a key per tab, activate one provider without changing the other, confirm active-row actions match UI-SPEC |
| Dashboard no longer implies one global active key | OPS-01 | UI-only presentation | Visit `/admin/dashboard`, verify Gemini and OpenAI active key states render separately and missing one provider does not hide the other |
| Admin generation table/detail shows provider/model and safe support info only | OPS-02 | UI-only rendering | Visit `/admin/content`, open a generation detail modal, verify provider/model columns or stacked cell plus collapsed support info; confirm no raw key/base64/raw response output appears |
| Gemini flows still run after provider-aware refactor | OPS-03 | Requires live worker/runtime | Submit a Gemini generation from an existing project, verify worker processes it successfully and admin monitoring shows `provider = gemini` plus the expected model |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or explicit manual verification mapping
- [ ] Sampling continuity: no 3 consecutive tasks without automated verification
- [ ] Wave 0 gaps are covered by API-side tests or explicit manual checks
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
