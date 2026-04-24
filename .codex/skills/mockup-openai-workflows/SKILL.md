---
name: mockup-openai-workflows
description: "Use when Codex needs to map MockupAI product features to the right OpenAI image workflow while Gemini remains in place: choosing the proper endpoint per feature, designing GPT Image 2 prompts for IP change, sketch-to-real, partial edit, style copy, and regeneration, and adapting official prompting guidance into this repo's product rules."
---

# Mockup OpenAI Workflows

Use this skill when the question is not "where do I put the code?" but "how should the OpenAI version behave for each existing feature?"

## Read First

- `references/workflow-matrix.md`
- `references/prompt-playbook.md`

## Workflow Rule

Preserve the current user intent and product contract. The OpenAI version should feel like the same feature family, not a different app.

## Feature Mapping

- `IP 변경`: lock product geometry and replace only the character/IP artwork.
- `스케치 실사화`: treat the sketch as a locked design spec and add manufacturing realism.
- `부분 수정`: change only the requested target; restate preserve constraints every time.
- `스타일 복사`: keep the approved output's composition and treatment, then replace only the named target.
- `동일 조건 재생성`: reuse the same inputs/options/provider, not a rewritten interpretation.

## Prompting Rules

- Name each input image by role and index.
- Separate `Must change` from `Must preserve`.
- Use product-specific locks: structure, viewpoint, hardware, labels, character face, and non-target areas.
- For edits, prefer `edit the first image...` wording over `merge` or `combine`.
- For text in images, quote literal text and require verbatim rendering.

## OpenAI-Specific Notes

- `gpt-image-2` handles image inputs at high fidelity automatically.
- Quality should be chosen intentionally: `low` for drafts, `medium` for normal review, `high` for fine detail or final review.
- Transparent background stays a product option, but the OpenAI generation step itself should remain opaque.

## Review Check

Before shipping any workflow design:

- The feature still matches current MockupAI inputs and outputs.
- The OpenAI path does not depend on Gemini-only primitives like `thoughtSignature`.
- The prompt states both the target change and the protected invariants.
- Provider-specific constraints are hidden inside the implementation, not pushed onto the user.
