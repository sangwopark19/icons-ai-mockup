---
phase: 11
slug: openai-style-copy-retry-recovery
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-29
---

# Phase 11 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "retryGeneration"` |
| **Full suite command** | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "retryGeneration"`
- **After every plan wave:** Run `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts`
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 30 seconds.

---

## Requirement Verification Map

| Requirement | Behavior | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|------------|-----------------|-----------|-------------------|-------------|--------|
| OPS-03 | Admin retry requeues failed OpenAI style-copy jobs with persisted provider/model/styleReferenceId/copyTarget/selectedImageId, and the worker accepts the payload before provider dispatch. | T-11-01 | Retry payload must be reconstructed from persisted generation data without relaxing worker guard checks. | service unit + worker integration-style mock | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` | yes | pending |
| OED-02 | Failed OpenAI style-copy retry keeps the named target and selected approved image. | T-11-02 | `copyTarget` must be literal-guarded to `ip-change` or `new-product`; `selectedImageId` must come from persisted `promptData`. | service unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts -t "retryGeneration"` | yes | pending |
| OED-03 | OpenAI style-copy retry remains isolated from Gemini-only style memory and does not introduce fallback behavior changes. | T-11-03 | Existing Gemini retry and non-style-copy OpenAI retry payloads remain unchanged except for absent optional continuation fields. | regression unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts src/__tests__/worker.provider-continuation.test.ts` | yes | pending |

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:

- `apps/api/src/services/__tests__/admin.service.test.ts`
- `apps/api/src/__tests__/worker.provider-continuation.test.ts`
- `apps/api/vitest.config.ts`

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All requirements have automated verification commands.
- [x] Sampling continuity: no three consecutive tasks should run without targeted Vitest feedback.
- [x] Wave 0 covers all missing references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 30 seconds.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
