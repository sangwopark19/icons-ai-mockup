---
phase: 13
slug: ip-change-verification-note-cleanup
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 13 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest for API tests, TypeScript compiler for API/web static checks, `rg` for documentation gates |
| **Config file** | `apps/api/vitest.config.ts`, `apps/api/tsconfig.json`, `apps/web/tsconfig.json` |
| **Quick run command** | `bash -lc 'set -e; checks=(".planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md::transparent-background checkbox is carried through" ".planning/phases/08-openai-ip-change-parity/08-SMOKE.md::v2 form keeps transparent background" ".planning/phases/08-openai-ip-change-parity/08-VALIDATION.md::Transparent-background post-process quality" ".planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md::transparent-background intent remains an app option"); for check in "${checks[@]}"; do file="${check%%::*}"; term="${check#*::}"; if rg -n -F "$term" "$file"; then exit 1; fi; done'` |
| **Full suite command** | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts src/services/__tests__/openai-image.service.test.ts && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| **Estimated runtime** | task-level static checks should finish in <10 seconds; final gate is ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick stale-claim gate plus the task-specific static check.
- **After every plan wave:** Run the full suite command as the wave/final gate.
- **Before `$gsd-verify-work`:** Full suite, captured/asserted `gsd-sdk query audit-uat --raw`, and the Phase 13 audit artifact check must be green.
- **Max feedback latency:** <10 seconds for task-level static checks; ~90 seconds for the wave/final gate.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | OIP-02 | T-13-01 | Active Phase 8 docs no longer claim IP Change v2 transparent option carry-through. | documentation gate | `bash -lc 'set -e; checks=(".planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md::transparent-background checkbox is carried through" ".planning/phases/08-openai-ip-change-parity/08-SMOKE.md::v2 form keeps transparent background" ".planning/phases/08-openai-ip-change-parity/08-VALIDATION.md::Transparent-background post-process quality" ".planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md::transparent-background intent remains an app option"); for check in "${checks[@]}"; do file="${check%%::*}"; term="${check#*::}"; if rg -n -F "$term" "$file"; then exit 1; fi; done'` | ✅ | ✅ green |
| 13-01-02 | 01 | 1 | OIP-02 | T-13-02 | IP Change v2 visible options cover structure, viewpoint, background-lock, hardware preservation, shadows, user instructions, quality, and two-candidate output without transparent UI. | static | `bash -lc 'set -e; file="apps/web/src/app/projects/[id]/ip-change/openai/page.tsx"; for term in "preserveStructure" "preserveHardware" "fixedBackground" "fixedViewpoint" "removeShadows" "userInstructions" "hardwareSpecInput" "outputCount: 2" "quality"; do rg -n -F "$term" "$file" >/dev/null || exit 1; done; for term in "transparentBackground" "투명 배경" "누끼"; do if rg -n -F "$term" "$file"; then exit 1; fi; done'` | ✅ | ✅ green |
| 13-01-03 | 01 | 1 | OIP-02 | T-13-03 | Direct OpenAI IP transparent-background submissions are rejected by route/service. | static | `rg -n -F "OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다" apps/api/src/routes/generation.routes.ts && rg -n -F "OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다" apps/api/src/services/generation.service.ts && rg -n -F "OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다" apps/api/src/services/__tests__/generation.service.test.ts` | ✅ | ✅ green |
| 13-01-04 | 01 | 1 | OIP-02 | T-13-04 | OpenAI Image API requests omit forbidden `background` and `input_fidelity`. | static | `rg -n -F "client.images.edit" apps/api/src/services/openai-image.service.ts && rg -n -F "expect(firstCall.background).toBeUndefined()" apps/api/src/services/__tests__/openai-image.service.test.ts && rg -n -F "expect(firstCall.input_fidelity).toBeUndefined()" apps/api/src/services/__tests__/openai-image.service.test.ts` | ✅ | ✅ green |
| 13-01-05 | 01 | 1 | OIP-02 | T-13-05 | Follow-up audit/UAT no longer reports the stale Phase 8 transparent-checkbox item. | audit/static | `bash -lc 'set -e; audit_out="$(mktemp)"; gsd-sdk query audit-uat --raw > "$audit_out"; for term in "transparent-background checkbox is carried through" "Phase 08 Transparent-Background Statement Is Stale" "stale transparent-background warning for IP Change v2"; do if rg -n -F "$term" "$audit_out"; then cat "$audit_out"; rm -f "$audit_out"; exit 1; fi; done; rm -f "$audit_out"'` plus deterministic results recorded in `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [x] `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` - deterministic follow-up audit artifact modeled after Phase 12 audit closure.

---

## Manual-Only Verifications

All Phase 13 behaviors have automated or static verification. Real OpenAI IP Change smoke and authenticated browser walkthrough remain Phase 8 human-needed evidence and must not be marked complete by this cleanup phase unless fresh runtime evidence is collected.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-30 after Phase 13 command gate.
