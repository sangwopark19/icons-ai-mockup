# Phase 2: Dashboard and User Management - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

관리자가 시스템 전체 현황을 한눈에 파악하는 대시보드(KPI 카드 + 실패율 차트)와, 사용자 계정의 전체 라이프사이클(목록 조회/검색/필터/정지/삭제/역할변경)을 관리하는 기능. DASH-01~05, USER-01~05 커버.

</domain>

<decisions>
## Implementation Decisions

### 대시보드 KPI 카드 구성
- 2x3 그리드 레이아웃 — 상단에 6개 KPI 카드 (전체 사용자, 전체 생성 건수, 실패 작업 수, 큐 깊이, 스토리지 사용량, 활성 API 키)
- 각 카드에 큰 수치 + 전일 대비 변화량 표시 (예: +12 ↑ 3.2%)
- 30초 자동 폴링으로 데이터 새로고침 (별도 수동 새로고침 버튼 없음)
- 로딩 시 카드 모양 스켈레톤 표시, 데이터 로드 후 실제 값으로 전환

### 실패율 차트 시각화
- KPI 카드 아래에 바 차트로 시간대별 실패 건수 표시
- 최근 24시간 고정 기간 (기간 전환 UI 없음)
- 차트 Y축: 실패 작업 절대 건수 (비율 아님)
- 차트 라이브러리: Recharts (React 19 호환은 react-is@19.0.0 pnpm override로 해결)

### 사용자 목록/검색 UI
- 테이블 칸럼: 이메일, 이름, role, status, 가입일, 마지막 로그인, 액션 버튼
- 오프셋 기반 페이지네이션 — 하단에 1 2 3 ... N 페이지 버튼
- 페이지당 20행
- 테이블 상단에 이메일 검색바 + role/status 필터 드롭다운 나란히 배치

### 사용자 계정 액션
- 각 행 오른쪽 끝에 ⋮ (더보기) 버튼 → 클릭 시 드롭다운 메뉴 (정지/해제, 삭제, 역할변경)
- 위험한 액션(정지/삭제)은 모달 확인 다이얼로그 — "정말 [user]를 정지하시겠습니까?" + 확인/취소 버튼
- 정지: status를 suspended로 변경. 기존 세션 유지, 다음 로그인/API 호출 시부터 차단
- 삭제: soft delete — status를 deleted로 변경, email → 'deleted_xxx@anon', name → '삭제된 사용자'로 익명화. passwordHash도 무효화. Generation/Image 레코드는 유지
- 역할변경: admin ↔ user 토글. 모달 확인 불필요 (드롭다운에서 바로 전환)

### Claude's Discretion
- KPI 카드 아이콘 선택 (lucide-react 사용)
- 스켈레톤 로딩 디자인 세부사항
- 변화량 표시 포맷 (색상, 화살표 등)
- Recharts 바 차트 색상/스타일링
- 빈 사용자 목록 상태 처리
- 검색 디바운스 시간
- 드롭다운 메뉴 구현 방식

</decisions>

<specifics>
## Specific Ideas

- Success Criteria에 명시된 30초 자동 새로고침 준수
- 정지된 사용자의 API 호출 거부 시 명확한 에러 반환 (기존 에러 형식 `{ success: false, error: { code: 'ACCOUNT_SUSPENDED', message } }`)
- soft delete 시 생성 레코드는 반드시 유지 — 통계/모니터링 데이터 보존 목적

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/src/components/ui/button.tsx`, `input.tsx`: 기존 UI 컴포넌트 — 테이블, 검색바, 모달에서 재사용
- `apps/api/src/plugins/auth.plugin.ts`: authenticate + requireAdmin 미들웨어 — 모든 admin API 엔드포인트에 적용
- `apps/web/src/stores/auth.store.ts`: Zustand persist store — role/status 정보 이미 포함
- `apps/web/src/app/admin/dashboard/page.tsx`, `apps/web/src/app/admin/users/page.tsx`: Phase 1에서 생성된 stub 페이지

### Established Patterns
- JWT 인증: `@fastify/jwt` 플러그인 + auth.plugin.ts 데코레이터 패턴
- 에러 응답: `{ success: false, error: { code, message } }` 일관된 형식
- Zod 검증: 모든 라우트에서 Zod 스키마로 입력 검증
- CVA + Tailwind + CSS 변수: 컴포넌트 스타일링 패턴
- 서비스 싱글톤: `export const xxxService = new XxxService()`

### Integration Points
- `apps/api/src/server.ts`: 새 admin 라우트 등록 위치 (admin.routes.ts 또는 개별 라우트)
- `apps/api/prisma/schema.prisma`: User 모델에 role(UserRole), status(UserStatus) enum 이미 존재
- `apps/web/src/app/admin/`: dashboard, users 디렉토리 이미 존재 (stub 페이지)
- BullMQ 큐: `apps/api/src/lib/queue.ts` — 큐 깊이 조회에 사용

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-dashboard-and-user-management*
*Context gathered: 2026-03-11*
