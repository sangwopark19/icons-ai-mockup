# Phase 4: API Key Management - Research

**Researched:** 2026-03-12
**Domain:** AES-256-GCM encryption, Prisma schema migration, BullMQ worker refactoring, Admin CRUD API
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**키 목록/관리 UI**
- 테이블 레이아웃 (Phase 2/3와 동일 패턴)
- 칼럼: 별칭, 마스킹된 키(마지막 4자리), 상태(활성/비활성), 호출 횟수, 등록일, 마지막 사용일, 액션 버튼
- 활성 키 행은 상태 칼럼에 시각적 강조 (배지)
- 활성 키에는 삭제/활성화 버튼 비노출

**키 추가**
- 테이블 상단 '키 추가' 버튼 클릭 → 모달에서 별칭 + API 키 입력
- API 키는 AES-256-GCM 암호화 저장, 전체 값은 API 응답에 절대 포함하지 않음 (마지막 4자리만 반환)

**키 삭제**
- 모달 확인 다이얼로그 ('키 [별칭]을 삭제합니다' + 확인 버튼)
- 활성 키는 삭제 버튼 비활성화 — 다른 키로 전환 후에만 삭제 가능

**키 전환 UX**
- 활성화 클릭 시 모달 확인 ('활성 키를 [별칭]으로 전환합니다. 새 생성 작업부터 이 키를 사용합니다.')
- 전환 성공 시 토스트 알림 + 테이블 상태 칼럼 즉시 갱신
- 이미 큐에 들어간 진행 중인 작업은 기존 키로 마무리 (Worker가 작업 처리 시점에 활성 키를 조회하므로 자연스럽게 처리됨)

**활성 키 없음 처리**
- DB에 활성 키가 없으면 명확한 에러 throw ('Gemini API 키가 설정되지 않았습니다')
- .env fallback 절대 금지 — process.env.GEMINI_API_KEY를 참조하지 않음
- 생성 작업은 failed 상태로 에러 메시지 기록

**GeminiService 리팩토링**
- 메서드에 apiKey 파라미터 주입 방식: generateIPChange(apiKey, sourceImage, characterImage, options)
- constructor에서 this.ai 제거 — 각 메서드에서 new GoogleGenAI({ apiKey }) 생성
- Worker가 작업 처리 시점에 DB에서 활성 키 조회 → 복호화 → GeminiService 메서드에 전달
- 작업별 1회 DB 조회 (캐싱 없음, 현재 트래픽 규모에서 충분)

**호출 횟수 추적**
- ApiKey 모델에 callCount 필드 추가
- Worker에서 Gemini API 실제 호출 시점에 increment (실패 호출도 카운트 — Google API 사용량과 일치)
- 마지막 사용일(lastUsedAt) 필드도 함께 업데이트

**초기 마이그레이션 정책**
- .env 키 자동 마이그레이션 없음 — 관리자가 admin UI에서 직접 키 등록 필요
- config.ts의 GEMINI_API_KEY 환경변수는 optional로 유지하되 GeminiService에서 참조하지 않음

### Claude's Discretion
- ApiKey Prisma 모델 상세 설계 (필드명, 인덱스)
- AES-256-GCM 암호화 키 관리 방식 (환경변수 기반 encryption key)
- 키 추가/삭제 모달 세부 레이아웃
- 테이블 행 스타일링 (활성 키 배지 색상)
- 토스트 알림 디자인
- Worker에서 키 조회 + 복호화 로직 배치 위치

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| KEY-01 | 관리자가 Gemini API 키 목록을 조회할 수 있다 (별칭, 마지막 4자리, 상태) | AdminService.listApiKeys() returns masked keys only — encryption layer ensures raw key never surfaces |
| KEY-02 | 관리자가 새 API 키를 등록할 수 있다 (암호화 저장) | AES-256-GCM encrypt in AdminService.createApiKey(); env var ENCRYPTION_KEY provides 32-byte key |
| KEY-03 | 관리자가 API 키를 삭제할 수 있다 | AdminService.deleteApiKey() with guard: throws if key is active |
| KEY-04 | 관리자가 활성 키를 수동 전환할 수 있다 (단일 활성 키 제약) | AdminService.activateApiKey() uses prisma.$transaction to deactivate-all then activate-one atomically |
| KEY-05 | GeminiService가 DB의 활성 키를 읽어 사용한다 (.env 대신) | Worker calls AdminService.getActiveApiKey() at job-start, decrypts, passes to GeminiService methods; no env fallback |
| KEY-06 | 각 API 키의 호출 횟수가 표시된다 | Worker increments callCount + updates lastUsedAt before each Gemini API call |
</phase_requirements>

