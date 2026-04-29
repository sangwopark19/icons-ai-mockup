---
phase: 10-provider-aware-result-continuation
plan: 01
subsystem: ui
tags: [nextjs, react, provider-aware, openai, result-page, history]

requires:
  - phase: 10-provider-aware-result-continuation
    provides: "Plan 10-03 OpenAI partial edit route with selectedImageId"
  - phase: 10-provider-aware-result-continuation
    provides: "Plan 10-04 provider-pinned regeneration and copy-style route contract"
  - phase: 10-provider-aware-result-continuation
    provides: "Plan 10-05 OpenAI style-copy worker execution"
  - phase: 10-provider-aware-result-continuation
    provides: "Plan 10-06 dedicated OpenAI style-copy page"
provides:
  - Provider-derived result and history badges that expose only v1/v2 product labels
  - OpenAI result follow-up actions for partial edit, style copy, and same-condition regeneration
  - Selected-image continuation context for edit and OpenAI style-copy routing
affects: [phase-10-provider-aware-result-continuation, result-continuation, history-ui]

tech-stack:
  added: []
  patterns:
    - "Result follow-up actions branch from persisted generation.provider instead of badge/query state."
    - "Edit, regenerate, and style-copy initiating controls guard duplicate submissions in UI state."

key-files:
  created:
    - .planning/phases/10-provider-aware-result-continuation/10-01-SUMMARY.md
  modified:
    - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
    - apps/web/src/app/projects/[id]/history/page.tsx

key-decisions:
  - "Result and history product UI stays limited to v1/v2 badges while raw provider/model strings remain hidden."
  - "OpenAI style-copy result actions route to /projects/:id/style-copy/openai with styleRef, copyTarget, and imageId."
  - "OpenAI partial edit reuses the existing modal and sends selectedImageId with the edit prompt."

patterns-established:
  - "One-output OpenAI edit results render as 수정 결과 instead of two-candidate copy."
  - "History destructive buttons expose aria-label=\"히스토리 삭제\" while preserving preventDefault and stopPropagation."

requirements-completed: [PROV-03, OED-01, OED-02]

duration: 8min
completed: 2026-04-29
---

# Phase 10 Plan 01: Provider-Aware Result And History UI Summary

**Provider-pinned result continuations with selected-image context and v1/v2-only product metadata across result and history pages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-29T01:48:12Z
- **Completed:** 2026-04-29T01:55:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Enabled OpenAI result follow-up actions by removing the Phase 8/9 disabled v2 state from partial edit, style copy, and same-condition regeneration.
- Updated partial edit to send `{ prompt, selectedImageId }`, keep duplicate submissions guarded by `!isEditing`, and route to the returned generation result.
- Routed OpenAI style-copy actions to `/projects/:id/style-copy/openai` with `styleRef`, `copyTarget`, and `imageId`, while preserving the existing Gemini style-copy route.
- Kept result/history provider copy to `v1`/`v2`, added `수정 결과` for one-output OpenAI edits, and tightened history empty/delete UI copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Enable provider-pinned result follow-up actions** - `45359ee` (feat)
2. **Task 2: Tighten history card product metadata boundary** - `b23f1b8` (fix)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - Enables provider-pinned result edit/regenerate/style-copy actions, sends selected image context, removes disabled v2 copy, and renders one-result edit headings.
- `apps/web/src/app/projects/[id]/history/page.tsx` - Keeps provider-derived v1/v2 badges, updates empty-state copy, and adds the delete button aria label.
- `.planning/phases/10-provider-aware-result-continuation/10-01-SUMMARY.md` - Execution summary for Plan 10-01.

## Decisions Made

- Used `generation.provider === 'openai'` as the only result-page branch for OpenAI style-copy routing.
- Kept same-condition regeneration on the existing `/api/generations/:genId/regenerate` endpoint for both providers and surfaced the UI-SPEC missing-input error on failure.
- Reused the existing partial edit modal instead of introducing a new UI surface, matching the Phase 10 UI contract.

## Deviations from Plan

None in product behavior - the plan was executed as written within the requested ownership boundaries.

## TDD Gate Compliance

Task 1 was marked `tdd="true"`, but executor ownership allowed only the result page, history page, and this summary. No test file was created. RED was confirmed with the pre-implementation grep finding `if (isV2) return`, disabled v2 action state, and missing OpenAI style-copy route; GREEN then passed the plan's type-check and grep verification after implementation.

## Issues Encountered

- The local `node ./node_modules/@gsd-build/sdk/dist/cli.js query state.load` path was unavailable, so execution used the `gsd-sdk` CLI fallback on `PATH` as allowed by the executor instructions.

## Authentication Gates

None.

## Known Stubs

None. The stub scan only found the required partial-edit input placeholder copy from the UI-SPEC; it is intentional product UI text, not unwired mock data.

## Threat Flags

None - the browser-to-API continuation calls and API data-to-product UI metadata boundary are covered by T-10-01-01 through T-10-01-05 in the plan threat model.

## Verification

- `pnpm --filter @mockup-ai/web type-check` - passed.
- `rg -n "style-copy/openai|selectedImageId|수정 결과|수정 결과 생성 중|원본 입력을 확인할 수 없어 동일 조건 재생성을 시작하지 못했습니다|isEditing|isRegenerating|isStartingStyleCopy" apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - passed.
- `! rg -n "v2 후속 편집은 다음 업데이트에서 지원됩니다|disabled=\\{isV2\\}|if \\(isV2\\) return" apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - passed.
- `rg -n "item\\.provider === 'openai' \\? 'v2' : 'v1'|목업 결과를 저장하면 여기에서 다시 열고 후속 작업을 이어갈 수 있습니다|aria-label=\"히스토리 삭제\"" apps/web/src/app/projects/[id]/history/page.tsx` - passed.
- `! rg -n "Gemini|OpenAI|GPT Image 2|gpt-image-2|providerModel" apps/web/src/app/projects/[id]/generations/[genId]/page.tsx apps/web/src/app/projects/[id]/history/page.tsx` - passed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The result page now reaches the provider-aware edit, regenerate, and dedicated OpenAI style-copy contracts built by Plans 10-03 through 10-06. Plan 10-07 can validate the end-to-end continuation flow without first removing disabled result-page v2 UI.

## Self-Check: PASSED

- Found summary, result page, and history page on disk.
- Verified task commits exist: `45359ee`, `b23f1b8`.
- Confirmed no tracked file deletions were introduced by task commits.
- Confirmed `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` have no local modifications from this executor.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
