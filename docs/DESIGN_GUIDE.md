# Design Guide
# AI 목업 이미지 프로그램 - 디자인 가이드

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-01-07 |
| 상태 | Draft |

---

## 1. 디자인 원칙

### 1.1 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **명확함 (Clarity)** | 사용자가 즉시 이해할 수 있는 직관적인 인터페이스 |
| **효율성 (Efficiency)** | 최소한의 클릭으로 목표 달성 |
| **일관성 (Consistency)** | 전체 앱에서 동일한 패턴과 스타일 유지 |
| **피드백 (Feedback)** | 모든 사용자 행동에 즉각적인 시각적 반응 |
| **전문성 (Professional)** | 디자이너를 위한 도구답게 세련되고 정교한 느낌 |

### 1.2 디자인 무드

```
모던 + 미니멀 + 프로페셔널

- 깔끔한 레이아웃, 충분한 여백
- 이미지가 주인공, UI는 조연
- 고급스러운 다크 모드 기본
- 부드러운 애니메이션
```

---

## 2. 컬러 시스템

### 2.1 다크 모드 (기본)

```css
:root {
  /* 배경색 */
  --bg-primary: #0a0a0b;      /* 메인 배경 */
  --bg-secondary: #141416;     /* 카드/섹션 배경 */
  --bg-tertiary: #1c1c1f;      /* 입력 필드 배경 */
  --bg-elevated: #222226;      /* 호버/활성 상태 */
  
  /* 텍스트 */
  --text-primary: #fafafa;     /* 주요 텍스트 */
  --text-secondary: #a1a1aa;   /* 보조 텍스트 */
  --text-tertiary: #71717a;    /* 비활성 텍스트 */
  --text-inverse: #0a0a0b;     /* 반전 텍스트 */
  
  /* 브랜드 컬러 */
  --brand-primary: #6366f1;    /* 인디고 - 주요 액션 */
  --brand-primary-hover: #818cf8;
  --brand-primary-active: #4f46e5;
  
  /* 강조색 */
  --accent-success: #22c55e;   /* 성공/완료 */
  --accent-warning: #f59e0b;   /* 경고 */
  --accent-error: #ef4444;     /* 에러 */
  --accent-info: #3b82f6;      /* 정보 */
  
  /* 보더 */
  --border-default: #27272a;   /* 기본 보더 */
  --border-hover: #3f3f46;     /* 호버 보더 */
  --border-focus: #6366f1;     /* 포커스 보더 */
  
  /* 그림자 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
}
```

### 2.2 라이트 모드

```css
[data-theme="light"] {
  /* 배경색 */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --bg-elevated: #e5e7eb;
  
  /* 텍스트 */
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-tertiary: #9ca3af;
  --text-inverse: #ffffff;
  
  /* 보더 */
  --border-default: #e5e7eb;
  --border-hover: #d1d5db;
  --border-focus: #6366f1;
  
  /* 그림자 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
}
```

### 2.3 시맨틱 컬러 사용 예시

| 컬러 | 용도 |
|------|------|
| `--brand-primary` | 주요 버튼, 활성 탭, 선택 상태 |
| `--accent-success` | 저장 완료, 생성 성공 |
| `--accent-warning` | 주의 필요, 용량 경고 |
| `--accent-error` | 에러 메시지, 삭제 버튼 |
| `--accent-info` | 정보 안내, 툴팁 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
:root {
  /* 한글 + 영문 통합 폰트 */
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, 
               BlinkMacSystemFont, system-ui, sans-serif;
  
  /* 고정폭 폰트 (코드, 수치) */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 3.2 폰트 크기 스케일

| 이름 | 크기 | 행간 | 사용처 |
|------|------|------|--------|
| `text-xs` | 12px | 16px | 캡션, 레이블 |
| `text-sm` | 14px | 20px | 보조 텍스트, 메타 정보 |
| `text-base` | 16px | 24px | 본문 텍스트 |
| `text-lg` | 18px | 28px | 강조 본문 |
| `text-xl` | 20px | 28px | 섹션 제목 |
| `text-2xl` | 24px | 32px | 페이지 제목 |
| `text-3xl` | 30px | 36px | 히어로 타이틀 |
| `text-4xl` | 36px | 40px | 대형 타이틀 |

### 3.3 폰트 웨이트

```css
:root {
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 3.4 타이포그래피 사용 예시

```css
/* 페이지 타이틀 */
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* 섹션 제목 */
.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* 본문 */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 레이블 */
.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  letter-spacing: 0.01em;
}
```

---

## 4. 스페이싱 시스템

### 4.1 스페이싱 스케일

```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### 4.2 사용 가이드라인

