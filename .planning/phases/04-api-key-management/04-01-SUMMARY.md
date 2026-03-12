---
phase: 04-api-key-management
plan: 01
subsystem: testing
tags: [vitest, tdd, crypto, aes-256-gcm, admin-service, api-keys]

# Dependency graph
requires:
  - phase: 03-generation-and-content-monitoring
    provides: Established admin.service.test.ts patterns (vi.mock, dynamic import, beforeEach clearAllMocks)
provides:
  - Failing crypto utility tests (9 test cases covering encrypt/decrypt/getEncryptionKey)
  - Failing AdminService API key tests (11 test cases covering KEY-01 through KEY-06)
  - Test contracts for AES-256-GCM crypto utility and all 6 API key requirements
affects:
  - 04-02-PLAN (implementation must satisfy these test contracts)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Wave 0: write all failing tests before any implementation code"
    - "crypto mock pattern: vi.mock('../../lib/crypto.js') at top level with fixed mock return values"
    - "prisma apiKey mock: added to existing prisma mock block with findMany/findFirst/findUnique/create/update/delete/updateMany"
    - "$transaction mock: vi.fn() in prisma mock, tested with mockImplementation that iterates ops array"

key-files:
  created:
    - apps/api/src/lib/__tests__/crypto.test.ts
  modified:
    - apps/api/src/services/__tests__/admin.service.test.ts

key-decisions:
  - "crypto.test.ts uses fixed 32-zero-byte test key (Buffer.from('0'.repeat(64), 'hex')) for deterministic test behavior"
  - "admin.service.test.ts mocks entire crypto module at top level — tests verify DB call shapes, not real encryption"
  - "getActiveApiKey test uses mocked decrypt (returns 'decrypted-key') — real crypto tested in crypto.test.ts only"
  - "11 new tests + 35 existing tests: split verifies old tests preserved, new tests RED"

patterns-established:
  - "Pattern 1: Mock crypto module at file top so all describes share the mock; override per-test with mockReturnValueOnce if needed"
  - "Pattern 2: 9-test crypto suite structure: 3 encrypt tests, 4 decrypt tests, 3 getEncryptionKey tests"
  - "Pattern 3: getEncryptionKey tests use afterEach to restore process.env.ENCRYPTION_KEY to original value"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-12
---

# Phase 4 Plan 01: TDD Wave 0 — Failing Tests for Crypto Utility and AdminService API Keys

**9 crypto tests + 11 AdminService API key tests written RED before any implementation, establishing test contracts for AES-256-GCM encrypt/decrypt and all 6 KEY requirements**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-12T10:15:24Z
- **Completed:** 2026-03-12T10:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `apps/api/src/lib/__tests__/crypto.test.ts` with 9 test cases covering all crypto utility behaviors (encrypt format, fresh IV, round-trip, tamper detection, wrong key, getEncryptionKey validation)
- Extended `apps/api/src/services/__tests__/admin.service.test.ts` with 11 new test cases covering KEY-01 through KEY-06 (listApiKeys, createApiKey, deleteApiKey, activateApiKey, getActiveApiKey, incrementCallCount)
- Added `apiKey` model and `$transaction` to the prisma mock, and added a top-level `vi.mock('../../lib/crypto.js')` mock
- All 35 existing Phase 1-3 tests remain GREEN; all 11 new tests are RED as expected

## Task Commits

Each task was committed atomically:

1. **Task 1: Create crypto utility test file (RED)** - `d6381f3` (test)
2. **Task 2: Extend AdminService tests with API key describe blocks (RED)** - `905372a` (test)

**Plan metadata:** (docs commit follows)

_Note: TDD Wave 0 — all commits are test-only (RED). Implementation comes in Plan 02._

## Files Created/Modified
- `apps/api/src/lib/__tests__/crypto.test.ts` — 9 failing tests for AES-256-GCM encrypt/decrypt/getEncryptionKey
- `apps/api/src/services/__tests__/admin.service.test.ts` — Extended with apiKey prisma mock, crypto mock, and 11 failing describe blocks for KEY-01 through KEY-06

## Decisions Made
- Used `afterEach` to restore `process.env.ENCRYPTION_KEY` in getEncryptionKey tests — avoids test pollution without needing `vi.stubEnv`
- Mocked entire crypto module for AdminService tests — AdminService tests verify DB call shapes, not encryption correctness; crypto correctness is tested separately in crypto.test.ts
- Added `$transaction: vi.fn()` to prisma mock rather than a separate mock — consistent with how other prisma methods are mocked in this file

## Deviations from Plan

None — plan executed exactly as written. Both test files created with the specified test cases, all failing in the expected RED state.

## Issues Encountered

None. The `vi.mock('../../lib/crypto.js')` top-level mock correctly intercepts module resolution even though crypto.ts doesn't exist yet — Vitest's mock factory handles this.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Test contracts established for all 6 KEY requirements
- Plan 02 can implement `crypto.ts` and AdminService API key methods against these contracts
- The `$transaction` mock shape is validated — `activateApiKey` must call `prisma.$transaction` with an array of operations
- getEncryptionKey behavior is fully specified: must throw if ENCRYPTION_KEY env var missing or wrong length (not 64 chars)

---
*Phase: 04-api-key-management*
*Completed: 2026-03-12*

## Self-Check: PASSED

- apps/api/src/lib/__tests__/crypto.test.ts — FOUND
- apps/api/src/services/__tests__/admin.service.test.ts — FOUND
- .planning/phases/04-api-key-management/04-01-SUMMARY.md — FOUND
- Commit d6381f3 (Task 1) — FOUND
- Commit 905372a (Task 2) — FOUND
