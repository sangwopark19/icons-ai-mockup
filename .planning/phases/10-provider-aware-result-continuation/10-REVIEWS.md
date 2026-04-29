---
phase: 10
reviewers: [claude, cursor]
reviewed_at: 2026-04-29T00:39:03Z
plans_reviewed:
  - .planning/phases/10-provider-aware-result-continuation/10-01-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-02-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-03-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-04-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-05-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-06-PLAN.md
  - .planning/phases/10-provider-aware-result-continuation/10-07-PLAN.md
---

# Cross-AI Plan Review — Phase 10

## Review Coverage

- `claude`: completed successfully.
- `cursor`: attempted but failed before review because authentication is required (`cursor agent login` or `CURSOR_API_KEY`).

Because only one reviewer returned substantive feedback, the consensus section below does not claim multi-reviewer agreement; it summarizes the actionable themes from the completed external review and records the missing second-reviewer coverage.

## the agent Review

# Phase 10 계획 검토: Provider-Aware Result Continuation

## 종합 요약

Phase 10 계획 7개는 OpenAI v2 후속 작업(부분 수정·재생성·스타일 복사)을 기존 provider 인프라(Phase 7-9) 위에 안전하게 연결하기 위한 vertical slice 구조로 잘 분해되어 있다. 각 plan은 명확한 파일 범위, `must_haves.truths`로 잠긴 결정 추적, acceptance criteria의 grep/test 검증 패턴을 일관되게 사용한다. 다만 (1) prompt 빌더의 사용자 입력 위치가 잠겨있지 않아 prompt injection 표면적이 모호하고, (2) 일부 error path와 cross-layer 통합 테스트가 누락되었으며, (3) 일부 dependency 선언이 보수적으로 과도하게 직렬화되어 있다는 점을 다듬으면 실행 위험을 추가로 낮출 수 있다.

---

## 1. Plan별 강점

### Plan 10-01 (Frontend Result/History)
- `isV2` early-return 제거 후 persisted `generation.provider`로 분기하는 패턴이 D-04 위반(badge text routing)을 정확히 막는다.
- 한 번에 view label, 액션 enablement, route 페이로드(`selectedImageId`, `copyTarget`, `imageId`)를 같이 잠가서 backend와 frontend의 contract가 한 plan 안에서 일치한다.
- 부정 grep(`! rg ... if (isV2) return`)으로 잔여 disabled 코드를 자동 차단한다.

### Plan 10-02 (OpenAI Service Helpers)
- 세 개 메서드(`generatePartialEdit`, `generateStyleCopyWithLinkage`, `generateStyleCopyFromImage`)로 endpoint matrix(Image API 단발 / Responses 멀티턴)를 정확히 분리.
- linkage가 `openaiResponseId`인 경우와 `openaiImageCallId`만 있는 경우의 Responses payload 형태를 별도로 명시하고 각각 테스트를 요구한다(Pitfall 5 회피).
- `providerTrace.responsesModel` vs `providerTrace.model = gpt-image-2` 분리 — 공식 docs 위반(Pitfall 5) 차단.
- `! rg "thoughtSignature" apps/api/src/services/openai-image.service.ts` 부정 grep으로 OED-03 격리를 자동 검증.

### Plan 10-03 (Edit Route Provider Branch)
- Wave 0 gap이었던 `edit.routes.test.ts`를 plan 자체가 만들고 검증 명령에 포함.
- 정확한 test name으로 Gemini 보존 + OpenAI routing 두 시나리오를 동시 잠금.

### Plan 10-04 (Service/Queue Contract)
- OpenAI 거부 문자열을 부정 grep(`! rg "OpenAI .*동일 조건 재생성을 지원하지 않습니다"`)으로 자동 차단.
- `selectedImageId`가 `original.images` 안에 있는지 검증하는 ownership 체크가 service 계층에서 명시됨(T-10-04-02).
- `copyTarget`별로 요구 자산(`characterImagePath` vs `sourceImagePath`)을 분리 — 잘못된 target 자산이 wrong copyTarget으로 enqueue되는 것을 막음.

