---
phase: 07-provider-foundation-and-key-separation
status: passed
verified: 2026-04-24T03:02:00.000Z
automated_checks_passed: true
human_verification_required: false
gaps_found: false
review_status: issues_found_partially_remediated
requirements:
  OPS-01: satisfied
  OPS-02: satisfied
---

# Phase 07 Verification: Provider Foundation and Key Separation

## Verdict

Phase 07 passed verification. The generation and admin control plane are now provider-aware before OpenAI workflows are exposed: provider/model lineage is persisted, queue payloads carry provider data, admin API keys are provider-scoped, worker/edit paths validate or preserve provider lineage, and admin monitoring surfaces safe provider support metadata.

## Requirement Traceability

| Requirement | Status | Evidence |
|---|---|---|
| OPS-01: Admin can store and activate OpenAI API keys separately from Gemini API keys | SATISFIED | `apps/api/src/services/admin.service.ts` scopes key CRUD/activation by provider; `apps/api/src/routes/admin/api-keys.routes.ts` requires provider; `/admin/api-keys` renders Gemini/OpenAI tabs. |
| OPS-02: Admin can view provider-aware generation metadata for OpenAI runs, including provider, model, and request identifiers needed for support | SATISFIED | `listGenerations()` returns provider/model/OpenAI support identifiers; `generation-table.tsx` shows provider/model; `generation-detail-modal.tsx` renders collapsed `지원 정보` without `providerTrace`. |

## Must-Have Verification

| Plan | Must-have | Status |
|---|---|---|
| 07-01 | Generation and ApiKey schema contain provider/model/OpenAI lineage fields with Gemini-safe defaults | VERIFIED |
| 07-01 | Generation queue payload includes required provider and providerModel | VERIFIED |
| 07-01 | Create/regenerate flows persist and re-enqueue saved provider/model | VERIFIED |
| 07-02 | Admin API key CRUD/activation is scoped by selected provider | VERIFIED |
| 07-02 | Gemini and OpenAI can each have an active key without cross-provider deactivation | VERIFIED by service tests |
| 07-03 | Admin API client and UI use provider-aware key/dashboard contracts | VERIFIED |
| 07-03 | `/admin/api-keys` and dashboard expose separate Gemini/OpenAI lanes | VERIFIED by browser smoke |
| 07-04 | Worker validates queue provider/model against the persisted generation | VERIFIED |
| 07-04 | Edit/retry paths preserve provider/model or reject unsupported provider runtime clearly | VERIFIED after review fix `98df431` |
| 07-04 | Admin monitoring exposes safe support metadata and does not expose `providerTrace` | VERIFIED |

## Automated Checks

- `pnpm --filter @mockup-ai/api test` - PASS, 5 files / 71 tests
- `pnpm type-check` - PASS, 3 packages
- `pnpm --filter @mockup-ai/api db:generate` - PASS
- `gsd-sdk query verify.schema-drift "07"` - PASS, valid
- Prior targeted checks also passed during plan execution: API type-check, web type-check, admin service Vitest suite, Prisma validate/db push in Plan 07-01.

## Browser Smoke

- `/admin/api-keys` on `http://localhost:3002` - PASS; Gemini/OpenAI tabs and provider-specific empty states rendered.
- `/admin/dashboard` with mocked stats - PASS; Gemini and OpenAI active-key cards rendered separately.
- `/admin/content` with mocked OpenAI generation - PASS; table rendered OpenAI + `gpt-image-2`, detail modal rendered OpenAI request/response/image call IDs and revised prompt in `지원 정보`.

## Code Review Follow-Up

`07-REVIEW.md` found 7 issues. Four provider-lineage or same-scope correctness issues were remediated in `98df431`:

- CR-02: `selectImage()` now verifies the image belongs to the authorized generation inside a transaction before clearing selection.
- WR-01: OpenAI unsupported-runtime guard now runs before active-key lookup, status transition, and file reads.
- WR-02: Admin retry now requeues the saved prompt, style reference, and full provider-relevant options.
- WR-03: `providerModel` is validated against the selected provider, and worker validates queued providerModel against the DB record.

Remaining review items are real residual risks but do not block Phase 07's provider-foundation goal:

- CR-01: uploaded image path ownership/boundary validation should be tightened in a dedicated security/gap task.
- WR-04: database-level partial uniqueness for one active API key per provider should be added when migration strategy is finalized.
- IN-01: split client-safe shared generation schema from internal persisted generation schema so `providerTrace` cannot be accidentally reused in public responses later.

## Residual Risk

Security enforcement is enabled and no `07-SECURITY.md` exists yet. Run `$gsd-secure-phase 07` before advancing a production rollout, especially to address the remaining path ownership finding.

## Conclusion

Phase 07 is ready for completion and unblocks Phase 08. The OpenAI runtime is intentionally not enabled yet; OpenAI generation attempts fail explicitly until the Phase 08 image runtime is implemented.
