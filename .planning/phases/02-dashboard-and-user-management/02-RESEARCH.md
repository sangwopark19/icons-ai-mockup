# Phase 2: Dashboard and User Management - Research

**Researched:** 2026-03-11
**Domain:** Admin dashboard KPIs + user lifecycle management (Fastify + Prisma + Recharts + Next.js App Router)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 2x3 grid layout with 6 KPI cards (total users, total generations, failed jobs, queue depth, storage usage, active API keys)
- Each card shows large number + day-over-day delta (e.g., +12 ↑ 3.2%)
- 30-second auto-polling — no manual refresh button
- Skeleton loading while data loads; switch to real values after load
- Bar chart below KPI cards — hourly failure count for the last 24 hours (fixed window, no period switcher)
- Chart Y-axis: absolute failed-job count (not percentage)
- Chart library: Recharts — React 19 peer-dep conflict resolved via `react-is@19.0.0` pnpm override
- User table columns: email, name, role, status, 가입일, 마지막 로그인, action button
- Offset-based pagination — numeric page buttons at bottom (1 2 3 … N)
- Page size: 20 rows
- Search bar + role/status filter dropdowns side-by-side above the table
- Per-row action: ⋮ overflow menu → Suspend/Unsuspend, Delete, Change Role
- Dangerous actions (suspend, delete) require modal confirmation dialog
- Role change (admin ↔ user): no confirmation modal, direct toggle from dropdown
- Suspend: set `status = suspended`; existing sessions preserved, future logins/API calls blocked
- Delete: soft delete — `status = deleted`, email anonymized to `deleted_xxx@anon`, name to `삭제된 사용자`, `passwordHash` invalidated; Generation/Image records kept
- Suspended user API rejection error shape: `{ success: false, error: { code: 'ACCOUNT_SUSPENDED', message } }`

### Claude's Discretion
- KPI card icon selection (lucide-react)
- Skeleton loading visual details
- Delta display format (color, arrow style)
- Recharts bar chart colors/styling
- Empty user list state
- Search debounce duration
- Overflow dropdown menu implementation
- Whether to use useEffect+useState pattern or introduce TanStack Query for polling

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | Total user count and total generation count KPI cards | `prisma.user.count()` + `prisma.generation.count()`; simple aggregate queries |
| DASH-02 | Failed job count (last 24 h) and current queue depth | `prisma.generation.count({ where: { status: 'failed', createdAt: { gte: 24hAgo } } })` for failed count; `generationQueue.getJobCounts('waiting', 'active', 'delayed')` for depth |
| DASH-03 | Total image storage usage | `prisma.generatedImage.aggregate({ _sum: { fileSize: true } })` — fileSize column already in schema |
| DASH-04 | Active API key info and call count | No ApiKey model in current schema — display "N/A — Phase 4" or wire to future model; must not block DASH-04 delivery |
| DASH-05 | Hourly failure rate chart (last 24 h) | SQL GROUP BY hour on `generations.created_at WHERE status='failed'`; 24 data points via Prisma raw query or Prisma `groupBy` |
| USER-01 | Admin can list all users with pagination | `prisma.user.findMany({ skip, take, orderBy })` + `prisma.user.count()` |
| USER-02 | Email search and status/role filter | Prisma `where: { email: { contains }, status, role }` + Zod query param validation |
| USER-03 | Suspend / unsuspend user account | `prisma.user.update({ where: { id }, data: { status: 'suspended' } })`; `requireAdmin` check on route; suspended check in `authenticate` decorator |
| USER-04 | Soft delete with PII anonymization | `prisma.user.update({ data: { status: 'deleted', email: \`deleted_\${id}@anon\`, name: '삭제된 사용자', passwordHash: 'DELETED' } })`; generations preserved by cascade rule (onDelete: Cascade is on Project, not Generation independently) — need to verify cascade path |
| USER-05 | Change user role (admin ↔ user) | `prisma.user.update({ data: { role } })`; role value validated with Zod enum |
</phase_requirements>

---

## Summary

