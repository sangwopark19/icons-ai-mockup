# Phase 13: IP Change Verification Note Cleanup - Research

**Researched:** 2026-04-30 [VERIFIED: current_date]
**Domain:** GSD verification artifact cleanup, OpenAI IP Change v2 traceability, documentation/audit closure [VERIFIED: .planning/ROADMAP.md]
**Confidence:** HIGH [VERIFIED: codebase rg + phase artifacts + package manifests]

## User Constraints

- Phase 13 goal: remove stale transparent-background references from Phase 8 verification and align `OIP-02` traceability with the current runtime. [VERIFIED: .planning/ROADMAP.md]
- Phase 13 depends on Phase 8. [VERIFIED: .planning/ROADMAP.md]
- Phase 13 requirement scope is `OIP-02`. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/REQUIREMENTS.md]
- `OIP-02` means: user can request OpenAI IP Change with structure, viewpoint, background, and hardware-preservation options. [VERIFIED: .planning/REQUIREMENTS.md]
- Success criteria require Phase 8 verification and related release notes to describe current IP Change v2 options without implying unsupported transparent output. [VERIFIED: .planning/ROADMAP.md]
- Follow-up audit must no longer report the Phase 8 stale transparent-background warning. [VERIFIED: .planning/ROADMAP.md]
- User-facing responses must be Korean while technical terms and code identifiers remain in English. [VERIFIED: user prompt]
- Do not edit Claude or `~/.claude` workflow files. [VERIFIED: user prompt]
- No Phase 13 `CONTEXT.md` exists, so there are no additional locked Phase 13 discuss decisions to copy. [VERIFIED: gsd-sdk init.phase-op 13] [VERIFIED: test -f .planning/phases/13-ip-change-verification-note-cleanup/13-CONTEXT.md]

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OIP-02 | User can request OpenAI IP Change with structure, viewpoint, background, and hardware-preservation options. [VERIFIED: .planning/REQUIREMENTS.md] | Current v2 UI carries `preserveStructure`, `fixedViewpoint`, `fixedBackground`, `preserveHardware`, `removeShadows`, `userInstructions`, `hardwareSpecInput`, `outputCount: 2`, and `quality`; backend route/service reject `transparentBackground` for OpenAI `ip_change`; OpenAI prompt maps structure/viewpoint/background/hardware into `Must preserve`. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: apps/api/src/services/openai-image.service.ts] |

</phase_requirements>

## Summary

Phase 13 is a documentation and traceability cleanup phase, not an OpenAI runtime implementation phase. [VERIFIED: .planning/ROADMAP.md] The current runtime already has the post-review behavior that matters for this gap: OpenAI IP Change v2 has no transparent-background UI control, and both API route validation and service-level validation reject `provider=openai`, `mode=ip_change`, `transparentBackground=true`. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md]

The stale claims are concentrated in active Phase 8 verification/smoke/validation artifacts plus one release-summary style artifact. [VERIFIED: rg "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option"] `08-VERIFICATION.md` still says the transparent-background checkbox is carried through as an option, `08-SMOKE.md` says the v2 form keeps transparent background available, `08-VALIDATION.md` still asks to submit v2 with the transparent option, and `08-01-SUMMARY.md` says transparent intent remains an app option. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-SMOKE.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md]

**Primary recommendation:** Update Phase 8 verification, smoke, validation, and release-summary notes to say IP Change v2 supports structure/viewpoint/background-lock/hardware-preservation options, but intentionally does not expose or accept transparent-background output; then add a deterministic Phase 13 audit check proving stale IP Change transparent-option claims are gone and `OIP-02` traceability is intact. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| IP Change v2 option surface | Browser / Client | API / Backend | The v2 page owns visible controls and request payload construction, while API/service validation enforces unsupported option rejection. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] |
| OIP-02 traceability evidence | Documentation / Planning Artifacts | API / Backend | Phase 13 must align `08-VERIFICATION.md`, `08-SMOKE.md`, `08-VALIDATION.md`, and release-summary notes with code evidence. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |
| OpenAI forbidden-parameter enforcement | API / Backend | Test Suite | Runtime service omits `background` and `input_fidelity`; tests assert those fields are absent. [VERIFIED: apps/api/src/services/openai-image.service.ts] [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts] |
| Follow-up audit closure | Documentation / Planning Artifacts | GSD audit tooling | Phase 12 used a deterministic audit artifact instead of hand-editing the historical milestone audit, and Phase 13 should follow that pattern. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |

