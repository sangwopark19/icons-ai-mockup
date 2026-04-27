# OpenAI GPT Image 2 Skill Guardrails

## Purpose

This file is the mandatory skill-use checklist for the v1.1 OpenAI GPT Image 2 Dual Provider milestone. GSD planning, execution, review, and verification work for OpenAI phases must use the relevant `.codex/skills/mockup-*` skills listed here before changing implementation details.

These guardrails do not replace phase context. When a phase context contains a more specific user decision, the phase context wins. Example: Phase 8 user-facing labels must be `v1`/`v2`, even though generic provider guidance may mention `Gemini`/`OpenAI` badges.

## Always-Read Skills For OpenAI Phases

Every OpenAI-related phase must read these first:

- `.codex/skills/mockup-openai-dual-provider/SKILL.md` - keep Gemini intact and add OpenAI beside it as a parallel provider.
- `.codex/skills/mockup-openai-workflows/SKILL.md` - map the product workflow to the correct OpenAI image behavior.
- `.codex/skills/mockup-openai-image-runtime/SKILL.md` - add OpenAI runtime support without mixing it into Gemini service code.

Every phase that designs, edits, reviews, or verifies prompts must also read the workflow-specific prompting skill and prompting references from the matrices below.

Every phase that changes or validates real OpenAI calls must also read:

- `.codex/skills/mockup-openai-cli-smoke/SKILL.md` - command-line smoke tests, request ID capture, and runtime debugging.

## Phase Skill Matrix

| Phase | Required skills | Why |
|---|---|---|
| Phase 7: Provider Foundation and Key Separation | `mockup-openai-dual-provider`, `mockup-openai-image-runtime` | Provider/model schema, API key separation, queue routing, worker guardrails, OpenAI metadata fields. |
| Phase 8: OpenAI IP Change Parity | `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-ip-change`, `mockup-openai-cli-smoke` | Parallel v2 entry, Image API edit runtime, two-candidate IP replacement prompt, OpenAI trace capture, smoke validation. |
| Phase 9: OpenAI Sketch to Real Parity | `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-sketch-realization`, `mockup-openai-cli-smoke` | Parallel Sketch to Real v2 entry, sketch-preservation prompt, optional texture/material references, opaque-first background handling, smoke validation. |
| Phase 10: Provider-Aware Result Continuation | `mockup-openai-dual-provider`, `mockup-openai-workflows`, `mockup-openai-image-runtime`, `mockup-precision-edit`, `mockup-openai-cli-smoke` | Provider-pinned regenerate/edit/style-copy, Responses API lineage where needed, precise edit prompts, no Gemini `thoughtSignature` reuse for OpenAI. |

## Prompting Skill Inventory

| Skill | Prompting responsibility | Required references |
|---|---|---|
| `mockup-openai-workflows` | Cross-feature prompt behavior, endpoint choice, and product-level preservation rules. | `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md` |
| `mockup-ip-change` | `IP 변경` prompt template and option mapping for source product + character reference edits. | `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md` |
| `mockup-sketch-realization` | `스케치 실사화` prompt template, material reference constraints, and sketch preservation rules. | `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md` |
| `mockup-precision-edit` | `부분 수정`, `스타일 복사`, and `동일 조건 재생성` prompt templates for surgical changes and follow-ups. | `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md` |

## Required Prompt References By Phase

| Phase | Prompt references that must appear in phase context or plan `read_first` |
|---|---|
| Phase 8: OpenAI IP Change Parity | `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-ip-change/references/gpt-image-2-notes.md` |
| Phase 9: OpenAI Sketch to Real Parity | `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-sketch-realization/references/gpt-image-2-notes.md` |
| Phase 10: Provider-Aware Result Continuation | `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md`, `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md`, `.codex/skills/mockup-precision-edit/references/gpt-image-2-notes.md` |

## Workflow-Specific Rules

- `IP 변경`: use `mockup-ip-change`; implement as strict replacement of character/IP artwork while preserving product geometry, viewpoint, material, hardware, labels, and non-target details.
- `스케치 실사화`: use `mockup-sketch-realization`; treat the sketch as a locked design spec and constrain optional material references to material/finish only.
- `부분 수정`, `스타일 복사`, `동일 조건 재생성`: use `mockup-precision-edit`; change only the named target and repeat the preserve list on every follow-up.
- Runtime work: use `mockup-openai-image-runtime`; add `openai-image.service.ts` or equivalent parallel service instead of folding OpenAI into `gemini.service.ts`.
- Provider rollout work: use `mockup-openai-dual-provider`; never remove, rename, or silently alter the Gemini path while adding OpenAI.
- Smoke/debug work: use `mockup-openai-cli-smoke`; capture OpenAI request IDs and confirm `background: "transparent"` is not sent to `gpt-image-2`.

## Required OpenAI Constraints

- Use `provider = "openai"` and `providerModel = "gpt-image-2"` for OpenAI GPT Image 2 generation records unless a phase explicitly selects a more specific supported model alias.
- Do not use ad hoc booleans such as `isOpenAI`; use the provider dimension already established in Phase 7.
- Do not send `background: "transparent"` to `gpt-image-2`. Generate an opaque image first, then use the project's background-removal/post-process path when transparent output is requested.
- Do not send `input_fidelity` for `gpt-image-2`.
- Preserve request/debug lineage in OpenAI-specific fields: request ID, response ID, image call ID, revised prompt, and provider trace where appropriate.
- Keep raw API keys, uploaded image bytes/base64, and raw vendor response bodies out of user/admin UI unless a future phase explicitly designs a secure internal-only debug surface.
- OpenAI workflows must never fall back to Gemini, and Gemini workflows must never route into OpenAI.

## Planning Checklist

Before creating a GSD plan for any OpenAI phase:

1. Identify the phase's product workflow and select the matching workflow skill from the matrix.
2. Include the selected skill files and every required prompt reference from the phase matrix in the phase context or plan `read_first`.
3. Confirm the plan preserves the existing Gemini route, service, worker behavior, and history lifecycle.
4. Confirm user-facing copy follows phase decisions. Phase 8 uses `v1`/`v2` labels and must not show model/provider names in the product workflow.
5. Confirm OpenAI API constraints are hidden in implementation rather than surfaced as confusing user warnings.
6. Confirm prompt construction separates `Must change`, `Must preserve`, and `Hard constraints` instead of burying preservation rules in freeform prose.

## Verification Checklist

Before marking an OpenAI phase complete:

1. Gemini path still works or remains covered by unchanged tests/smoke checks.
2. OpenAI path is reachable from the same project context as the corresponding Gemini path.
3. Worker routing validates persisted provider/model before vendor dispatch.
4. OpenAI records store provider/model and support identifiers.
5. Prompt tests or review artifacts confirm target-change and preserve constraints.
6. Smoke validation uses `mockup-openai-cli-smoke` guidance when real OpenAI runtime behavior is touched.
7. Prompt review confirms each input image is named by role and index, transparent output is routed through post-processing, and `input_fidelity` is not sent for `gpt-image-2`.
