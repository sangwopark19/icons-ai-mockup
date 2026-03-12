---
phase: 04-api-key-management
verified: 2026-03-12T05:11:07Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "Image generation continues to work end-to-end after switching the active key (no env var fallback)"
    status: partial
    reason: "generateEdit route fetches active key correctly but does NOT call incrementCallCount — call count is silently under-counted for edit-mode generations. All three worker code paths call incrementCallCount correctly, but the fourth Gemini call path (edit.routes.ts) is missing it."
    artifacts:
      - path: "apps/api/src/routes/edit.routes.ts"
        issue: "adminService.getActiveApiKey() is called, activeApiKey is passed to geminiService.generateEdit(), but adminService.incrementCallCount() is never called — edit calls do not increment the call count (KEY-06 partial)"
    missing:
      - "Add: const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(); (destructure id too)"
      - "Add: await adminService.incrementCallCount(activeKeyId); before the geminiService.generateEdit() call in edit.routes.ts"
human_verification:
  - test: "Navigate to /admin/api-keys in the browser"
    expected: "Page loads with empty state message '등록된 API 키가 없습니다', 'API 키 관리' title, '키 추가' button visible"
    why_human: "Visual rendering and layout cannot be verified programmatically"
  - test: "Add a key, then activate a second key, then attempt to delete the active key"
    expected: "Active key delete attempt shows error toast; inactive keys can be deleted; badge switches to green on newly activated key"
    why_human: "UI interaction flow and toast notification rendering require a browser"
  - test: "Check /admin dashboard after adding and activating a key"
    expected: "Dashboard activeApiKeys card shows the alias and call count of the active key (not null/empty)"
    why_human: "Dashboard data population requires a live DB connection with an active key record"
---

# Phase 4: API Key Management Verification Report

**Phase Goal:** Admin can manage multiple Gemini API keys in the DB and activate one at a time; GeminiService reads the active key from DB instead of the environment variable
**Verified:** 2026-03-12T05:11:07Z
**Status:** gaps_found — 1 gap blocking full KEY-06 compliance
**Re-verification:** No — initial verification

---

## Goal Achievement

### Success Criteria from ROADMAP.md

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can view all registered API keys showing alias, masked value (last 4 chars only), status, and call count | VERIFIED | `ApiKeyTable.tsx` renders all columns; `listApiKeys()` selects alias, maskedKey, isActive, callCount with explicit field select excluding encryptedKey |
| 2 | Admin can add a new API key with an alias; the key is stored encrypted and never returned in full via API | VERIFIED | `createApiKey()` calls `encrypt(rawKey, getEncryptionKey())`; selects only non-secret fields on return; `api-keys.routes.ts` has no reference to encryptedKey; `AddKeyModal.tsx` wired to `adminApi.createApiKey` |
| 3 | Admin can delete an API key (only if it is not currently active) | VERIFIED | `deleteApiKey()` throws `'활성 키는 삭제할 수 없습니다'` if `isActive === true`; route returns 400 with `ACTIVE_KEY_CANNOT_BE_DELETED`; `ApiKeyTable.tsx` hides delete button for active rows |
| 4 | Admin can activate a different key; only one key is active at a time and new generation jobs immediately use the newly active key | VERIFIED | `activateApiKey()` uses `prisma.$transaction([updateMany deactivate-all, update activate-target])`; Worker calls `getActiveApiKey()` at job start per job — no caching |
| 5 | Image generation continues to work end-to-end after switching the active key (no env var fallback) | PARTIAL | GeminiService has no `process.env.GEMINI_API_KEY` reference; Worker passes `activeApiKey` to all 3 generation paths with `incrementCallCount`; BUT `edit.routes.ts` calls `getActiveApiKey()` without capturing `id` and never calls `incrementCallCount` — edit-mode calls do not count toward KEY-06 |