## Project Constraints (from AGENTS.md)

- Write user-facing communication in Korean and keep technical identifiers in English. [VERIFIED: user prompt AGENTS instructions]
- The AGENTS instructions apply only to Codex global runtime and must not modify Claude or `~/.claude` files/workflows. [VERIFIED: user prompt AGENTS instructions]
- Treat GSD subagent timeout or empty status as non-failure until artifacts or terminal state are checked. [VERIFIED: user prompt AGENTS instructions]
- `AGENTS.md` was not present in the working tree during research; these directives came from the user-provided AGENTS block. [VERIFIED: test -f AGENTS.md] [VERIFIED: user prompt]

## Standard Stack

### Core

| Library / Tool | Repo Version | Registry / Tool Version Checked | Purpose | Why Standard |
|----------------|--------------|---------------------------------|---------|--------------|
| Next.js | `^16.1.0` in `apps/web/package.json`; registry latest `16.2.4`, modified 2026-04-29. [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] | `16.2.4` [VERIFIED: npm registry] | IP Change v2 page and product UI artifacts. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] | Use existing app stack; Phase 13 should not change frontend dependencies. [VERIFIED: package.json] |
| OpenAI Node SDK | `^6.34.0` in `apps/api/package.json`; registry latest `6.35.0`, modified 2026-04-28. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] | `6.35.0` [VERIFIED: npm registry] | Existing OpenAI image runtime evidence. [VERIFIED: apps/api/src/services/openai-image.service.ts] | Runtime already uses separate `openai-image.service.ts` per project skill guidance. [VERIFIED: .codex/skills/mockup-openai-image-runtime/SKILL.md] |
| Vitest | `^4.0.18` in `apps/api/package.json`; registry latest `4.1.5`, modified 2026-04-23. [VERIFIED: apps/api/package.json] [VERIFIED: npm registry] | `4.1.5` [VERIFIED: npm registry] | API service/route regression evidence. [VERIFIED: apps/api/vitest.config.ts] | Existing API tests already cover OpenAI forbidden-parameter and transparent rejection behavior. [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts] [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] |
| TypeScript | `^5.7.2` in root/API/web package manifests; registry latest `6.0.3`, modified 2026-04-16. [VERIFIED: package.json] [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] | `6.0.3` [VERIFIED: npm registry] | Static contract checks for API and web changes. [VERIFIED: package.json] | Existing scripts expose `type-check` for API, web, and monorepo. [VERIFIED: package.json] [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json] |
| ripgrep (`rg`) | Tool version `15.1.0`. [VERIFIED: rg --version] | n/a | Deterministic stale-claim and traceability checks. [VERIFIED: rg command] | Best fit for documentation cleanup validation because the gap is text/artifact mismatch. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `gsd-tools.cjs audit-open` | Local GSD tool. [VERIFIED: node /Users/sangwopark19/.codex/get-shit-done/bin/gsd-tools.cjs audit-open --json] | Detect remaining open verification/UAT items. [VERIFIED: audit-open output] | Use in Phase 13 validation to show whether the stale Phase 8 item remains or is superseded. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |
| `gsd-sdk query audit-uat --raw` | Local GSD SDK command. [VERIFIED: gsd-sdk query audit-uat --raw] | Lists human-needed verification items, including the current stale Phase 8 residual risk. [VERIFIED: gsd-sdk query audit-uat --raw] | Use after cleanup to verify the stale transparent-checkbox item no longer appears in Phase 8 UAT gap output. [VERIFIED: gsd-sdk query audit-uat --raw] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Updating active Phase 8 verification artifacts | Rewriting every historical Phase 8 plan/context/discussion file | Broad rewrites can erase historical decisions; planner should update active verification/release-note artifacts and add supersession notes where needed. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |
| Deterministic `rg`/audit checks | Manual visual review only | Manual review is insufficient because the audit warning is text/artifact driven. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |
| Runtime code edits | Documentation-only correction with evidence | Current code already rejects OpenAI IP transparent requests and exposes supported OIP-02 options, so code edits are not the default plan path. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] |

