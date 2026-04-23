# GPT Image 2 Notes For Precision Editing

Official sources checked on 2026-04-23:

- GPT Image Generation Models Prompting Guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- Image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
- ChatGPT Images 2.0 System Card: https://deploymentsafety.openai.com/chatgpt-images-2-0/

## Source Summary

- The official prompt guide emphasizes explicit invariants: describe what changes, what stays, and repeat the preserve list on each edit.
- Surgical edits should say not to alter saturation, contrast, layout, labels, camera angle, surrounding objects, and other non-target details.
- Responses API supports multi-turn editing by referencing previous response/image IDs. The image generation tool can use `action: "auto"`, `generate`, or `edit`.
- The image generation tool exposes `revised_prompt`, which is useful when debugging prompt drift.
- For text in images, quote exact text, require verbatim rendering, describe typography, and use `medium` or `high` quality for small or dense text.
- `gpt-image-2` does not support transparent backgrounds; route 누끼 to downstream background removal.
- Omit `input_fidelity` for `gpt-image-2`; the model processes image inputs at high fidelity automatically.
- The system card notes stronger realism and dense-text/detail capability, plus stricter image-specific safety layers. Avoid prompts that enable deceptive real-person imagery or policy-violating outputs.

## MockupAI Interpretation

- Partial edit prompts should be short, strict, and repetitive about invariants.
- Style copy should preserve the approved output's composition and treatment, while replacing only the named character/product/material.
- Regeneration should reuse stored inputs/options, not rewrite the user intent.
- Hardware preservation should be a first-class lock because product users often care about zipper/ring/buckle/patch details.
