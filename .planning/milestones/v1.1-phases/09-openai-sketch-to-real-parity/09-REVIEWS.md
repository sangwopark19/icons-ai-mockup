---
phase: 09
reviewers: [claude, cursor]
successful_reviewers: [claude]
failed_reviewers: [cursor]
reviewed_at: 2026-04-27T07:13:31.179Z
plans_reviewed: [".planning/phases/09-openai-sketch-to-real-parity/09-01-PLAN.md", ".planning/phases/09-openai-sketch-to-real-parity/09-02-PLAN.md", ".planning/phases/09-openai-sketch-to-real-parity/09-03-PLAN.md", ".planning/phases/09-openai-sketch-to-real-parity/09-04-PLAN.md"]
---

# Cross-AI Plan Review — Phase 09

## Claude Review

# Phase 9 Plan Review — OpenAI Sketch to Real Parity

## 1. Summary

Phase 9의 4개 plan은 Phase 8의 IP Change v2 패턴을 Sketch to Real로 확장하는 작업으로, 전체 구조와 must_haves 매핑은 매우 견고하다. provider/model UI 은닉, prompt 보존 계약, 두 후보 출력, v1/v2 사이드바 entry 등 핵심 요구사항이 D-XX 결정 기반으로 추적 가능한 형태로 잘 분해되어 있다. 그러나 **OSR-03의 핵심인 "background removal post-process" 구현 방식이 plan 전반에서 명시되지 않은 것이 가장 큰 약점**이다. plan은 "alpha channel을 가진 PNG가 나와야 hasTransparency=true"라고만 명시할 뿐, 실제로 어떤 라이브러리/알고리즘으로 배경을 제거할지 결정이 없어 실행자가 기술적으로 검증되지 않은 helper를 즉석에서 만들어야 한다. sharp 단독으로는 배경 검출/제거가 불가능하다는 점에서 이는 실행 단계에서 발목을 잡을 수 있다.

## 2. Strengths

- **Phase 8 패턴의 일관된 재사용**: 사이드바 순서, v1/v2 라벨, 결과 페이지 분기, 비활성 Phase 10 follow-up 처리가 Phase 8과 동일한 형태로 설계되어 회귀 위험이 낮다
- **must_haves 추적성**: 각 plan이 CONTEXT의 D-01~D-30 결정에 1:1 매핑되어 있어 review/verification에서 검증 가능
- **Forbidden parameter 명시적 테스트**: `background`/`input_fidelity` 미전송이 단위 테스트와 smoke 양쪽에서 검증 — `gpt-image-2` 제약을 정확히 반영
- **Prompt 구조 잠금**: 09-01-02에서 `Image roles:`, `Must preserve:`, `Must add:`, `Hard constraints:` 정확한 헤더 문자열까지 acceptance criteria로 못박아 D-29/D-30 강제
- **Provider fail-fast 유지**: worker의 `provider`/`providerModel` mismatch 검증을 보존하여 cross-provider 오디스패치 위험 차단
- **Wave 의존성 합리적**: 09-01(백엔드)과 09-02(폼)을 wave 1로 병렬, 09-03을 wave 2로 통합, 09-04를 최종 검증으로 분리
- **Gemini v1 보호**: 09-02-02가 v1 라우트의 create payload를 명시적으로 변경하지 않도록 negative acceptance criteria(`provider: 'openai'` 미포함)로 봉인

## 3. Concerns

### HIGH

- **HIGH — 배경 제거 helper의 구체적 구현 방식 미정**: 09-01-03이 `apps/api/src/services/upload.service.ts` 또는 새 service에 helper를 추가하라고만 명시하고, 어떤 알고리즘/라이브러리로 배경을 제거할지 결정이 없다. 현재 codebase는 `sharp`만 사용하는데 sharp는 픽셀 조작/알파 합성만 가능할 뿐 **배경 검출/제거 능력이 없다**. 실행자가 즉석에서 결정하면 두 가지 위험: (a) 단순 흰색 임계값 처리로 끝내 실제 제품 사진에서는 동작하지 않거나, (b) `rembg`/외부 API 의존을 새로 추가해 인프라/비용 영향이 plan 범위 밖에서 발생. RESEARCH.md도 "보수적 helper" 정도만 언급해 같은 결정 공백이 있음.

- **HIGH — OSR-03의 검증이 비결정적**: 09-04-01의 transparent verification이 "최종 자산 alpha channel 검사"로만 명시되어 있고, **품질 기준**(예: 가장자리 블리딩, 헤일로 효과)에 대한 검증이 없다. helper가 alpha 채널은 갖되 시각적으로 배경이 남아있는 결과물도 acceptance criteria를 통과할 수 있다.

### MEDIUM