**Installation:**

No package installation is recommended for Phase 13 because the phase is documentation/validation cleanup and all required tools are already present. [VERIFIED: command -v node] [VERIFIED: command -v pnpm] [VERIFIED: command -v rg]

**Version verification:** `npm view vitest version time.modified --json`, `npm view typescript version time.modified --json`, `npm view openai version time.modified --json`, and `npm view next version time.modified --json` were run during research. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Phase 13 input
  |
  v
Read roadmap / requirements / audit warning
  |
  v
Find stale transparent-output claims in Phase 8 docs
  |                         \
  |                          -> Historical context/plan files: preserve or add supersession notes only if required
  v
Trace current OIP-02 runtime
  |
  +--> UI options: structure, viewpoint, background lock, hardware, shadows, user instructions, quality
  |
  +--> API/service guard: reject OpenAI IP transparentBackground=true
  |
  +--> Worker/service prompt: map options to Must preserve rules and omit forbidden GPT Image 2 params
  |
  v
Update active verification/smoke/validation/release notes
  |
  v
Run deterministic checks
  |
  +--> no stale IP Change transparent-option claims in active docs
  +--> OIP-02 option evidence still present
  +--> audit/UAT output no longer reports stale Phase 8 transparent checkbox item
```

This flow is derived from the existing audit warning and current code evidence. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts]

### Recommended Project Structure

```text
.planning/phases/08-openai-ip-change-parity/
├── 08-VERIFICATION.md     # primary stale residual-risk cleanup target
├── 08-SMOKE.md            # browser checklist must match current v2 UI
├── 08-VALIDATION.md       # validation/manual-only map must stop asking for IP v2 transparent submission
├── 08-01-SUMMARY.md       # release-summary style note needs supersession/correction
└── 08-REVIEW-FIX.md       # already states the current transparent option removal/guard

.planning/phases/13-ip-change-verification-note-cleanup/
├── 13-RESEARCH.md         # this file
├── 13-VALIDATION.md       # planner should generate from Validation Architecture
├── 13-VERIFICATION.md     # final OIP-02 traceability and stale-claim closure
└── 13-AUDIT-CHECK.md      # recommended deterministic follow-up audit artifact
```

This structure follows existing phase artifact patterns and the Phase 12 audit-check pattern. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md]

### Pattern 1: Active-Artifact Correction With Historical Boundary

**What:** Update active verification, smoke, validation, and release-summary artifacts that current audits consume; avoid pretending old discussion decisions never happened. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

**When to use:** Use when a review fix changed runtime behavior after an earlier plan/spec said something else. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md]

**Example:**

```markdown
Current IP Change v2 option boundary:
- Supported: structure preservation, fixed viewpoint, fixed background, hardware preservation, shadow removal, user instructions, quality.
- Unsupported: transparent-background output for OpenAI IP Change v2; UI does not expose it and backend rejects direct API submissions.
```

Source: current v2 page and backend guards. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts]

### Pattern 2: OIP-02 Trace From UI To Prompt

**What:** Show `OIP-02` through the full path: UI state/payload -> API validation -> service persistence/queue -> worker dispatch -> OpenAI prompt rules -> tests. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: apps/api/src/worker.ts] [VERIFIED: apps/api/src/services/openai-image.service.ts] [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts]

**When to use:** Use for `13-VERIFICATION.md` and `13-AUDIT-CHECK.md`. [VERIFIED: .planning/ROADMAP.md]

**Example:**

```text
UI payload includes fixedBackground/fixedViewpoint/preserveHardware
  -> API accepts those option names
  -> GenerationService persists and enqueues them
  -> Worker passes them to openaiImageService.generateIPChange()
  -> buildIPChangePrompt() emits preserve rules for structure/viewpoint/background/hardware
