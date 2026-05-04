---
phase: 8
slug: openai-ip-change-parity
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-24
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest for `apps/api`; TypeScript compiler for `apps/web`; optional real OpenAI smoke scripts |
| **Config file** | `apps/api/vitest.config.*` if present; `apps/api/tsconfig.json`; `apps/web/tsconfig.json` |
| **Quick run command** | `pnpm --filter @mockup-ai/api test -- --runInBand` or targeted Vitest file command if supported |
| **Full suite command** | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| **Estimated runtime** | ~90 seconds locally, excluding real OpenAI smoke |

---

## Sampling Rate

- **After every task commit:** Run the relevant targeted test or `pnpm --filter @mockup-ai/api type-check` for API-only changes.
- **After every plan wave:** Run `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`.
- **Before `$gsd-verify-work`:** Full suite must be green. Real OpenAI smoke is required only when `OPENAI_API_KEY` is available.
- **Max feedback latency:** 120 seconds for automated checks; manual OpenAI smoke may exceed this and must record request IDs.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | OIP-01, OIP-02 | T-08-01 | OpenAI service never sends API keys, image bytes, raw vendor body, `background: "transparent"`, or `input_fidelity` to product UI/logs | unit | `pnpm --filter @mockup-ai/api test` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | OIP-01 | T-08-02 | Worker dispatch validates persisted provider/model before OpenAI runtime call and keeps unsupported OpenAI modes blocked | unit | `pnpm --filter @mockup-ai/api test` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | PROV-01 | — | Project screen exposes v1 and v2 sibling entries without provider/model names | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 1 | OIP-01, OIP-02 | — | v2 form sends `provider: "openai"`, `providerModel: "gpt-image-2"`, two-candidate output count, and mapped quality value | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 08-03-01 | 03 | 2 | OIP-03 | T-08-03 | v2 result/history lifecycle exposes only v1/v2 labels and disables unsupported follow-up actions | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 08-04-01 | 04 | 2 | OIP-01, OIP-02, OIP-03 | T-08-04 | Real-provider smoke captures request IDs and confirms no forbidden GPT Image 2 parameters | smoke/manual | `.codex/skills/mockup-openai-cli-smoke/scripts/images-edit.sh` gated by `OPENAI_API_KEY` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/services/__tests__/openai-image.service.test.ts` — prompt/quality/forbidden-parameter coverage for OIP-01 and OIP-02.
- [ ] Worker dispatch test coverage in an existing or new API test file — OpenAI `ip_change` routes to OpenAI service; OpenAI non-Phase-8 modes remain blocked.
- [ ] Static grep or test assertions proving product screens do not render `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2` on project workflow/result/history surfaces.
- [ ] Smoke instructions or script wrapper for `OPENAI_API_KEY` environments.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real GPT Image 2 edit produces two usable candidates | OIP-01, OIP-02 | Requires a live OpenAI API key and representative source/character images | Run the Image API edit smoke with sample product and character images; record request IDs and output file paths. |
| v2 visual parity and no provider/model leakage | PROV-01, OIP-03 | Visual review is required for card emphasis, badge placement, disabled follow-up affordances, and Korean copy | Open project screen, v2 form, result, and history in browser at desktop and mobile widths. Confirm only v1/v2 labels appear. |
| Direct OpenAI IP Change transparent-background submission rejection | OIP-02 | Static/UI absence plus route/service rejection can be automated; live browser/provider evidence remains separate | Verify the v2 UI has no transparent-background option and direct `provider=openai`, `mode=ip_change`, `transparentBackground=true` submissions are rejected by route/service guards. |

---

## Threat Model Seeds

| ID | Threat | Required Mitigation |
|----|--------|---------------------|
| T-08-01 | Raw API key, image bytes, or raw vendor body leaks into logs or product UI | Keep OpenAI key in provider-scoped admin key storage; store only support IDs/revised prompt fields; avoid logging raw image data. |
| T-08-02 | Queue/provider mismatch sends an OpenAI job to Gemini or vice versa | Preserve persisted-vs-queued provider/model validation before dispatch. |
| T-08-03 | User can trigger unsupported v2 follow-ups that fail at runtime or mix OpenAI state with Gemini `thoughtSignature` | Disable Phase 10 follow-ups for v2 with guided copy. |
| T-08-04 | GPT Image 2 request includes unsupported transparent/background or `input_fidelity` parameters | Add unit/static assertions and smoke checklist forbidding these parameters. |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers missing OpenAI runtime and prompt test references.
- [x] No watch-mode flags.
- [x] Feedback latency target < 120s for automated checks.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-04-24 for planning; execution must fill task statuses.