- **MEDIUM — `isV2` 일반화의 영향 범위**: 09-03-01은 `isV2 = generation?.provider === 'openai'`로 단순화하지만, 현재 결과 페이지의 v2 분기들이 모두 `ip_change`-specific copy를 갖고 있다. 모든 분기에서 mode 분기까지 추가해야 IP Change v2 카피가 Sketch v2 결과에 잘못 노출되지 않는다. plan에 "mode-specific helper 사용"은 적혀 있으나 acceptance criteria가 "스케치 카피 노출"만 검증하고 **"IP Change 카피가 Sketch에 새지 않음"을 검증하는 negative criteria가 없다**.

- **MEDIUM — Test brittleness**: 09-01-02의 acceptance criteria가 prompt 안 정확한 문자열(`Image 1: designer sketch. Treat it as the locked design spec.` 등)을 그대로 매칭한다. D-29/D-30의 의도는 보존되지만 **prompt 튜닝 시 매번 plan 수준 수정**이 필요해진다. 핵심 토큰만 substring 매칭으로 완화하거나 별도 테스트 fixture로 분리하는 것이 유지보수에 유리.

- **MEDIUM — `saveGeneratedImage` 시그니처 확장 영향 미정**: 09-01-03이 "`saveGeneratedImage(...)`에 `hasTransparency` 전달 가능하도록 overload 추가"를 요구하는데, 이 함수의 기존 호출자(Gemini Sketch, Gemini IP Change, OpenAI IP Change)가 어떤 영향을 받는지 plan에 명시 없음. 실행자가 default 인자 없이 변경하면 다른 워크플로 빌드가 깨질 수 있음.

- **MEDIUM — 후보 정렬 순서 결정 없음**: GPT Image 2의 `n: 2` 응답은 candidate 순서 결정성이 보장되지 않는데, 결과 페이지의 `aria-label="후보 1 선택"`/`후보 2 선택`이 어떤 기준으로 1/2로 매핑되는지(응답 배열 순서? 저장 timestamp?) plan에 없음. 사용자가 두 후보를 비교하는 워크플로에서는 사소한 디테일이지만 history reopen 후 일관성 문제로 이어질 수 있음.

- **MEDIUM — `userInstructions` 보존 계약 위반 검증 없음**: D-18이 "user instructions가 core sketch 디테일을 override할 수 없음"을 강제하지만, plan의 prompt 빌더는 user instructions를 단순히 prompt 끝에 붙이는 형태. **prompt injection 시도(예: "ignore all preservation rules")**에 대한 mitigation이 없다. Hard constraints 섹션이 user instructions 뒤에 위치하면 LLM이 후자를 우선시할 수 있음 — 09-01-02에서 user instructions를 Hard constraints **앞**에 배치하도록 명시적 순서를 강제할 필요.

- **MEDIUM — 파일 크기/포맷 validation 누락**: 09-02-03의 sketch/texture uploader가 추가 검증 없이 기존 `ImageUploader`를 재사용하지만, GPT Image 2 edit endpoint는 PNG/JPEG 입력 제약과 max file size가 있다. 업로드 시점이 아니라 generation create 시점에 실패하면 사용자 경험이 나쁨.

### LOW

- **LOW — 09-02-01의 mainGrid에서 v1 카드 강조 약화 우려**: "v1을 deprecated처럼 보이지 않게"라고만 명시되어 있어 시각적 균형이 실행자 재량에 맡겨짐. UI-SPEC에 wireframe이나 spacing 규칙이 있을 텐데 plan에서는 추가 참조하지 않음.

- **LOW — 09-04-03 manual smoke 증거의 위치**: `09-SUMMARY.md`에 기록하라고 하지만 이 파일이 언제 누가 만드는지 plan에 없음. (executor convention인지 GSD orchestrator가 자동 생성하는지 명시 권장.)

- **LOW — `pnpm db:push` 결정의 안전성**: 09-01-04가 schema 변경 발생 시 자동으로 `db:push`를 호출하라고 하는데, 이는 production이 아닌 local dev DB 가정 — plan에서 명시적으로 "local dev only"라고 기재하면 명확.

- **LOW — Worker 동시성/rate limit 미언급**: OpenAI Image API edit의 분당 호출 한도/이미지 사이즈/처리 시간이 BullMQ worker concurrency와 충돌할 수 있는데 risk 섹션에 없음. Phase 8에서 이미 처리되었다면 확인.

## 4. Suggestions

1. **09-01-03을 분할**: background-removal helper 구현을 별도 task(09-01-03a)로 떼고, 다음 중 하나를 결정하도록 plan에서 명시:
   - (a) `sharp` 기반 단순 알파 보존(이미 transparent로 생성된 이미지에 한정)
   - (b) `@imgly/background-removal-node` 또는 `rembg` 같은 ONNX 기반 라이브러리 추가
   - (c) 외부 API(Remove.bg 등) 통합
   각 선택지의 deps/license/cost trade-off를 plan에 표기.