```

Source: current code path. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: apps/api/src/worker.ts] [VERIFIED: apps/api/src/services/openai-image.service.ts]

### Anti-Patterns to Avoid

- **Deleting all `transparent` references blindly:** Some transparent references are valid for Sketch to Real `OSR-03` and forbidden-parameter checks; Phase 13 should target stale IP Change v2 transparent-option claims only. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]
- **Removing `fixedBackground` as if it were transparent output:** `fixedBackground` is the supported `OIP-02` background option and maps to a plain opaque background prompt rule. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/services/openai-image.service.ts]
- **Claiming live OpenAI IP smoke is complete:** Phase 8 remains `human_needed` for real OpenAI smoke and authenticated browser walkthrough. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-HUMAN-UAT.md]
- **Hand-editing the historical milestone audit as proof:** Phase 12 documented superseding evidence in a phase-local audit check instead of rewriting the historical audit finding. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

## Exact Stale Claim Inventory

| File | Lines / Claim | Classification | Recommended Phase 13 Action |
|------|---------------|----------------|-----------------------------|
| `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` | Residual risk says the transparent-background checkbox is carried through as an option. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] | Active stale verification claim. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] | Replace with current boundary: no IP v2 transparent UI, backend rejects direct transparent submissions, `OIP-02` covers structure/viewpoint/background-lock/hardware options. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] |
| `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` | Browser checklist says v2 form keeps transparent background available. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-SMOKE.md] | Active stale smoke checklist. [VERIFIED: rg command] | Remove transparent-background availability from browser checklist; add negative check that no transparent UI exists for IP Change v2. [VERIFIED: rg "transparentBackground|투명 배경|누끼" apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] |
| `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md` | Manual-only row asks to submit v2 with transparent option. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md] | Active stale validation mapping. [VERIFIED: gsd-sdk query audit-uat --raw] | Replace with route/service rejection validation and UI absence validation. [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] |
| `.planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | Key decision says transparent-background intent remains an app option. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md] | Release-summary style stale note. [ASSUMED] | Add a correction/supersession note referencing `08-REVIEW-FIX.md` rather than erasing runtime history. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] |
| `.planning/phases/08-openai-ip-change-parity/08-UI-SPEC.md` | Interaction contract says keep `투명 배경 (누끼)` for parity. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-UI-SPEC.md] | Historical design contract now superseded by review fix. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] | Add a dated supersession note only if planner decides UI-SPEC is treated as current release documentation. [ASSUMED] |
| `.planning/phases/08-openai-ip-change-parity/08-DISCUSSION-LOG.md` and `08-CONTEXT.md` | Historical decisions mention transparent parity/post-processing. [VERIFIED: rg command] | Historical context, not current proof. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] | Do not rewrite by default; prefer active verification/release-note correction plus `13-AUDIT-CHECK.md`. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stale-claim detection | Manual eyeballing only | `rg` checks against exact stale phrases and target files. [VERIFIED: rg command] | The audit warning is text-driven and reproducible by grep. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |
| Runtime evidence | New ad hoc runtime probes | Existing code trace plus existing Vitest tests. [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts] [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] | Current code already contains the relevant guards and tests. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] |
| Audit closure proof | Editing `.planning/v1.1-MILESTONE-AUDIT.md` directly | Phase-local deterministic `13-AUDIT-CHECK.md`, mirroring Phase 12. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] | Historical audit files should remain historical; new evidence should supersede them. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |
| API validation | Client-only hidden control | Existing route Zod `superRefine` plus service defensive validation. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] | Direct API callers can bypass UI, so backend rejection is required. [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] |

