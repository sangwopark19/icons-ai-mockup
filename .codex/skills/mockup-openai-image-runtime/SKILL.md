---
name: mockup-openai-image-runtime
description: "Use when Codex needs to implement GPT Image 2 runtime support in this repo without removing Gemini: adding the OpenAI Node SDK, creating parallel image service files, wiring Fastify routes and BullMQ worker routing, handling file uploads and image references, choosing Image API vs Responses API, logging request IDs, and storing OpenAI-specific metadata safely."
---

# Mockup OpenAI Image Runtime

Use this skill for backend/runtime work that adds OpenAI beside Gemini.

## Read First

- `references/node-runtime.md`
- `references/endpoint-matrix.md`

## Runtime Rule

Prefer a separate `openai-image.service.ts` instead of mutating `gemini.service.ts` into a mixed provider blob.

## Implementation Path

1. Add the `openai` Node SDK to `apps/api`.
2. Extend config for `OPENAI_API_KEY` and optional logging knobs.
3. Add provider-aware API key management.
4. Add provider-aware queue payloads and worker dispatch.
5. Add a dedicated OpenAI image service with methods parallel to the Gemini service.
6. Persist OpenAI metadata needed for debugging and iterative edits.

## Endpoint Choice

- Use `client.images.edit()` or `client.images.generate()` for straightforward single-request jobs.
- Use `client.responses.create()` with the hosted `image_generation` tool for conversational or multi-turn refinement.
- For Responses API image generation, use a text-capable model like `gpt-5.4`; the tool itself uses GPT Image models and `gpt-image-2` is not a valid `model` value for the Responses API request.

## MockupAI Mapping

- `ip_change`: usually start with Image API `images.edit()` because the current worker job is single-pass and image-reference heavy.
- `sketch_to_real`: usually Image API `images.edit()` with the sketch as the anchor and optional texture/product references.
- `partial edit`: Image API if it is one-shot; Responses API if the user will iterate from the previous result.
- `style copy`: Responses API using `previous_response_id` or returned image generation call IDs, not Gemini `thoughtSignature`.

## Non-Negotiable OpenAI Constraints

- Omit `input_fidelity` for `gpt-image-2`.
- Do not send `background: "transparent"` for `gpt-image-2`.
- If you need transparent output, generate opaque first and use the existing background-removal pipeline afterwards.
- Log `_request_id` or raw request IDs for failed OpenAI calls.

## Debugging Rule

When an OpenAI image looks wrong, save or log:

- request ID
- provider
- model
- prompt
- revised prompt, if the Responses tool provided one
- OpenAI response ID
- image generation call ID, if available

That data should be stored or logged without mixing it into Gemini-only fields.
