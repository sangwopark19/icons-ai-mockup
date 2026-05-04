# Phase 9: OpenAI Sketch to Real Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 09-openai-sketch-to-real-parity
**Areas discussed:** Sketch v2 form surface, Texture reference contract, Design preservation strictness, Product/material guidance

---

## Sketch v2 form surface

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Form surface | v1과 거의 동일하게 유지 | `sketch`, optional `texture`, 추가 지시사항, transparent만 둠 | |
| Form surface | Phase 8 v2처럼 확장 | quality mode, 구조/시점/배경 보존, 그림자 제거, 추가 지시사항을 둠 | ✓ |
| Form surface | Hybrid | quality mode와 추가 지시사항만 추가하고 보존 옵션은 기본값으로 숨김 | |
| 기본값 | 보존 강하게 기본값 | `균형모드`, 구조 보존 ON, 시점 고정 ON, 배경 고정 ON | ✓ |
| 기본값 | 사용자 자유도 높게 | `균형모드`, 구조 보존 ON만 기본, 시점/배경은 OFF | |
| 기본값 | 최고 품질 기본값 | `퀄리티모드`, 구조/시점/배경 보존 ON | |
| 진입 방식 | v1/v2 별도 카드와 sidebar entry | 기존 `/sketch-to-real`은 v1, 새 `/sketch-to-real/openai`는 v2 | ✓ |
| 진입 방식 | 기존 카드 안에서 v2 버튼만 추가 | 화면은 덜 늘어나지만 Phase 8 패턴과 다름 | |
| 진입 방식 | 기존 route를 v2로 교체 | 단순하지만 parallel rollout 원칙과 맞지 않음 | |
| Transparent 표시 | v1과 같은 위치에 그대로 표시 | 내부적으로 opaque 생성 후 background-removal/post-process | ✓ |
| Transparent 표시 | 고급 옵션 안에 표시 | 기본 화면은 덜 복잡하지만 parity가 약함 | |
| Transparent 표시 | 후처리 검증 전까지 숨김 | 실패 위험은 줄지만 `OSR-03`과 맞지 않음 | |

**User's choice:** 확장 form, 보존 강한 기본값, 별도 v1/v2 진입, transparent option 동일 위치.
**Notes:** Phase 8 v2 pattern을 Sketch to Real v2에도 carry forward한다.

---

## Texture reference contract

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| Texture scope | material/finish 전용으로 엄격 제한 | 재질, 표면감, 광택, 색상 동작만 참고 | ✓ |
| Texture scope | material + color palette까지 허용 | 색감도 넓게 반영 | |
| Texture scope | style reference처럼 넓게 활용 | 분위기/조명/연출까지 참고 | |
| 충돌 우선순위 | sketch/product category 우선 | sketch/category 우선, texture는 가능한 재질 힌트 | |
| 충돌 우선순위 | texture reference 우선 | texture가 제품 재질을 사실상 지정 | |
| 충돌 우선순위 | 명시적 prompt 우선 | 추가 지시사항이 충돌을 정리 | |
| 금지 항목 | 강한 금지 목록 사용 | 새 캐릭터, 로고, 텍스트, 패턴 배치, 제품 형태, 배경/scene, props 금지 | ✓ |
| 금지 항목 | 핵심만 금지 | 새 캐릭터/제품 형태/배경만 금지 | |
| 금지 항목 | 최소 금지 | "material only" 중심으로 짧게 둠 | |
| Texture 없음 | product category에 맞게 추론 | category/sketch/prompt에서 자연스러운 제조 재질 추론 | ✓ |
| Texture 없음 | clean studio product mockup 기본값 | 재질 추론 최소화 | |
| Texture 없음 | material 입력을 사실상 요구 | friction은 늘지만 명확함 | |

**User's choice:** Texture는 material/finish 전용. 제품 형태와 카테고리는 sketch가 우선하고, 그 안의 재질은 texture reference가 우선.
**Notes:** User clarified a mixed priority rule rather than choosing a stock option for the conflict question.