**Key insight:** The correct cleanup is not "remove every transparent-background mention"; it is "remove unsupported IP Change v2 transparent-output claims while preserving valid forbidden-parameter checks and Sketch to Real transparent-background evidence." [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]

## Common Pitfalls

### Pitfall 1: Confusing `fixedBackground` With Transparent Output

**What goes wrong:** A planner removes or weakens `fixedBackground` evidence because it sees "background" near transparent-output warnings. [VERIFIED: .planning/REQUIREMENTS.md]

**Why it happens:** `OIP-02` includes a background option, but it means supported background-lock behavior, not transparent-background output. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: apps/api/src/services/openai-image.service.ts]

**How to avoid:** Keep `fixedBackground` traceability and explicitly label it as an opaque/plain background rule. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/services/openai-image.service.ts]

**Warning signs:** A proposed edit removes `fixedBackground` from `OIP-02` evidence or treats all `background` strings as stale. [VERIFIED: rg command]

### Pitfall 2: Updating Only `08-VERIFICATION.md`

**What goes wrong:** `audit-uat` or follow-up grep still finds stale claims in `08-SMOKE.md`, `08-VALIDATION.md`, or release-summary notes. [VERIFIED: gsd-sdk query audit-uat --raw] [VERIFIED: rg command]

**Why it happens:** The integration warning names `08-VERIFICATION.md`, but the stale wording also appears in related Phase 8 artifacts. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] [VERIFIED: rg command]

**How to avoid:** Phase 13 should include a text gate for all active Phase 8 verification/smoke/validation/release-note targets. [VERIFIED: rg command]

**Warning signs:** `rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity` still returns matches after cleanup. [VERIFIED: rg command]

### Pitfall 3: Overclaiming Live Provider Evidence

**What goes wrong:** The cleanup accidentally marks real OpenAI IP smoke or browser walkthrough as passed. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-HUMAN-UAT.md]

**Why it happens:** This phase closes a documentation warning, not the human-needed live OpenAI smoke gap. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: gsd-sdk query audit-uat --raw]

**How to avoid:** Keep Phase 8 `status: human_needed` unless live credentials/sample/browser evidence is actually collected. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-HUMAN-UAT.md]

**Warning signs:** The edited verification claims request IDs, sample outputs, or authenticated browser approval without new evidence. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md]

## Code Examples

Verified patterns from local sources:

### Negative UI Check

```bash
if rg -n "transparentBackground|투명 배경|누끼" 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx'; then
  echo "unexpected transparent UI"
  exit 1
fi
```

Source: this command returned `NO_OPENAI_IP_TRANSPARENT_UI_MATCH` during research. [VERIFIED: rg command]

### Backend Guard Check

```bash
rg -n "OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다|provider === 'openai'.*ip_change|transparentBackground" \
  apps/api/src/routes/generation.routes.ts \
  apps/api/src/services/generation.service.ts \
  apps/api/src/services/__tests__/generation.service.test.ts
```

Source: route validation, service validation, and regression test are present. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts]

### OIP-02 Supported Option Check

```bash
rg -n "preserveStructure|preserveHardware|fixedBackground|fixedViewpoint|removeShadows|hardwareSpecInput|outputCount: 2|quality" \
  'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx'
```

Source: current v2 page exposes the supported option surface and request payload. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx]

### Deterministic Active-Doc Stale Claim Check

```bash
rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" \
  .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md \
  .planning/phases/08-openai-ip-change-parity/08-SMOKE.md \
  .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md \
  .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md
```

