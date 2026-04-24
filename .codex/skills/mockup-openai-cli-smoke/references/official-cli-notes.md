# Official CLI Notes For GPT Image 2 In This Repo

Checked on 2026-04-23.

## What counts as "official CLI" here

The official OpenAI image docs surfaced:

- curl examples for Image API edits
- official Node SDK examples
- official Python SDK examples

I did not find a separate dedicated OpenAI image CLI product page in the current official docs search results. Treat that as an evidence-based absence, not a guaranteed non-existence.

## Recommended operator stack

- quick smoke tests -> curl + jq + base64
- repo-aligned scripted checks -> Node SDK script

## Officially documented behaviors to preserve

- `gpt-image-2` does not support transparent backgrounds
- `gpt-image-2` image inputs are always high fidelity
- Responses image generation uses a mainline text model at the top level
- Image API supports reference-image edits and masks
- request IDs are available and should be logged

## When to use which script

- `images-generate.sh`: sanity-check plain generation
- `images-edit.sh`: sanity-check edit/reference-image flow
- `responses-image.mjs`: sanity-check iterative OpenAI-only follow-up behavior

## Prerequisites

- `curl`
- `jq`
- `base64`
- Node 22+
- `OPENAI_API_KEY`

For the Node script, install the SDK in `apps/api` before real use:

```bash
pnpm --filter @mockup-ai/api add openai
```