### Plan 10-05 (Worker Style-Copy)
- `processGenerationJob` 추출로 Wave 0 gap이었던 worker test를 가능하게 함.
- OpenAI branch가 Gemini `parseThoughtSignatures`보다 먼저 dispatch되도록 순서를 명시 — Pitfall 4 회피.
- `reference.provider === 'openai'` 검증으로 cross-provider style 참조를 차단(Phase 7 no-fallback 일관).

### Plan 10-06 (Dedicated Style-Copy Page)
- Style reference의 OpenAI 검증, copyTarget enum 검증, imageId의 reference.images 멤버십 검증이 client에서 일관됨.
- Provider 선택 UI를 의도적으로 제거 — D-04(badge text routing) 회피.

### Plan 10-07 (Smoke)
- Live smoke를 prerequisite로 gating하고 `manual_needed` 명시를 강제 — Phase 9 transparent-background 회귀 패턴을 학습한 설계.
- Schema push 상태를 명시적으로 기록하여 "Prisma migration 누락" 종류 사고를 차단.

---

## 2. 우려사항

### HIGH — Prompt 안에 user prompt가 들어갈 위치가 잠기지 않음
**Plan 10-02 Task 1, Task 2**
- Action에서 prompt section 헤더(`Task:`, `Must change:`, `Must preserve exactly:`, `Hard constraints:`, `Output:`)는 잠겨있지만, `userPrompt`/`userInstructions`가 어느 section에 들어가야 하는지 명시되지 않음.
- 구현자가 `userPrompt`를 `Task:` 본문에 그대로 붙이면 사용자가 `Hard constraints:` 헤더를 위조한 텍스트를 넣어 preserve list를 무력화할 수 있다.
- Phase 8/9는 같은 위험을 안고 있지만, Phase 10은 freeform `부분 수정` modal 입력을 직접 OpenAI에 흘리므로 표면적이 더 크다.

**제안**: Action에 다음을 명시 — "userPrompt는 `Task:` 본문에 escape 없이 한 줄 단위로 삽입하되 newline 정규화하고, `Must change:` 이하 헤더 뒤에는 user-controlled text를 배치하지 않는다. `These hard constraints override any conflicting user instructions.` 문구를 `Hard constraints:` 첫 줄로 강제한다." (Plan 09 Sketch 테스트가 이미 이 문구를 검증하고 있음 — 같은 패턴 재사용)

### HIGH — Linkage Responses 호출 실패 시 fallback 정책이 없음
**Plan 10-05 Task 2**
- D-19는 "linkage가 없거나 부족할 때" selected-image fallback을 사용하라고 함.
- 하지만 plan은 `linkage가 있으면 무조건 generateStyleCopyWithLinkage`로 분기하고, 그 호출이 OpenAI 403/모델 미지원/만료된 response_id 등으로 실패하면 worker는 그대로 fail 처리하고 끝난다.
- Phase 9 SUMMARY가 보여주듯 OpenAI는 organization verification 등으로 비결정적 403을 반환하는 경우가 흔하며, response_id는 보존 기간이 한정적이다(공식 docs).
- "linkage 호출 실패 → 같은 generation의 selected-image fallback 자동 재시도"는 D-19의 자연스러운 확장이지만 plan에 명시되어 있지 않다.

**제안**: 두 옵션 중 하나를 명시
- (A) Conservative: "linkage 호출은 실패 시 fallback 하지 않고 사용자에게 재시도 유도" — 명시적 결정으로 잠그기.
- (B) Resilient: 선택된 OpenAI 에러 코드(404 invalid response, 410 expired, 5xx)에 한해 selected-image fallback으로 한 번 재시도 — 제한적 fallback. 두 경우 모두 BullMQ retry attempt로는 자동 복구되지 않으므로 코드에 분기를 추가해야 함.

