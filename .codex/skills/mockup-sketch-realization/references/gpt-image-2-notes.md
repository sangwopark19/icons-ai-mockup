# GPT Image 2 Notes For Sketch Realization

Official sources checked on 2026-04-23:

- GPT Image Generation Models Prompting Guide: https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- Image generation tool guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- GPT Image 2 model page: https://developers.openai.com/api/docs/models/gpt-image-2
- ChatGPT Images 2.0 System Card: https://deploymentsafety.openai.com/chatgpt-images-2-0/

## Source Summary

- The official GPT Image prompting guide covers `gpt-image-2` and says it is the preferred default for most production workflows.
- Drawing-to-image prompts should preserve exact layout, proportions, and perspective; add realistic materials and lighting consistent with the sketch; and say not to add new elements or text.
- Product mockup prompts should preserve geometry and label/text legibility; for `gpt-image-2`, keep background opaque and remove it downstream if transparency is needed.
- Prompt fundamentals: define the goal, input image roles, subject details, materials, composition, and constraints in a consistent order.
- For material/texture references, say exactly what to copy and what not to copy.
- `quality: "low"` is good for drafts; use `medium` or `high` for small details, dense text, close-up identity, and final outputs.
- `gpt-image-2` accepts flexible sizes within constraints; square images are usually fastest.
- `gpt-image-2` does not support transparent backgrounds and does not allow changing `input_fidelity`.

## MockupAI Interpretation

- Sketch realization should treat the sketch as a locked design spec.
- Preserve product category, silhouette, character face, proportions, handle/rim/base positions, and implied perspective.
- Add only manufacturing realism: material, surface finish, shadows/form shading, seams, molded edges, stitching, or glaze as appropriate.
- Do not let texture references introduce a new product shape, new character, new text, or unrelated scene.
