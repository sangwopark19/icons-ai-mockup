---
phase: 11-openai-style-copy-retry-recovery
fixed_at: 2026-04-29T08:55:19Z
review_path: .planning/phases/11-openai-style-copy-retry-recovery/11-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-04-29T08:55:19Z
**Source review:** .planning/phases/11-openai-style-copy-retry-recovery/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Retry Failure Can Leave A Generation Pending With No Queue Job

**Status:** fixed: requires human verification
**Files modified:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** 43392da
**Applied fix:** Built and validated retry queue data before mutating status, then rolled the generation back to `failed` with the enqueue error if `addGenerationJob` rejects.

### CR-02: Concurrent Retries Can Enqueue Duplicate Jobs For One Generation

**Status:** fixed: requires human verification
**Files modified:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** d82ec8d
**Applied fix:** Replaced the non-atomic retry claim with `updateMany({ id, status: 'failed' })` and skipped enqueue unless exactly one caller wins the claim.

### CR-03: Bulk Image Delete Has No Scope Guard And Can Delete Everything

**Status:** fixed: requires human verification
**Files modified:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** c0d7c24
**Applied fix:** Added a bulk-delete scope guard requiring at least one filter before selecting or deleting generated images.

### WR-01: Pagination Inputs Can Produce Invalid Prisma Queries Or Invalid Metadata

**Status:** fixed: requires human verification
**Files modified:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** 8e50303
**Applied fix:** Added shared pagination normalization for admin user, generation, and generated-image listings, including limit clamping and invalid input defaults.

### WR-02: Short API Keys Are Fully Exposed In `maskedKey`

**Status:** fixed: requires human verification
**Files modified:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** 0fcc76d
**Applied fix:** Trimmed API keys before storage, rejected keys shorter than 8 characters, and only masked/encrypted the validated trimmed key.

### WR-03: `statusCounts` Test Uses The Wrong Prisma Mock Shape

**Status:** fixed
**Files modified:** `apps/api/src/services/__tests__/admin.service.test.ts`
**Commit:** d3e2113
**Applied fix:** Changed the mocked `groupBy` rows to use `_count._all` and asserted the exact `statusCounts` mapping.

---

_Fixed: 2026-04-29T08:55:19Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
