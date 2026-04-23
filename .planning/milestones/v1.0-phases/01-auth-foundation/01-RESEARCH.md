# Phase 1: Auth Foundation - Research

**Researched:** 2026-03-10
**Domain:** Role-based access control — Prisma enums, Fastify preHandler decorators, Next.js App Router layout guards, JWT payload extension
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**비관리자 접근 처리**
- /admin 접근 시 조용히 홈(/)으로 리다이렉트 (토스트/알림 없음)
- 비로그인 상태에서도 동일하게 홈으로 리다이렉트 (로그인 페이지가 아님)
- API: /api/admin/* 비관리자 호출 시 403 반환 — `{ success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' } }`
- Next.js middleware는 UX 리다이렉트 전용, Fastify requireAdmin이 보안 경계 (STATE.md 결정 유지)

**Admin 레이아웃/네비게이션**
- 왼쪽 사이드바 레이아웃 (데스크톱: 항상 표시, 모바일: 햄버거 메뉴)
- 4개 메뉴 항목: 대시보드, 사용자 관리, 생성/콘텐츠, API 키 — 각 Phase에 대응
- 사이드바 상단에 관리자 이름 + 이메일 표시
- 사이드바 하단에 "메인으로" 링크 (기존 앱으로 돌아가기)
- 기존 앱의 디자인 토큰(CSS 변수) 재사용, 별도 관리자 테마 없음

**Role 설계**
- Prisma enum으로 role 필드 추가: `user`, `admin` 2가지 (기본값: `user`)
- 마이그레이션에서 기존 사용자 전원 자동으로 `user` 할당
- Prisma seed 스크립트에 초기 admin 계정 생성 로직 포함 (개발 환경 세팅용)
- User 모델에 status 필드도 함께 추가 (Phase 2 suspend/delete 대비, 마이그레이션 1회로 처리)

**기존 클라이언트 호환성**
- JWT payload에 role 추가, 기존 토큰(role 없는)은 그대로 허용 — role 없으면 `user`로 취급
- Zustand auth store의 User 타입에 `role?: string` 선택적 필드 추가 — 기존 localStorage 데이터와 충돌 없음
- 프론트엔드 관리자 확인은 Zustand store의 role 값 사용 (API 호출 없이 즉시 참조)
- 기존 라우트(로그인, 프로젝트 등)와 기존 API는 전혀 수정하지 않음 — role은 /admin 영역에만 영향

### Claude's Discretion
- 모바일 사이드바 햄버거 메뉴 구현 방식
- 사이드바 너비, 아이콘 선택 (lucide-react 사용)
- status 필드의 enum 값 설계 (active, suspended, deleted 등)
- requireAdmin 미들웨어의 정확한 구현 패턴
- Next.js middleware vs layout-level 라우트 가드 구현 방식

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User 모델에 role 필드(admin/user) 추가 — Prisma 마이그레이션 | Prisma enum pattern documented; schema diff identified |
| AUTH-02 | Fastify requireAdmin 미들웨어 — /api/admin/* 엔드포인트에 admin 권한 체크 | Existing `authenticate` decorator pattern maps directly; `requireAdmin` extends it |
| AUTH-03 | JWT 토큰 payload에 role 포함 — 로그인 시 role 정보 반환 | `generateAccessToken` already in `auth.service.ts`; JWTPayload interface extension documented |
| AUTH-04 | Next.js /admin 라우트 가드 — 비관리자 접근 시 리다이렉트 | No middleware.ts exists yet; layout-level guard pattern documented; cookie blocker issue documented |
| AUTH-05 | Admin 레이아웃 — /admin 전용 사이드바/네비게이션 | App Router nested layout pattern documented; existing CSS vars and lucide-react confirmed |
</phase_requirements>

---

## Summary

This phase wires role-based access control across three layers: the database (Prisma enum), the API (Fastify preHandler decorator), and the frontend (Next.js App Router layout + Zustand store). The codebase is in excellent shape — the existing `authenticate` decorator in `auth.plugin.ts` is the direct template for `requireAdmin`, and the existing project routes show the `addHook('preHandler', ...)` pattern that admin routes will follow.

The critical blocker noted in STATE.md is real: the existing auth uses JWT stored in `localStorage` and sent as `Authorization: Bearer` headers. Next.js Edge middleware runs before React and cannot read `localStorage`. The decision is that Next.js middleware is UX-only, and Fastify's `requireAdmin` is the true security boundary — this sidesteps the cookie access problem entirely for security purposes. For the UX redirect, a layout-level client component (`'use client'`) can read the Zustand store from `localStorage` rehydration and redirect on mount, which is the safest approach given the existing auth architecture.

The User model needs two new fields added in a single migration: `role` (enum: `user`/`admin`, default `user`) and `status` (enum: `active`/`suspended`/`deleted`, default `active`). Existing users get `user` + `active` via migration default values — no explicit UPDATE needed.

**Primary recommendation:** Implement `requireAdmin` as a direct extension of `authenticate` using Fastify's decorator pattern, and guard the /admin route with a layout-level `'use client'` component that reads Zustand store — no Next.js middleware required for this phase.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.2.0 | DB schema, migration, enum | Already in use; enum support confirmed |
| @fastify/jwt | ^9.0.0 | JWT signing/verification | Already registered in auth.plugin.ts |
| jsonwebtoken | ^9.0.2 | Direct JWT ops in auth.service.ts | Already in use alongside @fastify/jwt |
| zustand | ^5.0.2 | Client auth state | Already powers auth store |
| lucide-react | ^0.468.0 | Icons for sidebar nav | Confirmed in package.json |
| Next.js App Router | ^16.1.0 | Route groups, nested layouts | Already used for (auth) group pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority (CVA) | (transitive) | Component variant styling | Already used in button.tsx, input.tsx |
| clsx + tailwind-merge | ^2.1.1 / ^2.6.0 | cn() utility | Already used in all UI components |
| Tailwind CSS v4 | ^4.0.0 | Utility styling | @theme CSS vars pattern in globals.css |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Layout-level guard | Next.js middleware | Middleware can't read localStorage JWT; layout approach consistent with existing pattern |
| Prisma enum | String field with constraint | Enums are self-documenting, enforce values at DB level, already used in codebase (GenerationMode, etc.) |

**No new packages required.** All needed dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

**API additions:**
```
apps/api/src/
├── plugins/
│   └── auth.plugin.ts          # ADD: requireAdmin decorator here
├── routes/
│   └── admin/
│       └── index.routes.ts     # New admin route prefix
├── services/
│   └── auth.service.ts         # MODIFY: add role to JWT payload
└── prisma/
    ├── schema.prisma            # MODIFY: add role + status enums
    └── seed.ts                  # ADD: admin seed script
```

**Web additions:**
```
apps/web/src/
├── app/
│   └── admin/
│       ├── layout.tsx           # Admin shell with sidebar (server component wrapper)
│       ├── page.tsx             # /admin redirect to /admin/dashboard
│       └── dashboard/
│           └── page.tsx         # Dashboard placeholder
├── components/
│   └── admin/
│       ├── admin-guard.tsx      # 'use client' — reads Zustand, redirects if not admin
│       └── admin-sidebar.tsx    # Sidebar component
└── stores/
    └── auth.store.ts            # MODIFY: add role?: string to User interface
```

### Pattern 1: Fastify requireAdmin Decorator

**What:** A preHandler decorator that chains after `authenticate` to enforce admin role.
**When to use:** On every route under `/api/admin/*`.

```typescript
// apps/api/src/plugins/auth.plugin.ts
// ADD alongside existing authenticate decorator:

fastify.decorate(
  'requireAdmin',
  async function (request: FastifyRequest, reply: FastifyReply) {
    // First run the base authenticate check
    await fastify.authenticate(request, reply);
    // If authenticate already replied (401), stop here
    if (reply.sent) return;

    const user = (request as any).user;
    if (!user || user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '관리자 권한이 필요합니다',
        },
      });
    }
  }
);

// TypeScript declaration extension:
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
```

**Admin route usage (mirrors project.routes.ts pattern):**
```typescript
// apps/api/src/routes/admin/index.routes.ts
const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply requireAdmin to ALL routes in this plugin
  fastify.addHook('preHandler', fastify.requireAdmin);

  fastify.get('/health', async (request, reply) => {
    return reply.send({ success: true, data: { status: 'ok' } });
  });
};
```

### Pattern 2: JWT Payload Extension (Backward-Compatible)

**What:** Add `role` to the JWT payload in `generateAccessToken`. Old tokens without `role` are handled by defaulting to `'user'` in `getUserFromToken`.

```typescript
// apps/api/src/services/auth.service.ts

interface JWTPayload {
  userId: string;
  email: string;
  role?: string;       // ADD — optional for backward compat
  iat?: number;
  exp?: number;
}

// MODIFY generateAccessToken:
private generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,   // ADD — 'user' | 'admin' from Prisma enum
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry,
  } as jwt.SignOptions);
}
```

Note: `getUserFromToken` fetches the full User from DB (not from token payload), so the role on `request.user` is always current — no stale-JWT concern.

### Pattern 3: Prisma Schema — Role + Status Enums

```prisma
// apps/api/prisma/schema.prisma

enum UserRole {
  user
  admin

  @@map("user_role")
}

enum UserStatus {
  active
  suspended
  deleted

  @@map("user_status")
}

model User {
  id           String     @id @default(uuid())
  email        String     @unique
  passwordHash String     @map("password_hash")
  name         String
  role         UserRole   @default(user)    // ADD
  status       UserStatus @default(active)  // ADD (Phase 2 prereq)
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  lastLoginAt  DateTime?  @map("last_login_at")

  sessions Session[]
  projects Project[]

  @@map("users")
}
```

Migration will automatically set all existing rows to `user` + `active` because both have `@default` values — no explicit SQL UPDATE needed.

### Pattern 4: Next.js Layout-Level Admin Guard

**What:** A `'use client'` component that reads the Zustand store (rehydrated from localStorage) and redirects non-admins before rendering any admin UI.

**Why layout-level, not middleware.ts:** The existing auth uses `Authorization: Bearer` headers from localStorage — not cookies. Next.js Edge middleware cannot access localStorage. A layout-level guard is consistent with the existing `AuthProvider` pattern.

```typescript
// apps/web/src/components/admin/admin-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isLoading) return; // Wait for Zustand rehydration
    if (!isAuthenticated || user?.role !== 'admin') {
      router.replace('/'); // Silent redirect to home
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show nothing until auth state is confirmed
  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
```

```typescript
// apps/web/src/app/admin/layout.tsx
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
```

### Pattern 5: Zustand Auth Store — Role Field Addition

```typescript
// apps/web/src/stores/auth.store.ts
// ONLY ADD role?: string to existing User interface — no other changes

interface User {
  id: string;
  email: string;
  name: string;
  role?: string; // ADD — optional preserves existing localStorage data
}
```

Existing localStorage data (no `role` field) rehydrates as `user.role === undefined`. The AdminGuard checks `user?.role !== 'admin'`, so undefined correctly denies admin access.

### Pattern 6: Admin Sidebar Structure

Nav items matching the 4-phase menu decision:
```typescript
const navItems = [
  { href: '/admin/dashboard',  label: '대시보드',     icon: LayoutDashboard },
  { href: '/admin/users',      label: '사용자 관리',  icon: Users },
  { href: '/admin/content',    label: '생성/콘텐츠',  icon: ImageIcon },
  { href: '/admin/api-keys',   label: 'API 키',       icon: Key },
];
```

Phase 2–4 items link to their pages (pages don't exist yet — they show an empty/stub page, not a "준비 중" message).

### Anti-Patterns to Avoid

- **Reading JWT payload for role on frontend:** The Zustand store's `user.role` is the source of truth on the client. Don't decode the JWT token in the browser to check role.
- **Trusting frontend guard as security boundary:** The AdminGuard is UX-only. Fastify's `requireAdmin` is the real boundary.
- **Using `reply.hijack()` in requireAdmin:** Checking `reply.sent` after calling authenticate handles the 401 case cleanly without hijacking.
- **Adding `preHandler: [fastify.authenticate, fastify.requireAdmin]` as two separate hooks:** Calling authenticate inside requireAdmin is cleaner and avoids double execution.
- **Flashing admin UI before redirect:** Return `null` from AdminGuard while `isLoading` is true — prevents any admin content flash.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom crypto | `jsonwebtoken` (already installed) | Timing attacks, algorithm confusion attacks |
| Password hashing | Custom hash | `bcrypt` (already installed) | Salt rounds, rainbow table resistance |
| DB enum validation | String checks + application-level guards | Prisma enum | DB enforces values, TypeScript types generated automatically |
| Route-level auth hooks | Custom hook system | Fastify's `addHook('preHandler', ...)` | Already used in project.routes.ts; built into Fastify |

**Key insight:** Every security primitive needed for this phase is already installed and in use. The task is wiring them together, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: reply.sent Not Checked in Chained PreHandlers
**What goes wrong:** `requireAdmin` calls `fastify.authenticate()` internally. If authenticate sends a 401, then requireAdmin continues and attempts to send a 403 — Fastify throws "Reply already sent".
**Why it happens:** `fastify.authenticate` sends the reply directly; control returns to the caller.
**How to avoid:** Always check `if (reply.sent) return;` immediately after calling `fastify.authenticate(request, reply)` inside `requireAdmin`.
**Warning signs:** "Reply was already sent" errors in Fastify logs.

### Pitfall 2: Admin UI Flash Before Redirect
**What goes wrong:** AdminGuard reads Zustand store, but on initial mount `isLoading` is `true` until rehydration completes. If the guard renders children while loading, admin UI briefly flashes for non-admins.
**Why it happens:** Zustand's `persist` middleware rehydration is async (uses `onRehydrateStorage`).
**How to avoid:** Return `null` from AdminGuard when `isLoading === true` OR when user is not admin. Only render children when `!isLoading && user?.role === 'admin'`.
**Warning signs:** Brief flash of admin sidebar before redirect to /.

### Pitfall 3: Migration Loses Data on Enum Addition
**What goes wrong:** Adding a Prisma enum field to an existing table with `@default` does NOT automatically add the column with default values if using `prisma db push` on production. `prisma migrate dev` generates a proper ALTER TABLE.
**Why it happens:** `db push` is schema-sync, not migration-based.
**How to avoid:** Always use `prisma migrate dev --name add-role-status` in development to generate a migration file. Never use `db push` for production schema changes.
**Warning signs:** `column "role" of relation "users" does not exist` errors.

### Pitfall 4: Stale Zustand Role After Role Change
**What goes wrong:** Admin changes another account's role in Phase 2. If the target user is currently logged in, their Zustand store still has the old role until next login.
**Why it happens:** `requireAdmin` fetches the user from DB on every request (via `getUserFromToken` → `getUserById`), so the API is always current. But the client Zustand store only updates on login.
**How to avoid:** In Phase 1, this is acceptable — the decision is "Setting a DB account to role=admin immediately grants access on **next login**." The success criterion explicitly says "on next login."
**Warning signs:** This is expected behavior per requirements, not a bug.

### Pitfall 5: CVE-2025-29927 — Next.js Middleware Auth Bypass
**What goes wrong:** Relying solely on Next.js middleware for authentication can be bypassed via a crafted `x-middleware-subrequest` header in some Next.js versions.
**Why it happens:** Known CVE disclosed in 2025 affecting middleware-based auth.
**How to avoid:** This is already addressed in STATE.md decisions — Fastify `requireAdmin` is the authoritative security boundary. The layout-level AdminGuard is UX-only. The 403 from Fastify is the real protection.
**Warning signs:** Any design where Next.js middleware is the ONLY auth check for API routes.

## Code Examples

Verified patterns from existing codebase:

### Existing preHandler Pattern (from project.routes.ts)
```typescript
// Source: apps/api/src/routes/project.routes.ts
const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // All routes get authenticate via addHook
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request, reply) => {
    const user = (request as any).user;
    // ... handler
  });
};
```

Admin routes follow this EXACT same pattern with `fastify.requireAdmin`.

### Existing Error Response Format (from auth.plugin.ts)
```typescript
// Source: apps/api/src/plugins/auth.plugin.ts
return reply.code(401).send({
  success: false,
  error: {
    code: 'UNAUTHORIZED',
    message,
  },
});
```

Admin 403 response mirrors this shape with `code: 'FORBIDDEN'`.

### Existing CSS Variable Usage (from (auth)/layout.tsx)
```typescript
// Source: apps/web/src/app/(auth)/layout.tsx
<div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8">
```

Admin sidebar uses `var(--bg-secondary)`, `var(--border-default)`, `var(--text-primary)`, `var(--text-secondary)`.

### Prisma Seed Pattern
```typescript
// apps/api/prisma/seed.ts (NEW FILE)
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: '관리자',
        passwordHash: await bcrypt.hash('admin1234!', 12),
        role: UserRole.admin,
        status: UserStatus.active,
      },
    });
    console.log('Admin seed created');
  } else {
    console.log('Admin already exists, skipping seed');
  }
}

main().finally(() => prisma.$disconnect());
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js pages/router for admin | App Router route groups + nested layouts | Next.js 13+ | Use `app/admin/layout.tsx`, not `pages/admin/_layout` |
| Zustand v4 `immer` middleware | Zustand v5 direct set (no immer needed for simple state) | Zustand 5.0 | Existing store uses v5 pattern correctly |
| Prisma 5.x migration commands | Prisma 6.x same commands | Prisma 6.2 | `prisma migrate dev` unchanged |
| `@fastify/jwt` for all JWT ops | Direct `jsonwebtoken` in service layer | — | Codebase uses both: `@fastify/jwt` registered for plugin compat, `jsonwebtoken` used directly in auth.service.ts |

**Deprecated/outdated:**
- `pages/` router for new routes: This project uses App Router (`app/`). Do not create anything under `pages/`.
- Zustand `subscribeWithSelector` for role checking: Not needed — direct store reads in component are sufficient.

## Open Questions

1. **Admin seed password for development**
   - What we know: Seed script creates admin account for dev
   - What's unclear: Should the password be hardcoded in seed.ts or read from env?
   - Recommendation: Hardcode a known dev password (`admin1234!`) in seed.ts with a comment — this is dev-only, not production auth.

2. **`/admin` root path behavior**
   - What we know: User decision says sidebar has "대시보드" as first item pointing to `/admin/dashboard`
   - What's unclear: Should `/admin` itself render the dashboard or redirect to `/admin/dashboard`?
   - Recommendation: Make `/admin/page.tsx` a redirect to `/admin/dashboard` — avoids duplicate content, cleaner URL.

3. **Pending Phase 2–4 menu items behavior**
   - What we know: Links should be present but the routes don't exist yet
   - Specific decision: 빈 페이지 (empty placeholder page), not "준비 중" message
   - Recommendation: Create stub `page.tsx` files that return a minimal empty layout with just the page title — zero content placeholders.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no vitest.config, jest.config, or test scripts in package.json |
| Config file | Wave 0 must create |
| Quick run command | `pnpm --filter api test` (once configured) |
| Full suite command | `pnpm --filter api test && pnpm --filter web test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | role + status columns exist in DB with correct defaults | smoke (migration verify) | `pnpm --filter api db:migrate && prisma db execute --preview-feature --schema prisma/schema.prisma` | Wave 0 |
| AUTH-02 | requireAdmin returns 403 for non-admin; 401 for unauthenticated | unit | `pnpm --filter api test -- requireAdmin` | Wave 0 |
| AUTH-03 | JWT access token contains role field | unit | `pnpm --filter api test -- generateAccessToken` | Wave 0 |
| AUTH-04 | GET /admin as non-admin user redirects to / | manual | Browser navigation test | manual-only (Next.js layout redirect) |
| AUTH-05 | Admin sidebar renders with correct nav items | manual | Browser visual check | manual-only (UI component) |

AUTH-02 and AUTH-03 are the only requirements with meaningful unit test coverage. AUTH-04 and AUTH-05 require a browser.

### Sampling Rate
- **Per task commit:** Not applicable — no test infrastructure yet
- **Per wave merge:** `pnpm --filter api test` once Wave 0 creates vitest config
- **Phase gate:** AUTH-02 + AUTH-03 unit tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/vitest.config.ts` — test framework setup for Fastify unit tests
- [ ] `apps/api/src/plugins/__tests__/auth.plugin.test.ts` — covers AUTH-02 (requireAdmin 401/403 behavior)
- [ ] `apps/api/src/services/__tests__/auth.service.test.ts` — covers AUTH-03 (JWT payload includes role)
- [ ] Framework install: `pnpm --filter api add -D vitest` — if vitest not already in devDependencies

## Sources

### Primary (HIGH confidence)
- Codebase direct inspection — `apps/api/src/plugins/auth.plugin.ts`, `auth.service.ts`, `project.routes.ts`
- Codebase direct inspection — `apps/web/src/stores/auth.store.ts`, `app/(auth)/layout.tsx`
- Codebase direct inspection — `apps/api/prisma/schema.prisma` (existing enum patterns: `GenerationMode`, `GenerationStatus`)
- STATE.md explicit decision — "Next.js middleware is UX-only redirect; Fastify requireAdmin is the authoritative security boundary (CVE-2025-29927 mitigation)"

### Secondary (MEDIUM confidence)
- `package.json` version inspection — Fastify 5.1.0, Prisma 6.2.0, Next.js 16.1.0, Zustand 5.0.2, lucide-react 0.468.0
- Fastify 5.x decorator + preHandler pattern — inferred from existing auth.plugin.ts usage
- Next.js App Router nested layout pattern — inferred from existing `(auth)` route group pattern

### Tertiary (LOW confidence)
- CVE-2025-29927 Next.js middleware bypass — referenced in STATE.md; not independently verified in this session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries directly verified from package.json and existing code
- Architecture: HIGH — patterns copied directly from existing codebase conventions
- Pitfalls: HIGH (reply.sent, UI flash, migration); MEDIUM (CVE-2025-29927 — referenced but not re-verified)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, 30-day window)