Phase 2 builds two admin screens on top of the existing auth/middleware foundation from Phase 1. The dashboard screen is a polling KPI display with a Recharts bar chart; the users screen is a paginated, filterable table with CRUD-style account lifecycle actions.

The API layer is straightforward: all new endpoints live under `/api/admin/` and inherit the `requireAdmin` preHandler hook already registered on the admin router. Data comes from Prisma (Postgres) for counts and aggregates, and from BullMQ's `getJobCounts()` for live queue depth. No new infrastructure is needed.

The only non-trivial concern is the Recharts + React 19 peer dependency conflict. The fix (adding `react-is@19.0.0` as a direct dependency and a pnpm workspace-level override) is well-documented and already noted in STATE.md. Recharts 2.15+ is stable with this override applied. A second concern is that the `ApiKey` model does not exist in the current schema (it is a Phase 4 deliverable), so DASH-04 must either display a placeholder or expose an empty state rather than throwing.

**Primary recommendation:** Build the API service layer first (`admin.service.ts`), then the admin routes, then the frontend components. Add the Recharts pnpm override in the root `package.json` before installing the library.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma Client | 6.x (existing) | DB queries for counts/aggregates/updates | Already the project ORM; no new dependency |
| BullMQ | 5.x (existing) | `getJobCounts()` for queue depth | Already the project queue library |
| Recharts | 2.15+ | Bar chart for hourly failure counts | Locked decision; React 19 stable with pnpm override |
| react-is | 19.0.0 | Peer dep fix for Recharts under React 19 | Required by Recharts internal; must match React version |
| lucide-react | 0.468 (existing) | KPI card icons | Already installed in web app |
| Zod | 3.x (existing) | Validate admin API query params and bodies | Established project pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.x (existing in package.json, not yet wired) | Polling / cache / mutation state on admin pages | Polling with `refetchInterval: 30000` is cleaner than `setInterval` in useEffect; optional based on Claude's discretion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Tremor, visx, Chart.js | Recharts is locked; others have better React 19 support but are out of scope |
| Prisma `groupBy` | Raw SQL `$queryRaw` | `groupBy` + `createdAt >= 24hAgo` is type-safe but may need post-processing for hourly buckets; `$queryRaw` gives direct `date_trunc('hour', ...)` |

**Installation (Recharts + override):**
```bash
# In apps/web:
pnpm add recharts react-is

# In root package.json, add:
{
  "pnpm": {
    "overrides": {
      "react-is": "$react-is"
    }
  }
}
```

---

## Architecture Patterns

### Recommended Project Structure — New Files

```
apps/api/src/
├── services/
│   └── admin.service.ts          # All admin business logic (counts, user mutations)
├── routes/admin/
│   ├── index.routes.ts           # Existing — add new sub-routes here
│   ├── dashboard.routes.ts       # GET /api/admin/dashboard/stats
│   │                             # GET /api/admin/dashboard/chart
│   └── users.routes.ts           # GET /api/admin/users
│                                 # PATCH /api/admin/users/:id/status
│                                 # PATCH /api/admin/users/:id/role
│                                 # DELETE /api/admin/users/:id

apps/web/src/
├── app/admin/
│   ├── dashboard/
│   │   └── page.tsx              # Replace stub — full dashboard page
│   └── users/
│       └── page.tsx              # Replace stub — full users page
├── components/admin/
│   ├── kpi-card.tsx              # Single KPI card (number + delta)
│   ├── kpi-skeleton.tsx          # Skeleton variant for loading
│   ├── failure-chart.tsx         # Recharts BarChart wrapper
│   ├── user-table.tsx            # Table + pagination
│   ├── user-search-bar.tsx       # Email search + role/status dropdowns
│   ├── user-action-menu.tsx      # ⋮ overflow dropdown per row
│   └── confirm-dialog.tsx        # Reusable modal confirmation
└── lib/api.ts                    # Add adminApi namespace
```

### Pattern 1: Admin Service Singleton

All admin DB queries live in `AdminService`; routes call service methods. Matches the established `export const xxxService = new XxxService()` pattern.

