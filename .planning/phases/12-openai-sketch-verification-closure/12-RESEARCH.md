# Phase 12: OpenAI Sketch Verification Closure - Research

**Researched:** 2026-04-30 [VERIFIED: system date]  
**Domain:** Phase verification, OpenAI Sketch to Real smoke evidence, transparent-background post-processing evidence [VERIFIED: .planning/ROADMAP.md]  
**Confidence:** HIGH for repository state and verification requirements; MEDIUM for live OpenAI evidence availability because `OPENAI_API_KEY` is not present in this shell [VERIFIED: source grep] [VERIFIED: shell: OPENAI_API_KEY=unset]

## User Constraints

No Phase 12 `CONTEXT.md` exists, so Phase 12 research is constrained by `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/v1.1-MILESTONE-AUDIT.md`, `.planning/v1.1-INTEGRATION-CHECK.md`, Phase 9 artifacts, and the user prompt. [VERIFIED: gsd-sdk init.phase-op 12] [VERIFIED: user prompt]

### Locked Decisions

- Phase 12 goal is to produce the missing Phase 9 verification and close Sketch to Real transparent-background evidence gaps. [VERIFIED: .planning/ROADMAP.md]
- Phase 12 depends on Phase 9. [VERIFIED: .planning/ROADMAP.md]
- Phase 12 must address `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03`. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: user prompt]
- Phase 12 closes orphaned Phase 9 requirements caused by missing `09-VERIFICATION.md` and deferred transparent-background evidence. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
- Transparent-background Sketch to Real requests must be verified through post-processing evidence or explicitly documented as a milestone exception. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: user prompt]
- Required skills for this phase are `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-sketch-realization`, and `mockup-openai-cli-smoke`. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: user prompt]
- Required prompt references are `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, and `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md`. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: user prompt]
- Do not replace Gemini, remove Gemini routes, or turn Phase 12 into a provider migration. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] [VERIFIED: .codex/skills/mockup-openai-dual-provider/SKILL.md]
- Do not send `background: "transparent"` to `gpt-image-2`; Phase 9/12 evidence must treat transparent output as opaque generation followed by local background removal. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] [CITED: https://developers.openai.com/api/docs/guides/image-generation]
- Do not send `input_fidelity` for `gpt-image-2`; current official docs say the parameter should be omitted because `gpt-image-2` processes image inputs at high fidelity automatically. [CITED: https://developers.openai.com/api/docs/guides/image-generation]

### the agent's Discretion

- Decide the narrow plan structure for producing `09-VERIFICATION.md`, collecting or documenting transparent evidence, and re-running audit checks. [VERIFIED: user prompt]
- Decide whether the transparent gap should be closed by live evidence or by a documented milestone exception after checking environment availability. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: shell: OPENAI_API_KEY=unset]
- Decide which existing Phase 9 evidence to cite as source/test/smoke evidence without re-implementing Phase 9. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] [VERIFIED: source grep]

### Deferred Ideas (OUT OF SCOPE)

- Phase 13 IP Change verification note cleanup is separate and must not be folded into Phase 12. [VERIFIED: .planning/ROADMAP.md]
- Replacing the local Sharp background-removal path with a new external background-removal service is out of scope for Phase 12. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md] [VERIFIED: source grep]
- Updating OpenAI Sketch to Real product behavior beyond verification closure is out of scope unless evidence collection exposes a blocking implementation defect. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROV-02 | User can open an OpenAI GPT Image 2 version of the Sketch to Real workflow from a project without losing access to the existing Gemini version. [VERIFIED: .planning/REQUIREMENTS.md] | Source evidence exists in project page and v2 form routing; verification must cite source lines and browser/smoke status. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| OSR-01 | User can generate two OpenAI GPT Image 2 Sketch to Real candidates from a sketch and optional texture reference. [VERIFIED: .planning/REQUIREMENTS.md] | Backend service, route, worker, tests, and opaque live smoke provide evidence; verification must map both automated and live opaque evidence. [VERIFIED: source grep] [VERIFIED: shell: pnpm --filter @mockup-ai/api test] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| OSR-02 | User can preserve sketch layout and key character/product details while applying realistic material treatment. [VERIFIED: .planning/REQUIREMENTS.md] | Prompt builder and tests enforce role naming, preserve/add/hard-constraint ordering, and material-only texture behavior; verification should mark visual quality as human-review dependent where live qualitative judgment is required. [VERIFIED: source grep] [VERIFIED: .codex/skills/mockup-sketch-realization/SKILL.md] |
| OSR-03 | User can request transparent-background output and receive a background-removed final asset through the existing post-process flow. [VERIFIED: .planning/REQUIREMENTS.md] | Code and unit tests cover post-processing metrics, but live transparent alpha/composite evidence is still missing or must become an explicit milestone exception. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] [VERIFIED: .planning/ROADMAP.md] |

</phase_requirements>

## Summary

Phase 12 is a verification-closure phase, not a feature-build phase: Phase 9 implementation artifacts for OpenAI Sketch v2, prompt construction, two-output runtime, result/history lifecycle, and local transparent post-processing are present in source and covered by current automated checks. [VERIFIED: source grep] [VERIFIED: shell: pnpm --filter @mockup-ai/api test] [VERIFIED: shell: pnpm --filter @mockup-ai/api type-check] [VERIFIED: shell: pnpm --filter @mockup-ai/web type-check]

The milestone blocker is traceability: `.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` is missing, so the audit classifies `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` as orphaned even though Phase 9 summary claims source/automated/opaque smoke progress. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]

The only substantive evidence gap is `OSR-03` live transparent-background proof: the existing code path removes a uniform light background with Sharp and enforces alpha, transparent-pixel ratio, transparent-border ratio, center/subject opacity, and dark-composite luma gates, but Phase 9 live transparent smoke failed before image output with OpenAI 403 and therefore did not record final alpha/composite evidence. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] [CITED: https://developers.openai.com/api/docs/guides/image-generation]

**Primary recommendation:** Plan Phase 12 as three tasks: create `09-VERIFICATION.md` from existing Phase 9 evidence, attempt or explicitly except the transparent-background live evidence with alpha/composite metrics, then rerun a follow-up milestone audit/integration check so Phase 9 is no longer orphaned. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: source grep]

## Project Constraints (from AGENTS.md)

- User-facing responses must be Korean, while technical terms and code identifiers remain English. [VERIFIED: user prompt]
- No local `./AGENTS.md` file exists in this workspace, but the user supplied `AGENTS.md` instructions in the prompt and those instructions apply to this research. [VERIFIED: filesystem: `sed AGENTS.md` failed] [VERIFIED: user prompt]
- GSD subagent timeout or empty status is not automatically failure; artifact contracts are authoritative for GSD subagent work. [VERIFIED: user prompt]
- Claude or `~/.claude` files and workflows must not be modified. [VERIFIED: user prompt]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Phase 9 requirement traceability | Planning artifacts | Source/test references | The audit looks for phase `VERIFICATION.md` coverage, so traceability belongs in `.planning/phases/09.../09-VERIFICATION.md` with links to source/test/smoke evidence. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |
| OpenAI Sketch v2 entry evidence | Browser / Client | API / Backend | Project page and form prove `PROV-02`, while API route/service acceptance confirms the submitted provider/mode contract. [VERIFIED: source grep] |
| Two-candidate Sketch generation evidence | API / Backend | OpenAI service | `generateSketchToReal()` calls `images.edit` with `n: 2`, and worker dispatch persists output candidates through existing storage. [VERIFIED: source grep] |
| Sketch-preservation prompt evidence | API / Backend | Human review | Prompt construction owns image-role and hard-constraint wording; human review remains needed for subjective output quality. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md] |
| Transparent-background final asset proof | API / Backend | Storage / Planning artifact | Worker routes OpenAI Sketch transparent requests through `removeUniformLightBackground()` before saving, while `09-VERIFICATION.md` must record alpha/composite evidence or an exception. [VERIFIED: source grep] [VERIFIED: .planning/ROADMAP.md] |
| Follow-up audit closure | Planning artifacts | GSD audit tooling | The audit classified Phase 9 as orphaned because `09-VERIFICATION.md` was missing, so the closure step must rerun the audit after artifact creation. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |

## Standard Stack

### Core

| Library / Tool | Project Version | Latest Verified Version | Purpose | Why Standard |
|----------------|-----------------|-------------------------|---------|--------------|
| `openai` | `^6.34.0` in `apps/api/package.json`; installed baseline published 2026-04-08. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] | `6.35.0`, published 2026-04-28. [VERIFIED: npm registry] | OpenAI Image API runtime already used by `openai-image.service.ts`. [VERIFIED: source grep] | Use existing SDK and runtime; do not upgrade during a verification-only phase unless a live-smoke blocker is proven to be SDK-specific. [VERIFIED: source grep] |
| `sharp` | `^0.33.5` in `apps/api/package.json`; installed baseline published 2024-08-16. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] | `0.34.5`, published 2025-11-06. [VERIFIED: npm registry] | Existing local image analysis and background-removal dependency. [VERIFIED: source grep] | Use existing Sharp helper for alpha/composite evidence; do not add a new background-removal dependency in Phase 12. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md] |
| `vitest` | `^4.0.18` in `apps/api/package.json`; installed baseline published 2026-01-22. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] | `4.1.5`, published 2026-04-21. [VERIFIED: npm registry] | API unit/regression test runner. [VERIFIED: apps/api/package.json] | Current API suite passes 12 files / 167 tests, so use it as the Phase 12 automated evidence source. [VERIFIED: shell: pnpm --filter @mockup-ai/api test] |
| `typescript` | `^5.7.2` in root/api/web package files; installed baseline published 2024-11-22. [VERIFIED: package.json] [VERIFIED: npm registry] | `6.0.3`, published 2026-04-16. [VERIFIED: npm registry] | API and web type safety checks. [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] | Current API and web type-checks exit 0, so use them as release evidence without upgrading. [VERIFIED: shell: pnpm --filter @mockup-ai/api type-check] [VERIFIED: shell: pnpm --filter @mockup-ai/web type-check] |
| `Next.js` | `^16.1.0` in `apps/web/package.json`; installed baseline published 2025-12-18. [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] | `16.2.4`, published 2026-04-15. [VERIFIED: npm registry] | Web App Router pages for project entry, v2 form, result, and history. [VERIFIED: source grep] | Phase 12 should verify existing pages instead of changing framework/runtime versions. [VERIFIED: source grep] |

### Supporting

| Tool | Version / Availability | Purpose | When to Use |
|------|------------------------|---------|-------------|
| `pnpm` | Project package manager is `pnpm@9.15.0`; shell command resolves through mise and prints `9.15.0`. [VERIFIED: package.json] [VERIFIED: shell: pnpm --version] | Run API/web checks and scripts. [VERIFIED: package.json] | Use for all repo commands in Phase 12. [VERIFIED: package.json] |
| `Docker` | `Docker version 29.1.3` is installed. [VERIFIED: shell: docker --version] | Optional local app/API/DB stack for browser smoke. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] | Use only if planner includes live app/browser verification. [VERIFIED: shell: docker --version] |
| `curl`, `jq`, `base64` | All commands are available in the shell. [VERIFIED: shell: command availability audit] | CLI OpenAI smoke and request ID capture. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] | Use when app flow is unavailable but live OpenAI credentials and approved samples are available. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| `gsd-sdk` / GSD audit tooling | `init.phase-op 12` succeeded and reports `commit_docs: true`. [VERIFIED: gsd-sdk init.phase-op 12] | Follow-up audit/commit workflow. [VERIFIED: gsd-sdk init.phase-op 12] | Use after writing `09-VERIFICATION.md` and transparent evidence notes. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Sharp post-process evidence | External background-removal API or model package | Rejected for Phase 12 because Phase 9 explicitly chose a local Sharp-based helper with no new dependency/API and Phase 12 is verification closure. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md] [VERIFIED: source grep] |
| Existing `09-SUMMARY.md` evidence only | Treat summary as final verification | Rejected because audit rules classify Phase 9 requirements as orphaned when `09-VERIFICATION.md` is missing. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |
| Live transparent proof only | Documented milestone exception | Both are valid Phase 12 closure paths because roadmap success criteria allow either post-processing evidence or explicit milestone exception. [VERIFIED: .planning/ROADMAP.md] |

**Installation:**

```bash
# No install step is recommended for Phase 12 verification closure. [VERIFIED: apps/api/package.json] [VERIFIED: source grep]
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