Expected after Phase 13 cleanup: no matches. [VERIFIED: current matches found before cleanup]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Keep IP Change v2 transparent-background option and route OpenAI through opaque generation plus later post-process. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-CONTEXT.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-UI-SPEC.md] | Hide/remove the unsupported IP Change v2 transparent-background option and reject direct backend submissions until a real removal pipeline is wired. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] [VERIFIED: apps/api/src/routes/generation.routes.ts] | Phase 8 review fix on 2026-04-27. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md] | Verification and release notes must stop claiming transparent option carry-through for IP Change v2. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |
| Count `OIP-02` transparent post-process quality as manual-only evidence. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md] | Count `OIP-02` as supported structure/viewpoint/background-lock/hardware options, plus negative evidence that transparent output is unsupported for IP Change v2. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] | Phase 13 cleanup target. [VERIFIED: .planning/ROADMAP.md] | Follow-up audit should treat the old transparent checkbox item as closed while preserving real OpenAI/browser human-needed status. [VERIFIED: gsd-sdk query audit-uat --raw] |

**Deprecated/outdated:**

- "The transparent-background checkbox is carried through as an option" is outdated for OpenAI IP Change v2. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx]
- "v2 form keeps transparent background available" is outdated for OpenAI IP Change v2. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-SMOKE.md] [VERIFIED: rg command]
- "Submit v2 with transparent option" is outdated as a Phase 8 `OIP-02` validation instruction. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md] [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `08-01-SUMMARY.md` and `08-04-SUMMARY.md` are "release-note-like" artifacts for this cleanup because the roadmap says "release notes" but the repo does not expose a separate Phase 8 release-notes file. [ASSUMED] | Exact Stale Claim Inventory | Planner may update too few or too many summary files; mitigate by using `rg` and planner review. |
| A2 | `08-UI-SPEC.md` should receive a supersession note only if the team treats Phase 8 UI-SPEC as current release documentation rather than historical design input. [ASSUMED] | Exact Stale Claim Inventory | Planner may leave a stale spec phrase searchable; mitigate by adding a dated supersession note if audit grep includes UI-SPEC. |

## Open Questions

1. **Should Phase 13 update historical Phase 8 `08-CONTEXT.md` and `08-DISCUSSION-LOG.md`?**
   - What we know: those files contain historical transparent-option decisions that were superseded by `08-REVIEW-FIX.md`. [VERIFIED: rg command] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-REVIEW-FIX.md]
   - What's unclear: whether the team's audit treats historical context as current release documentation. [ASSUMED]
   - Recommendation: do not rewrite historical context by default; add a Phase 13 audit check and, if necessary, add supersession notes to UI-SPEC/summary files rather than erasing history. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

