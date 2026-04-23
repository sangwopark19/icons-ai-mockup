# 기능 지형도

**Domain:** MockupAI dual-provider image workflows - OpenAI `gpt-image-2` track  
**Researched:** 2026-04-23  
**Overall confidence:** product-family parity 기대치는 HIGH, 일부 OpenAI surface 세부사항은 공식 guide와 API reference가 완전히 일치하지 않아 MEDIUM

이 문서는 기존 MockupAI 기능의 새 OpenAI 버전만 다룹니다. 목표는 "OpenAI를 다른 제품처럼 보이게 하는 것"이 아니라 "같은 MockupAI 제품군 안에서 provider만 달라진 것처럼 느끼게 하는 것"입니다.

사용자에게 보이는 contract는 Gemini와 최대한 같아야 합니다. 같은 기능 이름, 같은 project/history 흐름, 같은 결과 선택 방식, 같은 edit mental model, 그리고 보호해야 할 영역은 보호된다는 같은 신뢰를 유지해야 합니다. provider 차이는 실제 약속 범위를 바꾸는 경우가 아니라면 구현 내부에 숨겨야 합니다.

## Table Stakes

OpenAI track이 day one부터 갖춰야 하는 기능입니다. 이 중 하나라도 빠지면 OpenAI가 first-class provider가 아니라 별도 실험 기능처럼 보입니다.

| 기능 | 왜 당연히 기대되는가 | Complexity | Gemini와 맞춰야 할 점 | OpenAI provider caveat |
|------|----------------------|------------|------------------------|------------------------|
| 같은 기능 lineup과 진입점 | 사용자는 이미 MockupAI를 `IP 변경`, `스케치 실사화`, `부분 수정`, `스타일 복사`, `동일 조건 재생성`으로 인식하고 있음 | Low | 같은 라벨, 같은 페이지 진입 구조, 같은 provider 전환 mental model | 내부적으로 `images/edits` 또는 `Responses API`로 라우팅해도 되지만, UI에 OpenAI 전용 workflow 이름을 만들면 안 됨 |
| 같은 project 기반 결과 lifecycle | 현재 제품 contract는 project 단위 생성, 후보 비교, history 저장, 재오픈 후 반복 수정임 | Medium | 같은 project 소속, 같은 history save/load 흐름, 같은 결과 페이지 action | OpenAI 전용 metadata는 저장해도 되지만 history가 별도 subsystem처럼 느껴지면 안 됨 |
| 2장 후보 출력 contract 유지 | PRD에서 1회 요청당 2장 생성 후 1장 선택이 핵심 UX로 정의됨 | Low | OpenAI도 핵심 generate/edit 흐름에서 2장 후보를 반환해야 함 | OpenAI API가 더 많은 output을 지원해도 현재 product contract는 2장으로 고정 |
| provider 고정 재생성 | `동일 조건 재생성`은 같은 입력, 같은 옵션, 같은 provider로 새 후보를 받는다는 뜻이어야 함 | Medium | 입력 초기화 금지, 조용한 Gemini fallback 금지, 같은 결과 페이지 action 유지 | 내부적으로 stored inputs와 response/image lineage를 써도 되지만 source of truth는 항상 사용자가 저장한 inputs/options여야 함 |
| `IP 변경` parity | MockupAI의 핵심 기능이므로 OpenAI 버전도 캐릭터/IP만 바꾸고 제품 body는 유지해야 함 | High | geometry, crop, viewpoint, hardware, labels, seams, 비대상 영역, user instructions 보존을 Gemini 수준으로 맞춰야 함 | source product + IP reference 기반 image edit로 구현하되, 추가 reference 수용력은 초기 UI에 노출하지 않는 편이 맞음 |
| `스케치 실사화` parity | 사용자는 같은 "내 스케치를 locked design spec처럼 다뤄달라"는 동작을 기대함 | High | layout, proportions, face details, silhouette, perspective, optional material reference를 유지하고, 결과는 manufactured product photo처럼 보여야 함 | `gpt-image-2`는 image input을 자동으로 high fidelity로 처리하므로 별도 fidelity control을 UI에 노출할 필요가 없음 |
| `부분 수정`의 정확성 | "X만 바꿔줘"는 best-effort prompt가 아니라 제품의 강한 약속임 | High | approved result/history item에서 같은 edit entry point를 제공하고, non-target preservation 기대치를 Gemini와 맞춰야 함 | mask나 response linkage는 내부적으로 사용할 수 있지만, 사용자 contract는 계속 prompt-first, preserve-first여야 함 |
| `스타일 복사`의 같은 mental model | 사용자는 승인된 결과를 기준으로 "이 스타일 유지, target만 변경"을 계속 기대함 | High | 같은 결과 페이지 affordance, 같은 style anchor 개념, approved output 기준 IP 교체/추가 refinement 지원 | OpenAI는 Gemini 전용 개념인 `thoughtSignature`에 의존하면 안 되고, approved image와 stored lineage를 anchor로 삼아야 함 |
| 추가 지시사항 parity | V2 방향상 "지퍼 색상 유지", "손잡이 길이 변경 금지" 같은 사용자 규칙 입력은 핵심 보완 기능임 | Medium | 같은 textarea, 같은 우선순위, regenerate/edit 시 같은 지속성 규칙 유지 | 일부 OpenAI surface는 prompt를 내부적으로 revise할 수 있으므로, 저장 기준은 revised prompt가 아니라 원본 user text여야 함 |
| 구조/hardware/viewpoint lock 옵션 | 사용자는 model API가 아니라 preservation rule로 사고함 | Medium | 구조 보존, hardware 보존, viewpoint 유지, 흰 배경 고정, shadow 처리 같은 visible control을 Gemini와 맞춰야 함 | 같은 policy language를 써야 하지만 `input_fidelity` 같은 provider knob를 직접 노출하면 안 됨 |
| 같은 history 추적성과 provider 명시성 | OpenAI 결과가 history에서 first-class asset처럼 보여야 하고, Gemini 전용 가정에 묻히면 안 됨 | Low | 같은 save/open/delete/regenerate entry point 유지 | provider badge나 provenance는 보여줘도 되지만 history 시스템을 provider별로 분리하면 안 됨 |