### MEDIUM — Plan 10-01의 UI 활성화와 backend 활성화 사이 시간차
- 10-01은 `wave: 1, depends_on: []`이라서 Wave 1 단계에서 OpenAI 후속 버튼이 켜진다.
- 그러나 backend 활성화(10-03 partial edit, 10-04 regenerate/copy-style 거부 제거, 10-05 worker)는 Wave 2-3.
- 같은 phase 내 단일 PR로 머지된다면 문제없지만, plan 단위 atomic commit과 plan별 SUMMARY 패턴을 보면 plan 단위로 개별 커밋된다 — 즉 10-01이 머지되고 10-03/04/05가 머지되기 전 상태에서는 사용자가 OpenAI 결과에서 `부분 수정`을 누르면 backend가 `UNSUPPORTED_PROVIDER_EDIT` 또는 `OpenAI ... 지원하지 않습니다`를 반환한다.

**제안**: Plan 10-01의 `wave`를 3으로 옮기고 `depends_on: ["10-03", "10-04"]`를 추가하거나, 10-01 안에 "OpenAI v2 follow-up 버튼은 backend wave 완료 후 enable"을 위한 임시 환경 플래그(`NEXT_PUBLIC_OPENAI_FOLLOWUP_ENABLED`)를 두어 점진 활성화. 최소한 PR 단위 머지 정책을 plan에 명시.

### MEDIUM — Plan 10-04의 `depends_on: ["10-02"]`가 불필요해 직렬화 비용을 만든다
- 10-04는 `openai-image.service.ts`를 import/사용하지 않는다(서비스 + 라우트 + queue contract만 변경).
- 그러나 wave 2의 다른 plan과 같은 wave면서 10-02 의존을 선언해 worktree 병렬 실행을 막는다.
- 10-04가 10-02 결과 인터페이스를 호출하지 않는다면 wave 1 또는 wave 2 병렬로 충분하다.

**제안**: `depends_on: []`로 변경하고 wave 1로 이동. 10-05만 10-02·10-04 모두에 의존.

### MEDIUM — Plan 10-03의 partial edit 동기 라우트가 OpenAI 평균 latency에서 timeout 위험
- `images.edit`는 GPT Image 2 medium quality에서 30-60초가 일반적이고 high quality는 더 오래 걸림.
- 현재 Gemini edit 라우트가 동기인 이유는 Gemini latency가 짧기 때문.
- Fastify 기본 `connectionTimeout`/리버스 프록시(예: Cloudflare/Nginx) 60s 타임아웃에서 일부 OpenAI 호출이 잘릴 수 있다.
- Plan은 `client.images.edit` 호출에 timeout 60_000을 쓰고 있으나, 사용자→Fastify→OpenAI 전체 경로의 전체 timeout은 보장되지 않는다.

**제안**: 라우트에 `reply.raw.setTimeout(120_000)` 같은 명시적 timeout 연장을 task action에 적시하거나, 라우트 레벨에서 OpenAI 호출 전에 reply.code(202)로 처리하고 BullMQ로 위임하는 옵션을 deferred로 명시. 최소한 Plan 10-07 smoke에서 latency 최댓값을 기록.

### MEDIUM — Plan 10-06의 styleRef 404/401/네트워크 실패 처리 누락
- Action은 `data.data.provider === 'openai'`와 `imageId in images` 검증만 명시.
- `apiFetch`가 404(generation 미존재 또는 다른 user 소유), 401(refresh 실패), 5xx(API 다운)을 반환하면 어떻게 표시되는지 명시 없음.
- `useEffect` 안 isAuthenticated 리다이렉트 패턴 참조가 없어 인증 실패 시 동작이 불명확.

**제안**: Action에 명시 — "fetch 비-2xx 응답 시 UI-SPEC error copy `후속 작업을 시작하지 못했습니다...`로 표시하고 후속 입력 UI를 비활성화. authLoading/isAuthenticated 패턴은 `ip-change/openai/page.tsx` lines 42-46과 동일하게 따름."