```typescript
// apps/api/src/services/admin.service.ts
import { prisma } from '../lib/prisma.js';
import { generationQueue } from '../lib/queue.js';

export class AdminService {
  async getDashboardStats() {
    const [userCount, generationCount, failedJobCount, storageResult, queueCounts] =
      await Promise.all([
        prisma.user.count({ where: { status: { not: 'deleted' } } }),
        prisma.generation.count(),
        prisma.generation.count({
          where: {
            status: 'failed',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.generatedImage.aggregate({ _sum: { fileSize: true } }),
        generationQueue.getJobCounts('waiting', 'active', 'delayed', 'failed'),
      ]);

    const queueDepth =
      (queueCounts.waiting ?? 0) + (queueCounts.active ?? 0) + (queueCounts.delayed ?? 0);

    return {
      userCount,
      generationCount,
      failedJobCount,
      storageBytes: storageResult._sum.fileSize ?? 0,
      queueDepth,
      activeApiKeys: null, // Phase 4 — placeholder
    };
  }

  async getHourlyFailureChart() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
      SELECT date_trunc('hour', created_at) AS hour, COUNT(*) AS count
      FROM generations
      WHERE status = 'failed' AND created_at >= ${since}
      GROUP BY hour
      ORDER BY hour ASC
    `;
    return rows.map((r) => ({ hour: r.hour.toISOString(), count: Number(r.count) }));
  }
}

export const adminService = new AdminService();
```

### Pattern 2: Admin Routes — Registering Sub-Routers

```typescript
// apps/api/src/routes/admin/index.routes.ts (updated)
import dashboardRoutes from './dashboard.routes.js';
import usersRoutes from './users.routes.js';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAdmin); // applies to all children

  fastify.get('/health', async (_req, reply) => reply.send({ success: true, data: { status: 'ok' } }));

  fastify.register(dashboardRoutes, { prefix: '/dashboard' });
  fastify.register(usersRoutes, { prefix: '/users' });
};
```

### Pattern 3: Suspended User Check in authenticate Decorator

The existing `authenticate` decorator calls `authService.getUserFromToken()` which fetches the full User from DB. Add a status check there — this is the correct security boundary per STATE.md decisions.

```typescript
// Inside authPlugin authenticate, after user is fetched:
if (user.status === 'suspended') {
  return reply.code(403).send({
    success: false,
    error: { code: 'ACCOUNT_SUSPENDED', message: '계정이 정지되었습니다' },
  });
}
if (user.status === 'deleted') {
  return reply.code(403).send({
    success: false,
    error: { code: 'ACCOUNT_DELETED', message: '삭제된 계정입니다' },
  });
}
```

### Pattern 4: 30-Second Polling on Frontend

The project uses `useEffect + useState` (not TanStack Query yet). Two viable approaches:

**Option A — useEffect with setInterval (consistent with existing code):**
```typescript
useEffect(() => {
  let mounted = true;
  const fetchStats = async () => {
    if (!mounted) return;
    const data = await adminApi.getDashboardStats(accessToken!);
    if (mounted) setStats(data);
  };
  fetchStats();
  const id = setInterval(fetchStats, 30_000);
  return () => { mounted = false; clearInterval(id); };
}, [accessToken]);
```

**Option B — TanStack Query refetchInterval (cleaner, already in package.json):**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['admin', 'dashboard', 'stats'],
  queryFn: () => adminApi.getDashboardStats(accessToken!),
  refetchInterval: 30_000,
  enabled: !!accessToken,
});
```

TanStack Query requires adding a `QueryClientProvider` to the admin layout or root layout. This is Claude's discretion — either pattern is valid.

### Pattern 5: Recharts BarChart (React 19 safe)