---

## Summary

Phase 4 adds an API key management system: a `ApiKey` table stores encrypted Gemini API keys, an admin UI provides CRUD + activation switching, and `GeminiService` is refactored to receive the decrypted key as a parameter from the worker rather than reading it from the constructor.

The most critical and highest-risk work is the `GeminiService` refactor (KEY-05). All three public generation methods (`generateIPChange`, `generateSketchToReal`, `generateWithStyleCopy`) currently read `this.ai` which is built in the constructor from `process.env`. After refactoring, each method receives `apiKey: string` as first parameter and instantiates `new GoogleGenAI({ apiKey })` locally. The singleton `geminiService` export remains but becomes stateless.

The TDD approach means tests for the crypto utility and `AdminService` API key methods must be written before implementation. The existing test infrastructure (Vitest 4.x, `vi.mock`, dynamic imports) supports this pattern cleanly with the same mock-prisma approach established in previous phases.

**Primary recommendation:** Use Node.js built-in `crypto` module (no extra deps) for AES-256-GCM; write crypto utility tests with fixed test vectors first; extend the existing `admin.service.test.ts` file with the new describe blocks.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `crypto` (built-in) | Node 24 (project uses Node 24) | AES-256-GCM encrypt/decrypt | No dependency, built-in, FIPS-compliant, already available |
| `@prisma/client` | `^6.2.0` (already in project) | ApiKey model CRUD | Existing ORM |
| Vitest | `^4.0.18` (already in project) | Unit test framework | Established project test runner |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `^3.24.1` (already in project) | Validate request body (alias, apiKey) | All new admin routes — consistent with existing pattern |
| Fastify plugins (existing) | Already registered | Admin routes under `requireAdmin` hook | Already wired in `index.routes.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node.js `crypto` | `node-forge`, `crypto-js` | Extra deps with no benefit; built-in is sufficient and has no supply chain risk |
| env-var encryption key | KMS / HSM | KMS is v2 scope; env var (32-byte hex) is appropriate for current scale |

**Installation:**
No new npm packages required. All needed libraries are already in the project.

---

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── lib/
│   └── crypto.ts            # NEW: encrypt/decrypt utility (pure functions, no state)
├── services/
│   ├── admin.service.ts     # EXTEND: add ApiKey CRUD methods + getActiveApiKey
│   └── gemini.service.ts    # REFACTOR: remove constructor this.ai, add apiKey param to methods
├── routes/admin/
│   ├── index.routes.ts      # EXTEND: register api-key routes
│   └── api-keys.routes.ts   # NEW: GET/POST/DELETE/PATCH endpoints
├── worker.ts                # EXTEND: fetch active key + decrypt before Gemini calls
└── prisma/
    └── schema.prisma        # EXTEND: add ApiKey model

apps/web/src/app/admin/api-keys/
├── page.tsx                 # REPLACE stub: full page component
├── ApiKeyTable.tsx          # NEW: table with alias/masked/status/callCount/actions
├── AddKeyModal.tsx          # NEW: modal form for alias + raw key input
└── ConfirmActionModal.tsx   # REUSE: existing ConfirmDialog pattern from Phase 2/3

apps/api/src/services/__tests__/
└── admin.service.test.ts    # EXTEND: add KEY-01..06 describe blocks
apps/api/src/lib/__tests__/
└── crypto.test.ts           # NEW: pure function tests — write FIRST (TDD Wave 0)
```

### Pattern 1: AES-256-GCM Crypto Utility (Pure Functions)

**What:** Two exported functions `encrypt(plaintext, key)` and `decrypt(ciphertext, key)`. No singleton, no state. Each call generates a fresh IV.

**When to use:** Called only in `AdminService` — `createApiKey` encrypts, `getActiveApiKey` decrypts.

**Verified against:** Node.js v24 built-in `crypto` module (verified locally: AES-256-GCM round-trip confirmed).