| 용도 | 스페이싱 |
|------|----------|
| 아이콘과 텍스트 사이 | `--space-2` (8px) |
| 폼 요소 사이 | `--space-4` (16px) |
| 섹션 내 요소 | `--space-6` (24px) |
| 섹션 사이 | `--space-10` (40px) |
| 페이지 패딩 | `--space-8` (32px) |

---

## 5. 그리드 시스템

### 5.1 레이아웃 그리드

```css
/* 12컬럼 그리드 */
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-8);
}

/* 프로젝트 카드 그리드 */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

/* 이미지 갤러리 그리드 */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-4);
}
```

### 5.2 레이아웃 구조

```css
/* 메인 레이아웃 */
.app-layout {
  display: grid;
  grid-template-columns: 240px 1fr;  /* 사이드바 + 메인 */
  grid-template-rows: 64px 1fr;      /* GNB + 콘텐츠 */
  min-height: 100vh;
}

/* 사이드바 */
.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-default);
}

/* GNB */
.gnb {
  height: 64px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-default);
}
```

---

## 6. UI 컴포넌트

### 6.1 버튼

```css
/* 기본 버튼 스타일 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Primary 버튼 */
.btn-primary {
  background: var(--brand-primary);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--brand-primary-hover);
  box-shadow: var(--shadow-glow);
}

/* Secondary 버튼 */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.btn-secondary:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
}

/* Ghost 버튼 */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}

.btn-ghost:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

/* 버튼 크기 */
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
.btn-md { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
```

### 6.2 입력 필드

```css
/* 텍스트 입력 */
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:hover {
  border-color: var(--border-hover);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* 에러 상태 */
.input-error {
  border-color: var(--accent-error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
```

### 6.3 카드

```css
/* 기본 카드 */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

/* 카드 헤더 */
.card-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

/* 카드 본문 */
.card-body {
  padding: var(--space-4);
}

/* 카드 푸터 */
.card-footer {
  padding: var(--space-4);
  background: var(--bg-tertiary);
}
```

### 6.4 이미지 업로더

```css
/* 드롭존 */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 200px;
  padding: var(--space-8);
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-default);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropzone:hover {
  border-color: var(--brand-primary);
  background: rgba(99, 102, 241, 0.05);
}

.dropzone.active {
  border-color: var(--brand-primary);
  background: rgba(99, 102, 241, 0.1);
  box-shadow: var(--shadow-glow);
}

/* 드롭존 아이콘 */
.dropzone-icon {
  width: 48px;
  height: 48px;
  color: var(--text-tertiary);
}

/* 드롭존 텍스트 */
.dropzone-text {
  color: var(--text-secondary);
  text-align: center;
}
```

### 6.5 모달

```css
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* 모달 컨테이너 */
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  max-width: 560px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

/* 모달 헤더 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-default);
}

/* 모달 본문 */
.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
}

/* 모달 푸터 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-default);
}
```

### 6.6 진행 표시기

```css
/* 프로그레스 바 */
.progress {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-primary-hover));
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 스피너 */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-default);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 로딩 오버레이 */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-16);
}
```

### 6.7 토스트

```css
/* 토스트 컨테이너 */
.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 200;
}

/* 토스트 */
.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 토스트 타입 */
.toast-success { border-left: 3px solid var(--accent-success); }
.toast-error { border-left: 3px solid var(--accent-error); }
.toast-warning { border-left: 3px solid var(--accent-warning); }
.toast-info { border-left: 3px solid var(--accent-info); }
```

---

## 7. 아이콘 시스템

### 7.1 아이콘 라이브러리

**Lucide Icons** 사용 (https://lucide.dev)

### 7.2 아이콘 크기

| 이름 | 크기 | 사용처 |
|------|------|--------|
| `icon-xs` | 16px | 인라인 텍스트 |
| `icon-sm` | 20px | 버튼 내 아이콘 |
| `icon-md` | 24px | 기본 아이콘 |
| `icon-lg` | 32px | 빈 상태, 강조 |
| `icon-xl` | 48px | 히어로 섹션 |

### 7.3 주요 아이콘 매핑

| 기능 | 아이콘 |
|------|--------|
| IP 변경 | `Zap` |
| 스케치 실사화 | `Pencil` |
| 히스토리 | `Library` |
| 설정 | `Settings` |
| 업로드 | `Upload` |
| 다운로드 | `Download` |
| 삭제 | `Trash2` |
| 편집 | `Edit3` |
| 저장 | `Save` |
| 새로고침 | `RefreshCw` |
| 닫기 | `X` |
| 확대 | `ZoomIn` |
| 체크 | `Check` |
| 경고 | `AlertTriangle` |
| 정보 | `Info` |
| 사용자 | `User` |
| 폴더 | `Folder` |
| 이미지 | `Image` |
| 플러스 | `Plus` |

---

## 8. 애니메이션

### 8.1 트랜지션

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}