```typescript
// apps/web/src/components/admin/failure-chart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData { hour: string; count: number }

export function FailureChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="hour" tickFormatter={(v) => new Date(v).getHours() + 'h'} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="var(--color-danger, #ef4444)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Anti-Patterns to Avoid

- **Checking suspension in Next.js middleware only:** The Fastify `authenticate` decorator is the authoritative security boundary (established in STATE.md). Next.js middleware is UX redirect only.
- **Using `prisma.$queryRaw` with template string interpolation for user input:** Always use parameterized queries. For hourly chart, the date is server-computed, so `$queryRaw` is safe.
- **Deleting Generation records on user soft-delete:** CONTEXT.md explicitly requires keeping them for stats/monitoring.
- **Overwriting `passwordHash` with empty string:** Use a sentinel like `'DELETED'` that bcrypt can never produce, so login will always fail.
- **Cascading hard-delete through Project:** The Prisma schema has `Project -> onDelete: Cascade` from User. Soft delete avoids this entirely — do NOT call `prisma.user.delete()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Queue depth | Custom Redis LLEN queries | `generationQueue.getJobCounts('waiting', 'active', 'delayed')` | BullMQ stores counts in Redis hashes; raw LLEN on queue key misses delayed/active buckets |
| Hourly buckets | Manual JS groupBy on all Generation rows | `prisma.$queryRaw` with `date_trunc` or Prisma `groupBy` with `_count` | Fetching all rows to group in JS will be O(N) and slow at scale |
| Suspense/skeleton | Custom loading state machines | `isLoading` + CSS skeleton divs (simple) or Suspense boundaries | Skeleton via `animate-pulse` on placeholder divs is standard and matches existing project style |
| Confirmation dialog | Native `window.confirm()` | Custom modal component (`confirm-dialog.tsx`) | Native confirm is not styleable; design requires modal matching admin UI tokens |

---

## Common Pitfalls

### Pitfall 1: Recharts Blank Chart with React 19
**What goes wrong:** `ResponsiveContainer` renders with zero size; chart appears empty with no console error.
**Why it happens:** Recharts uses `react-is` internally to check if children are React components; the bundled `react-is` version predates React 19 and fails the check.
**How to avoid:** Add `react-is@19.0.0` to `apps/web/package.json` dependencies AND add the pnpm workspace override in root `package.json`:
```json
{ "pnpm": { "overrides": { "react-is": "$react-is" } } }
```
**Warning signs:** Chart area is visible but empty; no JS errors; adding `width={500}` directly to `BarChart` (bypassing `ResponsiveContainer`) makes it render.

### Pitfall 2: Soft-Delete Triggering Hard-Delete Cascade
**What goes wrong:** Calling `prisma.user.delete()` instead of `prisma.user.update()` triggers cascade deletes on `Session`, `Project`, and transitively `Generation`, `GeneratedImage`, etc.
**Why it happens:** The schema has `onDelete: Cascade` on foreign keys from Session and Project to User.
**How to avoid:** ALWAYS use `prisma.user.update({ data: { status: 'deleted', ... } })`. Never call `prisma.user.delete()` in admin operations.

### Pitfall 3: Stale Status in JWT — Suspended User Still Passes Auth
**What goes wrong:** A suspended user holds a valid JWT; if status is only checked at login, they continue making API calls until token expiry.
**Why it happens:** JWT contains `userId` but not `status`; status check must happen at each request.
**How to avoid:** The existing `getUserFromToken` fetches fresh User from DB on every request (STATE.md decision). Add status check in `authenticate` AFTER the DB fetch, not inside the JWT payload check.

### Pitfall 4: DASH-04 Blocking Phase Delivery
**What goes wrong:** API endpoint for DASH-04 (active API key info) throws because the `ApiKey` table doesn't exist yet (Phase 4).
**Why it happens:** Referencing a non-existent Prisma model.
**How to avoid:** Return `{ activeApiKeys: null, apiKeyCallCount: null }` placeholder from `getDashboardStats()`. The frontend renders "N/A" or a disabled card. Document this in a code comment.

### Pitfall 5: N+1 on User List Query
**What goes wrong:** Loading user list with per-row sub-queries for generation counts causes N+1 queries.
**Why it happens:** Joining counts eagerly in the list query is not the obvious choice.
**How to avoid:** Phase 2 user list does NOT include per-user generation counts per the spec. Use a single `prisma.user.findMany()` with no relation includes for the list view.