2. **Should `.planning/REQUIREMENTS.md` traceability mark `OIP-02` complete during Phase 13 execution?**
   - What we know: `OIP-02` is currently mapped to Phase 13 with status `Pending`. [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: whether execution plans should update milestone traceability after validation or leave it to verify-work. [ASSUMED]
   - Recommendation: include a final task to update `OIP-02` traceability only after `13-VERIFICATION.md` and deterministic stale-claim checks pass. [VERIFIED: .planning/ROADMAP.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | GSD audit commands and repo scripts. [VERIFIED: package.json] | yes [VERIFIED: command -v node] | `v24.13.0` [VERIFIED: node --version] | none needed |
| pnpm | API/web test and type-check scripts. [VERIFIED: package.json] | yes [VERIFIED: command -v pnpm] | `9.15.0` active package-manager version. [VERIFIED: pnpm --version] [VERIFIED: package.json] | npm scripts are not the repo standard. [VERIFIED: package.json] |
| ripgrep | Stale-claim checks. [VERIFIED: rg command] | yes [VERIFIED: command -v rg] | `15.1.0` [VERIFIED: rg --version] | `grep -R`, but use `rg` by default. [VERIFIED: tool availability] |
| GSD SDK / tools | Follow-up audit checks. [VERIFIED: gsd-sdk query audit-uat --raw] [VERIFIED: node gsd-tools.cjs audit-open --json] | yes [VERIFIED: commands succeeded] | local workspace tool [VERIFIED: commands succeeded] | deterministic Node/`rg` checks if a GSD audit command is unavailable. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md] |

**Missing dependencies with no fallback:** none found for Phase 13 research/validation. [VERIFIED: command probes]

**Missing dependencies with fallback:** none found for Phase 13 research/validation. [VERIFIED: command probes]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.18` in API package; TypeScript compiler for API/web; `rg` for documentation gates. [VERIFIED: apps/api/package.json] [VERIFIED: apps/api/vitest.config.ts] [VERIFIED: package.json] |
| Config file | `apps/api/vitest.config.ts`, `apps/api/tsconfig.json`, `apps/web/tsconfig.json`. [VERIFIED: rg --files] |
| Quick run command | `rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md .planning/phases/08-openai-ip-change-parity/08-SMOKE.md .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` should return no matches after cleanup. [VERIFIED: rg command] |
| Full suite command | `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| OIP-02 | IP Change v2 visible options cover structure, viewpoint, background-lock, hardware preservation, shadows, user instructions, quality, and two-candidate output without transparent UI. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] | static | `rg -n "preserveStructure|preserveHardware|fixedBackground|fixedViewpoint|removeShadows|hardwareSpecInput|outputCount: 2|quality" 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx' && ! rg -n "transparentBackground|투명 배경|누끼" 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx'` | yes [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx] |
| OIP-02 | Direct OpenAI IP transparent-background submissions are rejected by route/service. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] | unit/static | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts` | yes [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] [VERIFIED: apps/api/src/routes/__tests__/generation.routes.test.ts] |
| OIP-02 | OpenAI Image API request omits forbidden `background` and `input_fidelity`. [VERIFIED: apps/api/src/services/openai-image.service.ts] | unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts` | yes [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts] |
| OIP-02 | Active Phase 8 docs no longer claim IP Change v2 transparent option carry-through. [VERIFIED: rg command] | documentation gate | stale-claim `rg` command above must return no matches. [VERIFIED: rg command] | yes [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-SMOKE.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md] |
| OIP-02 | Follow-up audit/UAT no longer includes the stale transparent-checkbox residual item. [VERIFIED: gsd-sdk query audit-uat --raw] | audit | `gsd-sdk query audit-uat --raw` plus deterministic grep against output/artifacts. [VERIFIED: gsd-sdk query audit-uat --raw] | yes [VERIFIED: command succeeded] |

### Sampling Rate

- **Per task commit:** run the stale-claim `rg` gate plus the relevant file-specific `rg` check for the edited artifact. [VERIFIED: rg command]
- **Per wave merge:** run `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts src/routes/__tests__/generation.routes.test.ts` and both type-checks if code-adjacent docs or traceability tables changed. [VERIFIED: apps/api/package.json] [VERIFIED: apps/web/package.json]
- **Phase gate:** run full suite command, `gsd-sdk query audit-uat --raw`, and create `13-AUDIT-CHECK.md` with the deterministic stale-claim results. [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

### Wave 0 Gaps

- [ ] `.planning/phases/13-ip-change-verification-note-cleanup/13-VALIDATION.md` - new Phase 13 validation contract generated from this section. [VERIFIED: .planning/config.json]
- [ ] `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` - deterministic follow-up audit artifact recommended for success criterion 3. [VERIFIED: .planning/ROADMAP.md] [VERIFIED: .planning/phases/12-openai-sketch-verification-closure/12-AUDIT-CHECK.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Phase 13 does not change authentication behavior. [VERIFIED: .planning/ROADMAP.md] |
| V3 Session Management | no | Phase 13 does not change session behavior. [VERIFIED: .planning/ROADMAP.md] |
| V4 Access Control | no | Phase 13 does not change access-control code. [VERIFIED: .planning/ROADMAP.md] |
| V5 Input Validation | yes | Preserve route Zod validation and service defensive validation rejecting OpenAI IP transparent-background requests. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] |
| V6 Cryptography | no | Phase 13 does not change cryptography or key storage. [VERIFIED: .planning/ROADMAP.md] |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Documentation overclaims unsupported runtime behavior. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] | Repudiation / Information integrity | Tie claims to current code, tests, and audit artifacts. [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] |
| Direct API caller submits hidden unsupported option. [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts] | Tampering | Route-level Zod `superRefine` and service-level validation both reject the request. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts] |
| Raw provider/model details leak into product verification text as user-facing claims. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] | Information disclosure | Keep user-facing product copy at `v1`/`v2`; provider/model details stay in code/admin/support evidence. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md] [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md] |

