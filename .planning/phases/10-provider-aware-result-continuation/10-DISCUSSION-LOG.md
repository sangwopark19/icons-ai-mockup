# Phase 10: Provider-Aware Result Continuation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 10-provider-aware-result-continuation
**Areas discussed:** Provider/Model 표시 방식, OpenAI 동일 조건 재생성 기준, OpenAI 부분 수정 UX와 결과 수, OpenAI 스타일 복사 target과 lineage

---

## Provider/Model 표시 방식

| Option | Description | Selected |
|--------|-------------|----------|
| `v1`/`v2`만 기본 노출 | 기존 Phase 8/9 label decision과 맞춤. Raw provider/model은 일반 workflow label에 노출하지 않음. | ✓ |
| `v1 Gemini` / `v2 OpenAI` 같이 provider도 함께 노출 | 구분은 명확하지만 이전 user-facing label decision과 충돌 가능. | |
| Badge는 `v1`/`v2`, 옆에 작은 technical tooltip | UI는 깔끔하게 유지하면서 hover/focus 시 provider/model 확인 가능. | |

**User's choice:** `v1`/`v2`만 기본 노출  
**Notes:** Raw provider/model technical detail은 관리자/운영 화면에만 노출하기로 결정했다. Phase 10 success criteria의 provider/model 표시 요구는 `v1`/`v2`를 사용자-facing signal로 간주해 충족한다.

---

## OpenAI 동일 조건 재생성 기준

| Option | Description | Selected |
|--------|-------------|----------|
| 원본 inputs/options/prompt 재사용, fresh OpenAI request | 저장된 provider/model/source/character/texture/prompt/options를 replay한다. | ✓ |
| 선택된 결과 이미지를 기준으로 변형 생성 | 선택 결과 이미지를 seed/reference처럼 사용한다. | |
| OpenAI response linkage까지 포함해 continuation | 이전 response/image ID를 사용해 이어서 생성한다. | |

**User's choice:** 원본 inputs/options/prompt 재사용, fresh OpenAI request  
**Notes:** 선택된 결과 이미지는 seed로 쓰지 않는다. OpenAI v2 regeneration은 항상 두 후보를 반환하기로 결정했다.

---

## OpenAI 부분 수정 UX와 결과 수

| Option | Description | Selected |
|--------|-------------|----------|
| 기존 freeform modal 유지 + 엄격한 preserve prompt 적용 | 기존 edit UX를 유지하고 backend prompt가 drift를 막는다. | ✓ |
| `바꿀 대상` + `변경 내용` 두 필드로 분리 | 더 구조적이지만 기존 UX보다 무겁다. | |
| 간단 preset + freeform 조합 | 구조적이지만 Phase 10 범위가 커진다. | |

**User's choice:** 기존 freeform modal 유지 + 엄격한 preserve prompt 적용  
**Notes:** 부분 수정 결과는 1개로 결정했다. Runtime은 Image API edit 우선으로 잠갔다. 사용자는 결과물이 가장 중요하면서 실제 구현 가능해야 한다고 명시했고, Image API edit가 현재 codebase 구조와 결과 품질의 균형이 가장 좋다고 판단했다. Responses API 기반 iterative partial-edit refinement는 future phase로 deferred.

---

## OpenAI 스타일 복사 target과 lineage

| Option | Description | Selected |
|--------|-------------|----------|
| 둘 다 지원 | `스타일 복사 (IP 변경)`과 `스타일 복사 (새 제품 적용)` 모두 지원한다. | ✓ |
| `스타일 복사 (IP 변경)`만 먼저 지원 | 범위는 작지만 existing surface parity가 약하다. | |
| backend만 준비하고 UI는 계속 비활성화 | 구현 risk는 낮지만 Phase 10 success criteria가 약해진다. | |

**User's choice:** 둘 다 지원  
**Notes:** Style copy lineage는 saved OpenAI response/image call linkage 우선, selected image fallback으로 결정했다. Style copy 결과는 2개 후보로 결정했다.

### Style Copy Target Asset Surface

| Option | Description | Selected |
|--------|-------------|----------|
| 기존 IP Change form surface를 style-copy mode로 재사용 | 구현 범위는 작지만 style reference와 target asset 역할이 흐려질 수 있다. | |
| Result page 안에서 바로 upload modal을 띄움 | 빠르지만 result page가 무거워지고 validation/options 재사용이 어렵다. | |
| 새 dedicated style-copy page 추가 | style reference와 new target을 가장 명확히 분리해 결과물 품질을 우선한다. | ✓ |

**User's choice:** 새 dedicated style-copy page 추가  
**Notes:** 사용자는 가장 결과물이 좋은 방법을 물었고, output quality priority에 따라 dedicated style-copy page를 선택했다.

---

## the agent's Discretion

- Exact dedicated style-copy route name.
- Exact Korean microcopy for follow-up actions.
- Exact providerTrace JSON shape for OpenAI continuation metadata.
- Exact service/method names for provider-aware continuation internals.

## Deferred Ideas

- Responses API based iterative partial-edit refinement.
- Region mask based precision editing UI.
- Provider comparison views and cross-provider duplication flows.
