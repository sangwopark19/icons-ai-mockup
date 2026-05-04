---
phase: 09-openai-sketch-to-real-parity
plan: 02
subsystem: ui
tags: [nextjs, react, tailwind, openai, sketch-to-real]

requires:
  - phase: 08-openai-ip-change-parity
    provides: v1/v2 project entry and expanded v2 form patterns
provides:
  - Project-level Sketch to Real v1/v2 sidebar and workflow entries
  - OpenAI Sketch to Real v2 form route with product and material guidance
  - PNG/JPEG-only 10MB client upload validation hooks for v2 edit inputs
affects: [phase-09-result-history, sketch-to-real, provider-ui]

tech-stack:
  added: []
  patterns:
    - Phase 8 v2 card and form treatment reused for Sketch to Real v2
    - Shared ImageUploader accepts per-instance validation and remove aria-label copy

key-files:
  created:
    - apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx
  modified:
    - apps/web/src/app/projects/[id]/page.tsx
    - apps/web/src/app/projects/[id]/sketch-to-real/page.tsx
    - apps/web/src/components/ui/image-uploader.tsx

key-decisions:
  - "Sketch to Real v2 is exposed as a sibling route, not a provider toggle."
  - "Visible product copy uses only v1/v2 labels; provider/model values stay in request payload code."
  - "V2 upload validation is route-specific through backward-compatible ImageUploader props."

patterns-established:
  - "Sketch v2 forms use product category and material chip groups with aria-pressed state."
  - "OpenAI edit inputs are restricted client-side to PNG/JPEG and 10MB before upload and before create."

requirements-completed: [PROV-02, OSR-01, OSR-02, OSR-03]

duration: 6min
completed: 2026-04-28T02:04:38Z
---

# Phase 09 Plan 02: V2 Project Entry And Sketch Form Summary

**Sketch to Real v2 project entry and form route with provider-hidden OpenAI request wiring, product/material guidance, and PNG/JPEG upload guardrails**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-28T01:59:22Z
- **Completed:** 2026-04-28T02:04:38Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added sibling `스케치 실사화 v1` and `스케치 실사화 v2` entries to the project sidebar and workflow grid.
- Preserved the existing `/projects/:id/sketch-to-real` route and labeled it as v1 without changing its create payload.
- Added `/projects/:id/sketch-to-real/openai` with required sketch upload, optional texture reference, product/material controls, quality mapping, preservation defaults, transparent option, and two-output OpenAI payload fields.
- Extended `ImageUploader` with optional per-instance validation messages and Korean remove aria labels while keeping default behavior unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sibling Sketch v1/v2 project entries** - `610e0d2` (feat)
2. **Task 2: Preserve v1 Sketch route and label it as v1 if touched** - `b609b26` (feat)
3. **Task 3: Add OpenAI v2 Sketch to Real route and form** - `fb37587` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/web/src/app/projects/[id]/page.tsx` - Adds Sketch to Real v1/v2 project entry points with v2 route and provider-hidden user copy.
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx` - Labels the existing route as v1 while preserving Gemini-default create payload.
- `apps/web/src/app/projects/[id]/sketch-to-real/openai/page.tsx` - New v2 form route with Sketch-specific controls and OpenAI create body.
- `apps/web/src/components/ui/image-uploader.tsx` - Adds optional invalid type, max size, and remove aria-label props for route-specific validation.

## Decisions Made

- Kept Sketch to Real v1 and v2 as separate sibling entries to match the Phase 8 IP Change pattern.
- Used chip-style button groups with `aria-pressed` for product and material controls to keep labels visible and keyboard reachable.
- Added route-specific uploader copy through optional props so existing Gemini and IP Change callers keep their defaults.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Parallel wave changes were present in unrelated backend/shared files during execution. They were left unstaged and untouched for this plan's commits.

## Known Stubs

None. The stub scan only found intentional input placeholder attributes used as form examples.

## User Setup Required

None - no external service configuration required by this frontend entry/form plan.

## Next Phase Readiness

The v2 Sketch to Real form now submits the provider/model/options contract expected by backend runtime and result/history plans. Follow-up Phase 9 plans can focus on result lifecycle and history parity without adding another project entry surface.

## Self-Check: PASSED

- Created/modified files exist: project page, v1 route, v2 route, shared uploader, and this summary.
- Task commits found in git history: `610e0d2`, `b609b26`, `fb37587`.
- Verification passed: `pnpm --filter @mockup-ai/web type-check`.

---
*Phase: 09-openai-sketch-to-real-parity*
*Completed: 2026-04-28*
