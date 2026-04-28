---
phase: 10
slug: provider-aware-result-continuation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-28
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `4.0.18` for `apps/api`; frontend validation through TypeScript/static checks |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @mockup-ai/api test` |
| **Full suite command** | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| **Estimated runtime** | ~45-90 seconds |

---

## Sampling Rate

- **After every backend task commit:** Run `pnpm --filter @mockup-ai/api test`
- **After every frontend task commit:** Run `pnpm --filter @mockup-ai/web type-check`
- **After every plan wave:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`
- **Before `$gsd-verify-work`:** Full suite must be green, with OpenAI smoke evidence recorded when an active DB-managed OpenAI provider key is available
- **Max feedback latency:** 90 seconds for automated unit/type feedback

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PROV-03 | T-10-01 | Product UI derives `v1`/`v2` from persisted provider/model and hides raw provider/model labels | frontend static/type | `pnpm --filter @mockup-ai/web type-check` plus `rg "Gemini|OpenAI|gpt-image-2|providerModel" apps/web/src/app/projects/[id]/generations apps/web/src/app/projects/[id]/history` review | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | PROV-04 | T-10-02 | Regeneration replays stored provider/model/input paths/options and refuses missing source inputs without provider fallback | service unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts` | ✅ extend existing | ⬜ pending |
| 10-03-01 | 03 | 1 | OED-01 | T-10-03 | OpenAI partial edit uses selected result image, strict preserve prompt, one output, and safe OpenAI metadata storage | route/service unit | `pnpm --filter @mockup-ai/api test -- src/routes/__tests__/edit.routes.test.ts src/services/__tests__/openai-image.service.test.ts` | ❌ Wave 0 route test | ⬜ pending |
| 10-04-01 | 04 | 2 | OED-02 | T-10-04 | OpenAI style-copy uses linkage first and selected-image fallback without Gemini `thoughtSignature` | service/worker unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts` | ✅ extend existing; ❌ worker isolation gap | ⬜ pending |
| 10-05-01 | 05 | 2 | OED-03 | T-10-05 | Gemini and OpenAI continuation state remain isolated across edit, style-copy, and regenerate flows | service/worker/static | `pnpm --filter @mockup-ai/api test && rg "thoughtSignature" apps/api/src/worker.ts apps/api/src/services/generation.service.ts` | ✅ extend existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/routes/__tests__/edit.routes.test.ts` — stubs for OED-01 Gemini preservation and OpenAI partial edit routing.
- [ ] Worker provider-continuation tests or extracted worker helper tests — stubs for OED-02/OED-03 style-copy provider isolation.
- [ ] Frontend static verification script or documented grep checks — covers PROV-03 raw metadata boundary until a frontend test runner exists.
- [ ] OpenAI smoke evidence path — use `mockup-openai-cli-smoke` only when an active DB-managed OpenAI provider key exists.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OpenAI style-copy quality and linkage behavior | OED-02, OED-03 | Live OpenAI account/model access and image quality cannot be proven by mocked unit tests | With active OpenAI key, create a v2 result, run both style-copy targets, confirm two candidates, saved outputs, no Gemini `thoughtSignature`, and recorded OpenAI request/response/image-call IDs where available |
| Result/history visual raw metadata boundary | PROV-03 | No frontend browser test runner is configured | Open result and history pages at 360px and desktop width; confirm only `v1`/`v2` is visible in product UI and raw provider/model names appear only in debug/admin/test surfaces |

---

## Threat Model References

| Ref | Threat | Required Mitigation |
|-----|--------|---------------------|
| T-10-01 | Raw provider/model leakage in product UI | Render user-facing badges as `v1`/`v2`; keep raw values limited to API, tests, logs, admin/ops/debug surfaces |
| T-10-02 | Provider drift during regeneration | Fetch source `Generation`; copy persisted `provider`, `providerModel`, prompt data, input paths, and options; reject missing inputs without fallback |
| T-10-03 | Overbroad or unsafe partial edits | Wrap user edit text in strict preserve prompt and store only safe OpenAI identifiers/trace metadata |
| T-10-04 | Cross-provider style memory mixing | Keep Gemini `thoughtSignature` isolated to Gemini; use OpenAI linkage or selected-image fallback for OpenAI |
| T-10-05 | Cross-user image path reuse | Validate uploaded/selected paths through existing storage prefix checks before creating continuation jobs |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
