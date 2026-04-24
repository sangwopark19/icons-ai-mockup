# MockupAI Feature Matrix For OpenAI Version

## 1. IP 변경

Goal:

- Replace only the character/IP artwork.
- Preserve the product body and all non-target construction.

Recommended API:

- Start with Image API edit.

Prompt skeleton:

```text
Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Image roles:
- Image 1: source product photo. Preserve body, viewpoint, crop, material, hardware, labels, and lighting.
- Image 2: new character IP reference. Preserve silhouette, face, proportions, colors, and recognizable details.

Must change:
- Replace only the character/IP artwork on the product.

Must preserve:
- Product geometry, perspective, crop, hardware, seams, labels, and non-character details.
- Requested background rule.

Hard constraints:
- No extra characters, no extra text, no props, no redesign of the product body.
```

## 2. 스케치 실사화

Goal:

- Turn the sketch into a believable product mockup without reinterpreting the design.

Recommended API:

- Start with Image API edit.

Prompt skeleton:

```text
Task:
Edit Image 1 into a photorealistic product mockup.

Image roles:
- Image 1: designer sketch. Preserve exact layout, proportions, silhouette, face details, and perspective.
- Image 2, optional: material reference. Use only for texture/finish/material behavior.

Must preserve:
- Product construction and designed details.

Must add:
- Realistic material, manufacturing detail, and grounded lighting.
```

## 3. 부분 수정

Goal:

- Only the requested target changes.

Recommended API:

- One-shot -> Image API
- Follow-up refinement -> Responses API

Prompt skeleton:

```text
Task:
Edit the image by changing only [target] to [requested change].

Must preserve exactly:
- Product body, camera angle, crop, background, lighting, text, labels, hardware, and non-target character details.

Hard constraints:
- Do not restyle the image.
- Do not add or remove objects.
```

## 4. 스타일 복사

Goal:

- Keep composition and polish from an approved output, then swap only the named target.

Recommended API:

- Responses API with previous response linkage.

Prompt skeleton:

```text
Task:
Preserve Image 1's composition, viewpoint, lighting, background, and product treatment. Replace only [target] using Image 2.
```

## 5. 동일 조건 재생성

Goal:

- Same inputs and settings, new candidate outputs.

Rule:

- Reuse stored provider, prompt, options, and input assets.
- Do not silently switch provider or endpoint.