## Sources

### Primary (HIGH confidence)

- `.planning/ROADMAP.md` - Phase 13 scope, dependency, requirement, and success criteria. [VERIFIED: .planning/ROADMAP.md]
- `.planning/REQUIREMENTS.md` - `OIP-02` definition and traceability status. [VERIFIED: .planning/REQUIREMENTS.md]
- `.planning/OPENAI-SKILL-GUARDRAILS.md` - mandatory OpenAI phase guardrails and forbidden GPT Image 2 parameters. [VERIFIED: .planning/OPENAI-SKILL-GUARDRAILS.md]
- `.planning/v1.1-INTEGRATION-CHECK.md` - exact Phase 8 stale transparent-background warning and impact. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]
- `.planning/v1.1-MILESTONE-AUDIT.md` - audit warning and Phase 8 tech-debt item. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]
- `.planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md` - stale residual-risk claim and current Phase 8 verification status. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md]
- `.planning/phases/08-openai-ip-change-parity/08-SMOKE.md` - stale browser checklist claim. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-SMOKE.md]
- `.planning/phases/08-openai-ip-change-parity/08-VALIDATION.md` - stale manual transparent submission row. [VERIFIED: .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md]
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` - current v2 UI option surface and absence of transparent UI. [VERIFIED: apps/web/src/app/projects/[id]/ip-change/openai/page.tsx]
- `apps/api/src/routes/generation.routes.ts` and `apps/api/src/services/generation.service.ts` - route/service rejection guards. [VERIFIED: apps/api/src/routes/generation.routes.ts] [VERIFIED: apps/api/src/services/generation.service.ts]
- `apps/api/src/services/openai-image.service.ts` - OpenAI Image API edit request and prompt option mapping. [VERIFIED: apps/api/src/services/openai-image.service.ts]
- `apps/api/src/services/__tests__/openai-image.service.test.ts` and `apps/api/src/services/__tests__/generation.service.test.ts` - existing regression evidence. [VERIFIED: apps/api/src/services/__tests__/openai-image.service.test.ts] [VERIFIED: apps/api/src/services/__tests__/generation.service.test.ts]

### Secondary (MEDIUM confidence)

- `.codex/skills/mockup-openai-dual-provider/SKILL.md`, `.codex/skills/mockup-openai-workflows/SKILL.md`, `.codex/skills/mockup-openai-image-runtime/SKILL.md`, `.codex/skills/mockup-ip-change/SKILL.md`, `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - project skill guidance. [VERIFIED: local skill files]
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md` - IP Change prompt and option guidance. [VERIFIED: local skill references]
- `npm view` registry checks for package freshness. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None; assumptions are listed explicitly in the Assumptions Log. [VERIFIED: Assumptions Log]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - package manifests, tool probes, and npm registry checks were run. [VERIFIED: package.json] [VERIFIED: npm registry] [VERIFIED: command probes]
- Architecture: HIGH - the phase is codebase/documentation-only and the full UI/API/service/test trace was inspected. [VERIFIED: codebase rg]
- Pitfalls: HIGH - pitfalls are directly tied to existing audit warnings and current stale matches. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] [VERIFIED: rg command]

**Research date:** 2026-04-30 [VERIFIED: current_date]
**Valid until:** 2026-05-30 for documentation cleanup; re-check immediately if Phase 8 runtime or audit tooling changes before planning. [ASSUMED]
