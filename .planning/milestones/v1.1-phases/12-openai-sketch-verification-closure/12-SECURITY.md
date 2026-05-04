---
phase: 12
slug: openai-sketch-verification-closure
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-30
---

# Phase 12 — Security

Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Source/smoke evidence -> planning artifact | Runtime, browser, smoke, and test evidence is summarized into committed markdown. | Request IDs, command status, relative artifact paths, requirement status, derived metrics |
| OpenAI request IDs -> public repo docs | Vendor identifiers may be useful for support but must not include secrets, raw responses, or raw image payloads. | Request IDs and sanitized provider/debug metadata |
| Human visual/live evidence -> requirement status | Missing final alpha/composite evidence must not be converted into a passed requirement. | Requirement status and transparent-output metrics |
| Existing audit artifact -> new closure evidence | Historical audit findings are superseded by deterministic follow-up proof, not silently edited. | Audit status, orphan closure proof, command results |
| Browser/deployment evidence -> requirement status | Current-branch proof must be separated from stale runtime targets. | Docker/source evidence versus stale deployment references |

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-12-01 | Information Disclosure | `09-VERIFICATION.md` | mitigate | Store only request IDs, sanitized relative output paths, status, and derived metrics; reject inline image payload, raw payload marker, and API-key-like marker leakage. | closed |
| T-12-02 | Tampering / Repudiation | OSR-03 requirement row | mitigate | Require `PARTIAL_WITH_MILESTONE_EXCEPTION` or `human_needed` unless final PNG alpha/composite metrics are present. | closed |
| T-12-03 | Tampering | GPT Image 2 transparency claim | mitigate | State that `background: "transparent"` and `input_fidelity` are not sent, and that transparency is post-processed. Verify source/tests where possible. | closed |
| T-12-04 | Spoofing / Repudiation | Browser evidence | mitigate | Cite current-branch Docker evidence from Phase 9 and explicitly reject stale Tailscale runtime evidence as current-branch proof. | closed |
| T-12-05 | Information Disclosure | `09-VERIFICATION.md`, `12-AUDIT-CHECK.md` | mitigate | Record command status, request IDs, relative output paths, and derived metrics only; reject inline image payload, raw payload marker, and API-key-like marker leakage. | closed |
| T-12-06 | Repudiation | Follow-up audit closure | mitigate | Create `12-AUDIT-CHECK.md` with a deterministic node fallback proving all four IDs exist in `09-VERIFICATION.md`. | closed |
| T-12-07 | Tampering / Repudiation | `OSR-03` closure status | mitigate | Node fallback fails if `OSR-03` is overclaimed as `SATISFIED` without `_WITH_EXCEPTION`; artifact must contain exception/human-needed status. | closed |
| T-12-08 | Spoofing | Browser/deployment evidence | mitigate | Audit evidence must distinguish current-branch Docker/source evidence from the stale `100.69.75.47:3000` runtime noted in Phase 9. | closed |

## Threat Verification

| Threat ID | Evidence |
|-----------|----------|
| T-12-01 | `09-VERIFICATION.md:91-92` records sanitized relative output paths and request IDs; `09-VERIFICATION.md:127-129` limits evidence to request IDs, sanitized paths, status, and derived metrics. Auditor marker scan passed with no raw image or API-key-like markers in the artifact. |
| T-12-02 | `09-VERIFICATION.md:94` marks `OSR-03` as `PARTIAL - human_needed`; `09-VERIFICATION.md:98` records `PARTIAL_WITH_MILESTONE_EXCEPTION` and `human_needed`; `09-VERIFICATION.md:113-120` lists the missing final alpha/composite evidence. |
| T-12-03 | `09-VERIFICATION.md:122-125` states the unsupported GPT Image 2 fields are not sent and transparency is post-processed. `openai-image.service.ts:224-232` sends Sketch through `images.edit` without those fields; `openai-image.service.test.ts:279-302` and `openai-image.service.test.ts:368-383` assert omission and opaque local-removal prompting; `worker.ts:696-701` calls `removeUniformLightBackground()` for OpenAI Sketch transparent requests; `background-removal.service.ts:274-305` performs local alpha post-processing and quality assertions. |
| T-12-04 | `09-VERIFICATION.md:14`, `09-VERIFICATION.md:29`, `09-VERIFICATION.md:55`, and `09-VERIFICATION.md:91` cite current-branch Docker/source evidence; `09-VERIFICATION.md:147` rejects stale Tailscale runtime evidence as current-branch proof. |
| T-12-05 | `09-VERIFICATION.md:127-129` and `12-AUDIT-CHECK.md:60-62` define sanitized evidence-only recording. Auditor marker scan passed across both artifacts with no raw image or API-key-like markers. |
| T-12-06 | `12-AUDIT-CHECK.md:21-35` contains the deterministic fallback proof and observed output proving `PROV-02`, `OSR-01`, `OSR-02`, and `OSR-03` exist in `09-VERIFICATION.md`. The fallback command was re-run and printed the expected coverage OK line. |
| T-12-07 | `12-AUDIT-CHECK.md:27-29` includes the overclaim guard; `12-AUDIT-CHECK.md:44-46` keeps `OSR-03` exception/human-needed scoped; `09-VERIFICATION.md:94` and `09-VERIFICATION.md:98` also prevent full-satisfaction overclaim. |
| T-12-08 | `12-AUDIT-CHECK.md:48-58` separates current workspace/source command evidence from the stale `100.69.75.47:3000` deployment target; `09-VERIFICATION.md:147` also rejects stale deployment evidence as current-branch proof. |

## Threat Flags

| Source | Result |
|--------|--------|
| `12-01-SUMMARY.md:103-105` | None; planning documentation only, no new endpoint, auth path, file access behavior, schema boundary, or runtime data flow. |
| `12-02-SUMMARY.md:109-111` | None; planning documentation only, no new network endpoint, auth path, file access behavior, schema boundary, or runtime data flow. |

## Unregistered Flags

None.

## Accepted Risks Log

No accepted risks.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-30 | 8 | 8 | 0 | Codex gsd-security-auditor |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-30
