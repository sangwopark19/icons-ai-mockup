# OpenAI Node Runtime Notes For This Repo

## Install

For the API app:

```bash
pnpm --filter @mockup-ai/api add openai
```

## Client pattern

Use the official Node SDK with explicit operational defaults when useful:

```ts
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 60_000,
});
```

Useful SDK features from the official repo:

- `_request_id` on responses
- `.withResponse()` for raw request IDs/headers
- `maxRetries`
- `timeout`
- `logLevel` or `OPENAI_LOG`
- `files.create({ purpose: "vision" })`

## Suggested file layout

- `apps/api/src/services/openai-image.service.ts`
- optional helper: `apps/api/src/services/openai-files.service.ts`

Keep the method names parallel to Gemini for easier worker dispatch:

- `generateIPChange()`
- `generateSketchToReal()`
- `generateEdit()`
- `generateWithStyleCopy()`

## Image API extraction pattern

The Image API returns base64 image payloads in `data[0].b64_json`.

Node edit pattern from official docs:

```ts
import fs from "fs";
import OpenAI, { toFile } from "openai";

const client = new OpenAI();
const rsp = await client.images.edit({
  model: "gpt-image-2",
  image: await toFile(fs.createReadStream("input.png"), null, { type: "image/png" }),
  prompt: "Edit the image...",
});

const imageBase64 = rsp.data[0].b64_json;
const imageBytes = Buffer.from(imageBase64, "base64");
```

## Responses API pattern

Use Responses API when the user will iterate on the same image or style across turns.

Top-level model should be a text-capable mainline model such as `gpt-5.4`:

```ts
const response = await client.responses.create({
  model: "gpt-5.4",
  input: "Edit the first image by ...",
  tools: [{ type: "image_generation", action: "edit", quality: "high" }],
});
```

Follow-up refinement:

```ts
const followup = await client.responses.create({
  model: "gpt-5.4",
  previous_response_id: response.id,
  input: "Keep everything else the same and only warm the lighting.",
  tools: [{ type: "image_generation", action: "edit" }],
});
```

## Logging guidance

For any failed or surprising result, log:

- `provider`
- `model`
- `_request_id`
- prompt
- response ID
- image generation call ID
- revised prompt, when present

Do not squeeze these fields into Gemini-specific `thoughtSignatures`.