## Differentiators

parity가 안정화된 뒤 OpenAI track이 활용할 수 있는 장점입니다. 같은 feature family를 강화해야지, 별도 product line을 만들면 안 됩니다.

| 기능 | 사용자 가치 | Complexity | Notes |
|------|-------------|------------|-------|
| 같은 workflow 안에서 더 나은 text/label fidelity | packaging, mug text, hang tag, printed label처럼 글자가 중요한 상품에서 가치가 큼 | Medium | `IP 변경`, `부분 수정`, `스타일 복사` 내부 품질 향상으로 다뤄야지 별도 "text mode"를 만들면 안 됨 |
| 더 풍부한 multi-reference edit | OpenAI image edit는 여러 input image를 받을 수 있어 material/hardware/style reference를 더 잘 조합할 여지가 있음 | Medium | 초기 rollout에서는 현재 UI input만 유지하고, parity가 검증된 뒤 advanced reference builder를 검토하는 편이 맞음 |
| approved output 기준 iterative refinement 강화 | response/image lineage를 활용하면 style copy와 follow-up edit의 안정성이 좋아질 수 있음 | Medium | 구현 차별점일 뿐이고, 사용자는 단지 "승인한 결과에서 이어서 수정하기가 더 안정적이다"라고 느끼면 충분함 |
| provider-agnostic quality preset | `Draft`, `Review`, `Final` 같은 product preset으로 cost/latency를 제어할 수 있음 | Medium | 나중에 Gemini와 OpenAI 양쪽에서 같은 preset language를 공유할 수 있을 때만 도입하고, raw `low/medium/high`는 직접 노출하지 않는 편이 좋음 |

## Anti-Features

초기 OpenAI rollout에서 명시적으로 피해야 하는 항목입니다.

| Anti-Feature | 왜 피해야 하는가 | 대신 무엇을 해야 하는가 |
|--------------|------------------|--------------------------|
| OpenAI 전용 workflow 이름 또는 별도 IA | OpenAI가 같은 제품군이 아니라 다른 앱처럼 보이게 만듦 | 기존 MockupAI feature taxonomy를 유지하고 provider만 교체 |
| provider internal 개념 노출 | `previous_response_id`, `revised_prompt`, `action`, `input_fidelity`, `mask alpha` 같은 용어는 제품 가치가 아니라 구현 세부사항임 | debugging과 routing용으로만 내부 저장 |
| regenerate/edit 시 silent provider switching | 출력 차이를 사용자가 이해할 수 없게 만들고 신뢰를 무너뜨림 | 사용자가 명시적으로 바꾸지 않는 한 원래 provider에 고정 |
| Gemini와 pixel-identical parity 약속 | provider가 다르면 같은 입력이어도 같은 pixel이 나오지 않음 | behavioral parity만 약속: 같은 contract, 같은 control, 같은 protected invariant |
| day one부터 direct transparent background 약속 | OpenAI 공식 image-generation guidance는 현재 `gpt-image-2`의 `background: "transparent"`를 지원하지 않는다고 안내함 | direct transparent generation은 defer. 필요하면 post-process로 해결하거나 capability가 안정화된 뒤 별도 지원 |
| OpenAI 전용 고급 style transfer를 unrelated product까지 확대 | "parallel provider" 범위를 넘어 새로운 제품 기능이 되며 품질 보장이 불명확함 | 먼저 approved-output 기반 style copy를 현재 지원 workflow 안에서만 안정화 |
| streaming preview를 core promise로 넣기 | OpenAI docs에 partial image 언급은 있지만 rollout contract로 걸기엔 surface 정보가 아직 깔끔하지 않음 | streaming preview는 optional future UX research로 남김 |

