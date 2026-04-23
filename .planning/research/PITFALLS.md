# Pitfalls Research

**Domain:** Admin panel added to existing Next.js + Fastify AI mockup generation app
**Researched:** 2026-03-10
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Relying Solely on Next.js Middleware for Admin Route Protection

**What goes wrong:**
Admin routes at `/admin/*` are protected by Next.js middleware checking `role === 'admin'` in the JWT. An attacker sends a crafted `x-middleware-subrequest` header (CVE-2025-29927) or simply manipulates client-side state. The middleware is bypassed entirely, and admin pages render for unauthenticated users. Because this is a self-hosted deployment using `next start`, the app is in the affected class.

**Why it happens:**
The natural reflex when building admin routes in Next.js is to add a `middleware.ts` check. It feels complete. But CVE-2025-29927 — a critical vulnerability disclosed in March 2025 — demonstrates that Next.js middleware alone is insufficient as a security boundary for self-hosted apps. Developers treat middleware as the security gate, not as a UX redirect layer.

**How to avoid:**
- Treat Next.js middleware as UX-only (fast redirect for non-admins). It is not a security gate.
- Every admin API endpoint on the Fastify backend must have its own `requireAdmin` preHandler that reads `request.user.role` from the DB-verified token.
- Add a server-side check in every admin page (via Next.js Server Component or API call) that re-validates role before rendering any data.
- Pin to Next.js >= 15.2.3 (the patched version) and keep updated.
- Strip the `x-middleware-subrequest` header at the reverse proxy/nginx level.

**Warning signs:**
- Admin pages load data directly from the frontend store without re-verifying on the server.
- The Fastify admin routes only have `fastify.authenticate` but no role check.
- The admin middleware file is the only location where `role === 'admin'` is checked.

**Phase to address:** Phase 1 (Role system and auth middleware) — must be the first phase; all other admin work depends on this being correct.

---

### Pitfall 2: JWT Token Payload Does Not Include `role` — Stale Role After DB Change

**What goes wrong:**
The JWT is issued at login with the user's role at that point in time. An admin demotes a user (sets `role = 'user'`), but the user's existing access token still has `role = 'admin'` in its payload for the next 15–60 minutes. Conversely, if a user is promoted to admin, they cannot access admin features until their token expires and they log back in.

**Why it happens:**
The existing `auth.plugin.ts` calls `authService.getUserFromToken(token)` which re-queries the DB on every request (HIGH confidence — confirmed by reading the code). This is actually the safer pattern. The pitfall appears during the Prisma migration phase: if the role field is added to the User model but the `getUserFromToken` DB query does not `SELECT` the new `role` field, the returned `user` object will have `role: undefined`, and every admin check will silently fail.

**How to avoid:**
- When adding the `role` field to the User Prisma model, immediately update the `getUserFromToken` query to include `role` in the select clause.
- Write a test: login as admin, call an admin endpoint, confirm 200. Login as regular user, call the same endpoint, confirm 403.
- After granting/revoking admin role in the DB, the change takes effect on the next request automatically (no token invalidation needed, because the existing code already re-queries the DB).

**Warning signs:**
- The `(request as any).user` object is used in route handlers without TypeScript enforcement; `user.role` evaluates to `undefined` rather than throwing a type error.
- Admin check passes for all authenticated users because `undefined !== 'admin'` silently falls through to a wrong branch.

**Phase to address:** Phase 1 (Role system and auth middleware) — specifically when writing the Prisma migration and updating AuthService.

---

### Pitfall 3: Gemini API Keys Stored in DB Without Encryption

**What goes wrong:**
Admin adds a Gemini API key via the admin panel. The key is stored as plain text in a `gemini_api_keys` table. A database backup, a Prisma Studio session, or a SQL injection vulnerability exposes the key in plaintext. The attacker uses the key to generate images or exhaust API quotas.

**Why it happens:**
Encryption feels like complexity for an internal tool. "It's in the DB, behind auth" feels sufficient. But API keys stored in DB are a top secret management failure — a single point of exposure (DB read access, accidental log output, Prisma query logging in dev) leaks production credentials.

**How to avoid:**
- Encrypt API key values at rest using a symmetric encryption key stored in environment variables (not in the DB). Use `node:crypto` AES-256-GCM or a library like `@noble/ciphers`.
- Never log the decrypted key value. Mask it in API responses (return only the last 4 characters for display).
- The GeminiService reads the active key from the DB, decrypts in memory, uses it for the API call, and discards it — never caches in plaintext.
- Apply the same practice as the existing `.env`-based `GEMINI_API_KEY`: treat DB-stored keys as secrets, not data.