**Version verification:** Recommended package versions were checked against the npm registry on 2026-04-30; the plan should preserve existing project versions unless a specific evidence-collection blocker proves an upgrade is required. [VERIFIED: npm registry] [VERIFIED: shell command output]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 12 inputs
  -> read REQUIREMENTS / ROADMAP / audit / Phase 9 source + smoke evidence
  -> classify evidence per requirement
       -> source evidence
       -> automated test/type-check evidence
       -> opaque live smoke evidence
       -> transparent alpha/composite evidence OR explicit milestone exception
  -> write .planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md
  -> update Phase 9 smoke/summary only if new transparent evidence or exception details are collected
  -> rerun follow-up audit/integration check
       -> if PROV-02/OSR-01/OSR-02/OSR-03 no longer orphaned: Phase 12 passes
       -> if OSR-03 remains partial: record exact blocker and next evidence action
```

This diagram reflects the audit failure mode and Phase 12 roadmap closure target. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: .planning/ROADMAP.md]

### Recommended Project Structure

```text
.planning/phases/09-openai-sketch-to-real-parity/
├── 09-VERIFICATION.md   # create in Phase 12; primary closure artifact [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
├── 09-SMOKE.md          # existing checklist; update only if new evidence is collected [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md]
├── 09-SUMMARY.md        # existing smoke summary; update only with new transparent evidence or exception [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]
└── 09-VALIDATION.md     # existing Nyquist validation map [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md]

