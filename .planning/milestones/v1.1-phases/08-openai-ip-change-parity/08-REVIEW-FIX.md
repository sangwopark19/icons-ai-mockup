---
phase: 08-openai-ip-change-parity
source: 08-REVIEW.md
status: fixed
fixed_commit: 8915d60
fixed_at: 2026-04-27T02:28:54Z
---

# Phase 08 Code Review Fix Summary

## Fixed Findings

- **CR-01:** Added route-level Zod `superRefine` validation and service-level defensive validation so unsupported provider/mode combinations and incomplete mode inputs are rejected before generation records are created or jobs are queued.
- **CR-02:** Removed the unsupported transparent-background option from the OpenAI v2 IP Change UI and added backend guards rejecting OpenAI transparent-background requests until a real removal pipeline is wired.

## Current PR Review Follow-up

- Added backend source-of-truth rejection for OpenAI v2 regenerate requests so direct API callers cannot bypass the disabled result-page controls.
- Added route and service validation that OpenAI v2 `outputCount` must remain exactly `2`.
- Switched OpenAI v2 candidate generation to a single `images.edit` request with `n: 2`, so the two-candidate contract matches one external API request.
- Moved create-generation request validation onto route-local `safeParse` so custom validation messages are returned directly and invalid requests never reach `generationService.create`.
- Updated Phase 8 planning/verification notes to match the current OpenAI request policy.

## Verification

- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts` - failed before implementation with 3 expected regression failures.
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts` - passed, 10 tests.
- `pnpm --filter @mockup-ai/api test` - passed, 85 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- `pnpm --filter @mockup-ai/web type-check` - passed.
- `pnpm --filter @mockup-ai/api test -- src/services/__tests__/generation.service.test.ts src/services/__tests__/openai-image.service.test.ts` - passed, 16 tests.
- `pnpm --filter @mockup-ai/api test` - passed, 87 tests.
- `pnpm --filter @mockup-ai/api type-check` - passed.
- `pnpm --filter @mockup-ai/web type-check` - passed.
- `pnpm type-check` - passed, 3 packages successful.
- `pnpm --filter @mockup-ai/api test -- src/routes/__tests__/generation.routes.test.ts` - passed, 1 test.
- `pnpm --filter @mockup-ai/api type-check` - passed.
