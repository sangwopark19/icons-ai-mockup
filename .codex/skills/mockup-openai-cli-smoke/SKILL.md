---
name: mockup-openai-cli-smoke
description: "Use when Codex needs command-line smoke tests or operator tooling for GPT Image 2 in this repo: official curl-based checks, Node SDK test scripts, request ID capture, quick validation of generate/edit flows, and local debugging for the new OpenAI version while Gemini remains available."
---

# Mockup OpenAI CLI Smoke

Use this skill for command-line validation and operational debugging of the OpenAI image path.

## Read First

- `references/official-cli-notes.md`

## Included Scripts

- `scripts/images-generate.sh`: single-shot generation via `/v1/images/generations`
- `scripts/images-edit.sh`: edit/reference-image test via `/v1/images/edits`
- `scripts/responses-image.mjs`: multi-turn or Responses-tool smoke test using the Node SDK

## Usage Rule

Use shell scripts for quick operator checks and CI-like smoke tests. Use the Node script when you need Responses API behavior such as follow-up edits or `previous_response_id`.

## Validation Checklist

- Verify the request produces an image file.
- Capture request IDs for any failure.
- Confirm `background: "transparent"` is not used with `gpt-image-2`.
- Confirm edit inputs and masks match required size/format rules.
- Keep provider/debug logs separate from Gemini runs.
