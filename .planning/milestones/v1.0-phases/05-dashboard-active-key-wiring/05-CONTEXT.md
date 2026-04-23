# Phase 5: Dashboard Active Key Display Wiring - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 백엔드가 이미 반환하는 활성 API 키 데이터(`{ alias, callCount } | null`)를 Phase 2에서 만든 대시보드 KPI 카드에 실제로 연결한다. DASH-04 gap closure.

</domain>

<decisions>
## Implementation Decisions

### 타입 수정
- `apps/web/src/lib/api.ts`의 `DashboardStats.activeApiKeys` 타입을 `null`에서 `{ alias: string; callCount: number } | null`로 변경 — 백엔드 타입과 일치시킴

### 활성 키 표시 형식
- KPI 카드의 주요 값(value)으로 callCount 표시 (숫자 포맷)
- alias는 카드 하단 보조 텍스트로 표시 (예: "키: Production")
- `placeholder` prop 제거, 실제 데이터 바인딩

### 비활성 상태 fallback
- `activeApiKeys`가 null일 때 value에 "없음" 텍스트 표시
- 보조 텍스트로 "활성 키 미설정" 표시
- 경고 스타일 불필요 — 단순 정보 표시로 충분

### Claude's Discretion
- KPI 카드 내 보조 텍스트 스타일링 세부사항
- delta(전일 대비) 표시 여부 — callCount는 누적 값이므로 delta 미적용이 적절

</decisions>

<specifics>
## Specific Ideas

No specific requirements — 기존 KPI 카드 패턴을 따르되 activeApiKeys 데이터를 실제로 바인딩하는 것이 핵심

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `KpiCard` 컴포넌트 (`apps/web/src/components/admin/kpi-card.tsx`): label, value, icon, delta, format, placeholder props 지원
- `KpiSkeleton` 컴포넌트: 로딩 상태 이미 처리됨

### Established Patterns
- 대시보드 30초 폴링: `useEffect` + `setInterval` (Phase 2 패턴)
- `adminApi.getDashboardStats()` → `stats.activeApiKeys` 경로로 데이터 접근
- `Key` 아이콘 (lucide-react) 이미 import됨

### Integration Points
- `apps/web/src/lib/api.ts:195` — `DashboardStats.activeApiKeys` 타입 수정 필요
- `apps/web/src/app/admin/dashboard/page.tsx:100-105` — KPI 카드 하드코딩 → 실제 데이터 바인딩
- 백엔드 변경 불필요 — `admin.service.ts`가 이미 `{ alias, callCount } | null` 반환 중

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-dashboard-active-key-wiring*
*Context gathered: 2026-03-12*
