# Architecture Research

**Domain:** Admin panel integration into existing Next.js + Fastify monorepo
**Researched:** 2026-03-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (apps/web)                      │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │  Regular App Routes  │    │      Admin Routes (/admin/*)     │   │
│  │  /dashboard          │    │  /admin/dashboard                │   │
│  │  /projects/**        │    │  /admin/users                    │   │
│  │                      │    │  /admin/generations              │   │
│  │  Auth: isAuthenticated│    │  /admin/content                  │   │
│  └──────────────────────┘    │  /admin/api-keys                 │   │
│                              │                                  │   │
│                              │  Auth: isAuthenticated + isAdmin │   │
│                              └──────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              middleware.ts (Next.js Edge Middleware)            │  │
│  │  - Match /admin/* routes                                       │  │
│  │  - Decode JWT from Authorization header                        │  │
│  │  - Check role === 'admin', redirect if not                     │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                           │ HTTP (Bearer JWT)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Fastify API (apps/api)                           │
│                                                                      │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │  Existing Routes     │    │      Admin Routes                │   │
│  │  /api/auth/**        │    │  /api/admin/stats                │   │
│  │  /api/projects/**    │    │  /api/admin/users/**             │   │
│  │  /api/generations/** │    │  /api/admin/generations/**       │   │
│  │  /api/images/**      │    │  /api/admin/content/**           │   │
│  │                      │    │  /api/admin/api-keys/**          │   │
│  │  preHandler:         │    │                                  │   │
│  │    [authenticate]    │    │  preHandler:                     │   │
│  └──────────────────────┘    │    [authenticate, requireAdmin]  │   │
│                              └──────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  auth.plugin.ts (existing)                     │  │
│  │  + requireAdmin decorator (NEW)                                │  │
│  │    → reads request.user.role, rejects non-admin with 403      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Service Layer                           │    │
│  │  Existing services + AdminService (NEW)                      │    │
│  │  AdminService: stats queries, bulk ops, cross-user access    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Prisma / PostgreSQL                     │    │
│  │  User.role field (NEW enum: 'user' | 'admin')               │    │
│  │  ApiKey table (NEW): id, key, label, isActive, usageCount   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `middleware.ts` (Next.js) | Intercepts all `/admin/*` requests, checks JWT role before page renders | Zustand auth store (reads token), redirects to `/login` or `/forbidden` |
| `app/(admin)/` route group | Admin UI pages: dashboard, users, generations, content, api-keys | Admin API client functions in `lib/api.ts` |
| `AdminGuard` component | Client-side role double-check; renders fallback if `user.role !== 'admin'` | Zustand auth store |
| `requireAdmin` Fastify decorator | Backend guard on all `/api/admin/*` routes, runs after `authenticate` | Reads `request.user.role` set by existing auth plugin |
| `admin.routes.ts` (Fastify) | Route handlers for all admin API endpoints, registered under `/api/admin` prefix | AdminService |
| `AdminService` | Cross-user queries, aggregate stats, bulk delete, API key CRUD | Prisma client |
| `User.role` (Prisma) | Role field (`user` \| `admin`) on existing User model | Set directly in DB for initial admin; exposed in JWT payload |
| `ApiKey` table (Prisma) | Stores multiple Gemini API keys with label, status, usage count | GeminiService reads active key instead of env var |

## Recommended Project Structure

```
apps/
├── web/src/
│   ├── app/
│   │   ├── (auth)/               # existing
│   │   ├── dashboard/            # existing
│   │   ├── projects/             # existing
│   │   └── (admin)/              # NEW route group
│   │       ├── layout.tsx        # Admin layout + AdminGuard wrapper
│   │       ├── admin/
│   │       │   ├── page.tsx              # Redirect to /admin/dashboard
│   │       │   ├── dashboard/page.tsx    # Stats, queue status, API usage
│   │       │   ├── users/
│   │       │   │   ├── page.tsx          # User list with search/filter
│   │       │   │   └── [id]/page.tsx     # User detail + suspend/delete/role
│   │       │   ├── generations/page.tsx  # All generation jobs, queue state
│   │       │   ├── content/page.tsx      # Image search, bulk delete
│   │       │   └── api-keys/page.tsx     # Gemini key management
│   ├── lib/
│   │   └── api.ts                # extend with adminApi.* functions
│   ├── stores/
│   │   └── auth.store.ts         # add role field to User type
│   └── middleware.ts             # NEW — admin route guard at Edge
│
└── api/src/
    ├── plugins/
    │   └── auth.plugin.ts        # add requireAdmin decorator
    ├── routes/
    │   └── admin.routes.ts       # NEW — all /api/admin/* handlers
    ├── services/
    │   └── admin.service.ts      # NEW — cross-user queries, stats
    └── prisma/
        └── schema.prisma         # add User.role, ApiKey model, migration
```

### Structure Rationale

- **`(admin)/` route group:** Next.js route groups create layout isolation without affecting URL structure. The group-level `layout.tsx` contains a single `AdminGuard` component that handles the client-side role check, keeping each page clean.
- **`middleware.ts` at web root:** Next.js middleware runs at the Edge before any page component loads. Matching only `/admin/*` (not `/_next/**` or `/api/**`) keeps it cheap. It decodes the JWT from the Zustand-persisted localStorage token passed as a query param, or uses a cookie strategy.
- **`admin.routes.ts` as a single file:** All admin endpoints collected in one file makes auditing admin access easy. Register with `{ prefix: '/api/admin' }` in server.ts.
- **`admin.service.ts` separate from domain services:** Admin queries are cross-user by nature (e.g., "get all generations for any user"). Keeping them isolated prevents accidental cross-user leakage in user-facing services.

## Architectural Patterns

### Pattern 1: Fastify Decorator Chain for Role Authorization

**What:** Extend the existing `authenticate` decorator with an `requireAdmin` decorator. Routes needing admin access list both in `preHandler`.
**When to use:** All `/api/admin/*` routes. Some routes may need `authenticate` only (e.g., `/api/auth/me` already works this way).
**Trade-offs:** Explicit over implicit. Each route declares its security requirements in one array. Adding roles later is additive.

**Example:**
```typescript
// apps/api/src/plugins/auth.plugin.ts (addition)
fastify.decorate(
  'requireAdmin',
  async function (request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    if (!user || user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' },
      });
    }
  }
);

// apps/api/src/routes/admin.routes.ts
fastify.get('/stats', {
  preHandler: [fastify.authenticate, fastify.requireAdmin],
  handler: async (request, reply) => { /* ... */ },
});
```

### Pattern 2: Next.js Edge Middleware for Admin Route Guard

**What:** `middleware.ts` at `apps/web/src/` runs before every request. Use the `matcher` config to scope it to `/admin/*` only. Decode JWT (without full verification — keep middleware lean) and check the `role` claim.
**When to use:** Prevents admin pages from rendering at all for non-admin users. This is the first line of defense on the frontend.
**Trade-offs:** Edge middleware cannot access localStorage. The token must either be in a cookie or passed differently. Given the existing architecture uses localStorage/Zustand, the cleanest approach is to also set an `auth-token` cookie on login (HttpOnly optional, but needed for middleware to read it). The backend remains the authoritative security boundary.

**Example:**
```typescript
// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = jwtDecode<{ role?: string }>(token);
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Pattern 3: Role Field in JWT Payload

**What:** When the user logs in, include `role` in the JWT payload. The existing `authService.login()` builds the JWT — add `role` to the signed payload. The auth plugin then exposes `request.user.role` after token verification.
**When to use:** All authentication flows. This avoids an extra DB lookup per request to check admin status.
**Trade-offs:** Role changes (e.g., revoking admin) require token expiry before taking effect. Acceptable since the role is assigned manually and admin count is tiny.

## Data Flow

### Admin Request Flow

```
Admin navigates to /admin/users
    ↓
middleware.ts intercepts (Edge)
    → reads 'access-token' cookie
    → decodes JWT, checks role claim
    → if role !== 'admin': redirect /dashboard
    ↓
AdminGuard component (client-side double-check)
    → reads Zustand auth store user.role
    → if role !== 'admin': renders Forbidden UI
    ↓
Admin page component renders
    → calls adminApi.listUsers(token, params)
    → fetch POST /api/admin/users
    ↓
Fastify receives request
    → preHandler[0]: authenticate  → sets request.user (includes role)
    → preHandler[1]: requireAdmin  → checks request.user.role === 'admin'
    → handler: AdminService.listUsers(filters, pagination)
    → Prisma query: SELECT * FROM users WHERE ...
    ↓
Response returned → Admin UI renders table
```

### Gemini API Key Active Key Flow

```
GeminiService needs to call Gemini API
    ↓
Instead of process.env.GEMINI_API_KEY:
    → AdminService.getActiveApiKey()
    → SELECT key FROM api_keys WHERE is_active = true LIMIT 1
    ↓
Admin triggers key switch via /api/admin/api-keys/:id/activate
    → UPDATE api_keys SET is_active = false (all)
    → UPDATE api_keys SET is_active = true WHERE id = :id
    ↓
Next Gemini call picks up new active key
```

### Auth Store Role Extension

```
Login response from /api/auth/login
    → includes user.role in response body
    ↓
Zustand auth.store.ts
    → User type gains: role: 'user' | 'admin'
    → login() action stores role in persisted state
    ↓
Components and middleware read user.role from store / cookie
```

## Build Order (Dependencies)

The following order is required — later phases depend on earlier ones:

1. **DB Schema + Role field** — Foundation. `User.role` must exist before any role check can work. `ApiKey` table must exist before key management. Single Prisma migration.

2. **Backend: `requireAdmin` decorator + JWT role payload** — Gates all admin API routes. Must exist before any admin endpoints are registered. Also requires updating `auth.service.ts` to include `role` in the JWT and in the `/api/auth/me` response so the frontend can read it.

3. **Backend: `admin.routes.ts` + `AdminService`** — The actual admin API surface. Depends on decorator from step 2. Each endpoint group (users, generations, content, api-keys) can be built independently but all depend on the decorator.

4. **Frontend: Auth store role + cookie** — Login must write `role` to Zustand store AND set an `access-token` cookie so `middleware.ts` can read it. Depends on backend returning `role` (step 2).

5. **Frontend: `middleware.ts` route guard** — Depends on cookie being set (step 4). Must match only `/admin/*`.

6. **Frontend: Admin layout + AdminGuard** — Client-side guard in `(admin)/layout.tsx`. Depends on auth store having `role` (step 4).

7. **Frontend: Individual admin pages** — Each page depends on its corresponding backend endpoint (step 3) and the layout guard (step 6).

8. **GeminiService key source switch** — Switch from `env.GEMINI_API_KEY` to `AdminService.getActiveApiKey()`. Depends on `ApiKey` table (step 1) and admin key management endpoint (step 3).

## Anti-Patterns

### Anti-Pattern 1: Role Check Only on the Frontend

**What people do:** Check `user.role === 'admin'` in React components or Next.js middleware only, and skip the backend check.
**Why it's wrong:** The API remains accessible to anyone with a valid JWT. An attacker who knows the endpoint can bypass the UI entirely.
**Do this instead:** Always enforce with `preHandler: [authenticate, requireAdmin]` on every Fastify admin route. Frontend checks are UX only; backend is the security boundary.

### Anti-Pattern 2: Separate Admin App / Sub-domain

**What people do:** Create a separate Next.js app at `admin.example.com` for the admin panel.
**Why it's wrong:** The project explicitly scopes admin to `/admin/*` within the existing app. A separate app duplicates the auth system, complicates deployment, and introduces CORS between admin app and API.
**Do this instead:** Use a Next.js route group `(admin)` with a dedicated layout. This shares the same auth infrastructure with zero additional CORS config.

### Anti-Pattern 3: Cross-User Queries in Existing User-Scoped Services

**What people do:** Add `getAll()` methods to existing services like `GenerationService` that return results for all users.
**Why it's wrong:** Existing services are written with the assumption that operations are scoped to `request.user.id`. Adding cross-user variants risks accidental exposure if the wrong method is called from a user-facing route.
**Do this instead:** All cross-user queries live in `AdminService`. User-facing services remain scoped to the authenticated user's ID.

### Anti-Pattern 4: Hardcoding Gemini Key in `admin.service.ts` Fallback

**What people do:** Fall back to `process.env.GEMINI_API_KEY` if no active key is found in the database.
**Why it's wrong:** Silently hides misconfiguration. If the DB table is empty or migration not run, the system appears to work but bypasses the key management system.
**Do this instead:** Throw a clear error if no active key is found: `throw new Error('No active Gemini API key configured')`. Alert the admin rather than silently falling back.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Next.js middleware ↔ Fastify | HTTP (Bearer JWT in Authorization header) | Middleware only reads JWT — no direct API call. The actual admin API calls happen in page components. |
| AdminService ↔ GeminiService | Direct function call (same process) | GeminiService calls `adminService.getActiveApiKey()` on each generation job, replacing env var lookup. Must handle the case where no active key exists. |
| AdminService ↔ existing services | None (intentional) | AdminService uses Prisma directly for cross-user queries rather than delegating to user-scoped services. |
| auth.plugin.ts `requireAdmin` ↔ `authenticate` | Shared `request.user` object | `requireAdmin` must run after `authenticate` (which populates `request.user`). Always chain as `[authenticate, requireAdmin]`. |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Gemini API | `AdminService.getActiveApiKey()` returns key string; `GeminiService` passes it to the SDK | Active key cached at application level is risky (stale after switch); query DB per generation or use a short in-memory TTL (30s). |
| PostgreSQL | Prisma queries in AdminService | Admin stats queries may be expensive (COUNT, GROUP BY across large tables). Add DB indexes on `generations.status`, `generations.created_at` if not already present. |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current approach fine. Polling for queue status is acceptable. |
| 1k-100k users | Admin stats queries become slow. Add materialized views or a separate analytics table updated by the worker. |
| 100k+ users | Admin panel becomes its own service concern. Consider read replicas for admin queries to avoid impacting user-facing DB performance. |

### Scaling Priorities

1. **First bottleneck:** Admin dashboard stats (COUNT queries across all users/generations). Mitigate with indexed queries and/or caching stats in Redis with a 60s TTL.
2. **Second bottleneck:** Bulk content delete operations. Implement as background jobs (BullMQ already present) rather than synchronous HTTP responses.

## Sources

- Next.js middleware matcher docs: [https://nextjs.org/docs/app/building-your-application/routing/middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) — HIGH confidence
- Fastify preHandler hook pattern: [https://www.permit.io/blog/how-to-create-an-authorization-middleware-for-fastify](https://www.permit.io/blog/how-to-create-an-authorization-middleware-for-fastify) — MEDIUM confidence
- Next.js RBAC with App Router: [https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router](https://www.jigz.dev/blogs/how-to-use-middleware-for-role-based-access-control-in-next-js-15-app-router) — MEDIUM confidence
- Existing codebase analysis: `apps/api/src/plugins/auth.plugin.ts`, `apps/api/src/server.ts`, `apps/api/prisma/schema.prisma` — HIGH confidence

---
*Architecture research for: Admin panel integration into Next.js 16 + Fastify 5 monorepo*
*Researched: 2026-03-10*