**Warning signs:**
- The admin endpoint for listing keys returns full key values in JSON.
- Prisma query logging is enabled in development and the key appears in logs.
- The key field in the Prisma schema is `String` without any application-layer encryption mention in comments.

**Phase to address:** Phase 3 (Gemini API key management) — design the key table with encryption from day one; retrofitting encryption requires a data migration.

---

### Pitfall 4: Missing Authorization on Admin Fastify Routes (IDOR on User Data)

**What goes wrong:**
The admin API endpoint `GET /api/admin/users/:id/generations` returns all generations for a given user. The route has `fastify.authenticate` (confirms the caller is logged in) but not a role check. A regular user who discovers this URL pattern can view other users' entire generation history.

**Why it happens:**
When creating admin routes, developers add them to the same route plugin structure as regular routes and copy the `preHandler: [fastify.authenticate]` pattern. The role check is added as an afterthought or forgotten. The existing codebase uses `(request as any).user` without TypeScript type safety on `role`, so missing a role check produces no compile-time error.

**How to avoid:**
- Create a dedicated `admin-auth.plugin.ts` that adds a `requireAdmin` decorator:
  ```typescript
  fastify.decorate('requireAdmin', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if ((request as any).user?.role !== 'admin') {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN' } });
    }
  });
  ```
- All admin routes use `preHandler: [fastify.requireAdmin]` — never just `fastify.authenticate`.
- Register all admin routes under a Fastify sub-plugin that applies `requireAdmin` as a hook globally:
  ```typescript
  fastify.register(adminRoutes, { prefix: '/api/admin' });
  // inside adminRoutes: fastify.addHook('preHandler', fastify.requireAdmin);
  ```
  This ensures no individual route can accidentally skip the check.

**Warning signs:**
- Admin routes and regular routes are in the same route file.
- Admin endpoints return different data for different users based only on the `userId` in the JWT, not on their `role`.
- `/api/admin` routes appear in the same Fastify plugin registration as `/api/generations`.

**Phase to address:** Phase 1 (Role system and auth middleware) — the `requireAdmin` decorator must exist before any admin endpoint is created.

---

### Pitfall 5: Admin Bulk Delete Causes DB Lock and File Orphaning

**What goes wrong:**
Admin triggers "delete all generations for user X" or "delete all images before date Y." Prisma's `deleteMany` wraps thousands of rows in a single transaction, causing a table-level lock that blocks all concurrent user generation requests for several seconds. Additionally, the cascade-deleted `GeneratedImage` records still have files on disk at `filePath` and `thumbnailPath` — the file system and DB become inconsistent.

**Why it happens:**
The existing `deleteGeneration` flow in `GenerationService` handles one generation at a time for regular users. Admin bulk delete is a new operation with different scale characteristics. Developers write `prisma.generation.deleteMany({ where: { userId } })` and assume cascades handle everything — but cascades handle DB rows, not filesystem files.

**How to avoid:**
- Implement bulk admin deletes as batched operations: fetch IDs in pages of 100, collect all `filePath`/`thumbnailPath` values from `GeneratedImage` rows, delete DB rows in a transaction, then delete files after DB commit succeeds.
- Never use `deleteMany` without pagination on unbounded datasets in an admin context.
- Consider soft-delete first (set a `deletedAt` timestamp) and run actual file deletion in a background job to avoid blocking the request.
- Add an explicit warning in the admin UI: "Deleting X users will remove Y images (Z GB). This is irreversible."

**Warning signs:**
- Admin delete endpoints do not return a count of what will be deleted before confirming.
- The service layer bulk delete method calls `prisma.generatedImage.findMany` after `prisma.generation.deleteMany` — but the images are already gone from DB via cascade, so file paths are lost.
- No background job or queue exists for bulk file cleanup.