**Score:** 4/5 success criteria verified (1 partial)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/lib/__tests__/crypto.test.ts` | Crypto utility unit tests | VERIFIED | 10 tests covering encrypt, decrypt, getEncryptionKey — all GREEN |
| `apps/api/src/services/__tests__/admin.service.test.ts` | Extended AdminService tests with apiKey describe blocks | VERIFIED | 6 new describe blocks (lines 741-975), 46 total service tests passing |
| `apps/api/src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt utility | VERIFIED | Exports `encrypt`, `decrypt`, `getEncryptionKey`; uses `node:crypto`; iv:tag:ciphertext format |
| `apps/api/prisma/schema.prisma` | ApiKey model | VERIFIED | `model ApiKey` at line 221 with all required fields: id, alias, encryptedKey, maskedKey, isActive, callCount, lastUsedAt, createdAt, `@@index([isActive])` |
| `apps/api/src/services/admin.service.ts` | API key CRUD methods | VERIFIED | All 6 methods present: listApiKeys, createApiKey, deleteApiKey, activateApiKey, getActiveApiKey, incrementCallCount |
| `apps/api/src/routes/admin/api-keys.routes.ts` | CRUD REST endpoints | VERIFIED | 4 endpoints: GET /, POST /, DELETE /:id, PATCH /:id/activate — all wired to adminService |
| `apps/api/src/services/gemini.service.ts` | Refactored GeminiService | VERIFIED | All 4 public methods accept `apiKey: string` as first param; no `this.ai` field; no env var reference; constructor is empty |
| `apps/api/src/worker.ts` | Worker with active key lookup | VERIFIED | `getActiveApiKey()` called at job start; `incrementCallCount(activeKeyId)` before each of 3 Gemini calls |
| `apps/web/src/app/admin/api-keys/page.tsx` | API key management page | VERIFIED | 160 lines; uses adminApi.listApiKeys, createApiKey, deleteApiKey, activateApiKey; inline toast; ConfirmDialog wired |
| `apps/web/src/app/admin/api-keys/ApiKeyTable.tsx` | Table component | VERIFIED | 109 lines; renders alias, ****maskedKey, status badge, callCount, dates, action buttons; active row hides delete/activate |
| `apps/web/src/app/admin/api-keys/AddKeyModal.tsx` | Add key modal | VERIFIED | 128 lines; two inputs (alias, apiKey as password), submit/cancel, loading state, overlay-click-to-close, reset on close |
| `apps/web/src/lib/api.ts` | adminApi extended with api-key endpoints | VERIFIED | `AdminApiKey` interface defined; listApiKeys, createApiKey, deleteApiKey, activateApiKey methods at lines 402-420 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `apps/api/src/lib/__tests__/crypto.test.ts` | `apps/api/src/lib/crypto.ts` | `import { encrypt, decrypt, getEncryptionKey } from '../crypto.js'` | WIRED | Line 2 of test file |
| `apps/api/src/services/__tests__/admin.service.test.ts` | `apps/api/src/services/admin.service.ts` | `import('../admin.service.js')` in each test | WIRED | Dynamic import pattern used throughout |
| `apps/api/src/services/admin.service.ts` | `apps/api/src/lib/crypto.ts` | `import { encrypt, decrypt, getEncryptionKey }` | WIRED | Line 5 of admin.service.ts |
| `apps/api/src/services/admin.service.ts` | Prisma `apiKey` model | `prisma.apiKey.*` calls | WIRED | 9 distinct `prisma.apiKey.` calls confirmed |
| `apps/api/src/routes/admin/api-keys.routes.ts` | `apps/api/src/services/admin.service.ts` | `adminService.*` calls | WIRED | listApiKeys, createApiKey, deleteApiKey, activateApiKey — all present |
| `apps/api/src/routes/admin/index.routes.ts` | `apps/api/src/routes/admin/api-keys.routes.ts` | `fastify.register(apiKeysRoutes, { prefix: '/api-keys' })` | WIRED | Line 36 of index.routes.ts |
| `apps/api/src/worker.ts` | `apps/api/src/services/admin.service.ts` | `adminService.getActiveApiKey()` + `incrementCallCount()` | WIRED | Lines 57, 124, 148, 174 — 3 increment calls before Gemini invocations |
| `apps/api/src/worker.ts` | `apps/api/src/services/gemini.service.ts` | `geminiService.*` with `activeApiKey` as first arg | WIRED | Lines 125, 149, 175 — all 3 worker Gemini calls pass activeApiKey |
| `apps/web/src/app/admin/api-keys/page.tsx` | `apps/web/src/lib/api.ts` | `adminApi.listApiKeys/createApiKey/deleteApiKey/activateApiKey` | WIRED | Lines 34, 51, 79, 82 of page.tsx |
| `apps/web/src/lib/api.ts` | `/api/admin/api-keys` | fetch calls in request() | WIRED | Lines 403, 406, 413, 418 reference the backend endpoint paths |
| `apps/api/src/routes/edit.routes.ts` | `apps/api/src/services/admin.service.ts` | `adminService.getActiveApiKey()` | PARTIAL | Key is fetched and passed to generateEdit, but `incrementCallCount` is NOT called — edit calls do not count |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| KEY-01 | 04-01, 04-02, 04-03, 04-04 | 관리자가 Gemini API 키 목록을 조회할 수 있다 (별칭, 마지막 4자리, 상태) | SATISFIED | `listApiKeys()` returns alias, maskedKey, isActive, callCount; `ApiKeyTable.tsx` renders all columns; `GET /api/admin/api-keys` endpoint wired |
| KEY-02 | 04-01, 04-02, 04-03, 04-04 | 관리자가 새 API 키를 등록할 수 있다 (암호화 저장) | SATISFIED | `createApiKey()` calls `encrypt(rawKey, getEncryptionKey())`; `AddKeyModal.tsx` wired; `encryptedKey` never appears in any route response |
| KEY-03 | 04-01, 04-02, 04-03, 04-04 | 관리자가 API 키를 삭제할 수 있다 | SATISFIED | `deleteApiKey()` throws if active; route returns 400 with ACTIVE_KEY_CANNOT_BE_DELETED; `ApiKeyTable.tsx` hides delete button for active row |
| KEY-04 | 04-01, 04-02, 04-03, 04-04 | 관리자가 활성 키를 수동 전환할 수 있다 (단일 활성 키 제약) | SATISFIED | `activateApiKey()` uses `prisma.$transaction` to deactivate-all then activate-target atomically; single-active constraint enforced |
| KEY-05 | 04-01, 04-02, 04-03 | GeminiService가 DB의 활성 키를 읽어 사용한다 (.env 대신) | SATISFIED | No `process.env.GEMINI_API_KEY` in gemini.service.ts; Worker and edit.routes.ts both call `getActiveApiKey()` before Gemini calls; `getActiveApiKey()` throws clear error if no active key |
| KEY-06 | 04-01, 04-02, 04-04 | 각 API 키의 호출 횟수가 표시된다 | PARTIAL | `callCount` displayed in `ApiKeyTable.tsx`; `incrementCallCount()` called in worker for 3 paths (ip_change, sketch_to_real, style_copy); NOT called in `edit.routes.ts` — edit-mode API calls are silently not counted |

