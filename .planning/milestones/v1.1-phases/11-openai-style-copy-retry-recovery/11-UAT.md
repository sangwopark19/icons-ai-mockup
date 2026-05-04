---
status: passed
phase: 11-openai-style-copy-retry-recovery
source:
  - .planning/phases/11-openai-style-copy-retry-recovery/11-01-SUMMARY.md
started: 2026-04-30T00:30:25Z
updated: 2026-04-30T02:31:12Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Admin Retry Requeues Complete OpenAI Style-Copy Metadata
expected: |
  When an admin retries a failed OpenAI style-copy generation whose persisted promptData contains provider, providerModel, styleReferenceId, copyTarget, and selectedImageId, the retry job is queued with those exact continuation fields. The retried generation should continue the original style-copy request for the selected target/image rather than dropping linkage metadata.
result: passed

## Tests

### 1. Admin Retry Requeues Complete OpenAI Style-Copy Metadata
expected: When an admin retries a failed OpenAI style-copy generation whose persisted promptData contains provider, providerModel, styleReferenceId, copyTarget, and selectedImageId, the retry job is queued with those exact continuation fields. The retried generation should continue the original style-copy request for the selected target/image rather than dropping linkage metadata.
result: [passed]

### 2. Invalid Stored copyTarget Is Guarded
expected: If stored promptData.copyTarget is not `ip-change` or `new-product`, admin retry does not enqueue the invalid copyTarget value. The retry payload omits that field instead of trusting malformed persisted data.
result: [passed]

### 3. Retried OpenAI Style-Copy Uses OpenAI Dispatch Only
expected: A complete admin-retried OpenAI style-copy job passes the worker stored/queued metadata guard, calls OpenAI linkage dispatch, and does not fall back to Gemini style-copy or image generation dispatch.
result: [passed]

### 4. Existing Provider-Specific Retry Behavior Remains Unchanged
expected: Existing Gemini retry and non-style-copy OpenAI retry flows still queue their provider-specific payloads correctly, without new copyTarget/selectedImageId side effects.
result: [passed]

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