**Phase to address:** Phase 2 (Content management) — bulk delete is a required feature; design the batched approach from the start.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Frontend-only admin role check via Zustand store | Fast to ship | Regular users can access admin API endpoints; security bypass is trivial | Never |
| Single Fastify `authenticate` hook on admin routes without role check | Reuses existing pattern | IDOR vulnerability on all admin data endpoints | Never |
| Storing Gemini API keys as plain text in DB | Simpler schema | Keys exposed in any DB read (backups, logs, Prisma Studio) | Never |
| `prisma.generation.deleteMany` without batching | Simple code | Table lock on large datasets; file orphaning on cascade | Only for guaranteed small datasets (< 100 rows) |
| Polling admin dashboard stats every 5 seconds without debounce | Simple implementation | N redundant DB queries when dashboard tab is open; scales poorly | Acceptable in v1 if polling interval >= 30s |
| Manual DB `UPDATE users SET role = 'admin'` for first admin user | No code needed | Fine for initial setup | Acceptable — this is the stated design decision |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| BullMQ queue monitoring in admin | Directly instantiate a new `Queue` object in the Fastify route handler to call `getJobCounts()` | Reuse the existing queue instance from `apps/api/src/lib/queue.ts` — creating a new `Queue` object creates a new Redis connection per request |
| Gemini API key switching | Switching the active key mid-request causes in-flight generation jobs to fail because the worker loaded the old key at job start | Worker must read the active key at job start and pin it for that job; key switch only affects new jobs enqueued after the change |
| Prisma migration adding `role` enum | Running `prisma migrate dev` in production accidentally creates migration in non-standard state | Always use `prisma migrate deploy` in production; never `migrate dev` outside of local development |
| Next.js Server Components on admin pages | Fetching admin data via a client-side `fetch()` from within a `useEffect` — the data briefly renders before auth check completes | Use Next.js Server Components that call the Fastify admin API server-side, or use `getServerSideProps` with redirect on auth failure |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Dashboard stats query joining users + generations + images without index | Admin dashboard takes 3-5 seconds to load; DB CPU spikes | Use aggregation queries with `COUNT` and `GROUP BY` on indexed columns; add `@@index([userId, createdAt])` on `generations` (already exists) | Beyond 10k generations |
| Listing all users with `prisma.user.findMany()` without pagination | Admin user list hangs on apps with many users | Always paginate: `skip`, `take`, return `total` count | Beyond 500 users |
| BullMQ `getJobs(['waiting', 'active', 'completed', 'failed'])` fetching all jobs | Queue status panel is slow; Redis memory spikes | Use `getJobCounts()` for counts; only fetch individual jobs on demand | Beyond 1k jobs in queue |
| Admin dashboard polling every 5s while tab is active | Constant DB load even when no changes | Set polling interval to 30s minimum; use visibility API to pause polling when tab is hidden | Immediately with any concurrent users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Returning full Gemini API key in admin list endpoint | Key exposed to anyone who compromises an admin session | Return only masked value (e.g., `AIZA...k4Qw`) — never the full key |
| No rate limiting on admin endpoints | Admin login brute force; admin actions spammable | Apply existing Fastify rate limiting to `/api/admin/*`; admin endpoints must not be more permissive than regular endpoints |
| Admin-promoted user retains admin access after being demoted | If the DB update succeeds but the user is cached as admin in any in-memory store | The existing pattern (re-query DB on every request in `getUserFromToken`) prevents this — do not add any caching layer around user role lookup |
| Exposing internal stack traces in admin error responses | Reveals schema, file paths, internal logic to compromised admin session | Admin API follows the same `{ success: false, error: { code, message } }` format — never forward raw `error.stack` |
| Admin can delete their own account via user management panel | Leaves system with no admin | Prevent admin from performing destructive operations on their own `userId` at the service layer |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Destructive actions (ban user, delete images) with no confirmation | Admin fat-fingers a delete; data lost permanently | All destructive actions require a confirmation dialog showing what will be deleted; show record counts before confirming |
| Admin dashboard showing live queue counts without loading states | Stale numbers appear to be current; admin is confused about whether queue is actually empty | Show timestamp of last refresh; display loading spinner during each poll cycle |
| User suspension with no feedback to suspended user | Suspended user continues submitting generation requests and receives generic auth errors | On account suspension, API returns a specific error code (`ACCOUNT_SUSPENDED`) that the frontend displays as a clear message |
| No audit trail for admin actions | Cannot determine who deleted which content or when | Log admin actions to a simple `admin_audit_log` table: `adminUserId`, `action`, `targetId`, `timestamp`, `metadata` |
| API key "activate" button with no indication which key is current | Admin activates wrong key; current active key deactivated unexpectedly | Show active key prominently with a visual indicator; require explicit confirmation to switch |

---

## "Looks Done But Isn't" Checklist

