---
phase: 07
slug: provider-foundation-and-key-separation
status: blocked
threats_open: 3
asvs_level: 1
created: 2026-04-24
---

# Phase 07 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser to API | Authenticated users submit generation and copy-style requests. | Project IDs, provider/model values, image path references, prompts, generation options |
| API to Database | API services persist provider lineage, prompt metadata, generated image records, and encrypted API keys. | Generation metadata, `promptData`, `options`, `providerTrace`, encrypted API keys |
| API to Queue | Generation services enqueue worker jobs. | `GenerationJobData` with provider/providerModel copies and file path references |
| Queue to Worker | Worker validates queued lineage against the persisted generation before runtime dispatch. | Job payload, persisted generation provider/model, image file paths |
| Worker to Upload Storage | Worker and edit routes read uploaded/generated files from local storage. | Relative file paths and image bytes |
| Admin UI to Admin API | Admin surfaces manage provider-scoped API keys and generation monitoring. | Masked key metadata, provider/model support identifiers, failure details |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-07-01 | Tampering / Information Disclosure | Generation image path ingestion and worker file reads | mitigate | Require ownership/boundary validation or DB-owned upload IDs before paths are persisted and read. Current code still accepts raw path strings and passes them to `uploadService.readFile()`. | open |
| T-07-02 | Tampering / Authorization | Generated image selection | mitigate | `selectImage()` checks `{ id: imageId, generationId }` inside a transaction before clearing and setting selection. | closed |
| T-07-03 | Availability / Integrity | OpenAI unsupported runtime guard | mitigate | Worker validates provider/model lineage and throws the OpenAI unsupported-runtime error before key lookup, status transition, or file reads. | closed |
| T-07-04 | Integrity | Admin retry provider/input preservation | mitigate | Admin retry requeues saved provider/model, style reference, prompt, paths, and generation options. | closed |
| T-07-05 | Integrity | Provider/model mismatch | mitigate | Service rejects provider/model pair mismatches and worker compares queued providerModel to the persisted generation providerModel. | closed |
| T-07-06 | Elevation of Privilege / Integrity | Provider-scoped active API key exclusivity | mitigate | Application transaction scopes activation by provider, but no database uniqueness constraint prevents concurrent double-active rows. | open |
| T-07-07 | Information Disclosure | `providerTrace` in shared/client-facing schema | mitigate | Current admin/web generation payloads omit `providerTrace`, but exported shared `GenerationSchema` still includes the backend-only trace field. | open |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-07-01 | `apps/api/src/routes/generation.routes.ts:13` accepts `sourceImagePath`, `characterImagePath`, and `textureImagePath` as strings; `apps/api/src/services/generation.service.ts:120` persists those values and `apps/api/src/services/generation.service.ts:143` enqueues them; `apps/api/src/worker.ts:87` reads queued paths; `apps/api/src/services/upload.service.ts:231` only joins `baseDir` and the caller-provided relative path. |
| T-07-02 | `apps/api/src/services/generation.service.ts:204` loads the user-owned generation, then `apps/api/src/services/generation.service.ts:209` wraps selection in a transaction and checks `id` plus `generationId` before update. |
| T-07-03 | `apps/api/src/worker.ts:61` validates queued provider, `apps/api/src/worker.ts:65` validates queued providerModel, and `apps/api/src/worker.ts:72` rejects OpenAI before `getActiveApiKey()` at `apps/api/src/worker.ts:77`. |
| T-07-04 | `apps/api/src/services/admin.service.ts:456` requeues the failed generation with saved provider, providerModel, styleReferenceId, promptData paths, `userPrompt`, and options. |
| T-07-05 | `apps/api/src/services/generation.service.ts:57` resolves and validates provider/model pairs; `apps/api/src/worker.ts:65` fails jobs whose queued providerModel differs from the DB record. |
| T-07-06 | `apps/api/src/services/admin.service.ts:685` deactivates and activates keys inside a provider-scoped transaction, but `apps/api/prisma/schema.prisma:247` only declares indexes and not a unique active-key constraint. |
| T-07-07 | `apps/api/src/services/admin.service.ts:403`, `apps/web/src/lib/api.ts:358`, and `apps/web/src/components/admin/generation-detail-modal.tsx:56` keep current admin payloads/UI trace-safe; `packages/shared/src/types/index.ts:132` still exports `providerTrace` in `GenerationSchema`. |

---

## Accepted Risks Log

No accepted risks.

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-24 | 7 | 4 | 3 | Codex gsd-secure-phase |

---

## Security Audit 2026-04-24

| Metric | Count |
|--------|-------|
| Threats found | 7 |
| Closed | 4 |
| Open | 3 |

## Blocking Follow-Up

Phase advancement is security-blocked until `threats_open: 0`.

| Threat ID | Required Closure |
|-----------|------------------|
| T-07-01 | Validate submitted image paths against authenticated user/project ownership before persisting/enqueueing, or replace path inputs with DB-owned upload/image IDs. |
| T-07-06 | Add a database-level constraint or migration strategy that enforces one active API key per provider, or explicitly document this as an accepted risk. |
| T-07-07 | Split internal persisted generation schema from client-safe generation response schema, remove `providerTrace` from exported client-facing schema, or explicitly document this as an accepted risk. |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [ ] `threats_open: 0` confirmed
- [ ] `status: verified` set in frontmatter

**Approval:** pending