/* 기본 트랜지션 */
.transition-colors {
  transition: color var(--transition-fast),
              background-color var(--transition-fast),
              border-color var(--transition-fast);
}

.transition-transform {
  transition: transform var(--transition-normal);
}

.transition-all {
  transition: all var(--transition-normal);
}
```

### 8.2 마이크로 인터랙션

```css
/* 호버 스케일 */
.hover-scale:hover {
  transform: scale(1.02);
}

/* 클릭 스케일 */
.active-scale:active {
  transform: scale(0.98);
}

/* 페이드 인 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn var(--transition-normal);
}

/* 슬라이드 업 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp var(--transition-slow);
}

/* 펄스 (로딩) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

### 8.3 페이지 전환

```css
/* 페이지 진입 */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms ease, transform 300ms ease;
}

/* 페이지 이탈 */
.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease;
}
```

---

## 9. 반응형 디자인

### 9.1 브레이크포인트

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1440px;
}

/* Tailwind 스타일 */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1440px) { /* 2xl */ }
```

### 9.2 모바일 최적화

```css
/* 모바일 터치 타겟 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* 모바일 여백 */
@media (max-width: 640px) {
  .container {
    padding: 0 var(--space-4);
  }
  
  .card {
    border-radius: 8px;
  }
  
  .modal {
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
  }
}
```

---

## 10. 다크/라이트 모드

### 10.1 모드 전환

```css
/* 시스템 설정 따르기 (기본) */
@media (prefers-color-scheme: dark) {
  :root { /* 다크 모드 변수 */ }
}

@media (prefers-color-scheme: light) {
  :root { /* 라이트 모드 변수 */ }
}

/* 수동 설정 */
[data-theme="dark"] { /* 다크 모드 변수 */ }
[data-theme="light"] { /* 라이트 모드 변수 */ }
```

### 10.2 이미지 처리

```css
/* 다크 모드에서 이미지 밝기 조절 */
[data-theme="dark"] img {
  filter: brightness(0.95);
}

/* 로고 반전 (필요시) */
[data-theme="dark"] .logo-light {
  display: none;
}
[data-theme="dark"] .logo-dark {
  display: block;
}
```

---

## 부록: Tailwind CSS v4 설정

> **Note**: Tailwind CSS v4는 CSS-first 설정 방식을 사용합니다.

### 설치

```bash
npm install tailwindcss @tailwindcss/vite
```

### Vite 플러그인 설정

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

### CSS 설정 (app.css)

```css
@import "tailwindcss";

/* 테마 설정 */
@theme {
  /* 브랜드 컬러 */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-300: #a5b4fc;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --color-brand-800: #3730a3;
  --color-brand-900: #312e81;

  /* 폰트 */
  --font-sans: 'Pretendard Variable', 'Pretendard', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* 기본 border-radius */
  --radius-DEFAULT: 8px;
}

/* 다크 모드 */
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

### 레거시 설정 (tailwind.config.js - 호환용)

```javascript
// tailwind.config.js (v4에서도 선택적 사용 가능)
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
    },
  },
}
```

---

## 부록: 컴포넌트 체크리스트

| 컴포넌트 | 상태 | 우선순위 |
|----------|------|----------|
| Button (Primary/Secondary/Ghost) | 필요 | P0 |
| Input (Text/Password/Textarea) | 필요 | P0 |
| Card | 필요 | P0 |
| Modal | 필요 | P0 |
| Dropzone (이미지 업로더) | 필요 | P0 |
| Toast | 필요 | P0 |
| Progress | 필요 | P0 |
| Spinner | 필요 | P0 |
| Tabs | 필요 | P1 |
| Dropdown | 필요 | P1 |
| Checkbox | 필요 | P1 |
| Radio | 필요 | P1 |
| Select | 필요 | P1 |
| Tooltip | 필요 | P2 |
| Avatar | 필요 | P2 |
| Badge | 필요 | P2 |
