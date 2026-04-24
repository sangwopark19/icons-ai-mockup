# OpenAI Official Source Map For MockupAI

Checked on 2026-04-23.

## Primary sources

- GPT Image 2 model page  
  https://developers.openai.com/api/docs/models/gpt-image-2
  - `gpt-image-2` is the state-of-the-art image generation/editing model.
  - Endpoints listed include `v1/images/generations`, `v1/images/edits`, and `v1/responses`.
  - Current snapshot listed: `gpt-image-2-2026-04-21`.
  - Rate limits are provider-tier dependent; Tier 1 shows 5 IPM.

- Image generation guide  
  https://developers.openai.com/api/docs/guides/image-generation
  - Responses API is for conversations and multi-step flows.
  - Image API is for straightforward generation/editing.
  - Image edits can use one or more reference images.
  - Masks require same format/size as the edited image and an alpha channel.
  - `gpt-image-2` always uses high-fidelity image input; omit `input_fidelity`.
  - `gpt-image-2` does not support transparent backgrounds.
  - Flexible sizes are allowed if they satisfy the documented constraints.

- Image generation tool guide  
  https://developers.openai.com/api/docs/guides/tools-image-generation
  - Responses tool uses GPT Image models internally, including `gpt-image-2`.
  - In Responses API, the top-level `model` must be a text-capable mainline model such as `gpt-5.4`; `gpt-image-2` is not a valid `model` value there.
  - `action` can be `auto`, `generate`, or `edit`.
  - `revised_prompt` is available on image generation calls.
  - Multi-turn editing can use `previous_response_id` or returned image generation call IDs.
  - Partial image streaming is supported with `partial_images`.

- OpenAI Node SDK  
  https://github.com/openai/openai-node
  - Official JS/TS library for this repo's stack.
  - Supports `maxRetries`, `timeout`, request IDs, file uploads, and raw response access.

- GPT Image 1.5 Prompting Guide Cookbook  
  https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide
  - The official GPT Image 2-specific cookbook was not surfaced in docs search on 2026-04-23.
  - The 1.5 guide remains the best official prompting playbook for structure, invariants, multi-image indexing, and edit phrasing.

- ChatGPT Images 2.0 System Card  
  https://deploymentsafety.openai.com/chatgpt-images-2-0
  - Highlights stronger realism, denser text/detail, and stricter image safety monitoring.
  - Treat sensitive real-person/deepfake-like edits as higher risk.

## Practical conclusions for this repo

- Build OpenAI as a second provider, not a migration.
- Use Image API for the current single-job worker flow first.
- Use Responses API only where the user experience truly needs iterative follow-ups or conversational edits.
- Keep transparent background as a product feature, but implement it after OpenAI generation.
- Do not port Gemini `thoughtSignature`; use OpenAI response linkage instead.

## CLI note

Inference from official docs search: no separate "OpenAI Images CLI" product surfaced as the recommended path for image work. The official command-line interfaces shown in docs are curl examples, plus the official Node/Python SDKs.
