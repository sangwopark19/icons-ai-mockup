# GPT Image 2 Notes For Mockup IP Change

Official sources checked on 2026-04-23:

- GPT Image Generation Models Prompting Guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- Image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
- ChatGPT Images 2.0 System Card: https://deploymentsafety.openai.com/chatgpt-images-2-0/

## Source Summary

- `gpt-image-2` is the recommended default for new high-quality production image generation/editing workflows, especially customer-facing assets, photorealism, text-heavy images, compositing, identity-sensitive edits, and workflows where fewer retries matter.
- Prompt fundamentals: use a consistent order, name the goal, describe input image roles, specify materials/composition, state what to change vs preserve, quote literal text, and iterate with small single-change follow-ups.
- Multi-image workflows should reference each input by index and description, then say how the inputs interact.
- For edits, explicitly say "change only X" and "keep everything else the same"; repeat key invariants on each iteration.
- The image generation tool works best with terms like `draw` or `edit`; for compositing, prefer "edit the first image by adding/replacing..." over "combine" or "merge".
- `gpt-image-2` supports flexible sizes within constraints. Common safe defaults: `1024x1024`, `1536x1024`, `1024x1536`, and `2048x2048`; outputs above 2K can be more variable.
- `quality: "low"` is useful for fast drafts; compare `medium` or `high` for dense text, close-up identity, final assets, and high-resolution outputs.
- `gpt-image-2` does not support `background: "transparent"`. Use opaque output and remove background downstream when the app needs 누끼.
- Omit `input_fidelity` for `gpt-image-2`; image inputs are processed at high fidelity by default.
- Image API fits single prompt generation/editing. Responses API fits multi-turn editable experiences, previous image references, and conversational refinements.

## MockupAI Interpretation

- IP replacement should be modeled as a high-fidelity edit, not a free generation.
- The prompt should lock product structure, viewpoint, material, hardware, background, non-target labels, and only replace character/IP artwork.
- Character references should lock silhouette, proportions, face details, color boundaries, and recognizable motifs.
- Use an opaque white product-review background by default. If the user selected transparent background, produce a clean opaque image first and invoke background removal/upscaling pipeline afterwards.
