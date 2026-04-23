# Phase 3: Generation and Content Monitoring - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 전체 사용자의 생성 작업(Generation)을 상태별로 모니터링하고, 실패 작업을 진단/재시도하며, 생성된 이미지 콘텐츠를 검색/브라우징/삭제(개별+대량)하는 기능. GEN-01~03, CONT-01~04 커버.

</domain>

<decisions>
## Implementation Decisions

### 생성 작업 목록/필터 UI
- 테이블 칼럼: 사용자 이메일, 모드(ip_change/sketch_to_real), 상태, 생성일, 에러 메시지(실패 시) — 핵심 정보만 표시
- 상태 필터: 테이블 위에 탭 버튼 배치 — "전체 | 대기중 | 처리중 | 완료 | 실패" + 각 탭에 건수 배지 표시
- 사용자 이메일 검색바를 탭 옆에 배치 (Phase 2 검색 패턴과 동일)
- 오프셋 기반 페이지네이션 — 하단 페이지 버튼, 페이지당 20행 (Phase 2와 동일)
- 30초 자동 폴링으로 데이터 새로고침 (대시보드와 동일한 주기)

### 실패 작업 진단/재시도
- 실패 행의 '상세보기' 버튼 클릭 시 모달 팝업으로 에러 상세 표시 — 에러 메시지, 생성 옵션(promptData, options), 재시도 횟수(retryCount) 포함
- 모달 하단에 '재시도' 버튼 배치 — 에러 확인 후 바로 재시도 가능 (이중 접근: 테이블 행 버튼 + 모달 내 버튼)
- 재시도 클릭 시 확인 다이얼로그 없이 바로 BullMQ 큐에 재투입 — 재시도는 위험도 낮은 액션
- 재시도 후 해당 작업의 status를 failed → pending으로 즉시 변경하여 테이블에 반영
- 성공 토스트 알림 표시

### 콘텐츠 검색/브라우징
- 이미지 그리드 레이아웃으로 표시 — 각 카드에 썸네일 + 사용자명 + 날짜 + 프로젝트명 (GeneratedImage의 thumbnailPath 활용)
- 상단 필터 바: 사용자 이메일 검색 + 날짜 범위 선택(date picker) + 프로젝트 드롭다운 — 한 줄 배치
- 특정 사용자 생성 이력 조회는 콘텐츠 페이지의 사용자 필터로 통합 (별도 페이지 없음)
- 이미지 클릭 시 라이트박스로 원본 크기 확대 + 하단에 메타데이터(크기, 해상도, 날짜, 사용자, 프로젝트) + 삭제 버튼
- 오프셋 기반 페이지네이션 (그리드 하단)

### 이미지 삭제 (개별/대량)
- 개별 삭제: 라이트박스 상세에서 삭제 버튼 클릭 → 모달 확인 다이얼로그 후 실행
- 대량 삭제: 필터 기반 — 현재 검색 필터(사용자/날짜/프로젝트) 조건에 매칭되는 이미지 일괄 삭제
- 대량 삭제 확인 UX: 모달에 "필터 조건에 매칭되는 N건의 이미지를 삭제합니다" 건수 표시 + 이중 확인(확인 버튼)
- Hard delete 방식 — DB 레코드(GeneratedImage) 삭제 + 파일시스템에서 이미지+썸네일 삭제. Generation 레코드는 유지(통계용)
- 삭제 완료 후 그리드 자동 새로고침

### Claude's Discretion
- 그리드 카드 레이아웃 세부 디자인 (카드 크기, 간격, 반응형 칼럼 수)
- 라이트박스 구현 방식 (라이브러리 선택 또는 직접 구현)
- 탭 버튼 스타일링 (배지 색상, 활성/비활성 상태)
- 날짜 범위 선택 UI 구현 방식
- 에러 상세 모달 레이아웃
- 대량 삭제 진행 중 로딩 처리
- 빈 콘텐츠 상태 메시지

</decisions>

<specifics>
## Specific Ideas

- 생성 작업 모니터링과 콘텐츠 브라우징은 같은 사이드바 메뉴("생성/콘텐츠") 아래 별도 탭 또는 서브 페이지로 구분
- Phase 2에서 확립한 패턴 재사용: 테이블 페이지네이션(20행), 위험 액션 모달 확인, 30초 폴링, 에러 응답 형식
- 재시도는 위험도 낮은 액션이므로 확인 없이 바로 실행 — 삭제와 명확히 구분
- 대량 삭제의 건수 표시는 필수 — 실수로 전체 삭제 방지

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/services/admin.service.ts`: AdminService 클래스 — Phase 3 API 메서드 추가 위치 (getDashboardStats, listUsers 등 이미 존재)
- `apps/api/src/services/generation.service.ts`: GenerationService — 기존 생성 CRUD 로직, admin용 전체 조회/재시도 메서드 추가 가능
- `apps/api/src/lib/queue.ts`: generationQueue(BullMQ) — 재시도 시 addGenerationJob으로 큐에 재투입
- `apps/api/src/services/upload.service.ts`: UploadService — 파일시스템 삭제 시 baseDir(config.uploadDir) 참조
- `apps/web/src/app/admin/content/`: Phase 1에서 생성된 stub 페이지 — 콘텐츠 관리 UI 구현 위치
- Phase 2에서 만든 테이블/검색/페이지네이션/모달 컴포넌트 재사용 가능

### Established Patterns
- JWT 인증 + requireAdmin 미들웨어 — 모든 admin API 엔드포인트에 적용
- 에러 응답: `{ success: false, error: { code, message } }` 형식
- Zod 스키마 검증 — 모든 라우트 입력값
- useEffect + setInterval 30초 폴링 패턴 (Phase 2 대시보드)
- 서비스 싱글톤 패턴: `export const xxxService = new XxxService()`

### Integration Points
- `apps/api/src/server.ts`: admin 라우트에 generation/content 엔드포인트 추가
- `apps/api/prisma/schema.prisma`: Generation 모델(status, mode, errorMessage, retryCount 필드), GeneratedImage 모델(filePath, thumbnailPath, fileSize, width, height 필드) 이미 존재 — 스키마 변경 불필요
- `apps/web/src/app/admin/content/page.tsx`: 콘텐츠 관리 페이지 stub
- BullMQ generationQueue: 큐 상태 조회(getJobCounts) + 작업 추가(addGenerationJob)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-generation-and-content-monitoring*
*Context gathered: 2026-03-11*