```typescript
// Source: Node.js docs + local verification (2026-03-12)
// apps/api/src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 96-bit IV — recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag — GCM default

/**
 * Encrypts plaintext with AES-256-GCM.
 * Returns hex string: iv(24 hex) + tag(32 hex) + ciphertext(variable hex)
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all hex)
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypts AES-256-GCM ciphertext.
 * Throws if authentication tag verification fails (tampered data).
 */
export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Derives a 32-byte Buffer from ENCRYPTION_KEY env var (64-char hex string).
 * Call once at service init time.
 */
export function getEncryptionKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
}
```

### Pattern 2: AdminService ApiKey Methods

**What:** CRUD methods added to existing `AdminService` class. Single responsibility: DB operations + crypto calls.

**Key constraint:** `listApiKeys` and all responses MUST strip the `encryptedKey` field and return only `maskedKey` (last 4 chars of the original key — stored as a separate plain field at insert time, NOT derived from the encrypted blob at read time).

```typescript
// Prisma model design (for schema.prisma)
// model ApiKey {
//   id           String    @id @default(uuid())
//   alias        String
//   encryptedKey String    @map("encrypted_key")  // AES-256-GCM output
//   maskedKey    String    @map("masked_key")       // last 4 chars of raw key, stored plain
//   isActive     Boolean   @default(false) @map("is_active")
//   callCount    Int       @default(0) @map("call_count")
//   lastUsedAt   DateTime? @map("last_used_at")
//   createdAt    DateTime  @default(now()) @map("created_at")
//
//   @@index([isActive])
//   @@map("api_keys")
// }

// AdminService method signatures (TDD: write tests against these before implementing)
interface ApiKeyListItem {
  id: string;
  alias: string;
  maskedKey: string;   // e.g. "****ABCD"
  isActive: boolean;
  callCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
}

async listApiKeys(): Promise<ApiKeyListItem[]>
async createApiKey(alias: string, rawKey: string): Promise<ApiKeyListItem>
async deleteApiKey(id: string): Promise<void>  // throws if isActive
async activateApiKey(id: string): Promise<ApiKeyListItem>  // transaction
async getActiveApiKey(): Promise<string>  // returns decrypted key, throws if none active
async incrementCallCount(id: string): Promise<void>  // Worker calls this
```

### Pattern 3: GeminiService Refactor

**What:** Remove `private readonly ai: GoogleGenAI` from constructor. Each public method receives `apiKey: string` as its first parameter and creates `new GoogleGenAI({ apiKey })` locally.

**Critical rule from CONTEXT.md:** The constructor must NOT fall back to `process.env.GEMINI_API_KEY`. After refactor, if a method is called without a key it will fail at the GoogleGenAI construction level — which is acceptable.

```typescript
// Before (current):
// constructor() { this.ai = new GoogleGenAI({ apiKey: config.geminiApiKey }); }
// async generateIPChange(source, character, options) { ... this.ai.models.generateContent(...) }

// After (refactored):
// constructor() {} // no-op or empty
// async generateIPChange(apiKey: string, source, character, options) {
//   const ai = new GoogleGenAI({ apiKey });
//   ... ai.models.generateContent(...)
// }
```

The singleton `export const geminiService = new GeminiService()` is preserved — it just becomes stateless.

### Pattern 4: Worker Active Key Lookup

**What:** At the beginning of each job, BEFORE any Gemini API call, the worker fetches the active key from DB and decrypts it. This single DB call is scoped to the job.

```typescript
// In worker.ts — at job start, before image processing
const activeApiKey = await adminService.getActiveApiKey();
// Then pass activeApiKey to every geminiService method call:
const result = await geminiService.generateIPChange(activeApiKey, sourceImageBase64, ...);
```

**Key point:** `incrementCallCount` is called immediately before each `ai.models.generateContent` call (not after), so failures are still counted.

### Pattern 5: activateApiKey Transaction

**What:** Exactly one key may be active at a time. The switch must be atomic: deactivate all, then activate target — in a single `$transaction`.

```typescript
// Correct — atomic
await prisma.$transaction([
  prisma.apiKey.updateMany({ where: {}, data: { isActive: false } }),
  prisma.apiKey.update({ where: { id }, data: { isActive: true } }),
]);
```

### Anti-Patterns to Avoid