### Pitfall 6: Pagination Off-by-One
**What goes wrong:** Page 1 shows 20 results, but "total pages" is wrong because `count()` includes deleted users.
**Why it happens:** `count()` without a `where` clause includes all statuses.
**How to avoid:** Apply the same `where` filter to both `findMany` and `count()` calls. If the UI shows deleted users, include them in count; if not, filter both.

---

## Code Examples

### GET /api/admin/users — Route with Zod Validation

```typescript
// Source: established project Zod + Fastify pattern
import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  email: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

fastify.get('/', async (request, reply) => {
  const query = listUsersSchema.parse(request.query);
  const result = await adminService.listUsers(query);
  return reply.send({ success: true, data: result.users, pagination: result.pagination });
});
```

### PATCH /api/admin/users/:id/status

```typescript
const updateStatusSchema = z.object({ status: z.enum(['active', 'suspended']) });

fastify.patch('/:id/status', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { status } = updateStatusSchema.parse(request.body);
  const user = await adminService.updateUserStatus(id, status);
  return reply.send({ success: true, data: user });
});
```

### DELETE /api/admin/users/:id (Soft Delete)

```typescript
fastify.delete('/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  await adminService.softDeleteUser(id);
  return reply.send({ success: true, message: '사용자가 삭제되었습니다' });
});

// In AdminService:
async softDeleteUser(id: string) {
  return prisma.user.update({
    where: { id },
    data: {
      status: 'deleted',
      email: `deleted_${id}@anon`,
      name: '삭제된 사용자',
      passwordHash: 'DELETED',
    },
  });
}
```

### adminApi Client (frontend)

