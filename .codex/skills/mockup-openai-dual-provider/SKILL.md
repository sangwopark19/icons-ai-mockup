---
name: mockup-openai-dual-provider
description: "Use when Codex needs to design or implement a dual-provider rollout in this repo: keep the existing Gemini image features and menus intact, then add matching GPT Image 2 versions beside them. Trigger for provider split design, parallel menu/UI work, schema changes for provider/model tracking, admin API key separation, history badges, worker routing, and any request to add OpenAI without replacing Gemini."
---

# Mockup OpenAI Dual Provider

Use this skill when the user wants `기존 기능 유지 + OpenAI 버전 추가`. Do not plan a migration. Plan a parallel provider architecture.

## Read First

- `references/official-source-map.md`
- `references/project-rollout.md`

## Core Rule

Preserve the current Gemini path as the legacy/default experience. Add OpenAI as a second provider with the same product surface:

- `IP 변경`
- `스케치 실사화`
- `부분 수정`
- `스타일 복사`
- `동일 조건 재생성`

## Architecture Rules

- Add a first-class `provider` dimension (`gemini` | `openai`) instead of branching with ad hoc booleans.
- Track `model` per generation so history, debugging, and support can tell which runtime produced an image.
- Keep Gemini service files and worker logic intact; add parallel OpenAI service/runtime files.
- Keep user-visible options aligned across providers, but allow provider-specific implementation behind the scenes.
- Keep OpenAI request metadata separate: request IDs, response IDs, image generation call IDs, and revised prompts.

## Project Guidance

Use the existing code layout as the integration spine:

- `apps/web/src/app/projects/[id]/page.tsx`: add parallel entry points beside current menus.
- `apps/web/src/app/projects/[id]/ip-change/page.tsx`
- `apps/web/src/app/projects/[id]/sketch-to-real/page.tsx`
- `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- `apps/web/src/lib/api.ts`: carry `provider` through request payloads and typed responses.
- `apps/api/prisma/schema.prisma`: persist provider/model/request metadata.
- `apps/api/src/routes/generation.routes.ts`
- `apps/api/src/routes/edit.routes.ts`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/worker.ts`
- `apps/api/src/services/generation.service.ts`
- `apps/api/src/services/admin.service.ts`

## UI Rules

- Do not hide or rename the current Gemini menu unless the user explicitly asks.
- Add the OpenAI path as an adjacent version, not a replacement.
- Make provider choice obvious in the UI and history. Use a clear badge or label such as `Gemini` and `OpenAI GPT Image 2`.
- Keep the form fields the same unless a provider-specific option truly needs different copy.
- Keep transparent background as a UI option for parity, but route OpenAI requests through opaque generation plus downstream background removal.

## Data Rules

- `Generation` should store at least `provider`, `model`, and OpenAI-specific debug identifiers.
- `ApiKey` should be provider-scoped. Do not keep one global "active key" shared by Gemini and OpenAI.
- Queue payloads should include `provider`.
- History cards and admin screens should expose provider/model metadata for debugging and support.

## Rollout Checks

Before finishing a dual-provider change, verify:

- Gemini pages still work untouched.
- OpenAI pages are reachable from the same project context.
- API keys can be activated independently per provider.
- Worker routing cannot send an OpenAI job into Gemini code or the reverse.
- History clearly shows which provider created each result.