- **Reading `encryptedKey` in list endpoint:** Never include the encrypted blob in API response. Store `maskedKey` as a separate column at insert time.
- **Deriving masked key from encrypted blob at read time:** Decrypt-to-mask at read time leaks timing and requires the encryption key on every list call. Store the mask plainly.
- **Caching the active key in Worker memory:** Caching would mean key rotation doesn't take effect for in-flight workers. Per CONTEXT.md: one DB query per job, no caching.
- **Using `updateMany` without transaction for activation:** Without a transaction, a race condition can leave two keys active simultaneously.
- **`process.env.GEMINI_API_KEY` fallback in GeminiService:** Explicitly forbidden by CONTEXT.md. The warning in the current constructor must be removed entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authenticated encryption | Custom XOR / base64 "encryption" | Node.js `crypto` AES-256-GCM | GCM provides authentication tag; tampered ciphertexts throw on decrypt — simple schemes don't |
| Random IV generation | Math.random()-based bytes | `randomBytes(12)` from Node.js `crypto` | CSPRNG required; Math.random is predictable |
| Atomic key switching | Application-level lock + two queries | `prisma.$transaction` | Transaction guarantees atomicity across concurrent requests |

**Key insight:** AES-256-GCM's authentication tag catches bit-flipping attacks on stored keys. Without GCM (e.g., using AES-CBC), a corrupt DB record would silently produce a garbled API key and fail with a confusing Gemini error instead of a clear decryption failure.

---

## Common Pitfalls

### Pitfall 1: IV Reuse with the Same Encryption Key
**What goes wrong:** Using the same IV for two different encryptions with the same key completely breaks GCM confidentiality.
**Why it happens:** Developers generate IV once (at startup or as a constant) rather than per-encryption.
**How to avoid:** Generate IV with `randomBytes(12)` inside the `encrypt()` function, not outside. The format `iv:tag:ciphertext` embeds the IV in the stored value.
**Warning signs:** Tests that encrypt the same string twice and get identical output.

### Pitfall 2: Auth Tag Not Verified on Decrypt
**What goes wrong:** Calling `decipher.final()` before `decipher.setAuthTag()` — or skipping `setAuthTag` entirely — means tampered ciphertexts are silently decrypted to garbage.
**Why it happens:** Misunderstanding that `final()` automatically verifies. It does not — `setAuthTag()` must be called BEFORE `final()`.
**How to avoid:** Always `decipher.setAuthTag(tag)` before `decipher.final()`. A test that tampers with one byte of the stored value and expects a throw will catch this.
**Warning signs:** No test that verifies tampered ciphertext throws.

### Pitfall 3: Active Key Deletion Not Guarded
**What goes wrong:** Admin deletes the active key, leaving DB with no active key. Next generation job throws an unhandled error.
**Why it happens:** DELETE endpoint doesn't check `isActive` before deletion.
**How to avoid:** `deleteApiKey` throws `{ code: 'ACTIVE_KEY_CANNOT_BE_DELETED' }` if `isActive === true`. Test: mock an active key and expect the delete to throw.

### Pitfall 4: Prisma Model Missing `isActive` Index
**What goes wrong:** `getActiveApiKey()` does a `findFirst({ where: { isActive: true } })`. Without an index on `isActive`, this is a full table scan. Acceptable now (2–5 keys) but creates a schema debt.
**Why it happens:** Forgetting indexes on boolean filter columns.
**How to avoid:** Add `@@index([isActive])` to the Prisma model. The planner should include this in the schema migration task.

### Pitfall 5: `encryptedKey` Leaked in API Response
**What goes wrong:** Prisma `findMany()` returns all fields including `encryptedKey`. If the route handler passes the raw Prisma result to `reply.send()`, the encrypted blob is exposed.
**Why it happens:** Forgetting to project/select specific fields in the service method.
**How to avoid:** `listApiKeys` uses `select` to explicitly pick safe fields. The return type `ApiKeyListItem` has no `encryptedKey` field. A test that calls `listApiKeys()` and asserts no `encryptedKey` in the result will catch this.

### Pitfall 6: GeminiService `generateEdit` Uses `this.ai.chats.create`
**What goes wrong:** `generateEdit` currently uses `const chat = this.ai.chats.create(...)`. After removing `this.ai`, this call breaks.
**Why it happens:** Easy to miss — the `chats.create` call is not in the same pattern as `models.generateContent`.
**How to avoid:** All three methods — `generateIPChange`, `generateSketchToReal`, `generateWithStyleCopy`, AND `generateEdit` — must receive `apiKey` and create a local `ai` instance. The planner must include `generateEdit` in the refactor scope.

