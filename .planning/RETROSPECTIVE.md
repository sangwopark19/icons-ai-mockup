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

## Milestone: v1.1 — OpenAI GPT Image 2 Dual Provider

**Shipped:** 2026-05-04
**Phases:** 7 | **Plans:** 23 | **Tasks:** 61

### What Was Built

- Provider-aware generation schema, queue routing, worker dispatch, admin key lanes, and support metadata.
- OpenAI GPT Image 2 IP Change v2 and Sketch to Real v2 workflows beside the existing Gemini flows.
- Provider-pinned result continuation for regenerate, partial edit, style-copy, and history/result lifecycle.
- Admin retry recovery for failed OpenAI style-copy jobs.
- Verification closure phases for missing Phase 9 evidence and stale Phase 8 IP Change transparent-background wording.

### What Worked

- Keeping Gemini as the default lane while adding OpenAI-specific routing reduced migration risk.
- Requiring OpenAI-specific skills and prompt references kept API constraints visible during planning.
- Narrow gap-closure phases made audit findings easier to close without reopening broad workflow implementation.
- Source/test verification plus explicit `human_needed` gates kept live-provider evidence gaps from being hidden.

### What Was Inefficient

- Phase status drifted: ROADMAP and REQUIREMENTS still had pending/in-progress wording after implementation artifacts were complete.
- Live OpenAI/browser evidence remained scattered across UAT, VERIFICATION, audit, and quick-task artifacts.
- `PROV-03` exposed a wording/product-language mismatch late in the close process.
- Open quick-task records reported missing directories even though corresponding quick-task entries existed in `STATE.md`.

### Patterns Established

- `provider` and `providerModel` are first-class routing/support fields on generation records.
- OpenAI continuation metadata must be persisted before worker execution and reconstructed during admin retry.
- Transparent-background OpenAI requests use opaque-first generation plus local post-processing, not direct transparent model output.
- Product-safe provider labels may differ from raw model identifiers, but requirements must spell out that abstraction.

### Key Lessons

1. Requirement wording should distinguish user-facing product labels from raw provider/model identifiers before implementation starts.
2. Live-provider evidence should be captured into one durable artifact as soon as a smoke test runs, otherwise closeout becomes audit archaeology.
3. Verification closure phases should also update ROADMAP and REQUIREMENTS traceability in the same change.
4. Accepted milestone exceptions need explicit next-milestone candidates, not only audit notes.

### Cost Observations

- Model mix: not recorded in local artifacts.
- Sessions: multiple phase and quick-task sessions from 2026-04-24 through 2026-05-04.
- Notable: automated milestone extraction created a useful baseline, but human editorial cleanup was required to avoid overlong accomplishment lists and stale in-progress wording.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multiple | 6 | Established GSD phase execution, audit, and gap-closure flow for the admin panel |
| v1.1 | multiple | 7 | Added parallel provider rollout discipline with explicit accepted evidence debt |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 62 API tests plus phase verification checks | 28/28 v1 requirements satisfied | AES-256-GCM crypto utility uses Node built-ins |
| v1.1 | 149+ API tests across targeted audit runs plus API/web type-checks | 15/17 satisfied, 2 accepted deferred/exception-scoped | Background-removal post-process uses existing Sharp pipeline |

### Top Lessons

1. Keep source-of-truth artifacts synchronized after verification or audit-driven changes.
2. Archive milestone context aggressively once shipped to keep active planning files small.
3. Record live-provider evidence immediately in phase artifacts, including request IDs and output metrics when relevant.
4. Treat product-language vs raw-model-language as an explicit requirements decision.
