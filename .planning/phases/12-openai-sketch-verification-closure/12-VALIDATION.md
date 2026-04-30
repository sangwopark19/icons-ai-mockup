---
phase: 12
slug: openai-sketch-verification-closure
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 12 - Validation Strategy

Per-phase validation contract for OpenAI Sketch verification closure.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest for API tests; TypeScript compiler for API and web type-checks |
| Config file | `apps/api/vitest.config.ts`, `apps/api/tsconfig.json`, `apps/web/tsconfig.json` |
| Quick run command | `pnpm --filter @mockup-ai/api test` |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| Estimated runtime | ~180 seconds |

## Sampling Rate

- **After every task commit:** Run the task-specific grep/file checks plus the relevant quick command.
- **After every plan wave:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`.
- **Before `$gsd-verify-work`:** Confirm `09-VERIFICATION.md` exists and follow-up audit no longer treats Phase 9 requirements as orphaned.
- **Max feedback latency:** 180 seconds for automated checks; live OpenAI transparent evidence is manual/human-gated when `OPENAI_API_KEY` is unavailable.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PROV-02 | T-12-01 | No secrets or raw images committed into verification artifacts | artifact/static | `test -f .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` | W0 | pending |
| 12-01-02 | 01 | 1 | OSR-01 | T-12-01 | OpenAI request IDs and output paths recorded without raw response bodies | artifact/static | `grep -E "OSR-01|output_1.png|output_2.png" .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` | W0 | pending |
| 12-01-03 | 01 | 1 | OSR-02 | T-12-02 | Prompt evidence cites source/tests without overclaiming human visual quality | unit/artifact | `pnpm --filter @mockup-ai/api test` | W0 | pending |
| 12-02-01 | 02 | 2 | OSR-03 | T-12-02 | Transparent support is proven by post-process alpha/composite evidence or explicit exception | unit/manual | `grep -E "transparentPixelRatio|transparentBorderRatio|darkCompositeBorderLuma|milestone exception|human_needed" .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` | W0 | pending |
| 12-03-01 | 03 | 3 | PROV-02, OSR-01, OSR-02, OSR-03 | T-12-03 | Audit closure remains reproducible and does not silently mark gaps passed | audit/artifact | `grep -E "PROV-02|OSR-01|OSR-02|OSR-03" .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` | W0 | pending |

## Wave 0 Requirements

Existing infrastructure covers all automated phase requirements:

- `apps/api/vitest.config.ts`
- `apps/api/src/services/__tests__/openai-image.service.test.ts`
- `apps/api/src/services/__tests__/background-removal.service.test.ts`
- `apps/api/tsconfig.json`
- `apps/web/tsconfig.json`

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live transparent OpenAI Sketch output | OSR-03 | Requires `OPENAI_API_KEY`, approved sample images, and successful GPT Image 2 org access | Run the app or approved CLI smoke with `transparentBackground=true`; record final PNG alpha evidence, `transparentPixelRatio`, `transparentBorderRatio`, `darkCompositeBorderLuma`, dark composite path, and confirmation that `background: "transparent"` and `input_fidelity` were not sent. |
| Visual preservation quality | OSR-02 | Automated tests prove prompt contract, but actual realistic material treatment is human-evaluated | Review generated outputs or existing Phase 9 smoke evidence; record human-needed status if no new live output is produced. |

## Threat Model

| ID | Threat | Severity | Mitigation |
|----|--------|----------|------------|
| T-12-01 | API keys, approved source images, raw base64, or raw vendor responses are committed into planning artifacts | high | Store only request IDs, sanitized paths, status, and derived metrics. |
| T-12-02 | `OSR-03` is overclaimed as fully passed without final alpha/composite evidence | high | Require metric evidence or an explicit milestone exception/human-needed status. |
| T-12-03 | Follow-up audit passes because docs were edited without actually mapping all four requirement IDs | medium | Verification artifact must cite `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03`, and post-planning checks must grep for all four IDs. |

## Validation Sign-Off

- [x] All tasks have automated or explicit manual verification.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing test infrastructure references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 180 seconds for automated checks.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending execution
