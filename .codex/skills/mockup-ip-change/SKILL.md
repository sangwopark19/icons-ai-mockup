---
name: mockup-ip-change
description: "Use when Codex needs to design, review, or implement GPT Image 2 prompts for MockupAI character IP replacement: replacing a character graphic on an existing product while preserving product structure, camera angle, material, hardware, background rules, label/text fidelity, and character identity. Trigger for ip_change, character replacement, product mockup generation, OpenAI image prompt migration, multi-image product/character references, and prompt template work in this project."
---

# Mockup IP Change

Use this skill for the `ip_change` workflow in MockupAI. The job is not "make a similar product"; it is "edit the existing product so only the character IP changes."

## Official Notes

Read `references/gpt-image-2-notes.md` when model/API assumptions matter, especially for sizing, quality, transparent background, or whether to use Image API vs Responses API.

## Prompt Shape

Use a skimmable template. Keep the source image roles explicit:

```text
Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Image roles:
- Image 1: source product photo. Preserve the product body, camera angle, material, hardware, lighting, label placement, and product silhouette.
- Image 2: new character IP reference. Preserve this character's silhouette, proportions, facial features, colors, and recognizable details.

Must change:
- Replace the character/IP artwork on Image 1 with the character from Image 2.
- Integrate it as a real product decoration, print, patch, charm, figure, or surface treatment according to the source product.

Must preserve:
- Product geometry, dimensions, camera viewpoint, crop, perspective, material, and construction.
- Existing non-character text, labels, hardware, seams, zipper, ring, buckle, strap, button, and package details.
- Background rule: [plain white opaque / original background / requested background].

Hard constraints:
- Do not add extra characters, logos, watermark, text, props, accessories, or decorative effects.
- Do not redesign the product body.
- Do not change hardware color, position, size, or shape.
- Do not alter saturation, contrast, camera angle, or surrounding objects unless explicitly requested.

Output:
- Production-quality product mockup suitable for internal design review.
```

## Project Defaults

- Use `edit`, `draw`, or "edit Image 1..." wording. Avoid vague verbs like "combine" or "merge".
- Generate 2 variants for user choice when the app flow expects alternatives.
- Prefer `quality: "medium"` for normal review assets and `quality: "high"` for dense details, text, close-up characters, or final review.
- For fast ideation, allow `quality: "low"` only when the caller labels it as draft.
- Prefer square `1024x1024` or project-specific product aspect ratios. Use flexible `gpt-image-2` sizes only when the UI/output contract can store them.
- Do not request `background: "transparent"` with `gpt-image-2`; use a white/opaque background and a downstream background-removal step if the user asks for 누끼.
- Omit `input_fidelity` for `gpt-image-2`; it already processes image inputs at high fidelity.

## Option Mapping

- `preserveStructure`: Add "preserve product geometry, crop, viewpoint, proportions, and all physical construction exactly."
- `fixedViewpoint`: Add "same camera angle, lens feel, crop, and perspective as Image 1."
- `fixedBackground`: Add "plain pure white opaque background (#ffffff); no gradients, patterns, studio set, or environmental background."
- `removeShadows`: Add "remove cast shadows and drop shadows; keep only necessary form shading on the product."
- `preserveHardware`: Add a hardware lock list with item type, material, color, position, and size.
- `userInstructions`: Put these under a "Highest priority user instruction" section, but keep preservation constraints unless the user explicitly overrides them.

## Failure Checks

Before shipping a prompt or code change, check:

- The prompt names each input image by index and purpose.
- The prompt says what changes and what must not change.
- The target replacement surface is constrained: print, charm, patch, figurine, label, embossing, or product-specific placement.
- Transparent background is handled outside `gpt-image-2`.
- Safety-sensitive or public-figure/deepfake-like requests are not made easier by prompt wording.
