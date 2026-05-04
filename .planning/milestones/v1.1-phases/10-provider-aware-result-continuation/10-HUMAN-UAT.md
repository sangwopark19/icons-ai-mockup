---
status: partial
phase: 10-provider-aware-result-continuation
source: [10-VERIFICATION.md]
started: 2026-04-29T03:11:33Z
updated: 2026-04-29T03:11:33Z
---

# Phase 10 Human UAT

## Current Test

[awaiting human testing]

## Tests

### 1. Live OpenAI Partial Edit Smoke

expected: Existing result page partial edit sends `selectedImageId`, creates one OpenAI/gpt-image-2 edit result, and records OpenAI request/response/image-call metadata.

why_human: Requires a running app/API/DB stack, active DB-managed OpenAI key, a completed selected OpenAI result, and approved image content for transmission.

result: [pending]

### 2. Live OpenAI Style-Copy Smoke

expected: Dedicated style-copy page creates two OpenAI candidates from an approved OpenAI result and new target asset, records metadata, and never falls back to Gemini `thoughtSignature`.

why_human: Requires running stack, active OpenAI key/model access, completed selected OpenAI style reference, and approved target images.

result: [pending]

### 3. Authenticated Browser Walkthrough

expected: Result, history, regenerate, edit, and style-copy flows show v1/v2 product labels only and keep actions pinned to the source provider.

why_human: Requires authenticated runtime data and visual/user-flow interaction.

result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
