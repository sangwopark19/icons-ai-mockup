# Phase 5: Dashboard Active Key Display Wiring - Research

**Researched:** 2026-03-12
**Domain:** TypeScript type synchronization + React KPI card data binding
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `apps/web/src/lib/api.ts`의 `DashboardStats.activeApiKeys` 타입을 `null`에서 `{ alias: string; callCount: number } | null`로 변경 — 백엔드 타입과 일치시킴
- KPI 카드의 주요 값(value)으로 callCount 표시 (숫자 포맷)
- alias는 카드 하단 보조 텍스트로 표시 (예: "키: Production")
- `placeholder` prop 제거, 실제 데이터 바인딩
- `activeApiKeys`가 null일 때 value에 "없음" 텍스트 표시
- 보조 텍스트로 "활성 키 미설정" 표시
- 경고 스타일 불필요 — 단순 정보 표시로 충분

### Claude's Discretion
- KPI 카드 내 보조 텍스트 스타일링 세부사항
- delta(전일 대비) 표시 여부 — callCount는 누적 값이므로 delta 미적용이 적절

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-04 | 활성 Gemini API 키 정보 및 호출 횟수 표시 | 백엔드가 이미 `{ alias, callCount } \| null`을 반환하며 프론트엔드 타입과 KPI 카드 렌더링만 수정하면 된다 |
</phase_requirements>

---

## Summary

Phase 5는 두 파일만 수정하는 단순 gap closure다. 백엔드(`apps/api/src/services/admin.service.ts`)는 Phase 4에서 이미 `activeApiKeys: { alias: string; callCount: number } | null`을 정확히 반환하고 있다. 프론트엔드 타입(`apps/web/src/lib/api.ts` line 195)이 `null`로 고정되어 있어 백엔드 응답을 버리고 있을 뿐이다.

수정 범위는 명확하다: (1) `DashboardStats.activeApiKeys` 타입을 `{ alias: string; callCount: number } | null`로 업데이트하고, (2) `apps/web/src/app/admin/dashboard/page.tsx`의 활성 API 키 KPI 카드에서 하드코딩된 `value="N/A"` / `placeholder={true}`를 실제 `stats.activeApiKeys` 데이터 바인딩으로 교체한다.

`KpiCard` 컴포넌트는 `value: number | string`을 받으므로 추가 수정 없이 callCount(number)와 "없음"(string) 모두 처리 가능하다. 보조 텍스트(alias 또는 "활성 키 미설정")는 현재 delta 슬롯(`<p className="text-sm text-[var(--text-secondary)]">—</p>`)을 활용하거나, KpiCard의 delta prop 대신 별도 텍스트 노드로 렌더링한다.

**Primary recommendation:** `KpiCard`의 `placeholder` prop을 제거하고, `value`를 `stats.activeApiKeys?.callCount ?? '없음'`으로, 하단 보조 텍스트를 조건부 alias 또는 "활성 키 미설정"으로 렌더링한다. `KpiCard` 컴포넌트 자체는 수정하지 않는다.

---

## Standard Stack

### Core (모두 이미 설치됨, 신규 설치 없음)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | 타입 정의 수정 | 프로젝트 표준 |
| React 19 | 19.2.3 | 'use client' 컴포넌트 렌더링 | 프로젝트 표준 |
| lucide-react | (설치됨) | `Key` 아이콘 — 이미 import됨 | 프로젝트 표준 |
| Intl.NumberFormat | 네이티브 | callCount 숫자 포맷 | `KpiCard` 내부에서 이미 사용 |

**Installation:** 없음 — 신규 패키지 설치 불필요

---

## Architecture Patterns

### 현재 파일 구조 (수정 대상만)

```
apps/web/src/
├── lib/
│   └── api.ts                        # DashboardStats 타입 수정 (line 195)
└── app/admin/dashboard/
    └── page.tsx                       # KPI 카드 렌더링 수정 (lines 100-105)

apps/api/src/services/
└── admin.service.ts                   # 수정 불필요 — 이미 올바른 타입 반환
```

### Pattern 1: 타입 동기화 — 프론트엔드가 백엔드 인터페이스를 미러링

**What:** 백엔드 `DashboardStats` 인터페이스(`admin.service.ts` line 13)가 정답. 프론트엔드 `DashboardStats` (`api.ts` line 195)를 일치시킨다.

**Current backend type (verified, HIGH confidence):**
```typescript
// apps/api/src/services/admin.service.ts — already correct
export interface DashboardStats {
  // ...
  activeApiKeys: { alias: string; callCount: number } | null;
  // ...
}
```

**Frontend type to fix:**
```typescript
// apps/web/src/lib/api.ts line 195 — BEFORE
activeApiKeys: null;

// apps/web/src/lib/api.ts line 195 — AFTER
activeApiKeys: { alias: string; callCount: number } | null;
```

### Pattern 2: KpiCard 조건부 렌더링 — null 분기 처리

**What:** `stats.activeApiKeys`가 null일 때와 아닐 때를 삼항 또는 옵셔널 체이닝으로 처리.

