---
phase: 04-api-key-management
verified: 2026-03-12T05:11:07Z
reverified: 2026-04-23T00:00:00+09:00
status: passed
score: 5/5 success criteria verified
re_verification: true
gaps: []
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
**Status:** passed — KEY-06 gap rechecked and closed
**Re-verification:** Yes — 2026-04-23 artifact cleanup confirmed `edit.routes.ts` now increments call count

---

## Goal Achievement

### Success Criteria from ROADMAP.md

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can view all registered API keys showing alias, masked value (last 4 chars only), status, and call count | VERIFIED | `ApiKeyTable.tsx` renders all columns; `listApiKeys()` selects alias, maskedKey, isActive, callCount with explicit field select excluding encryptedKey |
| 2 | Admin can add a new API key with an alias; the key is stored encrypted and never returned in full via API | VERIFIED | `createApiKey()` calls `encrypt(rawKey, getEncryptionKey())`; selects only non-secret fields on return; `api-keys.routes.ts` has no reference to encryptedKey; `AddKeyModal.tsx` wired to `adminApi.createApiKey` |
| 3 | Admin can delete an API key (only if it is not currently active) | VERIFIED | `deleteApiKey()` throws `'활성 키는 삭제할 수 없습니다'` if `isActive === true`; route returns 400 with `ACTIVE_KEY_CANNOT_BE_DELETED`; `ApiKeyTable.tsx` hides delete button for active rows |
| 4 | Admin can activate a different key; only one key is active at a time and new generation jobs immediately use the newly active key | VERIFIED | `activateApiKey()` uses `prisma.$transaction([updateMany deactivate-all, update activate-target])`; Worker calls `getActiveApiKey()` at job start per job — no caching |
| 5 | Image generation continues to work end-to-end after switching the active key (no env var fallback) | VERIFIED | GeminiService has no `process.env.GEMINI_API_KEY` reference; Worker passes `activeApiKey` to all 3 generation paths with `incrementCallCount`; `edit.routes.ts` now destructures `id` from `getActiveApiKey()` and calls `incrementCallCount(activeKeyId)` before `generateEdit()` |

**Score:** 5/5 success criteria verified

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
| `apps/api/src/routes/edit.routes.ts` | `apps/api/src/services/admin.service.ts` | `adminService.getActiveApiKey()` + `incrementCallCount()` | WIRED | Lines 56-60 destructure `activeKeyId`, increment the active key call count, then call `generateEdit()` with the active key |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| KEY-01 | 04-01, 04-02, 04-03, 04-04 | 관리자가 Gemini API 키 목록을 조회할 수 있다 (별칭, 마지막 4자리, 상태) | SATISFIED | `listApiKeys()` returns alias, maskedKey, isActive, callCount; `ApiKeyTable.tsx` renders all columns; `GET /api/admin/api-keys` endpoint wired |
| KEY-02 | 04-01, 04-02, 04-03, 04-04 | 관리자가 새 API 키를 등록할 수 있다 (암호화 저장) | SATISFIED | `createApiKey()` calls `encrypt(rawKey, getEncryptionKey())`; `AddKeyModal.tsx` wired; `encryptedKey` never appears in any route response |
| KEY-03 | 04-01, 04-02, 04-03, 04-04 | 관리자가 API 키를 삭제할 수 있다 | SATISFIED | `deleteApiKey()` throws if active; route returns 400 with ACTIVE_KEY_CANNOT_BE_DELETED; `ApiKeyTable.tsx` hides delete button for active row |
| KEY-04 | 04-01, 04-02, 04-03, 04-04 | 관리자가 활성 키를 수동 전환할 수 있다 (단일 활성 키 제약) | SATISFIED | `activateApiKey()` uses `prisma.$transaction` to deactivate-all then activate-target atomically; single-active constraint enforced |
| KEY-05 | 04-01, 04-02, 04-03 | GeminiService가 DB의 활성 키를 읽어 사용한다 (.env 대신) | SATISFIED | No `process.env.GEMINI_API_KEY` in gemini.service.ts; Worker and edit.routes.ts both call `getActiveApiKey()` before Gemini calls; `getActiveApiKey()` throws clear error if no active key |
| KEY-06 | 04-01, 04-02, 04-04 | 각 API 키의 호출 횟수가 표시된다 | SATISFIED | `callCount` displayed in `ApiKeyTable.tsx`; `incrementCallCount()` called in worker for 3 paths (ip_change, sketch_to_real, style_copy) and in `edit.routes.ts` before `generateEdit()` |

**All 6 requirement IDs from plans accounted for.** No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
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

No open gaps remain.

The previous KEY-06 gap has been closed. `edit.routes.ts` now destructures both `id` and `key` from `getActiveApiKey()`, then calls `await adminService.incrementCallCount(activeKeyId);` before `geminiService.generateEdit()`.

Every Gemini call path now increments the active key call count: worker modes (`ip_change`, `sketch_to_real`, `style_copy`) and edit-mode calls through `POST /api/generations/:id/edit`.

---

_Verified: 2026-03-12T05:11:07Z_
_Verifier: Claude (gsd-verifier)_
