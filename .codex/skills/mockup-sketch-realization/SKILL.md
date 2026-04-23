---
name: mockup-sketch-realization
description: "Use when Codex needs to design, review, or implement GPT Image 2 prompts for MockupAI sketch-to-real workflows: converting 2D sketches or drawings into photorealistic product mockups while preserving layout, proportions, perspective, character details, material references, product category constraints, background rules, and output quality. Trigger for sketch_to_real, 2D-to-3D realism, product render prompts, texture/material references, and OpenAI image prompt migration."
---

# Mockup Sketch Realization

Use this skill for the `sketch_to_real` workflow. The goal is to turn a designer sketch into a believable product mockup without letting the model reinterpret the design.

## Official Notes

Read `references/gpt-image-2-notes.md` when model/API assumptions matter, especially for sketch rendering, product mockups, sizing, quality, transparent background, or `input_fidelity`.

## Prompt Shape

Use this structure for image edits that start from a sketch:

```text
Task:
Edit Image 1 into a photorealistic product mockup.

Image roles:
- Image 1: designer sketch. Preserve exact layout, proportions, silhouette, character features, product shape, and perspective.
- Image 2, optional: material/texture reference. Apply only the material, texture, finish, and color behavior from this image.
- Image 3, optional: product shape reference. Use only for physical product construction guidance.

Product category:
[mug / tumbler / plate / keyring / grip holder / plush / cushion / figure / magnet / other]

Must preserve:
- All designed contours, face details, character proportions, handle/rim/base positions, and physical product structure from the sketch.
- Camera viewpoint and composition implied by the sketch.

Must add:
- Photorealistic product material, believable manufacturing detail, natural form shading, and clean studio presentation.
- Material behavior appropriate to the product: ceramic glaze, plastic, metal, transparent acrylic, plush fabric, embroidery, rubber, resin, or vinyl.

Hard constraints:
- Do not add new characters, text, logos, props, decorations, or background objects.
- Do not simplify facial features or change character proportions.
- Do not change the product category or physical construction.

Output:
- A clean product photograph/mockup suitable for design review.
```

## Material Guidance

- Ceramic: glaze, subtle reflections, rounded rim, weighty product thickness.
- Plastic/acrylic: molded edges, specular highlights, possible translucency if requested.
- Metal: sharper highlights, realistic brushed or polished finish.
- Plush/fabric: fiber texture, stitching, seam placement, soft compression, embroidery.
- Figure/resin/vinyl: molded forms, clean paint boundaries, controlled highlights.
- Transparent products: explicitly describe refraction, visible rear edges, internal highlights, and not "invisible glass."

## Project Defaults

- Prefer `quality: "medium"` for normal review assets and `quality: "high"` when facial details, small text, or material fidelity are critical.
- Use `quality: "low"` only for draft thumbnails or fast exploration.
- Prefer white opaque background for product review unless the user asks for a scene.
- Do not request transparent output from `gpt-image-2`; create a clean opaque background, then use downstream background removal.
- Omit `input_fidelity` for `gpt-image-2`; the model already treats image inputs as high fidelity.

## Failure Checks

Before shipping a prompt or implementation:

- The prompt says "preserve exact layout, proportions, and perspective."
- Optional texture references are constrained to material/finish only.
- The product category is explicit.
- The prompt includes "do not add new elements or text."
- For character products, face shape, eyes, mouth, silhouette, and proportions are locked.
