---
phase: 08-openai-ip-change-parity
plan: 03
subsystem: web
tags: [nextjs, react, result-page, history, provider-parity]
requires:
  - phase: 08-openai-ip-change-parity
    provides: v2 create flow and provider-aware generation records
provides:
  - v2 result page labels and candidate lifecycle
  - disabled v2 follow-up actions for Phase 8
  - v1/v2 history badges
affects: [phase-08-openai-ip-change-parity, phase-10-provider-aware-result-continuation]
tech-stack:
  added: []
  patterns: [provider-derived-version-labels, disabled-followup-guidance]
key-files:
  created: []
  modified:
    - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
    - apps/web/src/app/projects/[id]/history/page.tsx
    - apps/web/src/lib/api.ts
key-decisions:
  - "v2 labels are derived from stored provider=openai and mode=ip_change."
  - "Phase 8 disables v2 edit/style-copy/regenerate actions with guided copy instead of allowing unsupported API calls."
  - "Download is disabled when no selected candidate exists."
patterns-established:
  - "Product surfaces use v1/v2 labels while provider/model values remain typed/internal."
requirements-completed: [OIP-01, OIP-03, PROV-01]
duration: 7 min
completed: 2026-04-24
---

# Phase 08 Plan 03: V2 Result And History Lifecycle Summary

**Provider-derived v2 result/history labels with selectable two-candidate lifecycle and disabled unsupported follow-ups**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-24T08:44:58Z
- **Completed:** 2026-04-24T08:51:40Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added provider-aware result typing and v2 pending/failed/completed copy.
- Added v2 candidate labels, selected image alt text, selected-candidate download guard, and v2 condition edit routing.
- Disabled Phase 10 follow-up actions for v2 with `v2 후속 편집은 다음 업데이트에서 지원됩니다`.
- Added v1/v2 history badges and updated the empty history state copy.

## Task Commits

1. **Tasks 08-03-01 and 08-03-02: v2 result rendering and disabled follow-ups** - `9c59b0c`
2. **Task 08-03-03: v1/v2 history badges** - `8c1d26c`

## Files Created/Modified

- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx` - v2 result state, candidates, disabled follow-ups, and v2 condition edit route.
- `apps/web/src/app/projects/[id]/history/page.tsx` - provider-derived v1/v2 badges and empty copy.
- `apps/web/src/lib/api.ts` - product generation/detail/history provider types.

## Decisions Made

- Kept candidate select/save/download on the existing endpoints instead of creating v2-specific endpoints.
- Combined result rendering and disabled follow-up changes into one commit because both tasks modify the same action surface in the same page.

## Deviations from Plan

### Auto-fixed Issues

**1. [Commit granularity] Combined two same-file result tasks**
- **Found during:** Task commit packaging
- **Issue:** Tasks 08-03-01 and 08-03-02 both modified the same result page state and action stack.
- **Fix:** Committed them together as one cohesive result lifecycle change to avoid artificial split patches.
- **Files modified:** `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`, `apps/web/src/lib/api.ts`
- **Verification:** Result page acceptance grep and web type-check passed.
- **Committed in:** `9c59b0c`

---

**Total deviations:** 1 packaging deviation.
**Impact on plan:** Behavioral scope unchanged.

## Issues Encountered

None.

## Verification

- `pnpm --filter @mockup-ai/web type-check` - passed.
- Acceptance greps confirmed provider union typing, `generation.provider === 'openai'`, v2 loading copy, candidate count, `후보 1`/`후보 2`, disabled follow-up copy, v2 condition route, disabled/download guards, history `v1`/`v2`, and empty state copy.
- Grep confirmed product result/history pages do not render `GPT Image 2` or `gpt-image-2`.

## User Setup Required

None.

## Next Phase Readiness

OpenAI IP Change v2 can now be created, selected, saved, reopened from history, and downloaded through the existing lifecycle. The final smoke/release verification plan can validate the full rollout.

---
*Phase: 08-openai-ip-change-parity*
*Completed: 2026-04-24*
