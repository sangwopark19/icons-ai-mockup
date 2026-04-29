---
phase: quick-260428-p4c-gpt-image-2-0-2-requests-27-101-176-cli
plan: 01
subsystem: api-observability
tags: [openai, gpt-image-2, bullmq, admin, request-accounting]
requires:
  - phase: v1.1 OpenAI GPT Image 2 Dual Provider
    provides: provider-aware OpenAI image runtime, API key call counts, admin generation metadata
provides:
  - Bounded OpenAI Image API request budget with SDK retries disabled
  - Provider-specific queue retry policy preserving Gemini retries
  - Safe admin request-accounting fields for OpenAI generations
  - REQUEST-AUDIT evidence trail for the 27 request / 101,176 token investigation
affects: [openai-runtime, admin-dashboard, generation-monitoring, queue-worker]
tech-stack:
  added: []
  patterns:
    - OpenAI providerTrace stores safe numeric accounting fields only
    - OpenAI callCount increments after vendor response using recorded externalRequestCount
key-files:
  created:
    - .planning/quick/260428-p4c-gpt-image-2-0-2-requests-27-101-176-cli/REQUEST-AUDIT.md
    - apps/api/src/lib/__tests__/queue.test.ts
    - .planning/quick/260428-p4c-gpt-image-2-0-2-requests-27-101-176-cli/260428-p4c-SUMMARY.md
  modified:
    - apps/api/src/services/openai-image.service.ts
    - apps/api/src/services/__tests__/openai-image.service.test.ts
    - apps/api/src/lib/queue.ts
    - apps/api/src/worker.ts
    - apps/api/src/services/admin.service.ts
    - apps/api/src/services/__tests__/admin.service.test.ts
    - apps/api/src/services/__tests__/generation.service.test.ts
    - apps/web/src/lib/api.ts
    - apps/web/src/app/admin/dashboard/page.tsx
    - apps/web/src/components/admin/generation-detail-modal.tsx
key-decisions:
  - "OpenAI image client uses maxRetries: 0 so app accounting maps one service call to one vendor HTTP request."
  - "OpenAI BullMQ jobs use attempts: 1 while Gemini keeps the existing default attempts: 3 behavior."
  - "Admin UI exposes selected safe request-accounting fields, not raw providerTrace or vendor responses."
patterns-established:
  - "Request budget trace: externalRequestCount, outputCount, sdkMaxRetries, queueAttempts."
  - "OpenAI active key callCount is app-recorded Image API calls, not browser requests or OpenAI token usage."
requirements-completed: [OPENAI-USAGE-AUDIT, OPENAI-REQUEST-BUDGET, ADMIN-USAGE-CLARITY]
duration: 19min
completed: 2026-04-28
---

# Phase quick-260428-p4c: GPT Image 2 Request Accounting Summary

**OpenAI Image API calls now have a bounded request budget, safe admin accounting, and an audit trail separating app calls, retries, candidates, browser requests, and dashboard token usage.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-04-28T09:12:33Z
- **Completed:** 2026-04-28T09:31:32Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments

- Built `REQUEST-AUDIT.md` with CLI/browser findings, local service blockers, and the root request-multiplier analysis for `27 requests` / `101,176` tokens.
- Disabled hidden OpenAI SDK retries and limited OpenAI BullMQ jobs to a single attempt while preserving Gemini retry behavior.
- Moved OpenAI `callCount` increment to after the vendor response and incremented by recorded `externalRequestCount`.
- Added safe admin/API fields: `openaiExternalRequestCount`, `openaiOutputCount`, `openaiSdkMaxRetries`, `openaiQueueAttempts`.
- Updated admin dashboard/detail UI copy so app-recorded OpenAI Image API calls are not confused with browser polling or OpenAI token usage.

## Task Commits

1. **Task 1: Build the request-accounting evidence trail** - `dbbe34d` (docs)
2. **Task 2 RED: Remove hidden OpenAI retry amplification tests** - `1e8dbdb` (test)
3. **Task 2 GREEN: Remove hidden OpenAI retry amplification** - `25451c1` (feat)
4. **Task 3: Make admin/API usage display request accounting safely** - `d3e3739` (feat)

## Files Created/Modified

- `REQUEST-AUDIT.md` - Investigation notes, root cause, blockers, and after-fix expectations.
- `openai-image.service.ts` - Sets `maxRetries: 0` and records request/candidate accounting metadata.
- `queue.ts` - Overrides OpenAI jobs to `attempts: 1`; Gemini keeps default retries.
- `worker.ts` - Adds queue attempt context and increments OpenAI callCount after vendor response.
- `admin.service.ts` - Maps safe accounting fields and supports explicit callCount increments.
- `generation-detail-modal.tsx` - Shows safe support counts without raw `providerTrace`.
- `dashboard/page.tsx` - Clarifies OpenAI KPI as app-recorded Image API calls.

## Decisions Made

- OpenAI request budgeting is enforced in both retry layers: SDK `maxRetries: 0` and BullMQ `attempts: 1`.
- OpenAI `n: 2` remains the product contract, but it is labeled as output candidates, not extra HTTP requests.
- Admin surfaces only selected numbers and request IDs; raw provider trace and vendor payloads stay backend-only.

## Deviations from Plan

None - plan executed as specified.

## Issues Encountered

- Local PostgreSQL (`:5432`) and Redis (`:6379`) were not running, so historical OpenAI `Generation` rows, `ApiKey.callCount`, BullMQ `attemptsMade`, and worker logs could not be inspected.
- Local web/API servers (`:3000`, `:4000`) were not running. Playwright MCP was also blocked by an existing Chrome profile lock, and fallback `curl` checks confirmed connection refused.
- OpenAI dashboard usage for the historical time window was not accessible from this workspace. The audit therefore separates confirmed code-level amplification from unverified dashboard interpretation.

## Known Stubs

None. Stub-pattern matches in the scan were existing nullable UI state or intentional accumulator arrays, not placeholder data paths.

## Threat Flags

None. The change adds no new endpoint, auth path, schema field, file access path, or raw provider payload exposure.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/openai-image.service.test.ts src/lib/__tests__/queue.test.ts src/services/__tests__/admin.service.test.ts src/services/__tests__/generation.service.test.ts` - passed, 86 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- `pnpm --filter @mockup-ai/web type-check` - passed.
- `REQUEST-AUDIT.md` required-term check - passed.
- Admin detail modal static guard for safe fields and no raw `providerTrace` render - passed.

## User Setup Required

None for the code fix. Live browser/OpenAI reconciliation requires local or remote services with PostgreSQL, Redis, API, worker, web, and OpenAI dashboard/API access for the same absolute time window.

## Next Phase Readiness

OpenAI request accounting is now bounded and visible through safe admin fields. A live smoke can be rerun once services are available to confirm one browser `POST /api/generations`, one queue attempt, `externalRequestCount: 1`, `outputCount: 2`, `sdkMaxRetries: 0`, and `queueAttempts: 1`.

## Self-Check: PASSED

- Found `REQUEST-AUDIT.md`.
- Found `260428-p4c-SUMMARY.md`.
- Found commits `dbbe34d`, `1e8dbdb`, `25451c1`, and `d3e3739`.
- Summary required-section check passed.

---
*Phase: quick-260428-p4c-gpt-image-2-0-2-requests-27-101-176-cli*
*Completed: 2026-04-28*