2. **09-04에 transparent 품질 검증 추가**: alpha channel 존재 여부뿐 아니라 (i) 알파=0 픽셀이 전체의 일정 비율 이상 차지하는지, (ii) 가장자리 픽셀의 alpha 분포가 점진적인지 등 정량 기준을 추가하거나, 최소한 manual smoke의 evidence에 "screenshot of background-removed asset on dark background"를 요구.

3. **09-03-01에 negative acceptance criteria 추가**: `Sketch v2 결과 페이지에 'IP 변경' 또는 ip_change-specific 카피가 노출되지 않음` 같은 명시적 부정 검증을 grep으로 추가.

4. **09-01-02의 prompt 테스트를 두 단계로**: (a) 핵심 must_haves 검증은 substring match, (b) 정확한 텍스트 검증은 snapshot test로 분리. 향후 prompt iteration 비용 감소.

5. **09-01-02에 prompt 섹션 순서 강제**: `Must preserve:` → `Must add:` → `User instructions(있을 때):` → `Hard constraints:` 순으로 배치하여 user instructions가 hard constraints에 의해 항상 후처리되도록 acceptance criteria에 추가.

6. **09-02-03에 파일 검증 명시**: sketch/texture 업로드 시 `max 4MB`, PNG/JPEG only 등 OpenAI Image API 제약을 클라이언트단에서 사전 차단.

7. **09-03-01에 candidate 순서 결정 규칙 명시**: GPT Image 2 응답 배열 순서를 그대로 1/2로 매핑하고 DB에 저장된 `position` 필드 등으로 history 재오픈 시에도 동일 순서를 보장하도록 acceptance.

8. **09-04에 CI 통합 옵션 표기**: 자동 검증 명령들이 CI에서도 동일하게 실행되는지 확인 또는 명시. (gated real smoke는 CI 제외 지시.)

## 5. Risk Assessment

**Overall Risk: MEDIUM-HIGH**

근거:
- **HIGH 요인**: OSR-03 transparent post-process의 기술적 결정 공백이 가장 큰 위험. 실행 중 helper 구현을 즉흥적으로 결정하면 (a) 품질 미달 (b) 신규 의존성/비용 (c) plan 재작업 중 하나가 발생할 가능성 높음. 이 부분만 사전 결정되면 risk는 LOW-MEDIUM으로 감소.
- **MEDIUM 요인**: `isV2` 일반화의 회귀 위험과 prompt injection 가능성은 실제 코드 작성 단계에서 충분히 발견/수정 가능하지만 plan 시점에 negative criteria가 없어 누락 가능.
- **LOW로 안정화된 요인**: provider routing, fail-fast 가드, v1 보호, must_haves 추적성, 테스트 커버리지 모두 견고. Phase 7/8 패턴 재사용으로 인프라 변동성 최소.

**권고**: 09-01-03 실행 전에 background-removal 구현 방식에 대한 짧은 ADR 또는 spike(약 30분)를 추가하고, 09-04에 시각적 transparent 품질 검증을 한 줄 추가하면 plan 품질이 production-ready 수준으로 올라간다. 그 외 plan 구조와 의존성 순서는 그대로 진행해도 무방.

---

## Cursor Review

Cursor review failed.

Error: Authentication required. Please run 'cursor agent login' first, or set CURSOR_API_KEY environment variable.

---

## Consensus Summary

Only one reviewer completed successfully. Cursor was installed but not authenticated, so there is no true 2+ reviewer consensus for this run. The actionable summary below reflects the successful Claude review and should be treated as single-review feedback, not cross-model agreement.

### Agreed Strengths

- No multi-review agreement available.
- Single-review signal: the plans are well structured around Phase 8 pattern reuse, explicit provider fail-fast behavior, v1/v2 route separation, and clear must-have traceability from the Phase 09 decisions.

### Agreed Concerns

- No multi-review agreement available.
- Single-review HIGH concern: the OSR-03 transparent-background post-process is under-specified. The plans require background removal/alpha output, but do not decide the implementation strategy, dependency, quality bar, or fallback behavior.
- Single-review HIGH concern: transparent-output verification checks alpha existence more than visual removal quality, so a technically transparent but visually poor asset could pass.
- Single-review MEDIUM concern: result-page v2 generalization may leak IP Change-specific copy into Sketch to Real unless negative acceptance criteria are added.
- Single-review MEDIUM concern: prompt ordering and user instructions handling should explicitly keep hard constraints after user-provided instructions to reduce override/injection risk.
- Single-review MEDIUM concern: candidate ordering and upload validation should be specified so two-candidate comparison and API failures remain predictable.

### Divergent Views

- None captured because Cursor could not run without authentication.

### Recommended Planner Inputs

- Add a short Phase 09 plan update or spike before 09-01-03 to decide the background-removal approach.
- Add transparent-output quality checks to 09-04, not only alpha-channel existence checks.
- Add negative acceptance criteria preventing IP Change copy from appearing in Sketch v2 result views.
- Add prompt section-order acceptance criteria that place hard constraints after user instructions.
- Add explicit candidate ordering and client-side file validation requirements.
