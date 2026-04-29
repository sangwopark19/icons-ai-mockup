# Phase 10 Provider-Aware Result Continuation Smoke

## Automated Verification

| Check | Status | Evidence |
|---|---|---|
| `pnpm --filter @mockup-ai/api test` | pending | To be run in Task 2. |
| `pnpm --filter @mockup-ai/api type-check` | pending | To be run in Task 2. |
| `pnpm --filter @mockup-ai/web type-check` | pending | To be run in Task 2. |
| `pnpm --filter @mockup-ai/api test && pnpm --filter @mockup-ai/api type-check && pnpm --filter @mockup-ai/web type-check` | pending | Full command required before phase close. |

## Product UI Metadata Boundary

| Check | Status | Evidence |
|---|---|---|
| `rg -n "style-copy/openai|selectedImageId|수정 결과" 'apps/web/src/app/projects/[id]/generations/[genId]/page.tsx'` | pending | Confirms selected-image continuation and one-result edit copy. |
| `rg -n "스타일 기준 · v2|copy-style|copyTarget: 'ip-change'|copyTarget: 'new-product'" 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` | pending | Confirms dedicated v2 style-copy surface and copy targets. |
| `! rg -n "Gemini|OpenAI|GPT Image 2|gpt-image-2|providerModel" 'apps/web/src/app/projects/[id]/generations/[genId]/page.tsx' 'apps/web/src/app/projects/[id]/history/page.tsx' 'apps/web/src/app/projects/[id]/style-copy/openai/page.tsx'` | pending | Confirms raw provider/model labels are not visible product copy. |

## Provider-Pinned Regeneration

| Check | Status | Evidence |
|---|---|---|
| Provider-pinned regeneration coverage | pending | Covered by automated API tests and full phase verification in Task 2. |

## OpenAI Partial Edit Smoke

| Check | Status | Evidence |
|---|---|---|
| Live/app partial edit smoke | pending | Will record request ID, response ID, image call ID, selected image ID, output count, and no Gemini fallback when prerequisites are available. |
| Forbidden parameters | pending | Must confirm `background: "transparent"` and `input_fidelity` are absent. |

## OpenAI Style Copy Smoke

| Check | Status | Evidence |
|---|---|---|
| Live/app style-copy smoke | pending | Will record generation ID, request ID, response ID, image call ID, output count, selected image ID, and no Gemini fallback when prerequisites are available. |
| Forbidden parameters | pending | Must confirm `background: "transparent"` and `input_fidelity` are absent. |

## Gemini/OpenAI Lineage Isolation

| Check | Status | Evidence |
|---|---|---|
| `rg -n "generateStyleCopyWithLinkage|generateStyleCopyFromImage" apps/api/src/worker.ts` | pending | Confirms OpenAI style-copy runtime has linkage-first and selected-image fallback paths. |
| worker grep for `thoughtSignature` | pending | Confirms Gemini-only lineage remains isolated during static review. |
| `! rg -n "background:|input_fidelity" apps/api/src/services/openai-image.service.ts` | pending | Confirms forbidden OpenAI parameters are not sent. |

## Schema Push Status

No Phase 10 plan modifies apps/api/prisma/schema.prisma; npx prisma db push is not required.

## Manual Needed Approval

manual_needed: pending

## Evidence Status

| Evidence | Status |
|---|---|
| Automated API tests | pending |
| Automated API type-check | pending |
| Automated web type-check | pending |
| Full phase verification command | pending |
| Product UI metadata boundary | pending |
| Provider-pinned regeneration | pending |
| OpenAI partial edit live smoke | pending |
| OpenAI style-copy live smoke | pending |
| Gemini/OpenAI lineage isolation | pending |
| Schema push status | passed |
