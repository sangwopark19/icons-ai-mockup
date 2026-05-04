---
phase: 07-provider-foundation-and-key-separation
plan: 03
subsystem: web
tags: [nextjs, react, admin-ui, provider-routing, api-client]

requires:
  - phase: 07-02-provider-scoped-admin-keys
    provides: Provider-required admin key routes and activeApiKeysByProvider dashboard payload
provides:
  - Provider-aware admin API client contracts
  - Gemini/OpenAI tabbed API key management UI
  - Provider-inherited add-key modal and row actions
  - Provider-scoped dashboard active key display
affects: [07-04-admin-monitoring-ui, phase-08-openai-provider-entry]

tech-stack:
  added: []
  patterns:
    - AdminProvider union drives web API calls and provider-tab UI state
    - Provider context is inherited from tabs rather than entered manually

key-files:
  created:
    - .planning/phases/07-provider-foundation-and-key-separation/07-03-SUMMARY.md
  modified:
    - apps/web/src/lib/api.ts
    - apps/web/src/app/admin/api-keys/page.tsx
    - apps/web/src/app/admin/api-keys/AddKeyModal.tsx
    - apps/web/src/app/admin/api-keys/ApiKeyTable.tsx
    - apps/web/src/app/admin/dashboard/page.tsx

key-decisions:
  - "The admin key table omits a provider column because the selected tab is the provider context."
  - "Dashboard active key state is rendered as separate Gemini and OpenAI KPI cards."

patterns-established:
  - "Use `AdminProvider` for provider-aware admin client methods instead of loose strings."
  - "Provider-specific Korean copy is derived from the selected provider tab."

requirements-completed:
  - OPS-01
  - OPS-02

duration: 6 min
completed: 2026-04-24
---

# Phase 07 Plan 03: Provider-Aware Admin Web Summary

**Admin web surfaces now expose Gemini and OpenAI as separate provider lanes for key management and dashboard active-key state.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-24T02:27:00Z
- **Completed:** 2026-04-24T02:33:00Z
- **Tasks:** 3 completed
- **Files modified:** 5

## Accomplishments

- Added `AdminProvider`, provider-aware `AdminApiKey`, `DashboardStats.activeApiKeysByProvider`, and OpenAI support metadata fields to the admin API client.
- Updated admin API key client calls to pass provider through list/create/delete/activate requests.
- Rebuilt `/admin/api-keys` as Gemini/OpenAI tabs with provider-inherited modal copy and row actions.
- Replaced the single dashboard active-key KPI with separate Gemini and OpenAI active-key cards.

## Task Commits

1. **Task 1: Update admin API client contracts for provider-aware keys, dashboard, and monitoring metadata** - `f0b9974` (feat)
2. **Task 2: Rebuild `/admin/api-keys` as provider tabs with provider-inherited modal and row actions** - `491a523` (feat)
3. **Task 3: Replace the single active-key KPI with provider-scoped dashboard state** - `0b52fa3` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/web/src/lib/api.ts` - Added provider-aware admin types and request signatures.
- `apps/web/src/app/admin/api-keys/page.tsx` - Added provider tabs and provider-aware API key actions.
- `apps/web/src/app/admin/api-keys/AddKeyModal.tsx` - Added provider prop and provider-specific title.
- `apps/web/src/app/admin/api-keys/ApiKeyTable.tsx` - Added provider-specific empty state while keeping provider out of row columns.
- `apps/web/src/app/admin/dashboard/page.tsx` - Added Gemini/OpenAI active-key KPI cards.

## Decisions Made

- Kept the admin key table columns unchanged inside each tab to preserve scan density.
- Used compact segmented tabs rather than a larger page section so the operational admin page stays focused.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Browser smoke required a fake admin auth state and mocked dashboard stats because the API server was not running on `localhost:4000`. This verified route rendering and UI state without requiring live backend auth.

## Verification

- `pnpm --filter @mockup-ai/web type-check` - PASS
- Browser smoke `/admin/api-keys` on `http://localhost:3002` - PASS; Gemini/OpenAI tabs and provider-specific empty states rendered.
- Browser smoke `/admin/dashboard` on `http://localhost:3002` with mocked stats - PASS; Gemini and OpenAI active-key cards rendered, including `활성 키 미설정` for missing OpenAI key.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 07-04 worker routing and admin monitoring metadata. The web API client already carries provider/model/support fields that the final admin generation UI work can consume.

## Self-Check: PASSED

- SUMMARY file exists.
- Key modified files exist.
- Task commits `f0b9974`, `491a523`, and `0b52fa3` exist in git history.
- Web type-check and browser smoke checks pass.

---
*Phase: 07-provider-foundation-and-key-separation*
*Completed: 2026-04-24*
