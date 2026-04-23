# Feature Research

**Domain:** Admin panel for AI mockup generation SaaS app
**Researched:** 2026-03-10
**Confidence:** HIGH (PROJECT.md scope is explicit; SaaS admin patterns are well-established)

---

## Feature Landscape

### Table Stakes (Admins Cannot Do Their Job Without These)

Features that must exist. Missing any one of these means an admin cannot safely operate the service.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Role-based access gate | Without it, any logged-in user can reach /admin | LOW | Add `role` field to User table (Prisma migration). Fastify middleware checks `role === 'admin'` on every `/admin/*` endpoint. Redirect to home on failure. |
| User list with search & filter | Core operational need — find users by name/email, filter by status | MEDIUM | Paginated table. Filter by status (active/suspended), search by email. Columns: email, created_at, role, status, action menu. |
| Account suspend / reactivate | Stop bad actors without destroying their data or history | LOW | Soft suspend: set `status = 'suspended'` on User. Auth middleware rejects suspended users with 401. |
| Account delete (soft delete) | GDPR / data hygiene — remove access while preserving referential integrity | MEDIUM | `deletedAt` timestamp, anonymize PII. Retain Generation records for audit. |
| Role elevation / demotion | Bootstrap the first admin; demote compromised admin accounts | LOW | PATCH `/admin/users/:id/role` — only sets `admin` or `user`. Guard against removing own admin role. |
| Admin dashboard overview | Summary KPIs — can't operate blind | MEDIUM | Total users, total generations, failed jobs in last 24 h, active queue depth, storage used. Polled every 30–60 s; no WebSocket needed. |
| Generation job list (all users) | Diagnose failures, see real-time workload | MEDIUM | Table of generations: user, type (IP Change/Sketch/Style), status (pending/processing/completed/failed), created_at, duration. Filterable by status. |
| Failed job detail & retry | Failed AI jobs need manual review or re-queuing | MEDIUM | Show Gemini error reason. Expose BullMQ retry endpoint. Bull-board pattern: `queue.getJob(id).retry()`. |
| API key list & status | Know which Gemini keys are registered and whether they're active | LOW | Table: key name/alias, last 4 chars of key, status (active/inactive), created_at. |
| Activate / deactivate API key | Manual key rotation when a key hits quota or is compromised | LOW | Toggle active key. Enforce exactly one active key at a time (or zero if all exhausted). |
| Add / delete API key | Onboard new keys from Google AI Studio, retire expired ones | LOW | Add key via form (stored encrypted or in plaintext depending on security posture). |

---

### Differentiators (Competitive Advantage for This Admin Panel)