---

## Code Examples

### TDD Wave 0: Crypto Utility Tests (Write First)

```typescript
// Source: verified Node.js crypto behavior + test vector approach
// apps/api/src/lib/__tests__/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../crypto.js';

const TEST_KEY = Buffer.from('0'.repeat(64), 'hex'); // 32 zero bytes

describe('crypto - encrypt', () => {
  it('should return a colon-separated iv:tag:ciphertext string', () => {
    const result = encrypt('test-key', TEST_KEY);
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24);  // 12-byte IV = 24 hex chars
    expect(parts[1]).toHaveLength(32);  // 16-byte tag = 32 hex chars
  });

  it('should produce different ciphertext on each call (fresh IV)', () => {
    const a = encrypt('same-value', TEST_KEY);
    const b = encrypt('same-value', TEST_KEY);
    expect(a).not.toBe(b);
  });
});

describe('crypto - decrypt', () => {
  it('should round-trip: decrypt(encrypt(x)) === x', () => {
    const original = 'AIzaSyD-actual-key-value';
    const ciphertext = encrypt(original, TEST_KEY);
    expect(decrypt(ciphertext, TEST_KEY)).toBe(original);
  });

  it('should throw if auth tag is tampered (bit-flip attack)', () => {
    const ciphertext = encrypt('value', TEST_KEY);
    const [iv, tag, data] = ciphertext.split(':');
    // Flip first byte of data
    const tamperedData = (parseInt(data.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0') + data.slice(2);
    expect(() => decrypt([iv, tag, tamperedData].join(':'), TEST_KEY)).toThrow();
  });

  it('should throw if wrong key is used', () => {
    const wrongKey = Buffer.from('f'.repeat(64), 'hex');
    const ciphertext = encrypt('value', TEST_KEY);
    expect(() => decrypt(ciphertext, wrongKey)).toThrow();
  });
});
```

### AdminService API Key Tests (Write Before Service Implementation)

```typescript
// Extend apps/api/src/services/__tests__/admin.service.test.ts
// Add to the prisma mock at top:
//   apiKey: {
//     findMany: vi.fn(),
//     findFirst: vi.fn(),
//     findUnique: vi.fn(),
//     create: vi.fn(),
//     update: vi.fn(),
//     delete: vi.fn(),
//     updateMany: vi.fn(),
//   }

describe('AdminService - listApiKeys', () => {
  it('should return list without encryptedKey field', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
      { id: 'k1', alias: 'Primary', maskedKey: '****ABCD', isActive: true,
        callCount: 42, lastUsedAt: new Date(), createdAt: new Date(),
        encryptedKey: 'should-not-appear' },
    ] as any);

    const result = await adminService.listApiKeys();

    expect(result[0]).not.toHaveProperty('encryptedKey');
    expect(result[0].maskedKey).toBe('****ABCD');
  });
});

describe('AdminService - createApiKey', () => {
  it('should store encrypted key and plain maskedKey (last 4 chars)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const rawKey = 'AIzaSyD-testkey-ABCD';
    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      id: 'k1', alias: 'Test', maskedKey: 'ABCD', isActive: false,
      callCount: 0, lastUsedAt: null, createdAt: new Date(),
    } as any);

    await adminService.createApiKey('Test', rawKey);

    const callArg = vi.mocked(prisma.apiKey.create).mock.calls[0][0] as any;
    // maskedKey should be last 4 chars only
    expect(callArg.data.maskedKey).toBe('ABCD');
    // encryptedKey must not be the raw key
    expect(callArg.data.encryptedKey).not.toBe(rawKey);
    // encryptedKey must be iv:tag:data format
    expect(callArg.data.encryptedKey.split(':').length).toBe(3);
  });
});

describe('AdminService - deleteApiKey', () => {
  it('should throw if key is active', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'k1', isActive: true,
    } as any);

    await expect(adminService.deleteApiKey('k1')).rejects.toThrow();
  });

  it('should delete if key is not active', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: 'k1', isActive: false,
    } as any);
    vi.mocked(prisma.apiKey.delete).mockResolvedValue({} as any);

    await adminService.deleteApiKey('k1');

    expect(vi.mocked(prisma.apiKey.delete)).toHaveBeenCalledWith({ where: { id: 'k1' } });
  });
});

describe('AdminService - activateApiKey', () => {
  it('should use prisma.$transaction to deactivate-all then activate-target', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.$transaction).mockImplementation(async (ops: any) => {
      // Execute all operations
      for (const op of ops) await op;
      return [];
    });
    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.apiKey.update).mockResolvedValue({
      id: 'k2', isActive: true, alias: 'New', maskedKey: 'EFGH',
      callCount: 0, lastUsedAt: null, createdAt: new Date(),
    } as any);

    await adminService.activateApiKey('k2');

    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled();
  });
});

describe('AdminService - getActiveApiKey', () => {
  it('should return decrypted key string when active key exists', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    // We need ENCRYPTION_KEY set for this test
    process.env.ENCRYPTION_KEY = '0'.repeat(64);
    const { encrypt } = await import('../../lib/crypto.js');
    const testKey = Buffer.from('0'.repeat(64), 'hex');
    const encrypted = encrypt('AIzaSyD-real-key', testKey);

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      id: 'k1', encryptedKey: encrypted, isActive: true,
    } as any);

    const result = await adminService.getActiveApiKey();
    expect(result).toBe('AIzaSyD-real-key');
  });

  it('should throw if no active key exists', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

    await expect(adminService.getActiveApiKey()).rejects.toThrow('Gemini API 키가 설정되지 않았습니다');
  });
});

describe('AdminService - incrementCallCount', () => {
  it('should increment callCount and set lastUsedAt', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

    await adminService.incrementCallCount('k1');

    expect(vi.mocked(prisma.apiKey.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'k1' },
        data: expect.objectContaining({
          callCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        }),
      })
    );
  });
});
```