## Provider-Specific Caveats

- `gpt-image-2`는 현재 OpenAI의 state-of-the-art image model이며 generation과 editing 모두의 기준선으로 삼는 것이 맞습니다.
- OpenAI guidance에 따르면 `gpt-image-2`는 image input을 자동으로 high fidelity로 처리합니다. 따라서 사용자가 조절하는 fidelity knob를 새로 만들 이유가 없습니다.
- OpenAI guide는 현재 `gpt-image-2`가 transparent background를 지원하지 않는다고 설명합니다. roadmap 관점에서는 direct transparent-background generation을 defer하는 보수적 해석이 맞습니다.
- OpenAI generate/edit surface는 multiple output과 multiple input image를 지원합니다. 이것은 MockupAI의 2-candidate contract 유지와 향후 richer reference workflow에 유리합니다.
- 일부 OpenAI surface는 prompt를 자동 revise할 수 있습니다. 그래도 product 기준의 canonical request는 항상 원본 user prompt와 option이어야 합니다.
- `스타일 복사`와 iterative edit continuity는 Gemini의 `thoughtSignature`가 아니라 approved output image와 stored OpenAI lineage를 기준으로 설계해야 합니다.

## Feature Dependencies

```text
Provider selection + generation에 provider 저장
  -> 모든 OpenAI feature의 전제조건

Approved result selection
  -> 부분 수정에 필요
  -> 스타일 복사에 필요
  -> regenerate 의미를 더 명확하게 만듦

Project-scoped history
  -> OpenAI output을 다음 edit base로 재오픈하는 데 필요

Preservation controls (structure/hardware/viewpoint/background rule)
  -> IP 변경에 필요
  -> 부분 수정에 필요
  -> 스타일 복사에 필요

Stored original inputs/options
  -> provider 고정 regenerate에 필요
```

## MVP Recommendation

우선순위:

1. 같은 provider-scoped lifecycle: OpenAI generation을 project에 저장하고, 2장 후보를 보여주고, 1장을 선택해 history에 저장하고, 같은 provider로 regenerate할 수 있어야 함
2. 핵심 parity 기능: `IP 변경`, `스케치 실사화`, `부분 수정`을 Gemini와 같은 preservation contract로 제공
3. approved output continuation: 선택된 OpenAI 결과에서 `스타일 복사`와 후속 edit를 이어갈 수 있어야 함

Defer:

- OpenAI provider의 direct transparent-background generation
- OpenAI 전용 advanced multi-reference UI
- streaming partial-preview UX
- provider internals를 드러내거나 기존 MockupAI IA를 바꾸는 모든 기능

## Sources

- `.planning/PROJECT.md` - 현재 제품 범위와 shipped baseline
- `docs/PRD.md` - output, history, core image workflow의 원래 product contract
- `docs/V2_PRD.md` - regenerate, style copy, hardware preservation, 추가 지시사항 동작 정의
- `.codex/skills/mockup-openai-workflows/SKILL.md` - project-specific OpenAI workflow guardrail
- `.codex/skills/mockup-openai-workflows/references/workflow-matrix.md` - feature-to-workflow mapping
- `.codex/skills/mockup-openai-workflows/references/prompt-playbook.md` - prompting constraint와 preservation rule
- OpenAI Image Generation Guide: https://developers.openai.com/api/docs/guides/image-generation
- OpenAI Image Generation Tool Guide: https://developers.openai.com/api/docs/guides/tools-image-generation
- OpenAI Images API Reference: https://developers.openai.com/api/reference/resources/images
- OpenAI GPT Image 2 Model Page: https://developers.openai.com/api/docs/models/gpt-image-2

## Confidence Notes

- HIGH: product-family parity expectation. project 문서와 V2 PRD가 사용자 contract를 매우 명확하게 정의하고 있음
- HIGH: `gpt-image-2` baseline, multi-turn lineage 활용 방향, automatic high-fidelity image input 처리
- MEDIUM: streaming, background parameter 같은 일부 surface 세부사항. 공식 guide가 API reference보다 더 보수적이므로, 이 문서는 rollout promise를 guide 기준으로 잡음
