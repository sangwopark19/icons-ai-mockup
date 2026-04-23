# Phase 7: Provider Foundation and Key Separation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 07-provider-foundation-and-key-separation
**Areas discussed:** Existing data transition, API key management UI, OpenAI trace metadata storage, Worker routing safeguards

---

## Gray Area Selection

The user selected the following areas for discussion:

| Area | Selected |
|------|----------|
| Existing data transition | Yes |
| API key management UI | Yes |
| OpenAI trace metadata storage | Yes |
| Worker routing safeguards | Yes |
| Admin operational visibility | Not selected as separate area; covered under trace metadata |

---

## Existing Data Transition

### Existing record backfill

| Option | Description | Selected |
|--------|-------------|----------|
| Backfill all existing `Generation` and `ApiKey` records as `gemini` | Current production data is operationally Gemini data; safest provider-aware migration path. | Yes |
| Backfill only `Generation`, require admins to reclassify API keys | More conservative but can break current active Gemini key behavior. | |
| Agent discretion | Planner decides migration details. | |

**User's choice:** Backfill all existing `Generation` and `ApiKey` records as `gemini`.
**Notes:** Existing API keys are currently Gemini keys and should keep working after provider separation.

### `providerModel` policy

| Option | Description | Selected |
|--------|-------------|----------|
| Required field | Backfill Gemini as `gemini-3-pro-image-preview`; store OpenAI model/snapshot/alias when used. | Yes |
| Optional field | Easier migration but can leave records with provider and no model. | |
| Trace JSON only | Less schema growth but weaker admin/history/query support. | |
| Agent discretion | Planner decides. | |

**User's choice:** `providerModel` is required.
**Notes:** Current Gemini service model is `gemini-3-pro-image-preview`.

---

## API Key Management UI

### Page structure

| Option | Description | Selected |
|--------|-------------|----------|
| Provider tabs: `Gemini` / `OpenAI` | Reuses existing table pattern and makes provider-specific active keys clear. | Yes |
| Single table with provider column/filter | Compact but may imply one global active key. | |
| Two vertical sections on one page | Easy comparison but can become long and less mobile-friendly. | |
| Agent discretion | Planner decides. | |

**User's choice:** Provider tabs: `Gemini` / `OpenAI`.
**Notes:** Each tab should manage that provider's keys independently.

### Key lifecycle rules

| Option | Description | Selected |
|--------|-------------|----------|
| Apply Phase 4 rules per provider | One active key per provider, active key deletion blocked, activation confirmation, toast feedback, per-provider call count/last used. | Yes |
| Relax rules for OpenAI | Simpler during experiments but increases operational risk. | |
| Multiple active keys selected by runtime | Useful for future rotation but too broad for Phase 7. | |
| Agent discretion | Planner decides. | |

**User's choice:** Apply Phase 4 rules per provider.
**Notes:** Gemini and OpenAI active states must be independent.

---

## OpenAI Trace Metadata Storage

### Storage shape

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated core fields plus `providerTrace` JSON | First-class provider/model and OpenAI support identifiers, with flexible extra metadata storage. | Yes |
| `providerTrace` JSON only | Fewer columns but weaker operational visibility. | |
| Dedicated columns for every OpenAI trace field | Easy query/display but high schema churn risk. | |
| Agent discretion | Planner decides. | |

**User's choice:** Dedicated core fields plus `providerTrace` JSON.
**Notes:** Dedicated fields discussed: `openaiRequestId`, `openaiResponseId`, `openaiImageCallId`, `openaiRevisedPrompt`.

### Admin/debug exposure

| Option | Description | Selected |
|--------|-------------|----------|
| Operational identifiers only | Show provider/model, request ID, response ID, image call ID, revised prompt summary/collapsible area; hide secrets/raw payloads. | Yes |
| Full raw trace JSON in UI | Faster debugging but exposes too much data. | |
| Provider/model only | Clean UI but too weak for support/debug requirements. | |
| Agent discretion | Planner decides. | |

**User's choice:** Operational identifiers only.
**Notes:** Raw API keys, uploaded image bytes/base64, and full vendor response bodies must not be exposed in UI.

---

## Worker Routing Safeguards

### Missing/unknown provider policy

| Option | Description | Selected |
|--------|-------------|----------|
| Fail fast | Missing/unknown provider or provider key records failure with clear error; no implicit fallback. | Yes |
| Treat missing provider as Gemini, fail unknown only | Easier compatibility but can hide new provider bugs. | |
| Lookup DB provider to patch missing payload provider | Safer than fallback but complicates payload/DB mismatch policy. | |
| Agent discretion | Planner decides. | |

**User's choice:** Fail fast.
**Notes:** OpenAI jobs must never silently enter Gemini code paths, and Gemini jobs must never silently enter OpenAI code paths.

### Provider source of truth

| Option | Description | Selected |
|--------|-------------|----------|
| DB `Generation.provider` is source of truth, queue payload has required copy | Worker compares payload provider to DB provider and fails on mismatch; retry reads DB provider. | Yes |
| Queue payload only | Simple but drift-prone for retry/manual queue operations. | |
| DB only, no provider in payload | Avoids drift but weakens queue inspection and payload-level routing. | |
| Agent discretion | Planner decides. | |

**User's choice:** DB `Generation.provider` is source of truth, queue payload has required copy.
**Notes:** Admin retry should requeue with the failed generation's original provider/model.

---

## the agent's Discretion

- Exact enum/type names for provider fields.
- Exact migration/backfill mechanics.
- Exact UI tab styling, badge style, and microcopy.
- Test file layout and mocking details.

## Deferred Ideas

None.
