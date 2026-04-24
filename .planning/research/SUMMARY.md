# Research Summary

**Milestone:** v1.1 OpenAI GPT Image 2 Dual Provider  
**Summarized:** 2026-04-23

## Stack additions

- Add official `openai` Node SDK to `apps/api`
- Keep existing monorepo runtime, BullMQ, Sharp, and file storage
- Add `openai-image.service.ts` beside `gemini.service.ts`
- Extend Prisma and shared types with first-class `provider`, `providerModel`, and `providerTrace`
- Make `ApiKey` provider-aware so Gemini and OpenAI each have their own active key

## Feature table stakes

- Keep the same product-family contract for OpenAI:
  - `IP 변경`
  - `스케치 실사화`
  - `부분 수정`
  - `스타일 복사`
  - `동일 조건 재생성`
- Preserve project/history lifecycle and 2-candidate generation behavior
- Keep provider-specific implementation details out of the UI
- Show provider/model clearly in result and history views

## Architecture direction

- Treat `provider` as a required dimension everywhere
- Route worker jobs by `provider -> mode -> service method`
- Use Image API first for current single-pass worker flows
- Add Responses API only where OpenAI iterative lineage is actually needed
- Keep follow-up actions pinned to the provider that created the source generation

## Watch Out For

- Global active API key pattern will break once OpenAI is added
- Current `edit`, `regenerate`, and `style copy` flows can drift back into Gemini unless provider is persisted
- `gpt-image-2` does not support direct transparent backgrounds
- Gemini `thoughtSignature` cannot be reused for OpenAI lineage
- OpenAI request IDs, response IDs, and revised prompts must be stored or logged for support/debugging

## Recommended roadmap shape

1. Provider/schema/admin foundation
2. OpenAI runtime wiring
3. OpenAI IP Change and Sketch to Real parity
4. OpenAI edit/regenerate/style copy follow-up flows
5. Provider-aware UX, history, and ops verification
