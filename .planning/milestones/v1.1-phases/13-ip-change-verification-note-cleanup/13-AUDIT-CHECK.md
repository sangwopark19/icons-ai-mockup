---
phase: 13-ip-change-verification-note-cleanup
artifact: deterministic-audit-check
created: 2026-04-30T08:37:20Z
status: passed_with_phase8_human_needed
requirements: [OIP-02]
---

# Phase 13 Audit Check

This audit check proves the active Phase 8 IP Change verification artifacts no longer contain the stale transparent-background option claims. It does not mark the Phase 8 live OpenAI smoke or authenticated browser walkthrough as complete.

## Local Audit Commands

| Command | Status | Sanitized Result |
|---|---|---|
| Active Phase 8 stale-claim gate | exit 0 | No matches for `transparent-background checkbox is carried through`, `v2 form keeps transparent background`, `Transparent-background post-process quality`, or `transparent-background intent remains an app option` in the four active Phase 8 target files. |
| Supported UI option static checks | exit 0 | `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` contains `preserveStructure`, `fixedViewpoint`, `fixedBackground`, `preserveHardware`, `removeShadows`, `userInstructions`, `hardwareSpecInput`, `quality`, and `outputCount: 2`. |
| UI no-transparent static checks | exit 0 | The OpenAI IP Change v2 page has no `transparentBackground`, `투명 배경`, or `누끼` UI evidence. |
| Route/service rejection static checks | exit 0 | Route, service, and service test evidence all contain `OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다`. |
| OpenAI service forbidden-parameter static/test evidence | exit 0 | `openai-image.service.ts` uses `client.images.edit`; tests assert `expect(firstCall.background).toBeUndefined()` and `expect(firstCall.input_fidelity).toBeUndefined()`. |
| Final-gate targeted API tests | exit 0 | `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/routes/__tests__/generation.routes.test.ts src/services/__tests__/openai-image.service.test.ts` passed: 3 files, 65 tests. |
| Final-gate API type-check | exit 0 | `pnpm --filter @mockup-ai/api type-check` passed. |
| Final-gate web type-check | exit 0 | `pnpm --filter @mockup-ai/web type-check` passed. |
| `gsd-sdk query audit-uat --raw` | exit 0 | Output reported Phase 08 and Phase 09 `human_needed` evidence only; deterministic grep found no stale Phase 08 transparent-background warning terms. |

## Deterministic Fallback Proof

Proof target: active Phase 8 docs no longer imply an OpenAI IP Change v2 transparent-background UI/output option, while OIP-02 remains covered by supported options and backend rejection evidence.

Fallback command:

```bash
bash -lc 'set -e; checks=(".planning/phases/08-openai-ip-change-parity/08-VERIFICATION.md::transparent-background checkbox is carried through" ".planning/phases/08-openai-ip-change-parity/08-SMOKE.md::v2 form keeps transparent background" ".planning/phases/08-openai-ip-change-parity/08-VALIDATION.md::Transparent-background post-process quality" ".planning/phases/08-openai-ip-change-parity/08-01-SUMMARY.md::transparent-background intent remains an app option"); for check in "${checks[@]}"; do file="${check%%::*}"; term="${check#*::}"; if rg -n -F "$term" "$file"; then echo "stale phrase remains: $term in $file"; exit 1; fi; done'
```

Observed output: no stale-claim matches.

## OIP-02 Runtime Evidence

OIP-02 is evidenced by the current supported OpenAI IP Change v2 option surface:

- `preserveStructure`
- `fixedViewpoint`
- `fixedBackground`
- `preserveHardware`
- `removeShadows`
- `userInstructions`
- `hardwareSpecInput`
- `quality`
- `outputCount: 2`

Unsupported behavior is also explicitly bounded: direct `provider=openai`, `mode=ip_change`, `transparentBackground=true` requests are rejected by route and service guards. GPT Image 2 request evidence remains valid because `background: "transparent"` and `input_fidelity` are omitted from `client.images.edit` calls.

## Current-Branch Evidence Boundary

This audit check relies on current workspace source checks and the Phase 13 Plan 13-01 command gate:

- Targeted API tests passed with 3 files / 65 tests.
- API type-check passed.
- Web type-check passed.
- Static checks confirm OpenAI IP Change v2 has no transparent-background or 누끼 UI control.
- Static checks confirm route/service rejection for direct `transparentBackground=true` requests.

## Human Evidence Boundary

Phase 8 live OpenAI smoke and authenticated browser walkthrough remain `human_needed` unless fresh evidence is collected in a separate verification pass. Phase 13 did not collect live request IDs, sample output images, browser screenshots, or authenticated runtime approval.

## Evidence Hygiene

This artifact records only sanitized command status, relative paths, requirement IDs, and derived pass/fail status. It does not include API keys, raw image payloads, raw approved images, raw vendor response bodies, or secrets.