---

## Design preservation strictness

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| 보존 강도 | 강한 보존 계약 | layout, silhouette, proportions, face details, construction, perspective를 거의 그대로 보존 | ✓ |
| 보존 강도 | 중간 보존 + 자연스러운 정리 허용 | 핵심 형태는 지키되 일부 정리 허용 | |
| 보존 강도 | 실사 제품으로 재해석 허용 | 제품 완성도를 위해 형태를 꽤 바꿀 수 있음 | |
| 지시사항 충돌 | 보존 규칙 우선 | 추가 지시사항은 보존 계약 안에서만 반영 | ✓ |
| 지시사항 충돌 | 명시적 사용자 지시 우선 | 사용자가 바꾸라고 하면 일부 디테일 변경 가능 | |
| 지시사항 충돌 | 충돌 시 실패/확인 유도 | validation/copy로 재작성 유도 | |
| 새 요소 | 새 요소 추가 전면 금지 | 새 캐릭터, 텍스트, 로고, 장식, props, 배경 오브젝트, scene 금지 | ✓ |
| 새 요소 | 최소 장식 허용 | subtle texture/pattern 같은 작은 장식 허용 | |
| 새 요소 | prompt에 있으면 허용 | 명시된 경우만 허용 | |
| 정리 범위 | 제조 현실감만 추가 | 두께감, form shading, 소재 질감, stitching, molded edge, glaze만 추가 | ✓ |
| 정리 범위 | 선 정리와 미세 비율 보정 허용 | 비뚤어진 선/어색한 비율 보정 | |
| 정리 범위 | 제품 완성도를 위해 꽤 다듬기 허용 | 양산 제품처럼 적극 정리 | |

**User's choice:** Strong preservation, preservation-first conflict handling, no new elements, manufacturing realism only.
**Notes:** Sketch is treated as a locked design spec.

---

## Product/material guidance

| Question | Option | Description | Selected |
|----------|--------|-------------|----------|
| 정보 수집 | 선택형 product category 추가 + material은 prompt/texture로 처리 | category만 명시적으로 받고 material은 prompt/texture 중심 | |
| 정보 수집 | 별도 입력 없이 sketch/prompt에서 추론 | UI 단순, 오해 위험 | |
| 정보 수집 | product category와 material 둘 다 선택/입력 | 가장 명확하지만 form이 무거움 | ✓ |
| Category 입력 | preset dropdown + 기타 입력 | preset 제공, 기타 선택 시 직접 입력 | ✓ |
| Category 입력 | 자유 입력만 사용 | 유연하지만 표준화 약함 | |
| Category 입력 | 자동 추론 + 수정 가능 | UX는 좋지만 scope 확장 가능 | |
| Material 입력 | preset chips + 자유 입력 | preset 제공 + 세부 설명 입력 | ✓ |
| Material 입력 | 자유 입력만 사용 | 표현은 자유롭지만 표준화 약함 | |
| Material 입력 | texture reference가 있으면 material 입력 숨김 | UI는 줄지만 결정과 어긋남 | |
| 우선순위 | category는 UI 입력 우선, material은 texture 우선 | category가 구조를 잠그고 texture가 material/finish를 구체화 | ✓ |
| 우선순위 | UI 입력이 항상 우선 | category/material 모두 UI 입력 우선 | |
| 우선순위 | texture가 category까지 영향 가능 | 재질 반영 강하지만 drift 위험 | |

**User's choice:** Collect both category and material. Category uses preset dropdown + 기타. Material uses preset chips/free text. Category input controls structure; texture controls material/finish.
**Notes:** Material preset/free text should help when no texture exists or texture needs disambiguation.

---

## the agent's Discretion

- Exact visual styling for v2 emphasis.
- Exact Korean microcopy around controls and helper text.
- Exact component sharing/refactor strategy.
- Exact internal field names for product category/material.
- Exact disabled follow-up action treatment until Phase 10.

## Deferred Ideas

None. Discussion stayed within Phase 9 scope.