**Current KpiCard props signature (verified):**
```typescript
// apps/web/src/components/admin/kpi-card.tsx
interface KpiCardProps {
  label: string;
  value: number | string;   // string "없음"을 그대로 받을 수 있음
  icon: React.ReactNode;
  delta?: { value: number; percentage: number } | null;
  format?: 'number' | 'bytes';
  placeholder?: boolean;    // 제거할 prop
}
```

**Target rendering pattern:**
```tsx
// apps/web/src/app/admin/dashboard/page.tsx lines 100-105 — AFTER
<KpiCard
  label="활성 API 키"
  value={stats.activeApiKeys ? stats.activeApiKeys.callCount : '없음'}
  icon={<Key className="h-5 w-5" />}
  // delta 미적용 — callCount는 누적값
/>
{/* alias 보조 텍스트는 KpiCard 내부 delta 슬롯이 "--" 를 표시하는 현재 패턴을 활용하거나,
    KpiCard를 래핑하는 div 내부에 별도 텍스트를 렌더링한다.
    KpiCard 자체를 수정하지 않는다면 delta slot의 텍스트가 "—"로 표시됨 — 허용 가능.
    alias 표시가 필요하다면 KpiCard 외부에서 래핑 div + 절대 위치 텍스트 방식 사용. */}
```

**보조 텍스트(alias) 처리 옵션 (Claude의 재량):**

옵션 A — KpiCard의 delta slot 재활용 불가 (delta는 `{ value: number; percentage: number }` 타입이므로 문자열 불가). 결론: alias 텍스트를 표시하려면 KpiCard를 수정하거나, 카드 아래에 별도 텍스트 엘리먼트를 추가한다.

옵션 B (권장) — KpiCard를 래핑하는 div에 `<p>` 태그 추가:
```tsx
<div className="relative">
  <KpiCard
    label="활성 API 키"
    value={stats.activeApiKeys ? stats.activeApiKeys.callCount : '없음'}
    icon={<Key className="h-5 w-5" />}
  />
  {/* 카드 내부 스타일이 이미 보조 텍스트 슬롯("—")을 점유하므로
      외부 래핑보다 KpiCard에 subtitle prop 추가가 더 깔끔 */}
</div>
```

옵션 C (가장 깔끔) — `KpiCard`에 `subtitle?: string` prop 추가:
```typescript
// kpi-card.tsx props 확장
interface KpiCardProps {
  // ...기존 props...
  subtitle?: string;  // alias 표시용 보조 텍스트
}
// 렌더링: delta slot을 subtitle로 대체 또는 병행
```

**결론:** alias 표시는 Claude의 재량 영역이다. 옵션 C(subtitle prop)가 가장 clean하고 기존 delta 렌더링과 충돌이 없다. 단, KpiCard 변경이 수반된다. 옵션 B는 KpiCard를 건드리지 않는 대신 마크업이 지저분해진다.

### Anti-Patterns to Avoid

- **`placeholder={true}` 유지:** 제거해야 한다. placeholder가 true면 displayValue가 항상 'N/A'로 고정된다.
- **`format="number"` 명시 안 함:** `value`가 number일 때 `format` 기본값이 'number'이므로 명시 불필요하지만, string("없음") 전달 시 formatNumber가 호출되지 않음을 확인 — `typeof value === 'string'` 분기가 이미 존재하므로 안전.
- **백엔드 수정:** `admin.service.ts`는 이미 올바르다. 건드리지 않는다.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 숫자 포맷 | 직접 toLocaleString | `KpiCard` 내부 `formatNumber` (Intl.NumberFormat) | 이미 구현됨 |
| null 안전 접근 | try/catch | 옵셔널 체이닝 `?.` | TS 표준 |

---

## Common Pitfalls

### Pitfall 1: `placeholder` prop을 제거하지 않으면 값이 항상 'N/A'

**What goes wrong:** `KpiCard.displayValue` 로직이 `if (placeholder) return 'N/A'`를 최우선으로 처리한다. `placeholder={true}`를 남겨두면 `value`에 무엇을 넣어도 'N/A'가 표시된다.

**How to avoid:** `placeholder` prop을 완전히 제거(undefined가 됨 → false로 평가).

### Pitfall 2: `value`에 number를 전달할 때 KpiCard의 `format` 기본값 확인

**What goes wrong:** `format` 기본값이 'number'이므로 callCount(예: 42)는 "42"로 포맷됨. 이는 의도한 동작이다. 문제없음.

### Pitfall 3: 타입 수정 후 TypeScript 에러 전파

**What goes wrong:** `api.ts`에서 타입을 바꾸면, 해당 타입을 쓰는 `page.tsx`의 기존 코드(`value="N/A"`)는 에러 없이 컴파일된다 — string은 `value: number | string`에 허용되기 때문. 하지만 `activeApiKeys`를 null로 단언하는 다른 코드가 있으면 에러 발생 가능.

**How to avoid:** 타입 변경 후 `npm run typecheck` 실행. 이 프로젝트에 별도의 `activeApiKeys` 사용처가 없음을 확인(grep 결과: dashboard page.tsx가 유일).

