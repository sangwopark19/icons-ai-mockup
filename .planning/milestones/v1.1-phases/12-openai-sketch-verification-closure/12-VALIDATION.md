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
| Quick run command | Task-specific `node -e` assertions plus independent `rg -q` checks from the relevant PLAN task |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| Estimated runtime | Task-level checks <60 seconds; full suite ~180 seconds at wave/phase gate |

## Sampling Rate

- **After every task commit:** Run the task-specific `node -e` assertions plus independent `rg -q` checks from the task's `<verify><automated>` command.
- **After every plan wave:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`.
- **Before `$gsd-verify-work`:** Confirm `09-VERIFICATION.md` exists and follow-up audit no longer treats Phase 9 requirements as orphaned.
- **Max feedback latency:** <60 seconds for task-level automated checks; ~180 seconds for wave/phase full-suite checks; live OpenAI transparent evidence is manual/human-gated when `OPENAI_API_KEY` is unavailable.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PROV-02, OSR-01, OSR-02, OSR-03 | T-12-01 | Verification artifact maps all four IDs and no app source file is changed | artifact/static | `node -e "assert 09-VERIFICATION.md exists, contains phase, Requirements Coverage, each ID, opaque generation/request IDs, output_1.png, output_2.png, and one coverage row per ID" && test -z "$(git diff --name-only -- apps)"` | W0 | pending |
| 12-01-02 | 01 | 1 | OSR-03 | T-12-02 | Transparent support is explicitly partial/human-needed or exception-scoped without raw image/secret leakage | artifact/static | `node -e "assert OSR-03 exception/human_needed status, transparent generation/request IDs, metric thresholds, forbidden-parameter not-sent context, Evidence Hygiene, and no data:image/base64/sk-* markers"` | W0 | pending |
| 12-02-01 | 02 | 2 | PROV-02, OSR-01, OSR-02, OSR-03 | T-12-05 | Full-suite command strings are recorded, while task-level source checks stay fast and independent | artifact/static | `node -e "assert 09-VERIFICATION.md records the three full-suite command strings" && independent rg -q checks for forbidden params, worker post-process symbols, project entry, OpenAI submit payload, result copy, and history badge` | W0 | pending |
| 12-02-02 | 02 | 2 | PROV-02, OSR-01, OSR-02, OSR-03 | T-12-06, T-12-07 | Audit closure remains reproducible and does not silently mark gaps passed | audit/artifact | `node -e "assert 09-VERIFICATION.md covers all four IDs, OSR-03 is not overclaimed, 12-AUDIT-CHECK.md contains the fallback OK output, 09-VERIFICATION.md exists, orphan-closure wording, OSR-03 exception/human-needed status, and no secret/raw-image markers"` | W0 | pending |

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
| T-12-03 | Follow-up audit passes because docs were edited without actually mapping all four requirement IDs | medium | Verification artifact must cite `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03`, and post-planning checks must assert each ID independently with `node -e` rather than broad OR grep. |

## Validation Sign-Off

- [x] All tasks have automated or explicit manual verification.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing test infrastructure references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 60 seconds for task-level automated checks; the ~180 second full suite is reserved for wave/phase verification.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending execution