```typescript
// apps/web/src/lib/api.ts — add adminApi namespace
export const adminApi = {
  getDashboardStats: (token: string) =>
    request<{ success: true; data: DashboardStats }>('/api/admin/dashboard/stats', { token }),

  getFailureChart: (token: string) =>
    request<{ success: true; data: HourlyChartPoint[] }>('/api/admin/dashboard/chart', { token }),

  listUsers: (token: string, params: UserListParams) =>
    request<{ success: true; data: AdminUser[]; pagination: Pagination }>(
      `/api/admin/users?${new URLSearchParams(params as any)}`, { token }
    ),

  updateUserStatus: (token: string, id: string, status: 'active' | 'suspended') =>
    request<{ success: true; data: AdminUser }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH', token, body: JSON.stringify({ status }),
    }),

  updateUserRole: (token: string, id: string, role: 'admin' | 'user') =>
    request<{ success: true; data: AdminUser }>(`/api/admin/users/${id}/role`, {
      method: 'PATCH', token, body: JSON.stringify({ role }),
    }),

  softDeleteUser: (token: string, id: string) =>
    request<{ success: true; message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE', token,
    }),
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Prisma aggregates for hourly data | `date_trunc` via `$queryRaw` | Always preferred | Returns correct 24 buckets without N+1 |
| Manual polling with `setInterval` | TanStack Query `refetchInterval` | TQ v5 (already in package.json) | Background refetch, stale-while-revalidate, dedup |
| Recharts 2.x with React 18 peer | Recharts 2.15+ with `react-is@19.0.0` override | Late 2024 | Blank chart issue resolved |

---

## Open Questions

1. **DASH-04: Active API key display**
   - What we know: No `ApiKey` model exists; Phase 4 will add it
   - What's unclear: Should DASH-04 be a disabled/placeholder card now, or should Phase 4 backfill it?
   - Recommendation: Render a static placeholder card with "API 키 관리 (Phase 4)" text; mark DASH-04 as partial completion

2. **TanStack Query provider for admin pages**
   - What we know: `@tanstack/react-query` is in `package.json` but no `QueryClientProvider` is wired
   - What's unclear: Whether to add TQ provider to root layout (affects all pages) or admin layout only
   - Recommendation: If using TQ for polling, add `QueryClientProvider` to admin layout only to avoid global state leakage; otherwise use `useEffect` polling pattern matching existing project code

3. **Day-over-day delta for KPI cards**
   - What we know: CONTEXT.md specifies "+12 ↑ 3.2%" format for each KPI card
   - What's unclear: The API needs yesterday's counts to compute delta — one extra query per KPI or a single batch query covering two 24h windows
   - Recommendation: Compute yesterday's count in the same `getDashboardStats()` call with a second date range; add `*Yesterday` fields to the response shape

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `apps/api/vitest.config.ts` |
| Quick run command | `cd apps/api && pnpm test` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | `getDashboardStats()` returns correct userCount and generationCount | unit | `cd apps/api && pnpm test -- --reporter=verbose src/services/__tests__/admin.service.test.ts` | ❌ Wave 0 |
| DASH-02 | `getDashboardStats()` returns failedJobCount and queueDepth | unit | same | ❌ Wave 0 |
| DASH-03 | `getDashboardStats()` returns correct storageBytes | unit | same | ❌ Wave 0 |
| DASH-04 | `getDashboardStats()` returns `null` for activeApiKeys (placeholder) | unit | same | ❌ Wave 0 |
| DASH-05 | `getHourlyFailureChart()` returns 24 hourly buckets | unit | same | ❌ Wave 0 |
| USER-01 | `listUsers()` returns paginated results with correct total | unit | same | ❌ Wave 0 |
| USER-02 | `listUsers()` filters by email/role/status | unit | same | ❌ Wave 0 |
| USER-03 | `updateUserStatus()` sets suspended; suspended user blocked by `authenticate` | unit | same | ❌ Wave 0 |
| USER-04 | `softDeleteUser()` anonymizes PII; generations not deleted | unit | same | ❌ Wave 0 |
| USER-05 | `updateUserRole()` toggles role correctly | unit | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test`
- **Per wave merge:** `cd apps/api && pnpm test && cd ../web && pnpm type-check`
- **Phase gate:** Full suite green + `pnpm type-check` on both apps before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/services/__tests__/admin.service.test.ts` — covers DASH-01 through USER-05
- [ ] Mock setup for `../../lib/queue.js` (`generationQueue.getJobCounts`) alongside existing prisma mock

---

## Sources

### Primary (HIGH confidence)
- Prisma docs (`prisma.user.update`, `aggregate`, `groupBy`, `$queryRaw`) — verified via codebase (existing pattern) and official Prisma docs
- BullMQ `getJobCounts` API — [BullMQ Getters docs](https://docs.bullmq.io/guide/jobs/getters), [BullMQ API v5](https://api.docs.bullmq.io/classes/v4.Queue.html)
- Existing codebase: `apps/api/src/lib/queue.ts`, `apps/api/src/plugins/auth.plugin.ts`, `apps/api/prisma/schema.prisma`

### Secondary (MEDIUM confidence)
- Recharts + React 19 fix: [recharts/recharts#4558](https://github.com/recharts/recharts/issues/4558), [bstefanski.com blog](https://www.bstefanski.com/blog/recharts-empty-chart-react-19) — fix confirmed by multiple sources; current stable version (2.15+) requires the pnpm override
- [Recharts npm page](https://www.npmjs.com/package/recharts)

### Tertiary (LOW confidence)
- Recharts 2.15+ stability with React 19.2.x — [recharts/recharts#6857](https://github.com/recharts/recharts/issues/6857) reports new blank-chart issues after React 19.2.3 upgrade; not fully resolved as of March 2026. **Flag:** Test chart render in the dev environment before committing to Recharts; if still broken, use `width`/`height` props directly on `BarChart` without `ResponsiveContainer`.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in the project except Recharts; pnpm override pattern is well-documented
- Architecture: HIGH — follows established project patterns (service singleton, Zod validation, error shape)
- Pitfalls: HIGH for cascade/status concerns (verified from schema); MEDIUM for Recharts React 19.2.x regression (single source, ongoing issue)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable stack; Recharts React 19 compat may change sooner)