**Warning signs:** `npm run typecheck` 실패 시 다른 파일에서 `activeApiKeys`를 `null`로 단언하는 코드 탐색.

---

## Code Examples

Verified patterns from source files:

### 최종 KpiCard 렌더링 패턴 (dashboard/page.tsx)

```tsx
// Source: apps/web/src/app/admin/dashboard/page.tsx (현재 lines 100-105, 수정 후)
<KpiCard
  label="활성 API 키"
  value={stats.activeApiKeys ? stats.activeApiKeys.callCount : '없음'}
  icon={<Key className="h-5 w-5" />}
/>
```

alias 보조 텍스트가 필요하다면 subtitle prop을 KpiCard에 추가:

```tsx
// kpi-card.tsx — subtitle prop 추가 시
<p className="text-sm text-[var(--text-secondary)]">
  {subtitle ?? '—'}
</p>
```

```tsx
// dashboard/page.tsx — subtitle 사용 시
<KpiCard
  label="활성 API 키"
  value={stats.activeApiKeys ? stats.activeApiKeys.callCount : '없음'}
  icon={<Key className="h-5 w-5" />}
  subtitle={stats.activeApiKeys ? `키: ${stats.activeApiKeys.alias}` : '활성 키 미설정'}
/>
```

### 타입 수정 패턴 (api.ts)

```typescript
// Source: apps/web/src/lib/api.ts — BEFORE line 195
activeApiKeys: null;

// AFTER — 백엔드 admin.service.ts와 동기화
activeApiKeys: { alias: string; callCount: number } | null;
```

---

## Validation Architecture

`workflow.nyquist_validation: true` — 포함.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (apps/api), 웹 앱에 별도 테스트 프레임워크 없음 |
| Config file | apps/api/vitest.config.* (또는 package.json scripts.test) |
| Quick run command | `cd apps/api && pnpm test` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-04 | `activeApiKeys` 타입이 `{ alias, callCount } \| null`임 | manual (TypeScript check) | `npm run typecheck` (monorepo root) | ✅ (typecheck만) |
| DASH-04 | 활성 키 있을 때 callCount 표시 | manual (visual) | 브라우저에서 `/admin` 확인 | ❌ no web tests |
| DASH-04 | 활성 키 없을 때 "없음" 표시 | manual (visual) | 브라우저에서 `/admin` 확인 | ❌ no web tests |

**Note:** 웹 앱(`apps/web`)에 테스트 파일이 없다. 기존 패턴(Phase 2~4)에서도 대시보드 UI는 시각적 수동 검증으로 처리했다. `npm run typecheck`가 타입 정확성을 자동 검증하는 유일한 수단이다.

### Sampling Rate

- **Per task commit:** `npm run typecheck` (monorepo root)
- **Per wave merge:** `npm run typecheck` + 브라우저 수동 확인
- **Phase gate:** TypeScript clean + 브라우저에서 활성 키 callCount/alias 표시 확인

### Wave 0 Gaps

웹 앱 테스트 인프라 없음 — 기존 프로젝트 패턴과 동일하므로 이 Phase에서 추가 설치하지 않는다.

None — existing infrastructure (typecheck + manual visual) covers all phase requirements per project pattern.

---

## Open Questions

1. **alias 보조 텍스트 표시 방법**
   - What we know: `KpiCard`의 delta slot은 `{ value: number; percentage: number }` 타입이므로 문자열 직접 전달 불가
   - What's unclear: KpiCard에 subtitle prop을 추가할지, 외부에서 래핑할지
   - Recommendation: subtitle prop 추가(옵션 C)가 가장 clean. 변경 범위가 kpi-card.tsx 한 군데이고 다른 KpiCard 사용처에 영향 없음(prop이 optional이므로).

---

## Sources

### Primary (HIGH confidence)

- `apps/api/src/services/admin.service.ts` — 백엔드 `DashboardStats` 인터페이스 및 `getDashboardStats()` 구현 직접 확인
- `apps/web/src/lib/api.ts` (lines 189-199) — 프론트엔드 `DashboardStats` 타입 직접 확인
- `apps/web/src/app/admin/dashboard/page.tsx` — 대시보드 페이지 렌더링 로직 직접 확인
- `apps/web/src/components/admin/kpi-card.tsx` — KpiCard props 인터페이스 및 displayValue 로직 직접 확인

### Secondary (MEDIUM confidence)

- `.planning/phases/05-dashboard-active-key-wiring/05-CONTEXT.md` — 사용자 결정사항 확인
- `.planning/STATE.md` — 프로젝트 패턴 및 이전 Phase 결정사항 확인

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 신규 라이브러리 없음, 기존 코드만 수정
- Architecture: HIGH — 두 파일 수정, 패턴 완전히 파악됨
- Pitfalls: HIGH — `placeholder` prop 제거가 핵심 함정, 직접 코드에서 확인

**Research date:** 2026-03-12
**Valid until:** Phase 완료 시까지 (코드베이스 변경이 없으면 영구적)