.planning/phases/12-openai-sketch-verification-closure/
├── 12-RESEARCH.md       # this research artifact [VERIFIED: gsd-sdk init.phase-op 12]
└── 12-*.md              # planner-created tasks for verification closure [VERIFIED: gsd-sdk init.phase-op 12]
```

### Pattern 1: Verification Artifact As Audit Contract

**What:** Create `09-VERIFICATION.md` with frontmatter, goal achievement, observable truths, required artifacts, key links, automated checks, requirements coverage, human verification, and residual gaps. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md]

**When to use:** Use this when audit says requirements are orphaned because `VERIFICATION.md` is missing even though implementation and summary evidence exist. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

**Example:**

```markdown
---
phase: 09-openai-sketch-to-real-parity
verified: 2026-04-30T...
status: human_needed
requirements:
  - PROV-02
  - OSR-01
  - OSR-02
  - OSR-03
---

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| OSR-03 | PARTIAL or SATISFIED_WITH_EXCEPTION | Transparent post-process source/test evidence plus live alpha/composite evidence or documented milestone exception. |
```

This structure follows existing Phase 8 and Phase 10 verification artifacts. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md]

### Pattern 2: Evidence Ladder Per Requirement

**What:** For each requirement, record evidence at the strongest available level: source, automated test, smoke/live output, browser/runtime, or explicit human-needed/exception status. [VERIFIED: .planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md]

**When to use:** Use this because `OSR-03` has source/unit coverage but lacks final live alpha/composite proof. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]

**Evidence map to plan around:**

| Requirement | Source Evidence | Automated Evidence | Live / Human Evidence |
|-------------|-----------------|--------------------|-----------------------|
| PROV-02 | v1/v2 project entries and v2 form route exist. [VERIFIED: source grep] | Web type-check passes. [VERIFIED: shell: pnpm --filter @mockup-ai/web type-check] | Phase 9 browser smoke verified project/form flow on local Docker current branch. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| OSR-01 | `generateSketchToReal()` uses Image API edit with `n: 2`. [VERIFIED: source grep] | OpenAI service tests assert `n: 2` and exactly two buffers. [VERIFIED: source grep] | Opaque live smoke produced two output paths with request ID `req_b78ef6875e7e4b889486726a42e304fc`. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| OSR-02 | Prompt builder locks Image 1 as design spec and constrains Image 2 to material/finish behavior. [VERIFIED: source grep] | Prompt tests assert section order and hard constraints. [VERIFIED: source grep] | Visual quality remains human-review dependent beyond source/test evidence. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md] |
| OSR-03 | Worker routes transparent OpenAI Sketch outputs through `removeUniformLightBackground()` and saves `hasTransparency`. [VERIFIED: source grep] | Background-removal tests assert alpha and quality thresholds. [VERIFIED: source grep] | Live transparent generation failed before output with OpenAI 403; final alpha/composite evidence is missing. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |

### Pattern 3: Transparent Evidence Collection

**What:** Prove transparent output by recording final PNG alpha-channel evidence, `transparentPixelRatio`, `transparentBorderRatio`, `darkCompositeBorderLuma`, and a dark/contrasting composite path or screenshot. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md] [VERIFIED: source grep]

**When to use:** Use this when `transparentBackground` is enabled and OpenAI returns opaque outputs that local post-processing converts to transparent PNGs. [VERIFIED: source grep] [CITED: https://developers.openai.com/api/docs/guides/image-generation]

**Example operator note:**

```markdown
Transparent evidence:
- generationId: ...
- final PNG: ...
- metadata.hasAlpha: true
- transparentPixelRatio: 0.xx
- transparentBorderRatio: 0.xx
- darkCompositeBorderLuma: 0.xx
- dark composite output: ...
- request confirms no `background: "transparent"` and no `input_fidelity`
```

The exact threshold values come from Phase 9 smoke checklist and `background-removal.service.ts`. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md] [VERIFIED: source grep]

### Pattern 4: Audit Closure Check

**What:** Rerun milestone audit or an equivalent follow-up check after `09-VERIFICATION.md` exists. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

**When to use:** Use this after writing verification because the original blocker is audit classification, not just source behavior. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

**Recommended command family:**

```bash
gsd-sdk query commit "docs(12): research phase domain" ".planning/phases/12-openai-sketch-verification-closure/12-RESEARCH.md"
# Planner should include the actual audit command used by this repo's GSD workflow after 09-VERIFICATION.md is created. [VERIFIED: gsd-sdk init.phase-op 12]
```

The exact audit command should be chosen by the planner from local GSD tooling because the audit artifact was generated by `gsd-audit-milestone`. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [ASSUMED]

### Anti-Patterns to Avoid

- **Rebuilding Phase 9:** Do not reimplement OpenAI Sketch v2 unless evidence collection finds a real implementation defect. [VERIFIED: source grep] [VERIFIED: .planning/ROADMAP.md]
- **Treating `09-SUMMARY.md` as sufficient:** The audit explicitly requires a Phase 9 `VERIFICATION.md` for requirement traceability. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
- **Inventing live request IDs or alpha metrics:** If live evidence is unavailable, record `human_needed` or a milestone exception instead. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md] [VERIFIED: .planning/ROADMAP.md]
- **Changing requirement checkboxes without verification:** `REQUIREMENTS.md` still marks Phase 12 IDs as pending, and updates should follow artifact/audit closure rather than precede it. [VERIFIED: .planning/REQUIREMENTS.md]
- **Direct transparent request to `gpt-image-2`:** Current official docs state `gpt-image-2` does not currently support transparent backgrounds. [CITED: https://developers.openai.com/api/docs/guides/image-generation]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Phase 9 verification format | A new custom report schema | Existing Phase 8/10 `*-VERIFICATION.md` structure | Existing audit already understands phase verification artifacts. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |
| Transparent PNG metrics | Ad hoc visual statements like "looks transparent" | Existing `analyzeTransparentOutputQuality()` metrics and Phase 9 smoke thresholds | The repo already defines alpha, border, center/subject, and dark-composite gates. [VERIFIED: source grep] |
| Background removal | New dependency/API/model | Existing `removeUniformLightBackground()` Sharp helper | Phase 9 locked local Sharp post-processing with no new dependency/API. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md] [VERIFIED: source grep] |
| OpenAI smoke script | Untracked one-off code | Existing skill script `images-edit.sh` or app flow | The project skill already defines CLI smoke patterns and request ID capture. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| Audit closure | Manual claim that orphaned requirements are fixed | Follow-up audit/integration check artifact | The blocker was produced by audit workflow rules, so closure must be audit-visible. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] |

**Key insight:** Phase 12 should convert existing implementation and smoke evidence into audit-visible verification evidence, then close or explicitly document the one missing transparent live-proof branch. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

## Common Pitfalls

### Pitfall 1: Closing The Orphan By Updating Summary Only

**What goes wrong:** The audit still reports `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` as orphaned if `09-VERIFICATION.md` is still absent. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]  
**Why it happens:** Phase 9 has `09-SUMMARY.md`, `09-SMOKE.md`, and `09-VALIDATION.md`, but no verification artifact. [VERIFIED: file inventory]  
**How to avoid:** Make `09-VERIFICATION.md` the primary Phase 12 deliverable. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]  
**Warning signs:** Follow-up audit still says `verification_status: "missing"` for Phase 9 IDs. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

### Pitfall 2: Treating OSR-03 As Fully Passed Without Final PNG Evidence

**What goes wrong:** The verification overclaims transparent-background success when no final alpha/composite output exists. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**Why it happens:** Source and unit tests prove the path, but Phase 9 live transparent generation failed before image output. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**How to avoid:** Mark `OSR-03` as `PARTIAL`, `human_needed`, `SATISFIED_WITH_EXCEPTION`, or `SATISFIED` only when the corresponding evidence tier is true. [VERIFIED: .planning/ROADMAP.md]  
**Warning signs:** `09-VERIFICATION.md` contains no `metadata.hasAlpha`, ratio metrics, dark composite path, or explicit exception. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md]

### Pitfall 3: Retesting Against A Stale Deployment

**What goes wrong:** Browser smoke can inspect a deployment that does not include the Phase 9 branch and falsely report missing v2 routes. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**Why it happens:** Phase 9 summary found the provided Tailscale URL served a different project path and did not contain `sketch-to-real/openai`. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**How to avoid:** Use a current local Docker stack or verify deployment freshness before browser evidence. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**Warning signs:** Runtime page lacks `스케치 실사화 v2` while source contains it. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]

### Pitfall 4: Live OpenAI 403 Misclassified As Code Failure

**What goes wrong:** A provider/account verification failure can be mistaken for app code failure. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**Why it happens:** OpenAI docs say GPT Image models, including `gpt-image-2`, may require API Organization Verification. [CITED: https://developers.openai.com/api/docs/guides/image-generation]  
**How to avoid:** Record request IDs and error category separately from app source/test evidence. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]  
**Warning signs:** Error contains organization verification or permission status but app source/static checks pass. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]

### Pitfall 5: Direct API Capability Drift

**What goes wrong:** Planner reopens the transparent-output architecture because docs changed or model support appears confusing. [CITED: https://developers.openai.com/api/docs/guides/image-generation]  
**Why it happens:** OpenAI image docs are fast-moving, and search snippets can include older GPT Image model behavior. [CITED: https://developers.openai.com/api/docs/guides/image-generation]  
**How to avoid:** For Phase 12, honor the project decision to verify post-processing path; defer any direct-transparency product change to a separate decision. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md]

## Code Examples

### Verification Requirement Row

```markdown
| OSR-03 | PARTIAL - transparent live evidence pending | Source: worker post-process path; Tests: background-removal quality gates; Smoke: opaque passed; Gap: no final alpha/composite PNG because transparent live generation failed with OpenAI 403. |
```

This pattern is needed because Phase 12 success criteria allow explicit human-evidence status or milestone exception, not only binary pass/fail. [VERIFIED: user prompt] [VERIFIED: .planning/ROADMAP.md]

### Transparent Quality Evidence Shape

```typescript
// Source: apps/api/src/services/background-removal.service.ts
type TransparentEvidence = {
  hasAlpha: true;
  transparentPixelRatio: number;      // expected >= 0.15 and <= 0.95
  transparentBorderRatio: number;     // expected >= 0.85
  darkCompositeBorderLuma: number;    // expected <= 40
  compositePath: string;
};
```

These thresholds are implemented in `assertTransparentOutputQuality()` and listed in `09-SMOKE.md`. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md]

### Automated Verification Commands

```bash
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

