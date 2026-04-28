---
phase: 09-openai-sketch-to-real-parity
plan: 03
subsystem: ui
tags: [nextjs, react, tailwind, openai, sketch-to-real, history]

requires:
  - phase: 08-openai-ip-change-parity
    provides: v2 result lifecycle, disabled follow-up, and history badge patterns
  - phase: 09-openai-sketch-to-real-parity
    provides: OpenAI Sketch to Real v2 form route and generation payload contract
provides:
  - OpenAI Sketch to Real v2 result lifecycle with mode-specific copy
  - Stable two-candidate Sketch v2 ordering and exact-count guard
  - Sketch and IP Change history cards with provider-derived v1/v2 badges
affects: [phase-10-provider-continuation, result-history, sketch-to-real]

tech-stack:
  added: []
  patterns:
    - Provider-based v2 result state with mode-specific workflow copy
    - Persisted output-index/file-path ordering for candidate rendering
    - Provider-derived v1/v2 history badges across result modes

key-files:
  created: []
  modified:
    - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
    - apps/web/src/app/projects/[id]/history/page.tsx

key-decisions:
  - "OpenAI result pages derive v2 state from provider while keeping workflow copy mode-specific."
  - "OpenAI Sketch v2 renders only exactly two candidates and orders them by persisted output index/file path."
  - "OpenAI v2 follow-up actions stay disabled for Phase 9, while condition edit routes back to the matching v2 form."
  - "History v1/v2 badges use stored provider for both Sketch to Real and IP Change."

patterns-established:
  - "Result pages use `getV2WorkflowCopy(mode)` for OpenAI-specific copy instead of reusing IP Change text."
  - "Candidate thumbnails are rendered from output-index order without moving the selected image to the front."
  - "Sketch history cards hide IP Change-only character metadata."

requirements-completed: [PROV-02, OSR-01, OSR-03]

duration: 8min
completed: 2026-04-28T02:22:40Z
---

# Phase 09 Plan 03: V2 Sketch Result And History Lifecycle Summary

**OpenAI Sketch v2 result and history lifecycle with two ordered candidates, provider-derived v1/v2 badges, disabled follow-ups, and Sketch-specific retry/edit routes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-28T02:14:14Z
- **Completed:** 2026-04-28T02:22:40Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Generalized result-page v2 detection to `generation.provider === 'openai'` while keeping IP Change and Sketch to Real copy in separate mode-specific branches.
- Added OpenAI Sketch v2 loading, failure, selected-image alt text, thumbnail alt text, retry route, condition-edit route, and `선택 이미지 다운로드` copy.
- Added a Sketch v2 guard that shows an actionable failure state unless exactly two persisted candidates are present.
- Sorted rendered candidates by persisted `output_1`/`output_2` style file-path order while preserving selection state separately.
- Kept Phase 10 follow-up actions disabled for OpenAI v2 and removed IP Change-only follow-up wording from visible Sketch v2 action labels.
- Extended history cards so Sketch to Real and IP Change both render `v1`/`v2` badges based on stored provider and reopen the existing generation result route.

## Task Commits

Each task was committed atomically:

1. **Task 1: Generalize result page v2 state for Sketch to Real** - `2aaa7b4` (feat)
2. **Task 2: Keep unsupported v2 follow-ups disabled for Sketch** - `da8876f` (fix)
3. **Task 3: Add Sketch v1/v2 history badges and reopen parity** - `5d02f24` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - Adds provider-based v2 state, mode-specific OpenAI copy, Sketch v2 route handling, exact two-candidate guard, output-order rendering, selected-image download copy, and disabled follow-up safeguards.
- `apps/web/src/app/projects/[id]/history/page.tsx` - Adds provider-derived v1/v2 badges for Sketch and IP Change cards, keeps generation-result reopen links, hides Sketch-incompatible character metadata, and updates empty copy for Sketch saved results.

## Decisions Made

- Used stored `provider` as the version boundary and `mode` only for workflow-specific copy and routes.
- Preserved IP Change v2 copy by putting Sketch v2 strings in a separate `sketch_to_real` copy branch.
- Used output-index/file-path ordering instead of selected state so choosing candidate 2 does not reorder thumbnails after reload or history reopen.
- Kept `조건 수정` enabled for OpenAI v2 because it routes to the corresponding v2 form, while all Phase 10 follow-up actions remain disabled.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None. Stub scan only found intentional runtime state initialization and an existing input placeholder example; no placeholder data blocks the result/history lifecycle.

## User Setup Required

None - no external service configuration required by this frontend lifecycle plan.

## Next Phase Readiness

OpenAI Sketch v2 results can now use the same result, selection, save, download, history, and reopen lifecycle as IP Change v2. Phase 10 can add provider-aware continuation actions on top of the disabled follow-up controls without changing the result/history version boundary.

## Self-Check: PASSED

- Created/modified files exist: result page, history page, and this summary.
- Task commits found in git history: `2aaa7b4`, `da8876f`, `5d02f24`.
- Verification passed: `pnpm --filter @mockup-ai/web type-check`.
- Shared orchestrator artifacts were not modified: `.planning/STATE.md` and `.planning/ROADMAP.md` remained untouched.

---
*Phase: 09-openai-sketch-to-real-parity*
*Completed: 2026-04-28*