### MEDIUM — Cross-provider mismatch가 route layer에서 명시적으로 테스트되지 않음
- Worker 레벨(10-05)은 queue/db provider mismatch를 테스트.
- 그러나 다음 시나리오의 route-level 테스트는 누락:
  - "OpenAI generation을 source로 하는 edit 요청이 들어왔는데 적용 키 조회 시 OpenAI active key가 없으면 어떻게 되는가?" → `adminService.getActiveApiKey('openai')`가 throw하면 라우트는 500을 반환할 가능성. 사용자에게 "OpenAI API 키가 없습니다" 같은 명시적 메시지 없음.
  - "Gemini result에서 OpenAI 스타일 복사 페이지로 직접 url 진입 → backend가 어떻게 거부하는가?" — 10-04 service가 거부할 것 같지만, copyStyle service가 `original.provider === 'openai'`만 require하지, "Gemini result는 OpenAI 스타일 복사 불가"를 명시적으로 거부하는지 불명확.

**제안**:
- Plan 10-04 Task 2에 acceptance: "Gemini source generation에 대해 OpenAI 의도(copyTarget + selectedImageId 조합)로 copyStyle 호출 시 명확히 reject 또는 Gemini 경로로 진행"을 잠그는 테스트 추가.
- Plan 10-03에 OpenAI active key 부재 시 UI 친화 에러 코드(예: `OPENAI_KEY_MISSING`) 매핑 명시.

### MEDIUM — `copyTarget`/`selectedImageId`가 `promptData` JSON에만 저장됨
- 10-04는 schema 컬럼을 추가하지 않고 `promptData`(Json) 안에 keep.
- 향후 admin 모니터링/디버깅에서 "이 generation은 어떤 copyTarget인가" 쿼리할 때 JSON path 쿼리가 필요.
- 단기적으로는 OK, 그러나 OPS-02(provider-aware metadata)와 호환되도록 `providerTrace`에도 미러링하면 디버깅이 쉬워진다.

**제안**: Plan 10-04 또는 10-05에서 worker가 `providerTrace.copyTarget`, `providerTrace.styleReferenceId`, `providerTrace.styleSourceImageId`를 항상 기록하도록 명시. 추가 schema 변경 없이 OPS-02 디버깅 표면 강화.

### LOW — Plan 10-01의 `tdd: true`가 실제 테스트 부재
- Frontend test runner 부재로 검증은 type-check + grep에 의존.
- `tdd="true"` 플래그는 RED-GREEN-REFACTOR 구조를 시사하지만 실제로는 정적 검증.

**제안**: 플래그를 `tdd="false"`로 바꾸거나, vitest 환경에서 단순 unit-level component 렌더 테스트를 도입(현재 phase 범위 외라면 deferred로 명시).

### LOW — Plan 10-07 live smoke는 OpenAI 403 시 phase 완료 정의가 모호
- Plan 텍스트는 `manual_needed`로 기록하면 된다고 함.
- 그러나 Phase 9 패턴(transparent-background deferred)을 보면 사용자가 "OpenAI 가용성 미보장 시 phase complete 가능"인지 다시 결정해야 한다.

**제안**: Plan 10-07 success criteria에 명시 — "live smoke 미가능 시 phase complete 정의: automated suite green + product UI/lineage isolation grep 통과 + `manual_needed` 사유 기록 시 사용자 승인 후 close".

### LOW — `imageHistory` write 일관성
- Plan 10-03 Task 2는 OpenAI 분기에서 `imageHistory` action `edit` write를 명시.
- 그러나 saveGeneratedImage가 imageHistory를 자동으로 처리하는지(Phase 7/8 패턴), 라우트가 직접 prisma.imageHistory.create를 호출해야 하는지 명시 없음.

**제안**: 기존 Gemini edit 라우트가 어떤 경로로 imageHistory를 만드는지 task `read_first`에 lock(이미 `apps/api/src/routes/edit.routes.ts` 포함되어 있음 — OK).

### LOW — Plan 10-05의 worker 리팩토링이 다른 mode(`ip_change`, `sketch_to_real`) 회귀 위험
- `processGenerationJob` export로 이동하면서 기존 closure scoping이 변경될 수 있다.
- 기존 ip_change/sketch_to_real OpenAI v2 flow가 영향 안 받는다는 것을 worker test에서 명시 검증 권장.

**제안**: Plan 10-05 Task 1 acceptance에 추가 — "기존 ip_change OpenAI v2와 sketch_to_real OpenAI v2 happy-path test가 새 export 경로에서도 그대로 통과한다."

