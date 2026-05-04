---
phase: 10-provider-aware-result-continuation
plan: 06
subsystem: ui
tags: [nextjs, react, provider-aware, openai, style-copy, continuation]

requires:
  - phase: 10-provider-aware-result-continuation
    provides: "Plan 10-04 copy-style API endpoint and OpenAI continuation payload contract"
provides:
  - Dedicated `/projects/:id/style-copy/openai` style-copy page
  - Authenticated OpenAI v2 style reference preview with selected-image validation
  - Target-specific upload and copy-style submit flow for `ip-change` and `new-product`
affects: [phase-10-provider-aware-result-continuation, openai-style-copy, provider-aware-ui]

tech-stack:
  added: []
  patterns:
    - "OpenAI continuation product UI uses `v2` copy while raw provider/model identifiers stay hidden"
    - "Style-copy page validates URL continuation state before enabling target upload or submit"

key-files:
  created:
    - apps/web/src/app/projects/[id]/style-copy/openai/page.tsx
    - .planning/phases/10-provider-aware-result-continuation/10-06-SUMMARY.md
  modified: []

key-decisions:
  - "The style-copy page treats `styleRef`, `copyTarget`, and `imageId` as required continuation state and blocks the form with Phase 10 copy when invalid."
  - "The submit flow uploads the new target first, then sends only the target-specific path field expected by `/api/generations/:styleRef/copy-style`."

patterns-established:
  - "Dedicated v2 follow-up pages should fetch persisted generation data after auth hydration and redirect unauthenticated users before any protected fetch."
  - "Target asset validation errors stay on the style-copy page; raw OpenAI/provider/model strings are not shown in product copy."

requirements-completed: [OED-02, PROV-03]

duration: 5min
completed: 2026-04-29
---

# Phase 10 Plan 06: OpenAI Style-Copy Page Summary

**Dedicated v2 style-copy page with authenticated style reference preview, target upload, and provider-pinned copy-style submission**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-29T01:34:32Z
- **Completed:** 2026-04-29T01:39:43Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `/projects/:id/style-copy/openai` as a client route that reads `styleRef`, `copyTarget`, and `imageId` from `useSearchParams`.
- Fetches the style reference only after auth hydration and access token availability, redirects unauthenticated users to `/login`, and handles `401`, `404`, `>=500`, invalid provider, and missing selected-image states with the required Korean copy.
- Renders the approved output as `스타일 기준 · v2`, then collects either `새 캐릭터 이미지` or `새 제품 이미지` with the matching upload endpoint and remove aria label.
- Submits `copy-style` requests with `copyTarget`, `selectedImageId`, and the correct target path field, then routes to the new generation result page.

## Task Commits

1. **Task 1: Build style reference preview and target upload page** - `dd3908b` (`feat`)
2. **Task 2: Submit OpenAI style-copy requests from the dedicated page** - `8e93fb3` (`feat`)

## Files Created/Modified

- `apps/web/src/app/projects/[id]/style-copy/openai/page.tsx` - Dedicated v2 style-copy page with authenticated reference fetch, target upload, optional instructions, submit guard, and `copy-style` POST.
- `.planning/phases/10-provider-aware-result-continuation/10-06-SUMMARY.md` - Execution summary for Plan 10-06.

## Decisions Made

- Invalid or incomplete continuation query state blocks target upload/submit instead of attempting fallback routing.
- Target upload errors use the page-level submit/error area and do not overwrite the style-reference fetch error.
- The page keeps product labels to `v2` and does not expose raw provider/model strings as user-facing copy.

## Verification

- `pnpm --filter @mockup-ai/web type-check` - passed.
- `rg -n "useSearchParams|router\\.push\\('/login'\\)|response\\.status === 401|response\\.status === 404|response\\.status >= 500|스타일 복사 v2|스타일 기준 · v2|새 캐릭터 이미지|새 제품 이미지|추가 지시사항|스타일 기준 v2 결과 이미지" 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` - passed.
- `rg -n "copy-style|copyTarget: 'ip-change'|copyTarget: 'new-product'|selectedImageId: imageId|v2 스타일 복사 생성하기|스타일을 복사한 두 후보를 생성 중|isGenerating|새 대상 이미지를 업로드해주세요" 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` - passed.
- `! rg -n "Gemini|GPT Image 2|gpt-image-2|providerModel" 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` - passed.
- `! rg -n "@/components/ui/.*shadcn|components.json|registry|TODO|FIXME|coming soon|placeholder|not available" 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` - passed.

## Deviations from Plan

None in product behavior - the planned page, validation, copy, and submit contract were implemented as specified.

## TDD Gate Compliance

Task 2 was marked `tdd="true"`, but the executor ownership was explicitly limited to the page file and this summary, so no separate test file was created. Before implementation, the Task 2 grep for `copy-style`, `selectedImageId`, `isGenerating`, and submit copy failed as the RED check; the GREEN implementation then passed the plan's automated type-check and grep verification.

## Known Stubs

None.

## Threat Flags

None - the new browser-to-upload/API surface is the planned style-copy trust boundary and is covered by T-10-06-01 through T-10-06-06.

## Issues Encountered

- Parallel work modified `apps/api/src/routes/edit.routes.ts`, `apps/api/src/worker.ts`, and `apps/api/src/__tests__/` while this plan was running. Those files are outside this executor's ownership and were left untouched.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The dedicated OpenAI style-copy route is ready for result-page routing to pass `styleRef`, `copyTarget`, and `imageId`. The page uses the Plan 10-04 `copy-style` backend contract and preserves the Phase 10 `v2` product-label boundary.

## Self-Check: PASSED

- Summary and created page file exist.
- Task commits found: `dd3908b`, `8e93fb3`.
- No tracked file deletions were introduced by plan commits.
- Shared tracking files `.planning/STATE.md`, `.planning/ROADMAP.md`, and `.planning/REQUIREMENTS.md` were not modified by this executor.

---
*Phase: 10-provider-aware-result-continuation*
*Completed: 2026-04-29*
