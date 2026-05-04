# Phase 8 Smoke Checklist

## Automated Verification

Run these commands before marking Phase 8 complete:

```bash
pnpm --filter @mockup-ai/api test
pnpm --filter @mockup-ai/api type-check
pnpm --filter @mockup-ai/web type-check
```

Expected:

- API tests pass, including OpenAI image service forbidden-parameter tests.
- API type-check passes.
- Web type-check passes.

## Browser Verification

Check the authenticated product workflow at desktop and mobile widths:

- project page shows `IP 변경 v1` and `IP 변경 v2`
- v2 form defaults preserve structure, fixed viewpoint, and fixed background enabled
- v2 form exposes structure preservation, hardware preservation, fixed background, fixed viewpoint, shadow removal, user instructions, quality, and two-candidate generation controls; it does not expose transparent-background or 누끼 controls
- result page shows `v2`, two candidates, save, download, and disabled follow-ups
- history shows `v2` badge and reopens the result page
- no product screen visibly shows `OpenAI`, `Gemini`, `GPT Image 2`, or `gpt-image-2`

## Real OpenAI Smoke

Prerequisites:

- `OPENAI_API_KEY`
- one source product image
- one character reference image

Suggested command:

```bash
.codex/skills/mockup-openai-cli-smoke/scripts/images-edit.sh \
  --prompt "Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2. Preserve product geometry, camera viewpoint, material, hardware, labels, and non-target areas." \
  --image /path/to/source-product.png \
  --image /path/to/character-reference.png \
  --out /tmp/mockupai-phase8-openai-ip-change.png \
  --quality medium
```

Forbidden-parameter checklist:

- `background: "transparent"` not sent
- `input_fidelity` not sent
- request IDs captured
- output file path recorded

## Evidence To Record

- automated command results
- browser viewport notes for project page, v2 form, result page, and history
- real smoke request ID, if run
- source image path and character image path, if real smoke is run
- output image path, if real smoke is run
- selected quality value
- confirmation that `background: "transparent"` was not sent
- confirmation that `input_fidelity` was not sent