**All 6 requirement IDs from plans accounted for.** No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/src/routes/edit.routes.ts` | ~57 | Missing `incrementCallCount` after `getActiveApiKey()` | Warning | KEY-06 under-counting for edit operations — does not block correctness, but call count stat is inaccurate for edit-mode |
| `apps/api/src/services/admin.service.ts` | 595-610 | `activateApiKey` constructs Prisma promise objects before transaction, then re-awaits the settled `activateTarget` promise after transaction | Info | Works correctly (re-awaiting a settled Promise returns cached result); adds a redundant DB call via the re-await, but harmless in tests and passes all 62 tests |

---

## Human Verification Required

### 1. API Key Management Page Renders Correctly

**Test:** Log in as admin, navigate to `/admin/api-keys`
**Expected:** Page title "API 키 관리", empty state message "등록된 API 키가 없습니다", "키 추가" button visible in the top-right area
**Why human:** Visual layout and CSS rendering cannot be confirmed programmatically

### 2. Full Add / Activate / Delete Flow

**Test:** Add a key with alias "test-key-1", add a second with "test-key-2", activate "test-key-2", then attempt to delete "test-key-2" (the now-active key)
**Expected:** "test-key-2" becomes active (green badge); "test-key-1" shows activate and delete buttons; deleting "test-key-2" shows error toast; deleting "test-key-1" succeeds
**Why human:** Badge switching, button visibility rules, and toast notifications require browser interaction

### 3. Dashboard Active Key Info

**Test:** After activating a key, navigate to `/admin` dashboard
**Expected:** Dashboard shows the active key's alias and call count in the API key KPI card (not null or empty)
**Why human:** Requires live DB connection, active key record, and dashboard data fetch to confirm `activeApiKeys` field is populated

---

## Gaps Summary

**1 gap identified:** KEY-06 is partially implemented.

The `edit.routes.ts` file was updated during Plan 03 to pass `activeApiKey` to `geminiService.generateEdit()` (required to fix a TypeScript error). However, only `key` was destructured from `getActiveApiKey()` — not `id`. As a result, there is no `activeKeyId` variable in scope and `incrementCallCount()` was never added to this code path.

Every generation job through the worker increments call count correctly across all three modes (ip_change, sketch_to_real, style_copy). But user-facing edit operations through `POST /api/generations/:id/edit` are silently excluded from the count. The displayed call count in the admin table and dashboard will under-count actual API usage when edits are performed.

**Root cause:** Plan 03 Task 2 instructions specified updating `worker.ts` but did not explicitly call out `edit.routes.ts` needing `incrementCallCount` — the edit route was only mentioned in the context of the TypeScript fix for the missing `apiKey` argument.

**Fix required:** In `edit.routes.ts`, change the destructuring from `const { key: activeApiKey }` to `const { id: activeKeyId, key: activeApiKey }`, then add `await adminService.incrementCallCount(activeKeyId);` before the `geminiService.generateEdit()` call.

---

_Verified: 2026-03-12T05:11:07Z_
_Verifier: Claude (gsd-verifier)_
