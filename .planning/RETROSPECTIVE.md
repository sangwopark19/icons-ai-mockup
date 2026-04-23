# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — AI Mockup Admin Panel

**Shipped:** 2026-04-23
**Phases:** 6 | **Plans:** 18 | **Tasks:** 30

### What Was Built

- Secure admin access foundation across backend `requireAdmin` and frontend `/admin` guard/layout.
- Operational dashboard and user management workflows.
- Generation monitoring and content management workflows.
- Encrypted Gemini API key management with active key switching and call count tracking.
- Gap closures for dashboard active key display and edit-mode API key call counting.

### What Worked

- TDD setup for backend service methods caught contract shape before implementation.
- Verification-only final plans were useful as phase gates when paired with human visual approval.
- Keeping Fastify as the authoritative security boundary avoided relying on frontend or middleware-only protection.
- Small gap-closure phases made audit findings cheap to close without destabilizing earlier phase scopes.

### What Was Inefficient

- Verification frontmatter stayed stale after later human approvals and code fixes, which made milestone close noisier than necessary.
- Phase 6 was represented in ROADMAP/STATE but had no phase-local PLAN/SUMMARY artifacts because the code had already been fixed during Phase 4.
- Some generated milestone accomplishments included noisy one-liner extraction artifacts and needed manual cleanup.

### Patterns Established

- `AdminService` centralizes admin business logic and routes stay thin.
- `adminApi` in `apps/web/src/lib/api.ts` is the frontend boundary for admin data calls.
- `ConfirmDialog` is reused for dangerous admin actions.
- `KpiCard` supports a `subtitle` slot for secondary non-delta KPI context.
- Gemini call sites fetch the active DB key and increment call count explicitly before API calls.

### Key Lessons

1. Verification artifacts need a closeout pass whenever code fixes happen outside the originally planned phase.
2. Human verification outcomes should be reflected in `VERIFICATION.md`, not only in `SUMMARY.md`.
3. Gap-closure phases should still get local artifacts even when the code fix already exists, otherwise progress tools report inconsistent state.
4. Admin UX work should keep visual verification separate from code verification so runtime-only checks remain clear.

### Cost Observations

- Model mix: not recorded in local artifacts.
- Sessions: multiple GSD phase sessions across 2026-03-10 to 2026-03-12, with final archive on 2026-04-23.
- Notable: automated extraction was useful for raw archive creation but required manual editorial cleanup for milestone-quality docs.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multiple | 6 | Established GSD phase execution, audit, and gap-closure flow for the admin panel |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 62 API tests plus phase verification checks | 28/28 v1 requirements satisfied | AES-256-GCM crypto utility uses Node built-ins |

### Top Lessons

1. Keep source-of-truth artifacts synchronized after verification or audit-driven changes.
2. Archive milestone context aggressively once shipped to keep active planning files small.