Features that go beyond baseline operation. Worth building for operational efficiency, but not blockers.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-API-key usage counter | Know which key is absorbing quota before it fails | MEDIUM | Increment a Redis counter or DB column on every Gemini request. Display in admin key table as "N requests today / this week". |
| Content browsing by user | See exactly what a specific user has generated — essential for abuse investigation | MEDIUM | Admin can navigate to a user's profile and see all their projects + images. Reuse existing project/image data; just remove user-scoping on admin queries. |
| Bulk image delete with filters | Clean up storage at scale (old images, specific user's content) | HIGH | Filter by: user, date range, project. Confirm count before delete. Soft-delete first, purge on schedule. High risk: needs confirmation step and dry-run count. |
| Queue depth trend chart | Visualize backlog over time — spot traffic spikes | HIGH | Requires storing BullMQ metrics in time series (Redis ZADD or a metrics table). BullMQ has native metrics API (`queue.getMetrics('completed', start, end)`). |
| Generation failure rate stat | Operational health indicator — rising failures signal Gemini quota or prompt issues | LOW | Derived from existing Generation records: `COUNT(status='failed') / COUNT(*)` in last N hours. Cheap query. |
| Storage usage by user | Identify users consuming disproportionate disk space | MEDIUM | Sum file sizes from the filesystem or DB path lengths. Sorted table. Triggers cleanup decisions. |

---

### Anti-Features (Deliberately NOT Building)

Explicitly out of scope for v1. Each has a simpler alternative that avoids the complexity.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| API key auto-rotation | Prevent quota exhaustion automatically | Requires quota forecasting, fallback logic, race conditions under concurrent requests, and complex error handling across the generation pipeline | Manual rotation by admin when a key starts failing. Alert via failed job count in dashboard. |
| Admin invite / registration flow | Self-service admin onboarding | Admins are rare; building a full invite flow adds auth complexity for 1–3 users | DB direct: `UPDATE "User" SET role = 'admin' WHERE email = '...'`. Document this in a runbook. |
| Real-time WebSocket admin feed | Live push updates for job status, new users | Adds infra complexity (ws connections, keepalive) for marginal value in a low-traffic admin context | Poll every 30–60 s via React Query `refetchInterval`. Sufficient for operational awareness. |
| Content moderation / AI safety pipeline | Auto-flag inappropriate generated images | Out of scope for a private B2B mockup tool used by known users; adds significant ML infra cost | Admin can manually browse and delete content. |
| Granular RBAC (multiple admin roles) | "Super admin" vs "support admin" permission split | Premature — only one admin role needed at launch; full RBAC adds middleware complexity | Binary role: `admin` or `user`. Extend later if multi-tier admin access becomes needed. |
| Audit log / activity trail | Track every admin action for compliance | Good idea long-term but adds per-action logging overhead and storage | Add in v2 when compliance requirements emerge. |
| Email notifications on events | Alert admin by email on failures or suspicious activity | Requires email service integration (SES, Sendgrid) with template management | Admin checks dashboard manually. Dashboard failure counters serve this purpose at current scale. |

---

## Feature Dependencies

```
Role system (User.role field + middleware)
    └──requires──> All other admin features (nothing works without the gate)

User list
    └──requires──> Role system

Account suspend
    └──requires──> Role system
    └──enhances──> User list (inline action)

Generation job list (all users)
    └──requires──> Role system
    └──enhances──> Dashboard (drill-down from failure stat)

Failed job retry
    └──requires──> Generation job list

API key table
    └──requires──> ApiKey DB table (new Prisma model)
    └──requires──> Role system

Activate/deactivate key
    └──requires──> API key table
    └──requires──> GeminiService reads active key from DB (not .env)

Per-key usage counter
    └──requires──> API key table
    └──requires──> GeminiService to increment counter on each call

Content browsing by user
    └──requires──> User list (navigate from user row)
    └──enhances──> Dashboard (user-scoped investigation)

Bulk image delete
    └──requires──> Content browsing by user
    └──conflicts──> Per-key usage counter (delete does not affect quota — no conflict, just note)

Queue depth trend chart
    └──requires──> BullMQ metrics storage (new infrastructure)
    └──enhances──> Dashboard (replaces static queue depth with time series)
```

### Dependency Notes

- **Role system is the hard prerequisite for everything:** The Prisma migration adding `role` to `User`, plus the Fastify `preHandler` admin middleware, must be complete before any other admin feature can be built or tested.
- **API key active flag requires GeminiService refactor:** Currently `GeminiService` reads from `process.env.GEMINI_API_KEY`. Switching to DB-backed active key lookup must happen before the key management UI is useful. This is the highest-risk integration point.
- **Bulk image delete conflicts with data integrity:** Deleting images while a generation referencing them is in-flight (status `processing`) can corrupt state. Guard: only allow deletion of generations in `completed` or `failed` status.

---

## MVP Definition

### Launch With (v1 — this milestone)

Minimum viable admin panel — an admin can operate the service safely.

- [ ] Role gate — `/admin/*` protected, non-admins redirected
- [ ] Dashboard overview — user count, generation count, queue depth, failure count (last 24 h)
- [ ] User list — search by email, paginated, status visible
- [ ] Account suspend / reactivate — inline action from user list
- [ ] Account delete (soft) — inline action, confirmation required
- [ ] Generation job list — all users, filterable by status
- [ ] Failed job detail — error reason visible, retry button
- [ ] API key list — registered keys, active flag, alias
- [ ] Add / delete API key — form to register, delete button
- [ ] Activate API key — toggle active key (enforces single active key)

### Add After Validation (v1.x)

- [ ] Per-key usage counter — add after key management is stable and usage data is wanted
- [ ] Content browsing by user — add when abuse investigation becomes a real operational need
- [ ] Storage usage by user — add when storage costs become a concern
- [ ] Generation failure rate trend — add when traffic volume makes per-request visibility insufficient

### Future Consideration (v2+)

- [ ] Bulk image delete — add when storage cleanup at scale is needed; high risk, needs careful UX
- [ ] Queue depth trend chart — add when BullMQ metrics infrastructure is justified by traffic
- [ ] Audit log — add when compliance or multi-admin accountability is required
- [ ] Granular RBAC — add only when multiple tiers of admin are needed

---

## Feature Prioritization Matrix

| Feature | Admin Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| Role gate (middleware + migration) | HIGH | LOW | P1 |
| Dashboard overview | HIGH | MEDIUM | P1 |
| User list + search | HIGH | LOW | P1 |
| Account suspend/reactivate | HIGH | LOW | P1 |
| Account soft delete | HIGH | LOW | P1 |
| Generation job list (all users) | HIGH | LOW | P1 |
| Failed job retry | HIGH | MEDIUM | P1 |
| API key list | HIGH | LOW | P1 |
| Add/delete API key | HIGH | LOW | P1 |
| Activate API key (+ GeminiService refactor) | HIGH | MEDIUM | P1 |
| Per-key usage counter | MEDIUM | MEDIUM | P2 |
| Content browsing by user | MEDIUM | LOW | P2 |
| Storage usage by user | MEDIUM | MEDIUM | P2 |
| Generation failure rate stat | MEDIUM | LOW | P2 |
| Bulk image delete | MEDIUM | HIGH | P3 |
| Queue depth trend chart | LOW | HIGH | P3 |
| Audit log | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for admin panel launch
- P2: Should have, add when core is stable
- P3: Nice to have, defer to v2

---

## Sources

- PROJECT.md — explicit feature list and out-of-scope decisions
- [SaaS User Management Guide 2026 — Zluri](https://www.zluri.com/blog/saas-user-management)
- [User Management for B2B SaaS — WorkOS](https://workos.com/blog/user-management-for-b2b-saas)
- [Bull Board — BullMQ Queue Inspector](https://github.com/felixmosh/bull-board)
- [BullMQ Metrics](https://docs.bullmq.io/guide/metrics)
- [Gemini API Key Rotation — Medium](https://medium.com/@entekumejeffrey/bypassing-gemini-api-rate-limits-with-smart-key-rotation-in-next-js-8acdee9f9550)
- [API Key Management Best Practices — DigitalAPI](https://www.digitalapi.ai/blogs/top-api-key-management-tools)
- [Table-stake Features in SaaS — LinkedIn](https://www.linkedin.com/pulse/table-stake-features-saas-enterprise-products-rohit-pareek)

---

*Feature research for: AI Mockup Admin Panel*
*Researched: 2026-03-10*
