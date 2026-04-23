# Phase 4: API Key Management - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 여러 Gemini API 키를 DB에 등록/삭제/전환하고, GeminiService가 .env 대신 DB의 활성 키를 사용하도록 리팩토링. 키별 호출 횟수 표시. KEY-01~06 커버. 자동 로테이션은 v2 범위.

</domain>

<decisions>
## Implementation Decisions

### 키 목록/관리 UI
- 테이블 레이아웃 (Phase 2/3와 동일 패턴)
- 칼럼: 별칭, 마스킹된 키(마지막 4자리), 상태(활성/비활성), 호출 횟수, 등록일, 마지막 사용일, 액션 버튼
- 활성 키 행은 상태 칼럼에 시각적 강조 (배지)
- 활성 키에는 삭제/활성화 버튼 비노출

### 키 추가
- 테이블 상단 '키 추가' 버튼 클릭 → 모달에서 별칭 + API 키 입력
- API 키는 AES-256-GCM 암호화 저장, 전체 값은 API 응답에 절대 포함하지 않음 (마지막 4자리만 반환)

### 키 삭제
- 모달 확인 다이얼로그 ('키 [별칭]을 삭제합니다' + 확인 버튼)
- 활성 키는 삭제 버튼 비활성화 — 다른 키로 전환 후에만 삭제 가능

### 키 전환 UX
- 활성화 클릭 시 모달 확인 ('활성 키를 [별칭]으로 전환합니다. 새 생성 작업부터 이 키를 사용합니다.')
- 전환 성공 시 토스트 알림 + 테이블 상태 칼럼 즉시 갱신
- 이미 큐에 들어간 진행 중인 작업은 기존 키로 마무리 — Worker가 작업 처리 시점에 활성 키를 조회하므로 자연스럽게 처리됨

### 활성 키 없음 처리
- DB에 활성 키가 없으면 명확한 에러 throw ('Gemini API 키가 설정되지 않았습니다')
- .env fallback 절대 금지 — process.env.GEMINI_API_KEY를 참조하지 않음
- 생성 작업은 failed 상태로 에러 메시지 기록

### GeminiService 리팩토링
- 메서드에 apiKey 파라미터 주입 방식: generateIPChange(apiKey, sourceImage, characterImage, options)
- constructor에서 this.ai 제거 — 각 메서드에서 new GoogleGenAI({ apiKey }) 생성
- Worker가 작업 처리 시점에 DB에서 활성 키 조회 → 복호화 → GeminiService 메서드에 전달
- 작업별 1회 DB 조회 (캐싱 없음, 현재 트래픽 규모에서 충분)

### 호출 횟수 추적
- ApiKey 모델에 callCount 필드 추가
- Worker에서 Gemini API 실제 호출 시점에 increment (실패 호출도 카운트 — Google API 사용량과 일치)
- 마지막 사용일(lastUsedAt) 필드도 함께 업데이트

### 초기 마이그레이션 정책
- .env 키 자동 마이그레이션 없음 — 관리자가 admin UI에서 직접 키 등록 필요
- config.ts의 GEMINI_API_KEY 환경변수는 optional로 유지하되 GeminiService에서 참조하지 않음

### Claude's Discretion
- ApiKey Prisma 모델 상세 설계 (필드명, 인덱스)
- AES-256-GCM 암호화 키 관리 방식 (환경변수 기반 encryption key)
- 키 추가/삭제 모달 세부 레이아웃
- 테이블 행 스타일링 (활성 키 배지 색상)
- 토스트 알림 디자인
- Worker에서 키 조회 + 복호화 로직 배치 위치

</decisions>

<specifics>
## Specific Ideas

- Phase 2/3에서 확립한 패턴 재사용: 테이블 페이지네이션(필요 시), 위험 액션 모달 확인, 토스트 알림
- 키 전환은 라이브 파이프라인 변경이므로 재시도(Phase 3)보다 높은 확인 수준 적용
- 호출 횟수는 Google API 실제 사용량 기준 — 성공/실패 모두 카운트
- 키 수가 적으므로 (보통 2-5개) 페이지네이션 불필요할 수 있음

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/services/admin.service.ts`: AdminService — 키 관리 CRUD 메서드 추가 위치
- `apps/api/src/services/gemini.service.ts`: GeminiService 싱글톤 — 리팩토링 대상. constructor에서 `config.geminiApiKey || process.env.GEMINI_API_KEY` 사용 중
- `apps/api/src/worker.ts`: BullMQ Worker — Gemini API 호출 전 활성 키 조회 로직 추가 위치. geminiService 메서드 호출부 수정 필요
- `apps/api/src/config/index.ts`: GEMINI_API_KEY는 optional — GeminiService에서 더 이상 참조하지 않도록 변경
- Phase 2/3 프론트엔드 테이블, 모달 확인, 토스트 패턴 재사용

### Established Patterns
- JWT 인증 + requireAdmin 미들웨어 — 모든 admin API
- 에러 응답: `{ success: false, error: { code, message } }` 형식
- Zod 스키마 검증 — 모든 라우트 입력값
- 서비스 싱글톤: `export const xxxService = new XxxService()`
- 위험 액션 모달 확인 (Phase 2 삭제, Phase 3 대량 삭제)

### Integration Points
- `apps/api/prisma/schema.prisma`: ApiKey 모델 추가 + 마이그레이션 필요
- `apps/api/src/server.ts`: admin 라우트에 api-key 엔드포인트 추가
- `apps/web/src/app/admin/`: API Key 관리 페이지 추가 (사이드바에 메뉴 이미 존재할 수 있음)
- `apps/web/src/lib/api.ts`: adminApi에 키 관리 함수 추가

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-api-key-management*
*Context gathered: 2026-03-12*
