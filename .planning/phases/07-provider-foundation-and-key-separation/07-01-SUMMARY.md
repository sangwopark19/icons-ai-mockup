---
phase: 07-provider-foundation-and-key-separation
plan: 01
subsystem: database
tags: [prisma, provider-routing, bullmq, zod, openai, gemini]

requires:
  - phase: v1.0-admin-panel
    provides: Gemini generation, encrypted API key storage, generation retry, and BullMQ queue orchestration
provides:
  - Provider-aware Generation schema with Gemini-safe defaults and OpenAI lineage fields
  - Provider-scoped ApiKey schema foundation
  - Provider/model shared contracts and generation route payloads
  - Provider-aware queue payloads for create, regenerate, copy-style, and admin retry enqueue paths
affects: [07-02-provider-api-keys, 07-04-worker-routing, phase-08-openai-ip-change, phase-10-provider-continuation]

tech-stack:
  added: []
  patterns:
    - Provider enum shared across Prisma, Zod contracts, services, routes, and queue payloads
    - Generation.provider remains durable source of truth while queue payload carries provider as routing copy

key-files:
  created:
    - .planning/phases/07-provider-foundation-and-key-separation/07-01-SUMMARY.md
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/types/index.ts
    - apps/api/src/lib/queue.ts
    - apps/api/src/services/generation.service.ts
    - apps/api/src/routes/generation.routes.ts
    - apps/api/src/services/admin.service.ts

key-decisions:
  - "Generation.provider defaults to gemini and providerModel defaults to gemini-3-pro-image-preview for existing records."
  - "Queue provider/providerModel fields are required copied routing data, not a replacement for the database generation record."
  - "Explicit OpenAI create requests default providerModel to gpt-image-2 until the runtime supplies a more precise model."

patterns-established:
  - "Provider lineage fields are persisted before enqueue so workers and retries never infer provider from mode alone."
  - "Generation responses include provider and providerModel wherever create/regenerate/history consumers need lineage."

requirements-completed:
  - OPS-02
  - OPS-03
  - OPS-04

duration: 9 min
completed: 2026-04-24
---

# Phase 07 Plan 01: Provider Foundation Contracts Summary

**Provider/model lineage is now durable across Prisma, shared types, generation routes, and BullMQ enqueue payloads.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-04-24T02:00:56Z
- **Completed:** 2026-04-24T02:10:02Z
- **Tasks:** 3 completed
- **Files modified:** 6

## Accomplishments

- Added Prisma `Provider` enum plus `Generation.provider`, `Generation.providerModel`, `providerTrace`, and OpenAI request/response lineage fields.
- Added `ApiKey.provider` with Gemini default and provider/active index for provider-scoped key separation.
- Extended shared Zod contracts, generation request validation, route responses, service persistence, and queue payloads with provider/model fields.
- Verified the live mockup Postgres schema and regenerated Prisma Client against the provider-aware schema.

## Task Commits

1. **Task 1: Add provider-aware Prisma and shared type contracts** - `3a4d58e` (feat)
2. **Task 2: Persist provider/model in create and regenerate flows and queue payloads** - `39dfe3b` (feat)
3. **Task 3: Run Prisma schema push and verify provider defaults landed** - `3f0a8b1` (chore, empty verification commit)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `apps/api/prisma/schema.prisma` - Added provider enum, Generation provider/model/OpenAI lineage fields, and ApiKey provider scoping.
- `packages/shared/src/types/index.ts` - Added `GenerationProviderEnum`, `GenerationProvider`, and provider/model fields to generation contracts.
- `apps/api/src/lib/queue.ts` - Required `provider` and `providerModel` in `GenerationJobData`.
- `apps/api/src/services/generation.service.ts` - Persisted provider/model on create and preserved them on regenerate/copy-style.
- `apps/api/src/routes/generation.routes.ts` - Accepted optional provider/model and returned provider/model in create, get, regenerate, copy-style, and history payloads.
- `apps/api/src/services/admin.service.ts` - Preserved provider/model when admin retry re-enqueues a failed generation.

## Decisions Made

- Used a single `Provider` enum with exact values `gemini` and `openai` instead of boolean provider flags.
- Kept Gemini as the default provider/model for omitted values so current product flows remain unchanged.
- Treated queue provider/model as required copied metadata while preserving `Generation.provider` as the durable source of truth for later worker validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated admin retry enqueue for required provider queue payload**
- **Found during:** Task 2 (Persist provider/model in create and regenerate flows and queue payloads)
- **Issue:** Making `GenerationJobData.provider` and `providerModel` required would break the existing `adminService.retryGeneration()` enqueue path.
- **Fix:** Added `generation.provider` and `generation.providerModel` to the admin retry `addGenerationJob(...)` payload.
- **Files modified:** `apps/api/src/services/admin.service.ts`
- **Verification:** `pnpm --filter @mockup-ai/api type-check`
- **Committed in:** `39dfe3b`

**2. [Rule 3 - Blocking] Resolved local Prisma DB push environment mismatch**
- **Found during:** Task 3 (Run Prisma schema push and verify provider defaults landed)
- **Issue:** Prisma did not auto-load the root `.env` for filtered package commands, and the configured localhost Postgres port was occupied by another project database.
- **Fix:** Started a temporary Postgres container on port `55432` using the existing `icons-ai-mockup_postgres_data` volume, ran `db:push`, `db:generate`, and `prisma validate` against the mockup database, then removed the temporary container.
- **Files modified:** None
- **Verification:** `pnpm --filter @mockup-ai/api db:push && pnpm --filter @mockup-ai/api db:generate`; `cd apps/api && npx prisma validate`
- **Committed in:** `3f0a8b1`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were required to complete the planned contract and database verification. No feature scope was expanded beyond provider/model lineage.

## Issues Encountered

- Initial `db:push` failed because `DATABASE_URL` was not visible to the Prisma package command. After loading an explicit mockup database URL, the command succeeded.
- The default local Postgres port was occupied by another project container, so verification used the existing mockup volume through a temporary port `55432` container.

## Verification

- `pnpm --filter @mockup-ai/api type-check` - PASS
- `pnpm --filter @mockup-ai/web type-check` - PASS
- `pnpm --filter @mockup-ai/api db:push && pnpm --filter @mockup-ai/api db:generate` - PASS against the mockup Postgres volume via temporary `localhost:55432`
- `cd apps/api && npx prisma validate` - PASS
- Generated Prisma Client read check for `Provider`, `providerModel`, `providerTrace`, and OpenAI lineage fields - PASS
- Database read check showed `provider` defaults to `gemini` and `provider_model` defaults to `gemini-3-pro-image-preview` - PASS

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 07-02 provider-scoped API key backend work. The database and queue contracts now expose provider/model lineage, while worker dispatch and admin key UI separation remain in later Phase 7 plans.

## Self-Check: PASSED

- SUMMARY file exists.
- Key modified files exist.
- Task commits `3a4d58e`, `39dfe3b`, and `3f0a8b1` exist in git history.

---
*Phase: 07-provider-foundation-and-key-separation*
*Completed: 2026-04-24*
