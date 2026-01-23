# UI 컴포넌트 사용 가이드

## Checkbox 컴포넌트

### 기본 사용

```tsx
import { Checkbox } from '@/components/ui/checkbox';

function Example() {
  const [checked, setChecked] = React.useState(false);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      label="이용약관에 동의합니다"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | 체크박스 레이블 |
| `description` | `string` | - | 체크박스 설명 텍스트 |
| `error` | `string` | - | 에러 메시지 |
| `checked` | `boolean` | - | 체크 상태 (controlled) |
| `onCheckedChange` | `(checked: boolean) => void` | - | 상태 변경 콜백 |
| `disabled` | `boolean` | `false` | 비활성화 상태 |

### 예제

```tsx
// 에러 상태
<Checkbox
  checked={accepted}
  onCheckedChange={setAccepted}
  label="필수 동의 항목"
  error="이용약관에 동의해주세요"
/>

// 설명이 있는 체크박스
<Checkbox
  checked={newsletter}
  onCheckedChange={setNewsletter}
  label="뉴스레터 구독"
  description="새로운 소식과 업데이트를 이메일로 받아보세요"
/>
```

### 접근성

- ✅ ARIA 속성 지원 (`aria-checked`, `aria-describedby`, `aria-invalid`)
- ✅ 키보드 네비게이션 (Space 키로 토글)
- ✅ 스크린리더 호환
- ✅ 포커스 표시

---

## Textarea 컴포넌트

### 기본 사용

```tsx
import { Textarea } from '@/components/ui/textarea';

function Example() {
  const [value, setValue] = React.useState('');

  return (
    <Textarea
      label="설명"
      placeholder="내용을 입력하세요"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | 레이블 텍스트 |
| `description` | `string` | - | 설명 텍스트 |
| `error` | `string` | - | 에러 메시지 |
| `resize` | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | 크기 조절 방향 |
| `disabled` | `boolean` | `false` | 비활성화 상태 |
| `readOnly` | `boolean` | `false` | 읽기 전용 상태 |
| `required` | `boolean` | `false` | 필수 입력 여부 |
| `rows` | `number` | - | 기본 행 수 |
| `placeholder` | `string` | - | 플레이스홀더 텍스트 |

### 예제

```tsx
// 에러 상태
<Textarea
  label="피드백"
  error="최소 10자 이상 입력해주세요"
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)}
/>

// 필수 입력
<Textarea
  label="상세 설명"
  description="제품에 대한 자세한 설명을 입력하세요"
  required
  rows={5}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

// 읽기 전용
<Textarea
  label="생성된 프롬프트"
  readOnly
  resize="none"
  value={generatedPrompt}
/>
```

### 접근성

- ✅ ARIA 속성 지원 (`aria-label`, `aria-invalid`, `aria-describedby`, `aria-required`)
- ✅ 키보드 네비게이션
- ✅ 스크린리더 호환
- ✅ 포커스 표시
- ✅ 필수 입력 표시 (*)

---

## 디자인 시스템

모든 컴포넌트는 다음과 같은 일관된 디자인 토큰을 사용합니다:

### 색상 변수

```css
--text-primary      /* 주요 텍스트 */
--text-secondary    /* 보조 텍스트 (레이블 등) */
--text-tertiary     /* 설명 텍스트, 플레이스홀더 */
--bg-primary        /* 기본 배경 */
--bg-elevated       /* 높은 레벨 배경 (hover 등) */
--bg-tertiary       /* 입력 필드 배경 */
--border-default    /* 기본 테두리 */
--border-hover      /* hover 테두리 */
```

### 브랜드 색상

```css
brand-500          /* 기본 브랜드 색상 (focus, checked 등) */
brand-400          /* 밝은 브랜드 색상 */
brand-600          /* 어두운 브랜드 색상 */
```

### 상태 색상

```css
red-500            /* 에러 상태 */
```

---

## 컴포넌트 테스트

### 체크박스 테스트 체크리스트

- [ ] 기본 렌더링
- [ ] 체크/언체크 상태 변화
- [ ] 키보드 네비게이션 (Space 키)
- [ ] disabled 상태
- [ ] 에러 상태 표시
- [ ] ARIA 속성 검증
- [ ] 스크린리더 호환성

### 텍스트에어리어 테스트 체크리스트

- [ ] 기본 렌더링
- [ ] 값 입력/변경
- [ ] 포커스 관리
- [ ] resize 동작
- [ ] readOnly 상태
- [ ] required 표시
- [ ] 에러 상태 표시
- [ ] ARIA 속성 검증
- [ ] 스크린리더 호환성

---

## 참고

- 모든 컴포넌트는 React 19.x와 호환됩니다
- Tailwind CSS 4.x를 사용합니다
- shadcn/ui 스타일 가이드를 따릅니다
- `forwardRef`를 사용하여 ref 전달을 지원합니다
- `useId`를 사용하여 접근성을 보장합니다