### GeminiService Refactor: Signature Changes

```typescript
// Current signature:
// async generateIPChange(sourceImageBase64: string, characterImageBase64: string, options: GenerationOptions)

// Refactored signature (apiKey first):
// async generateIPChange(apiKey: string, sourceImageBase64: string, characterImageBase64: string, options: GenerationOptions)

// Inside the method:
// const ai = new GoogleGenAI({ apiKey });
// const response = await ai.models.generateContent({ ... });

// generateEdit also needs the same treatment:
// async generateEdit(apiKey: string, originalImageBase64: string, editPrompt: string)
// const ai = new GoogleGenAI({ apiKey });
// const chat = ai.chats.create({ model: this.imageModel });
```

### Worker Integration

```typescript
// In worker.ts — add at job start (before image loading):
// import { adminService } from './services/admin.service.js';

const activeApiKey = await adminService.getActiveApiKey();
// If no active key: throws → caught by outer try/catch → generationService.updateStatus('failed', message)

// Before each geminiService call — increment first, then call:
await adminService.incrementCallCount(activeKeyId); // need to return id from getActiveApiKey
const result = await geminiService.generateIPChange(activeApiKey, ...);
```

**Note:** `getActiveApiKey` should return `{ id: string, key: string }` so the worker can call `incrementCallCount(id)` with the correct key ID.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AES-CBC (no auth tag) | AES-256-GCM (authenticated encryption) | Standard since 2015 NIST guidance | Tampered ciphertexts throw instead of silently decrypting to garbage |
| Hardcoded API key in env | DB-managed encrypted keys | This phase | Key rotation without redeployment |
| Constructor-injected API key | Per-call API key injection | This phase (GeminiService refactor) | Worker uses current active key at call time, not startup time |

**Deprecated/outdated:**
- `config.geminiApiKey` usage in GeminiService constructor: removed in this phase (env var stays optional but GeminiService no longer reads it)
- `this.ai: GoogleGenAI` field in GeminiService: replaced by local instantiation per method call

---

## Open Questions

1. **`getActiveApiKey` return type: key-only or `{ id, key }` struct?**
   - What we know: Worker needs both the decrypted key string (for GeminiService) and the key ID (for `incrementCallCount`)
   - What's unclear: Whether to return a struct or make two DB calls
   - Recommendation: Return `{ id: string; key: string }` to avoid a second DB roundtrip. This is Claude's Discretion territory.

