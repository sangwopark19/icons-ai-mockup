---
phase: 9
slug: openai-sketch-to-real-parity
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest for `apps/api`; TypeScript compiler for `apps/api` and `apps/web`; gated real OpenAI smoke |
| **Config file** | `apps/api/tsconfig.json`; `apps/web/tsconfig.json`; API Vitest configuration |
| **Quick run command** | `pnpm --filter @mockup-ai/api test` for API tasks or `pnpm --filter @mockup-ai/web type-check` for web-only tasks |
| **Full suite command** | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| **Estimated runtime** | ~120 seconds locally, excluding real OpenAI smoke |

---

## Sampling Rate

- **After every backend task:** Run `pnpm --filter @mockup-ai/api test` and `pnpm --filter @mockup-ai/api type-check`.
- **After every frontend task:** Run `pnpm --filter @mockup-ai/web type-check`.
- **After every wave:** Run the full suite command.
- **Before `$gsd-verify-work`:** Full suite must be green. Real OpenAI smoke is required only when `OPENAI_API_KEY` and sample images are available.
- **Max feedback latency:** 120 seconds for automated checks; live OpenAI smoke may exceed this and must record request IDs.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | PROV-02, OSR-01, OSR-03 | T-09-01, T-09-02 | API/service accepts OpenAI Sketch only with provider/model match, safe paths, two outputs, and transparent post-process eligibility | unit/type | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | OSR-01, OSR-02 | T-09-03, T-09-04, T-09-05 | OpenAI service uses Image API edit, role-named prompt, material-only texture, and forbidden-parameter guards | unit/type | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 09-01-03 | 01 | 1 | OSR-01, OSR-03 | T-09-01, T-09-06 | Worker routes OpenAI Sketch after provider/model validation and persists transparent post-processed outputs explicitly | unit/type | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 09-01-04 | 01 | 1 | PROV-02, OSR-03 | T-09-02 | Schema state is checked and any schema change is pushed before final API verification | verify | `git diff --name-only -- apps/api/prisma/schema.prisma && pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | PROV-02 | T-09-07 | Project page exposes Sketch v1/v2 sibling entries without provider/model labels | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | PROV-02 | T-09-09 | Existing Gemini Sketch route remains provider-default and unchanged except optional v1 label | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-02-03 | 02 | 1 | PROV-02, OSR-01, OSR-02, OSR-03 | T-09-07, T-09-08, T-09-10 | V2 form submits exact OpenAI provider/model/options and accessible category/material/quality controls | type/static | `pnpm --filter @mockup-ai/web type-check` | planned | ⬜ pending |
| 09-03-01 | 03 | 2 | PROV-02, OSR-01, OSR-03 | T-09-11, T-09-12 | Result page treats OpenAI Sketch as v2 and routes retry/condition edit to the v2 Sketch form | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-03-02 | 03 | 2 | PROV-02, OSR-03 | T-09-13 | Unsupported v2 follow-ups stay disabled and do not execute Gemini-only logic | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-03-03 | 03 | 2 | PROV-02, OSR-03 | T-09-14 | History shows Sketch v1/v2 badges and reopens existing result route without provider/model labels | type/static | `pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-04-01 | 04 | 3 | PROV-02, OSR-01, OSR-02, OSR-03 | T-09-15, T-09-16, T-09-18 | Smoke checklist covers automated, browser, live OpenAI, request ID, forbidden parameter, and transparent-output evidence | static | `grep -n "Real OpenAI Sketch Smoke\\|Transparent Background Verification" .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` | planned | ⬜ pending |
| 09-04-02 | 04 | 3 | PROV-02, OSR-01, OSR-02, OSR-03 | T-09-16 | Final API/web automated checks are green before release verification completes | verify | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` | ✅ | ⬜ pending |
| 09-04-03 | 04 | 3 | PROV-02, OSR-01, OSR-02, OSR-03 | T-09-15, T-09-17, T-09-18 | Live smoke/browser evidence is recorded or explicitly marked manual-needed when credentials/assets are unavailable | manual | Manual evidence in `09-SUMMARY.md` | planned | ⬜ pending |

*Status: ⬜ pending · ✅ green · planned = created during execution · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers Wave 0 for this phase:

- Vitest and API type-check scripts already exist in `apps/api/package.json`.
- Web type-check script already exists in `apps/web/package.json`.
- Phase 9 plans explicitly create or update missing test/smoke artifacts as execution tasks.
- No standalone pre-execution test scaffold is required before `$gsd-execute-phase 9`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real GPT Image 2 Sketch to Real produces two usable candidates | OSR-01, OSR-02 | Requires live OpenAI API key and representative sketch/texture images | Run v2 Sketch to Real with sketch only and sketch + texture; record request IDs and output file paths. |
| Transparent-background final asset quality | OSR-03 | Background-removal quality cannot be fully judged by unit tests | Submit v2 with `투명 배경 (누끼)` enabled; confirm OpenAI request is opaque and final downloaded PNG has alpha transparency. |
| Visual parity and no provider/model leakage | PROV-02 | Requires browser review across project, form, result, and history surfaces | Open desktop and 360px mobile widths; confirm only `v1`/`v2` labels appear and controls do not overflow. |

---

## Threat Model Seeds

| ID | Threat | Required Mitigation |
|----|--------|---------------------|
| T-09-01 | OpenAI Sketch request is accidentally routed to Gemini or wrong model | Preserve persisted-vs-queued provider/model validation before dispatch. |
| T-09-02 | Uploaded sketch/texture path crosses user/project storage boundaries | Reuse project-owned upload prefix validation for sketch and texture. |
| T-09-03 | GPT Image 2 request includes unsupported `background: "transparent"` or `input_fidelity` | Add unit/static assertions that fail if those fields are sent. |
| T-09-04 | Texture reference changes shape, scene, logos, text, or props | Prompt must state Image 2 is material/finish/color behavior only. |
| T-09-05 | User instructions override sketch preservation | Prompt and service options must scope instructions inside preservation contract. |
| T-09-06 | Transparent request silently saves opaque output as transparent | Post-process must produce alpha output and set `hasTransparency = true`, or fail generation. |
| T-09-07 | Product UI leaks provider/model labels | Visible product copy must use v1/v2 only. |
| T-09-08 | V2 form submits Gemini-default payload | Submit exact `provider: "openai"` and `providerModel: "gpt-image-2"`. |
| T-09-09 | Existing Gemini Sketch route changes during v2 work | Keep v1 route payload Gemini-default. |
| T-09-10 | Missing category/material guidance creates vague prompts | Disable submit until required sketch/category/material guidance exists. |
| T-09-11 | Result page treats OpenAI Sketch as v1 | Generalize v2 detection beyond `ip_change`. |
| T-09-12 | Retry/condition edit routes to v1 | Route OpenAI Sketch retry and condition edit to `/sketch-to-real/openai`. |
| T-09-13 | Phase 10 follow-ups execute early | Disable partial edit, style copy, and same-condition regeneration for v2. |
| T-09-14 | History omits Sketch v2 badge | Render v1/v2 badges for all generation modes based on provider. |
| T-09-15 | Live smoke leaks credentials or sample images | Keep API key in environment and avoid committing samples/outputs. |
| T-09-16 | Live API rejects request shape despite unit tests | Record request IDs and actual output evidence when credentials are available. |
| T-09-17 | Mobile UI overflows or loses accessibility | Browser-check desktop and 360px mobile controls. |
| T-09-18 | Transparent asset is opaque | Inspect final PNG alpha or record manual-needed status. |

---

## Validation Sign-Off

- [x] All 13 actual tasks have automated, static, verify, or manual validation mapping.
- [x] Sampling continuity: no 3 consecutive tasks without automated/static verification.
- [x] Wave 0 is covered by existing test/type-check infrastructure and explicit execution tasks.
- [x] No watch-mode flags.
- [x] Feedback latency target < 120s for automated checks.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-04-27 for planning; execution must fill task statuses.