These commands currently pass in this research session, with API Vitest reporting 12 files and 167 tests passed. [VERIFIED: shell: pnpm --filter @mockup-ai/api test] [VERIFIED: shell: pnpm --filter @mockup-ai/api type-check] [VERIFIED: shell: pnpm --filter @mockup-ai/web type-check]

## State of the Art

| Old / Risky Approach | Current Approach | When Verified | Impact |
|----------------------|------------------|---------------|--------|
| Assume `gpt-image-2` supports direct transparent output | Current official docs state `gpt-image-2` does not currently support transparent backgrounds, and project guardrails route transparency through post-processing. [CITED: https://developers.openai.com/api/docs/guides/image-generation] [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] | 2026-04-30 [VERIFIED: system date] | Planner should keep OSR-03 evidence focused on local post-process output. [VERIFIED: .planning/ROADMAP.md] |
| Set `input_fidelity` for preservation | Current official docs say omit `input_fidelity` for `gpt-image-2` because it processes every image input at high fidelity. [CITED: https://developers.openai.com/api/docs/guides/image-generation] | 2026-04-30 [VERIFIED: system date] | Verification should cite tests/source showing no `input_fidelity` field is sent. [VERIFIED: source grep] |
| Treat live 403 as app failure | Current official docs say API Organization Verification may be required for GPT Image models including `gpt-image-2`. [CITED: https://developers.openai.com/api/docs/guides/image-generation] | 2026-04-30 [VERIFIED: system date] | Verification should separate account-access blockers from source/test coverage. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| Rely on summary-only phase closure | Audit-visible `VERIFICATION.md` is needed to avoid orphaned requirements. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] | 2026-04-29 audit [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] | Phase 12 must write `09-VERIFICATION.md`. [VERIFIED: .planning/ROADMAP.md] |

**Deprecated/outdated:**

- Phase 9 `09-SUMMARY.md` alone is insufficient for milestone audit closure. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
- Direct `background: "transparent"` for `gpt-image-2` is not a valid Phase 12 verification path. [CITED: https://developers.openai.com/api/docs/guides/image-generation] [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The planner should use local GSD audit tooling to rerun the same audit family that produced `v1.1-MILESTONE-AUDIT.md`; the exact command name is inferred from artifact provenance rather than verified by an explicit help command in this research. [ASSUMED] | Pattern 4 | Planner may choose a different but equivalent verification command, so the plan should verify the exact available command before execution. |

## Open Questions

1. **Will Phase 12 get live OpenAI credentials and approved sample images?** [VERIFIED: shell: OPENAI_API_KEY=unset]
   - What we know: The shell does not expose `OPENAI_API_KEY`, and Phase 9 live transparent generation previously failed before output with OpenAI 403. [VERIFIED: shell: OPENAI_API_KEY=unset] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]
   - What's unclear: Whether the operator can provide a verified OpenAI org/key and sample approval during Phase 12 execution. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]
   - Recommendation: Plan one live-evidence task with a fallback branch to a documented milestone exception. [VERIFIED: .planning/ROADMAP.md]

2. **Should `OSR-03` end as satisfied, partial, or exception-satisfied?** [VERIFIED: .planning/ROADMAP.md]
   - What we know: Source/test coverage exists, but final alpha/composite live proof is missing. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]
   - What's unclear: Whether milestone policy accepts source/test plus explicit exception as enough for requirement status. [VERIFIED: .planning/ROADMAP.md]
   - Recommendation: Use `SATISFIED_WITH_EXCEPTION` only if the exception states the missing live artifact, blocker, owner, and follow-up condition. [VERIFIED: .planning/ROADMAP.md]

3. **Should `REQUIREMENTS.md` checkboxes be updated in Phase 12?** [VERIFIED: .planning/REQUIREMENTS.md]
   - What we know: `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` are still unchecked and mapped to Phase 12. [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: Whether this project updates requirement checkboxes during gap-closure execution or only after audit passes. [VERIFIED: .planning/STATE.md]
   - Recommendation: Planner should make checkbox updates a final task gated on `09-VERIFICATION.md` plus follow-up audit result. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm scripts and optional evidence scripts | yes [VERIFIED: shell: node --version] | `v25.9.0` [VERIFIED: shell: node --version] | Project requires Node `>=22.0.0`, so current shell satisfies the stated engine. [VERIFIED: package.json] |
| pnpm | Automated checks | yes [VERIFIED: shell: pnpm --version] | `9.15.0` [VERIFIED: shell: pnpm --version] | None needed. [VERIFIED: package.json] |
| Docker | Optional local app/browser smoke | yes [VERIFIED: shell: docker --version] | `29.1.3` [VERIFIED: shell: docker --version] | Use source/test evidence plus documented human-needed if no runtime stack is used. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| curl | CLI OpenAI smoke | yes [VERIFIED: shell: curl --version] | `8.7.1` [VERIFIED: shell: curl --version] | Use app flow if CLI smoke is not needed. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| jq | CLI response parsing | yes [VERIFIED: shell: jq --version] | `1.7.1-apple` [VERIFIED: shell: jq --version] | Use Node SDK parsing if `jq` is not used. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| base64 | CLI image decode | yes [VERIFIED: shell: command -v base64] | macOS system utility [VERIFIED: shell: command -v base64] | Use Node Buffer decoding if preferred. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| OPENAI_API_KEY | Live OpenAI transparent smoke | no [VERIFIED: shell: OPENAI_API_KEY=unset] | unavailable [VERIFIED: shell: OPENAI_API_KEY=unset] | Document `human_needed` or milestone exception unless key is supplied during execution. [VERIFIED: .planning/ROADMAP.md] |

**Missing dependencies with no fallback:**

- None for creating `09-VERIFICATION.md` from existing evidence. [VERIFIED: source grep] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

**Missing dependencies with fallback:**

- `OPENAI_API_KEY` is missing for live transparent smoke; fallback is a documented milestone exception or human-needed status. [VERIFIED: shell: OPENAI_API_KEY=unset] [VERIFIED: .planning/ROADMAP.md]

## Validation Architecture

Validation is enabled because `.planning/config.json` has `workflow.nyquist_validation: true`. [VERIFIED: .planning/config.json]

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.18` for API tests; TypeScript compiler for API and web type-checks. [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] |
| Config file | `apps/api/vitest.config.ts`, `apps/api/tsconfig.json`, and `apps/web/tsconfig.json`. [VERIFIED: file inventory] |
| Quick run command | `pnpm --filter @mockup-ai/api test` for backend evidence, `pnpm --filter @mockup-ai/web type-check` for web-only evidence. [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check`. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PROV-02 | v1/v2 Sketch entries and v2 form route exist while Gemini route remains. [VERIFIED: .planning/REQUIREMENTS.md] | static/type/browser | `pnpm --filter @mockup-ai/web type-check` [VERIFIED: shell] | yes; source files exist. [VERIFIED: source grep] |
| OSR-01 | OpenAI Sketch accepts sketch plus optional texture and returns two candidates. [VERIFIED: .planning/REQUIREMENTS.md] | unit/smoke | `pnpm --filter @mockup-ai/api test` [VERIFIED: shell] | yes; `openai-image.service.test.ts` exists. [VERIFIED: source grep] |
| OSR-02 | Prompt preserves sketch layout/details and scopes texture to material/finish. [VERIFIED: .planning/REQUIREMENTS.md] | unit/human review | `pnpm --filter @mockup-ai/api test` [VERIFIED: shell] | yes; prompt tests exist. [VERIFIED: source grep] |
| OSR-03 | Transparent request produces post-processed PNG or explicit exception. [VERIFIED: .planning/REQUIREMENTS.md] | unit/live/manual | `pnpm --filter @mockup-ai/api test`; live proof needs `OPENAI_API_KEY`. [VERIFIED: shell] | source/test exists; live evidence missing. [VERIFIED: source grep] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |

### Sampling Rate

- **Per task commit:** Run the relevant quick command and grep the artifact being changed. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md]
- **Per wave merge:** Run the full suite command. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-VALIDATION.md]
- **Phase gate:** `09-VERIFICATION.md` exists, `09-SUMMARY.md`/`09-SMOKE.md` reflect any new transparent evidence or exception, and follow-up audit no longer reports Phase 9 requirements as orphaned. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

### Wave 0 Gaps

- None for automated test infrastructure; `apps/api` Vitest and API/web type-check scripts already exist and pass. [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] [VERIFIED: shell]
- Missing artifact gap: `.planning/phases/09-openai-sketch-to-real-parity/09-VERIFICATION.md` must be created by Phase 12. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

## Security Domain

Security enforcement is treated as enabled because `.planning/config.json` does not explicitly set `security_enforcement: false`. [VERIFIED: .planning/config.json]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no new auth code | Phase 12 should not change auth; browser smoke may require authenticated runtime data. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| V3 Session Management | no new session code | Use existing authenticated app flow if browser evidence is collected. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| V4 Access Control | applies to evidence handling only | Do not bypass project/user upload ownership paths when collecting live smoke. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md] |
| V5 Input Validation | yes | Existing route/service validation requires OpenAI Sketch product/material fields and exactly two outputs. [VERIFIED: source grep] |
| V6 Cryptography | no new crypto | Do not commit API keys or secrets; live smoke must use environment-provided `OPENAI_API_KEY`. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] |
| V9 Data Protection | yes | Do not commit approved sample images, raw image bytes/base64, or raw vendor response bodies into planning artifacts. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Committing API keys or raw sample image data in verification docs | Information Disclosure | Record request IDs, output paths, metrics, and sanitized descriptions only. [VERIFIED: .codex/skills/mockup-openai-cli-smoke/SKILL.md] [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] |
| Overclaiming transparent support without actual PNG proof | Tampering / Repudiation | Require alpha/composite metrics or explicit exception status. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md] |
| Running smoke against stale deployment | Spoofing / Repudiation | Verify current branch/runtime before treating browser evidence as Phase 9 evidence. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] |
| OpenAI account 403 hidden as app failure | Repudiation | Record OpenAI request IDs and error category separately from app source/test evidence. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] [CITED: https://developers.openai.com/api/docs/guides/image-generation] |

## Sources

### Primary (HIGH confidence)

- `.planning/ROADMAP.md` - Phase 12 goal, requirements, required skills, success criteria, and gap-closure scope. [VERIFIED: .planning/ROADMAP.md]
- `.planning/REQUIREMENTS.md` - `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` definitions and traceability mapping. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/v1.1-MILESTONE-AUDIT.md` - orphaned Phase 9 requirement diagnosis and transparent evidence gap. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
- `.planning/v1.1-INTEGRATION-CHECK.md` - source wiring status for OpenAI Sketch opaque and transparent flows. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]
- `.planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md` - Phase 9 automated, browser, opaque live, and blocked transparent smoke evidence. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md]
- `.planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md` - transparent evidence checklist and metric thresholds. [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SMOKE.md]
- `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` and `.planning/phases/10-provider-aware-result-continuation/10-VERIFICATION.md` - local verification artifact patterns. [VERIFIED: file reads]
- Source files under `apps/api/src` and `apps/web/src` - current implementation state for OpenAI Sketch, background removal, result/history, and tests. [VERIFIED: source grep]
- OpenAI Image Generation Guide - current official `gpt-image-2` guidance for organization verification, `n`, `input_fidelity`, transparent support, size, and quality. [CITED: https://developers.openai.com/api/docs/guides/image-generation]
- GPT Image 2 model page - current official model modalities and endpoint family. [CITED: https://developers.openai.com/api/docs/models/gpt-image-2]

### Secondary (MEDIUM confidence)

- `.codex/skills/mockup-openai-dual-provider/SKILL.md`, `.codex/skills/mockup-openai-workflows/SKILL.md`, `.codex/skills/mockup-openai-image-runtime/SKILL.md`, `.codex/skills/mockup-sketch-realization/SKILL.md`, and `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - project-specific implementation and verification guardrails. [VERIFIED: skill file reads]
- npm registry metadata for package latest versions and publish dates. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None used as authoritative evidence. [VERIFIED: research log]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - package files, npm registry, and current command outputs were verified. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] [VERIFIED: shell]
- Architecture: HIGH - roadmap/audit/source files agree that Phase 12 is verification closure, not feature construction. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: source grep]
- Pitfalls: HIGH - pitfalls are directly grounded in audit findings, Phase 9 smoke summary, and OpenAI official docs. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: .planning/phases/09-openai-sketch-to-real-parity/09-SUMMARY.md] [CITED: https://developers.openai.com/api/docs/guides/image-generation]
- Live transparent evidence: MEDIUM - source/test evidence is verified, but live provider evidence is unavailable because `OPENAI_API_KEY` is unset in this shell. [VERIFIED: shell: OPENAI_API_KEY=unset] [VERIFIED: source grep]

**Research date:** 2026-04-30 [VERIFIED: system date]  
**Valid until:** 2026-05-07 for OpenAI API behavior and package currency; 2026-05-30 for repository-local audit/verification patterns. [VERIFIED: npm registry] [CITED: https://developers.openai.com/api/docs/guides/image-generation]

## RESEARCH COMPLETE
