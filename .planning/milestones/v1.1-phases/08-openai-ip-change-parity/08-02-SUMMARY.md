---
phase: 08-openai-ip-change-parity
plan: 02
subsystem: web
tags: [nextjs, react, ip-change, provider-parity, quality-mode]
requires:
  - phase: 08-openai-ip-change-parity
    provides: backend OpenAI IP Change runtime and quality contract
provides:
  - v1/v2 project workflow entries
  - v2 IP Change form route
  - OpenAI provider/model create payload with Korean quality labels
affects: [phase-08-openai-ip-change-parity, phase-10-provider-aware-result-continuation]
tech-stack:
  added: []
  patterns: [parallel-v2-route, native-radio-segmented-control]
key-files:
  created:
    - apps/web/src/app/projects/[id]/ip-change/openai/page.tsx
  modified:
    - apps/web/src/app/projects/[id]/page.tsx
    - apps/web/src/app/projects/[id]/ip-change/page.tsx
key-decisions:
  - "v2 is a sibling route at /projects/:id/ip-change/openai; v1 remains at /projects/:id/ip-change."
  - "Product copy uses v1/v2 labels only; provider/model names are hidden in request payload code."
  - "Quality mode uses Korean labels mapped to low, medium, and high with medium as default."
patterns-established:
  - "OpenAI-backed product forms keep provider values in create payloads, not visible workflow labels."
requirements-completed: [PROV-01, OIP-01, OIP-02]
duration: 6 min
completed: 2026-04-24
---

# Phase 08 Plan 02: V2 Project Entry And IP Change Form Summary

**Project-level v1/v2 IP Change entries and a preservation-default v2 form that submits OpenAI-backed requests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-24T08:39:04Z
- **Completed:** 2026-04-24T08:44:58Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added sibling `IP 변경 v1` and `IP 변경 v2` entries to the project sidebar and workflow card grid.
- Preserved the legacy route while labeling it as `IP 변경 v1`.
- Created `/projects/:id/ip-change/openai` with v2 defaults, two-output payload, hidden OpenAI provider/model values, and `빠른모드`/`균형모드`/`퀄리티모드` quality mapping.

## Task Commits

1. **Task 08-02-01: Add sibling v1/v2 project entries** - `d3a4ea9`
2. **Task 08-02-02: Preserve v1 route and label it as v1 if touched** - `6ecdde1`
3. **Task 08-02-03: Add OpenAI v2 IP Change route and form** - `39a0483`

## Files Created/Modified

- `apps/web/src/app/projects/[id]/page.tsx` - v1/v2 sidebar and project card entries.
- `apps/web/src/app/projects/[id]/ip-change/page.tsx` - legacy v1 title/body label only.
- `apps/web/src/app/projects/[id]/ip-change/openai/page.tsx` - v2 upload/options form and OpenAI-backed create request.

## Decisions Made

- Used a native radio-based segmented control for quality mode to preserve keyboard operation.
- Kept v2 visual emphasis limited to brand border/badge so v1 remains equal and available.
- Duplicated the existing IP Change form flow for v2 first, avoiding a broad shared-component refactor during parity rollout.

## Deviations from Plan

None - plan executed exactly as written.

---

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

None.

## Verification

- `pnpm --filter @mockup-ai/web type-check` - passed.
- Acceptance greps confirmed `IP 변경 v1`, `IP 변경 v2`, `/ip-change/openai`, v2 copy, provider/model request values, Korean quality labels, `quality`, and `outputCount: 2`.
- Grep confirmed v1 route does not contain OpenAI provider/model payloads.

## User Setup Required

None.

## Next Phase Readiness

Users can now enter the v2 IP Change flow and create OpenAI-backed generation records. Wave 2 can wire result/history lifecycle behavior around provider-aware v1/v2 labels and disabled v2 follow-up actions.

---
*Phase: 08-openai-ip-change-parity*
*Completed: 2026-04-24*
