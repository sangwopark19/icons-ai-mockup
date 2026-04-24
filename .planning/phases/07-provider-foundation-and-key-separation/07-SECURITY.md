---
phase: 07
slug: provider-foundation-and-key-separation
status: verified
threats_open: 0
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
| T-07-01 | Tampering / Information Disclosure | Generation image path ingestion and worker file reads | mitigate | Storage paths are normalized, traversal/absolute paths are rejected, create/retry paths verify authenticated user/project prefixes, and worker reads go through safe storage resolution. | closed |
| T-07-02 | Tampering / Authorization | Generated image selection | mitigate | `selectImage()` checks `{ id: imageId, generationId }` inside a transaction before clearing and setting selection. | closed |
| T-07-03 | Availability / Integrity | OpenAI unsupported runtime guard | mitigate | Worker validates provider/model lineage and throws the OpenAI unsupported-runtime error before key lookup, status transition, or file reads. | closed |
| T-07-04 | Integrity | Admin retry provider/input preservation | mitigate | Admin retry requeues saved provider/model, style reference, prompt, paths, and generation options. | closed |
| T-07-05 | Integrity | Provider/model mismatch | mitigate | Service rejects provider/model pair mismatches and worker compares queued providerModel to the persisted generation providerModel. | closed |
| T-07-06 | Elevation of Privilege / Integrity | Provider-scoped active API key exclusivity | mitigate | Application activation remains provider-scoped, and SQL migration `20260424093000_provider_foundation_security_constraints` adds a partial unique index for one active key per provider. | closed |
| T-07-07 | Information Disclosure | `providerTrace` in shared/client-facing schema | mitigate | Shared schemas now split `InternalGenerationSchema` from client-safe `GenerationSchema`; `providerTrace` stays internal-only. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Evidence

| Threat ID | Evidence |
|-----------|----------|
| T-07-01 | `apps/api/src/services/upload.service.ts:25` normalizes storage paths and rejects absolute/traversal input; `apps/api/src/services/generation.service.ts:58` checks allowed user/project prefixes and file existence before persistence/queueing; `apps/api/src/services/admin.service.ts:149` applies the same checks before retry requeue; `apps/api/src/services/upload.service.ts:287` resolves reads/deletes/filesystem checks under `baseDir`. |
| T-07-02 | `apps/api/src/services/generation.service.ts:256` loads the user-owned generation, then `apps/api/src/services/generation.service.ts:261` wraps selection in a transaction and checks `id` plus `generationId` before update. |
| T-07-03 | `apps/api/src/worker.ts:61` validates queued provider, `apps/api/src/worker.ts:65` validates queued providerModel, and `apps/api/src/worker.ts:72` rejects OpenAI before `getActiveApiKey()` at `apps/api/src/worker.ts:77`. |
| T-07-04 | `apps/api/src/services/admin.service.ts:486` requeues the failed generation with saved provider, providerModel, styleReferenceId, promptData paths, `userPrompt`, and options. |
| T-07-05 | `apps/api/src/services/generation.service.ts:103` resolves and validates provider/model pairs; `apps/api/src/worker.ts:65` fails jobs whose queued providerModel differs from the DB record. |
| T-07-06 | `apps/api/src/services/admin.service.ts:715` deactivates and activates keys inside a provider-scoped transaction; `apps/api/prisma/migrations/20260424093000_provider_foundation_security_constraints/migration.sql:27` cleans up duplicate active rows and `apps/api/prisma/migrations/20260424093000_provider_foundation_security_constraints/migration.sql:43` creates `api_keys_one_active_per_provider`. |
| T-07-07 | `apps/api/src/services/admin.service.ts:427`, `apps/web/src/lib/api.ts:358`, and `apps/web/src/components/admin/generation-detail-modal.tsx:56` keep current admin payloads/UI trace-safe; `packages/shared/src/types/index.ts:132` defines internal persisted generation data and `packages/shared/src/types/index.ts:156` omits `providerTrace` from client-safe `GenerationSchema`. |

---

## Accepted Risks Log

No accepted risks.

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-24 | 7 | 4 | 3 | Codex gsd-secure-phase |
| 2026-04-24 | 7 | 7 | 0 | Codex security fix |

---

## Security Audit 2026-04-24

| Metric | Count |
|--------|-------|
| Threats found | 7 |
| Closed | 7 |
| Open | 0 |

## Closure Notes

Phase 07 security gate is clear.

| Threat ID | Closure |
|-----------|------------------|
| T-07-01 | Implemented path normalization, prefix ownership checks, file existence checks, and storage read resolution under `baseDir`. |
| T-07-06 | Added idempotent SQL migration with duplicate-active cleanup and a partial unique index on active API keys by provider. |
| T-07-07 | Split internal/client-safe shared generation schemas so `providerTrace` is no longer part of exported client-safe `GenerationSchema`. |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-24
