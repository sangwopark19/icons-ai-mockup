---
phase: 13
slug: ip-change-verification-note-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `! rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md .planning/phases/08-openai-ip-change-parity/08-SMOKE.md .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` |
| **Full suite command** | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts src/services/__tests__/openai-image.service.test.ts && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` |
| **Estimated runtime** | ~90 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick stale-claim `rg` gate plus the task-specific static or unit check.
- **After every plan wave:** Run the full suite command.
- **Before `$gsd-verify-work`:** Full suite, `gsd-sdk query audit-uat --raw`, and the Phase 13 audit artifact check must be green.
- **Max feedback latency:** 90 seconds for local/static checks; longer only if full package tests slow down.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | OIP-02 | T-13-01 | Active Phase 8 docs no longer claim IP Change v2 transparent option carry-through. | documentation gate | `! rg -n "transparent-background checkbox is carried through|v2 form keeps transparent background|Transparent-background post-process quality|transparent-background intent remains an app option" .planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md .planning/phases/08-openai-ip-change-parity/08-SMOKE.md .planning/phases/08-openai-ip-change-parity/08-VALIDATION.md .planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | OIP-02 | T-13-02 | IP Change v2 visible options cover structure, viewpoint, background-lock, hardware preservation, shadows, user instructions, quality, and two-candidate output without transparent UI. | static | `rg -n "preserveStructure|preserveHardware|fixedBackground|fixedViewpoint|removeShadows|hardwareSpecInput|outputCount: 2|quality" 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx' && ! rg -n "transparentBackground|투명 배경|누끼" 'apps/web/src/app/projects/[id]/ip-change/openai/page.tsx'` | ✅ | ⬜ pending |
| 13-01-03 | 01 | 1 | OIP-02 | T-13-03 | Direct OpenAI IP transparent-background submissions are rejected by route/service. | unit/static | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts` | ✅ | ⬜ pending |
| 13-01-04 | 01 | 1 | OIP-02 | T-13-04 | OpenAI Image API requests omit forbidden `background` and `input_fidelity`. | unit | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts` | ✅ | ⬜ pending |
| 13-01-05 | 01 | 1 | OIP-02 | T-13-05 | Follow-up audit/UAT no longer reports the stale Phase 8 transparent-checkbox item. | audit | `gsd-sdk query audit-uat --raw` plus deterministic grep results recorded in `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/13-ip-change-verification-note-cleanup/13-AUDIT-CHECK.md` - deterministic follow-up audit artifact modeled after Phase 12 audit closure.

---

## Manual-Only Verifications

All Phase 13 behaviors have automated or static verification. Real OpenAI IP Change smoke and authenticated browser walkthrough remain Phase 8 human-needed evidence and must not be marked complete by this cleanup phase unless fresh runtime evidence is collected.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