2. **`ENCRYPTION_KEY` env var naming + test isolation**
   - What we know: Tests that call `getActiveApiKey` or `createApiKey` need `process.env.ENCRYPTION_KEY` set
   - What's unclear: Whether to set it in a `beforeAll` or mock `crypto.ts` entirely
   - Recommendation: Add `process.env.ENCRYPTION_KEY = '0'.repeat(64)` in `beforeEach` for tests involving crypto. Mock `../../lib/crypto.js` entirely for tests that don't need real encryption (just need to verify DB calls).

3. **Dashboard `activeApiKeys` field (currently `null`)**
   - What we know: `admin.service.ts` line 12: `activeApiKeys: null; // Phase 4 -- ApiKey model does not exist yet`
   - What's unclear: Exact format the dashboard expects
   - Recommendation: After Phase 4, update `getDashboardStats` to return `{ alias, callCount }` for the active key. Include in KEY-01 scope.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `apps/api/vitest.config.ts` |
| Quick run command | `cd apps/api && npx vitest run src/lib/__tests__/crypto.test.ts` |
| Full suite command | `cd apps/api && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KEY-01 | listApiKeys returns masked keys, no encryptedKey | unit | `cd apps/api && npm test -- --reporter=verbose` | ❌ Wave 0 |
| KEY-02 | createApiKey stores AES-256-GCM encrypted key, maskedKey = last 4 chars | unit | `cd apps/api && npm test` | ❌ Wave 0 |
| KEY-03 | deleteApiKey throws if isActive, succeeds if not | unit | `cd apps/api && npm test` | ❌ Wave 0 |
| KEY-04 | activateApiKey uses $transaction, only one key active | unit | `cd apps/api && npm test` | ❌ Wave 0 |
| KEY-05 | getActiveApiKey returns decrypted string; throws if none | unit | `cd apps/api && npm test` | ❌ Wave 0 |
| KEY-06 | incrementCallCount updates callCount+1 and lastUsedAt | unit | `cd apps/api && npm test` | ❌ Wave 0 |
| crypto | encrypt/decrypt round-trip; tamper throws; wrong key throws | unit | `cd apps/api && npx vitest run src/lib/__tests__/crypto.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && npm test` (all 3 test files, currently ~41 tests, fast)
- **Per wave merge:** `cd apps/api && npm test && npm run type-check`
- **Phase gate:** Full suite green + `npm run type-check` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/lib/__tests__/crypto.test.ts` — covers crypto round-trip, tamper detection, wrong-key rejection (write FIRST)
- [ ] Extend `apps/api/src/services/__tests__/admin.service.test.ts` — add `apiKey` to prisma mock + describe blocks for KEY-01..KEY-06
- [ ] `ENCRYPTION_KEY` env var must be present in test environment — add `process.env.ENCRYPTION_KEY = '0'.repeat(64)` in tests that need real crypto, or mock the crypto module for tests that only need to verify DB call shapes

---

## Sources

### Primary (HIGH confidence)
- Node.js v24 built-in `crypto` module — AES-256-GCM API (`createCipheriv`, `createDecipheriv`, `randomBytes`, `getAuthTag`, `setAuthTag`) — verified locally with round-trip test (2026-03-12)
- `apps/api/vitest.config.ts` — confirms test glob, environment, globals settings
- `apps/api/src/services/__tests__/admin.service.test.ts` — established patterns: `vi.mock` at top, dynamic import inside `it` blocks, `beforeEach(vi.clearAllMocks)`
- `apps/api/src/services/gemini.service.ts` — current constructor and method signatures examined directly
- `apps/api/src/worker.ts` — current geminiService call sites identified
- `apps/api/prisma/schema.prisma` — no `ApiKey` model present; migration required

### Secondary (MEDIUM confidence)
- NIST SP 800-38D — 12-byte IV recommended for GCM; 16-byte auth tag is standard default
- Prisma docs — `$transaction` with array of operations for atomic multi-update

### Tertiary (LOW confidence)
- None — all key claims verified against local code or official Node.js API

---

## Metadata

**Confidence breakdown:**
- Crypto approach: HIGH — verified locally with Node 24 round-trip test
- Standard stack: HIGH — no new dependencies; all libs already in project
- Architecture patterns: HIGH — derived from existing Phase 2/3 code, not speculation
- GeminiService refactor scope: HIGH — all four public methods verified in source
- Pitfalls: HIGH — derived from direct code inspection (auth tag ordering, `this.ai.chats.create` in `generateEdit`)
- Test patterns: HIGH — exact patterns from existing test file verified

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, no fast-moving dependencies)
