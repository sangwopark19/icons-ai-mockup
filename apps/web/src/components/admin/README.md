# Admin Components

관리자 페이지용 공통 컴포넌트 라이브러리

## Components

### 1. StatCard - 통계 카드

```tsx
import { StatCard } from '@/components/admin';
import { Users } from 'lucide-react';

<StatCard
  title="총 사용자"
  value={1234}
  icon={Users}
  trend={{ value: 12.5, isPositive: true }}
/>
```

**Props:**
- `title`: 카드 제목
- `value`: 통계 값 (문자열 또는 숫자)
- `icon`: Lucide 아이콘 컴포넌트
- `trend?`: 트렌드 표시 (`{ value: number, isPositive: boolean }`)

### 2. StatusBadge - 상태 배지

```tsx
import { StatusBadge } from '@/components/admin';

<StatusBadge status="completed" />
<StatusBadge status="processing" />
<StatusBadge status="pending" />
<StatusBadge status="failed" />
```

**Props:**
- `status`: 'pending' | 'processing' | 'completed' | 'failed'

**상태별 색상:**
- `pending`: 회색
- `processing`: 파랑 (애니메이션)
- `completed`: 초록
- `failed`: 빨강

### 3. DataTable - 데이터 테이블

```tsx
import { DataTable } from '@/components/admin';

const columns = [
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  {
    key: 'status',
    label: '상태',
    render: (user) => <StatusBadge status={user.status} />
  }
];

const data = [
  { id: '1', name: 'John', email: 'john@example.com', status: 'active' }
];

<DataTable
  columns={columns}
  data={data}
  onRowClick={(user) => console.log(user)}
/>
```

**Props:**
- `columns`: 컬럼 정의 배열
- `data`: 데이터 배열 (각 항목은 `id` 필드 필수)
- `onRowClick?`: 행 클릭 핸들러
- `emptyMessage?`: 빈 상태 메시지

### 4. ConfirmModal - 확인 모달

```tsx
import { ConfirmModal } from '@/components/admin';

const [isOpen, setIsOpen] = useState(false);

<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="사용자 삭제"
  message="정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
  confirmLabel="삭제"
  cancelLabel="취소"
  variant="danger"
/>
```

**Props:**
- `isOpen`: 모달 열림 상태
- `onClose`: 닫기 핸들러
- `onConfirm`: 확인 핸들러
- `title`: 모달 제목
- `message`: 확인 메시지
- `variant?`: 'danger' | 'warning' | 'info' (기본: 'danger')
- `confirmLabel?`: 확인 버튼 텍스트
- `cancelLabel?`: 취소 버튼 텍스트
- `isLoading?`: 로딩 상태

**키보드 단축키:**
- `ESC`: 모달 닫기

### 5. SearchFilter - 검색 + 필터

```tsx
import { SearchFilter } from '@/components/admin';

const [search, setSearch] = useState('');
const [status, setStatus] = useState('all');

<SearchFilter
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="사용자 검색..."
  filters={[
    {
      label: '상태',
      value: status,
      onChange: setStatus,
      options: [
        { label: '전체', value: 'all' },
        { label: '활성', value: 'active' },
        { label: '비활성', value: 'inactive' }
      ]
    }
  ]}
/>
```

**Props:**
- `searchValue`: 검색어
- `onSearchChange`: 검색어 변경 핸들러
- `searchPlaceholder?`: 검색 입력 플레이스홀더
- `filters?`: 필터 배열

**키보드 단축키:**
- `Cmd/Ctrl + K`: 검색 포커스

### 6. SidebarLink - 사이드바 링크

```tsx
import { SidebarLink } from '@/components/admin';
import { Home, Users, Settings } from 'lucide-react';

<nav>
  <SidebarLink href="/admin" icon={Home} label="대시보드" isActive />
  <SidebarLink href="/admin/users" icon={Users} label="사용자" badge={12} />
  <SidebarLink href="/admin/settings" icon={Settings} label="설정" />
</nav>
```

**Props:**
- `href`: 링크 경로
- `icon`: Lucide 아이콘 컴포넌트
- `label`: 링크 레이블
- `isActive?`: 활성 상태
- `badge?`: 배지 (숫자 또는 문자열)

## Design System

### Color Palette

모든 컴포넌트는 프로젝트의 디자인 시스템을 따릅니다:

- **Brand**: `brand-500` (메인 액센트)
- **Background**: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-elevated`
- **Text**: `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Border**: `--border-default`, `--border-hover`
- **Status**: green (성공), blue (진행중), gray (대기), red (실패/에러)

### Typography

- 본문: `text-sm` (14px)
- 제목: `text-xl` - `text-3xl`
- 작은 텍스트: `text-xs` (12px)
- 폰트: Pretendard Variable

### Spacing

- 작은 간격: `gap-1.5`, `gap-2`, `gap-3`
- 패딩: `px-3 py-2`, `px-4 py-3`, `px-6 py-4`
- 여백: `space-y-1.5`, `space-y-4`, `space-y-6`

### Animations

- 트랜지션: `transition-all duration-200`
- 호버 효과: `hover:scale-110`, `hover:bg-*`
- 펄스 애니메이션: `animate-ping` (processing 상태)

## Accessibility

모든 컴포넌트는 접근성을 고려하여 구현되었습니다:

- ✅ ARIA labels (`aria-label`, `aria-current`, `aria-modal`)
- ✅ 키보드 네비게이션 (ESC, Cmd/Ctrl+K)
- ✅ 포커스 표시 (`focus:ring`, `focus-visible:outline`)
- ✅ 스크린 리더 지원 (`sr-only`, `role`)

## Responsive Design

모든 컴포넌트는 반응형으로 설계되었습니다:

- 모바일: 기본 스타일
- 태블릿: `sm:*` 브레이크포인트
- 데스크톱: `md:*`, `lg:*` 브레이크포인트

## Usage Example

```tsx
'use client';

import { useState } from 'react';
import {
  StatCard,
  DataTable,
  StatusBadge,
  SearchFilter,
  ConfirmModal,
  SidebarLink
} from '@/components/admin';
import { Users, Activity, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  return (
    <div>
      {/* 통계 카드 */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="총 사용자"
          value={1234}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="활성 작업"
          value={56}
          icon={Activity}
        />
        <StatCard
          title="완료율"
          value="94.2%"
          icon={TrendingUp}
          trend={{ value: 2.3, isPositive: true }}
        />
      </div>

      {/* 검색 + 필터 */}
      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="사용자 검색..."
      />

      {/* 데이터 테이블 */}
      <DataTable
        columns={[
          { key: 'name', label: '이름' },
          { key: 'email', label: '이메일' },
          {
            key: 'status',
            label: '상태',
            render: (user) => <StatusBadge status={user.status} />
          }
        ]}
        data={users}
        onRowClick={(user) => setDeleteModal(user.id)}
      />

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
        title="사용자 삭제"
        message="정말로 삭제하시겠습니까?"
        variant="danger"
      />
    </div>
  );
}
```