- [ ] **Admin role check:** The `/admin` page redirects non-admins — verify the Fastify `/api/admin/*` routes also return 403 for non-admins (test with a regular user token).
- [ ] **Gemini key switching:** Admin activates a new key in the UI — verify that the next generation job actually uses the new key by checking logs, not just by trusting the UI toggle.
- [ ] **User suspension:** Admin suspends a user account — verify the suspended user's existing valid JWT is rejected at the next API call (requires `isActive`/`isSuspended` flag checked in `getUserFromToken`, not just in the admin UI).
- [ ] **Bulk delete:** Admin deletes a user's content — verify that image files are actually removed from disk, not just DB rows. Check `uploads/` directory after deletion.
- [ ] **Queue monitoring:** Admin dashboard shows "0 active jobs" — verify this matches actual Redis queue state, not a stale poll result.
- [ ] **Stats dashboard:** Generation count on dashboard matches `SELECT COUNT(*) FROM generations` in DB directly.
- [ ] **Prisma migration:** `role` field added to User model — verify existing users get the default value `user` and do not require manual DB updates.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Admin bypass via middleware-only auth | HIGH | Audit all admin API endpoints; add `requireAdmin` hook to every route; rotate any potentially exposed data |
| Gemini key stored in plaintext and exposed | HIGH | Immediately rotate affected Google Cloud API keys; add encryption before re-inserting new keys; audit access logs |
| Bulk delete without file cleanup | MEDIUM | Implement a reconciliation job that scans DB `file_path` columns and removes files not referenced by any DB row |
| Missing admin role check on a specific endpoint (IDOR) | MEDIUM | Add role check; invalidate all active admin sessions as precaution; audit access logs for that endpoint |
| Prisma migration adding `role` field breaks existing tokens | LOW | The existing code re-queries DB so role is always fresh; recovery is just deploying the fix and running `prisma migrate deploy` |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Middleware-only admin protection (CVE-2025-29927 class) | Phase 1 — Role system and auth middleware | Call admin endpoint with regular user token; expect 403 |
| JWT payload stale role / missing role in DB query | Phase 1 — Role system and auth middleware | Change user role in DB; confirm next request reflects new role without re-login |
| Missing `requireAdmin` on Fastify routes | Phase 1 — Role system and auth middleware | Integration test: regular user token against every `/api/admin/*` route |
| Gemini API keys stored in plaintext | Phase 3 — Gemini API key management | Inspect DB directly; confirm key value is not plaintext |
| Admin bulk delete locking + file orphaning | Phase 2 — Content management | Delete 1000 generations in test; measure lock duration; verify files removed from disk |
| User suspension not enforced at API level | Phase 2 — User management | Suspend user; make API call with their valid token; expect 403 with ACCOUNT_SUSPENDED |
| Audit log missing for admin actions | Phase 1 or 2 — whichever implements first destructive action | Perform admin action; check `admin_audit_log` table for entry |

---

## Sources

- CVE-2025-29927 Next.js Middleware Authorization Bypass: [ProjectDiscovery Analysis](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass), [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/), [JFrog Blog](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/)
- Fastify role authorization patterns: [Permit.io Fastify Middleware Guide](https://www.permit.io/blog/how-to-create-an-authorization-middleware-for-fastify), [Logto Fastify RBAC + JWT](https://docs.logto.io/api-protection/nodejs/fastify)
- Next.js RBAC pitfalls: [Medium: Hidden Pitfalls of Next.js Permissions](https://medium.com/@adorekasun/the-hidden-pitfalls-of-next-js-permissions-and-how-i-solved-them-5557325cb769), [EastonDev RBAC Admin Guide](https://eastondev.com/blog/en/posts/dev/20260107-nextjs-rbac-admin-guide/)
- API key security: [GitGuardian Secrets API Management](https://blog.gitguardian.com/secrets-api-management/), [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- Prisma migration production safety: [Prisma Migrate Dev vs. Deploy](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production), [Prisma Data Migration Guide](https://www.prisma.io/docs/guides/data-migration)
- BullMQ monitoring: [BullMQ Metrics Docs](https://docs.bullmq.io/guide/metrics), [Bull Board](https://github.com/felixmosh/bull-board)
- Bulk delete database safety: [CockroachDB Bulk Delete Guide](https://www.cockroachlabs.com/docs/stable/bulk-delete-data), [Medium: Delete Large Rows in Production](https://aashishpeepra-ap.medium.com/how-to-delete-a-large-number-of-rows-in-production-394b89179d26)
- Existing codebase review: `apps/api/src/plugins/auth.plugin.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/routes/generation.routes.ts`

---

*Pitfalls research for: Admin panel in Next.js + Fastify AI mockup generation app*
*Researched: 2026-03-10*