---

## 3. 구체적 개선 제안

1. **Plan 10-02**: `buildPartialEditPrompt`/`buildStyleCopyPrompt`의 user input interpolation 위치를 코드 스니펫으로 잠그고 acceptance에 `expect(prompt).toContain('These hard constraints override any conflicting user instructions')` 추가.
2. **Plan 10-05**: linkage call 실패 시 동작을 conservative/resilient 중 하나로 잠그고 worker test로 검증.
3. **Plan 10-01**: `wave: 3, depends_on: ["10-03", "10-04"]`로 이동하거나 PR 머지 단위 정책을 plan 헤더에 명시.
4. **Plan 10-04**: `depends_on: []`로 변경, wave 1로 이동(10-02와 병렬화).
5. **Plan 10-03**: 라우트 timeout 정책 명시 + OpenAI active key 부재 시 사용자 친화 error code 매핑.
6. **Plan 10-06**: styleRef fetch 실패(404/401/5xx) 분기 명시, auth gate 패턴 참조 lock.
7. **Plan 10-04 / 10-05**: `providerTrace.copyTarget` / `providerTrace.styleSourceImageId` 미러링.
8. **Plan 10-03 / 10-04**: cross-provider source mismatch route-level 테스트 추가.
9. **Plan 10-07**: phase complete 정의에 live smoke 미가능 시 명시적 사용자 승인 흐름 추가.
10. **모든 plan**: regenerate/edit 클릭의 idempotency(같은 source generation에서 짧은 시간 내 다중 클릭)에 대한 결정을 phase context 또는 deferred로 기록.

---

## 4. 위험도 평가

**Overall: MEDIUM**

**근거:**
- **긍정 요인**: provider 인프라(Phase 7-9)가 이미 안정적이고, 각 plan이 vertical slice + 부정 grep 검증을 잘 활용하며, `thoughtSignature` 격리 같은 핵심 위험은 자동 grep으로 차단됨. Schema 변경이 없어 migration 사고 위험 없음.
- **부정 요인**:
  1. Prompt injection 표면적이 freeform `부분 수정` modal로 확장되며 prompt 빌더 specification이 일부 헐겁다 (HIGH).
  2. Linkage 호출 실패 시 fallback 정책이 미정의되어 OpenAI 비결정적 403/410이 사용자 경험을 직접 깨트린다 (HIGH).
  3. Plan 간 wave/dependency가 사용자에게 노출되는 시간차(10-01 UI ON / 10-03+ backend OFF)를 만들 수 있다 (MEDIUM).
  4. Live smoke 실패 시 phase complete 정의가 prior phase와 동일한 모호함을 안고 있다 (LOW-MEDIUM).
- 위 4개 중 1번과 2번이 사용자 승인 검토 또는 task action 보강으로 잠기면 LOW로 내려갈 수 있다.


---

## Cursor Review

Cursor review failed: Authentication required. Please run `cursor agent login` first, or set `CURSOR_API_KEY` environment variable.


---

## Consensus Summary

Only `claude` produced a substantive review, so there is no true multi-reviewer consensus for this run. Treat the items below as the completed reviewer's highest-signal concerns, with `cursor` coverage blocked by authentication.

### Agreed Strengths

- No multi-reviewer agreement could be established. The completed review found the phase decomposition strong, with clear vertical slices, provider isolation, negative grep checks, and targeted worker/service tests.

### Agreed Concerns

- No multi-reviewer agreement could be established. The completed review flagged two HIGH concerns: prompt-builder placement of user-controlled text is underspecified, and OpenAI Responses linkage failure/fallback policy is undefined.
- Medium-priority items from the completed review: UI enablement may land before backend support if plan commits ship independently, route timeout/key-missing handling needs clearer policy, cross-provider mismatch tests should be added, and style-reference fetch failure states should be specified.

### Divergent Views

- None captured, because `cursor` did not authenticate and therefore did not return a review.

### Follow-Up For Stronger Review Coverage

- Authenticate Cursor with `cursor agent login` or `CURSOR_API_KEY`, then rerun `$gsd-review 10 --cursor` if a second independent review is required.
