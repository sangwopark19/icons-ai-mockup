---
name: mockup-precision-edit
description: "Use when Codex needs to design, review, or implement GPT Image 2 prompts for MockupAI partial image editing, regeneration, style copy, or surgical changes: changing only color/material/position/hardware/IP/style while preserving every other product, background, viewpoint, text, label, character, and composition detail. Trigger for edit prompts, copy-style, regenerate with same inputs, precise product modifications, hardware preservation, and multi-turn OpenAI image workflows."
---

# Mockup Precision Edit

Use this skill when the user wants a small change to an existing result. The governing rule is: change only the requested target and lock everything else.

## Official Notes

Read `references/gpt-image-2-notes.md` when choosing Image API vs Responses API, using multi-turn editing, handling `action`, transparent background, sizing, or quality.

## Surgical Edit Prompt

```text
Task:
Edit the image by changing only [target area / object / property] to [requested change].

Must change:
- [Exact change, e.g. "change only the mug handle color to matte black"]

Must preserve exactly:
- Product body, geometry, crop, camera angle, perspective, material, lighting, and background.
- Character/IP silhouette, face, proportions, color boundaries, and placement.
- All hardware: zipper, ring, buckle, strap, button, patch, clasp, chain, seams, stitching.
- All text, labels, logos, and printed details not named in the change.
- Overall saturation, contrast, sharpness, and image quality.

Hard constraints:
- Do not add or remove objects.
- Do not restyle the image.
- Do not change surrounding areas.
- Do not change camera angle, layout, background, shadows, or product scale.
```

## Style Copy Prompt

Use this when the user likes a previous output and wants a new character/product while keeping the visual treatment:

```text
Task:
Edit Image 1 by preserving its composition, placement, product styling, viewpoint, lighting, background, and overall mockup treatment. Replace only [target] using Image 2.

Image roles:
- Image 1: approved style/result reference. Preserve layout, product angle, background, material treatment, shadow policy, and visual polish.
- Image 2: new character/product/material reference. Use only for the requested replacement.

Must change:
- [specific replacement]

Must preserve:
- Everything else from Image 1, including product geometry, camera viewpoint, background, hardware, labels, and non-target details.
```

## API Choice

- Use Image API for a single generate/edit request without conversation state.
- Use Responses API image generation tool for multi-turn editing, previous image references, or conversational refinement.
- For Responses API, set `action: "edit"` when an image is already in context and the user clearly asks to modify it. Use `action: "generate"` only when forcing a new image.
- Inspect `revised_prompt` when debugging why a generated image drifted from the app prompt.

## Precision Rules

- Repeat the preserve list on every follow-up edit. Do not rely on "same as before" alone.
- For text-in-image edits, quote exact text and require verbatim rendering with no extra characters.
- For material-only edits, explicitly preserve geometry, color regions not named, lighting direction, and product scale.
- For position-only edits, specify the movement in product-relative language: "move the character 8 percent left on the front face; keep size and rotation unchanged."
- For hardware edits, make a lock table or bullet list of every hardware item that must not move.

## Failure Checks

Before shipping:

- The change target is singular and unambiguous.
- The preserve list includes background, viewpoint, labels/text, hardware, and non-target character details.
- The prompt avoids broad style language unless style is the requested target.
- Transparent-background requests are routed to downstream removal instead of `background: "transparent"` for `gpt-image-2`.
- Safety-sensitive edits involving real people, political figures, minors, sexual content, or deceptive realism are not enabled by the prompt.
