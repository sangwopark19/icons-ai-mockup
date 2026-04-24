# Endpoint Matrix For Existing Features

## Summary

Use Image API first for the existing async worker flow. Add Responses API where the OpenAI version needs iterative follow-ups.

## IP 변경

Recommended starting point: `client.images.edit()`

Why:

- Current worker flow is single-job, image-reference heavy, and not conversational.
- Official docs show Image API edits can use one or more input images as references.

Input shape:

- source product image
- character reference image
- optional extra references later if the UI expands

Notes:

- Use explicit `Must change` and `Must preserve` prompt sections.
- Keep output opaque; background removal happens later.

## 스케치 실사화

Recommended starting point: `client.images.edit()`

Why:

- The sketch is the anchor image.
- Optional texture/product references fit the Image API reference-image pattern.

Input shape:

- sketch image
- optional texture reference
- optional product-form reference

## 부분 수정

Two paths:

- one-shot edit -> `client.images.edit()`
- iterative user refinement -> `client.responses.create()` with `image_generation`

Use mask support when the UI eventually offers region selection. Official docs require mask/image size and format to match, and the mask must have an alpha channel.

## 스타일 복사

Recommended path: Responses API

Why:

- Gemini `thoughtSignature` does not exist in OpenAI.
- OpenAI officially supports multi-turn image editing with `previous_response_id` or prior image generation call IDs.

Implementation rule:

- Store the OpenAI response linkage from the approved generation.
- Reuse that linkage when the user asks for "same style, change only X."

## 동일 조건 재생성

Recommended path:

- Reuse the same provider, model, input assets, and prompt/options.
- Prefer fresh OpenAI requests rather than trying to imitate Gemini state carryover.

## Output count parity

Inference for product parity: because this app currently expects 2 results per generate action, the safest OpenAI implementation is two explicit requests or two explicit tool calls until you have verified the current `gpt-image-2` multi-output behavior you want in the live SDK/docs for your chosen endpoint.

## Provider-specific traps

- `gpt-image-2` does not support transparent backgrounds.
- `gpt-image-2` does not let you set `input_fidelity`.
- Responses API uses a mainline text model at the top level; `gpt-image-2` is not the value for the Responses `model` field.
