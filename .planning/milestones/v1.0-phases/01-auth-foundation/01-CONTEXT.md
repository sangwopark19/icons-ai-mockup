# Phase 1: Auth Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin 접근 보안 구현 — User 모델에 role 필드 추가, Fastify requireAdmin 미들웨어, Next.js /admin 라우트 가드, Admin 전용 레이아웃(사이드바/네비게이션). role=admin인 계정만 /admin 경로와 /api/admin/* 엔드포인트에 접근 가능. 기존 사용자 영역은 전혀 수정하지 않음.

</domain>

<decisions>
## Implementation Decisions

### 비관리자 접근 처리
- /admin 접근 시 조용히 홈(/)으로 리다이렉트 (토스트/알림 없음)
- 비로그인 상태에서도 동일하게 홈으로 리다이렉트 (로그인 페이지가 아님)
- API: /api/admin/* 비관리자 호출 시 403 반환 — `{ success: false, error: { code: 'FORBIDDEN', message: '관리자 권한이 필요합니다' } }`
- Next.js middleware는 UX 리다이렉트 전용, Fastify requireAdmin이 보안 경계 (STATE.md 결정 유지)

### Admin 레이아웃/네비게이션
- 왼쪽 사이드바 레이아웃 (데스크톱: 항상 표시, 모바일: 햄버거 메뉴)
- 4개 메뉴 항목: 대시보드, 사용자 관리, 생성/콘텐츠, API 키 — 각 Phase에 대응
- 사이드바 상단에 관리자 이름 + 이메일 표시
- 사이드바 하단에 "메인으로" 링크 (기존 앱으로 돌아가기)
- 기존 앱의 디자인 토큰(CSS 변수) 재사용, 별도 관리자 테마 없음

### Role 설계
- Prisma enum으로 role 필드 추가: `user`, `admin` 2가지 (기본값: `user`)
- 마이그레이션에서 기존 사용자 전원 자동으로 `user` 할당
- Prisma seed 스크립트에 초기 admin 계정 생성 로직 포함 (개발 환경 세팅용)
- User 모델에 status 필드도 함께 추가 (Phase 2 suspend/delete 대비, 마이그레이션 1회로 처리)

### 기존 클라이언트 호환성
- JWT payload에 role 추가, 기존 토큰(role 없는)은 그대로 허용 — role 없으면 `user`로 취급
- Zustand auth store의 User 타입에 `role?: string` 선택적 필드 추가 — 기존 localStorage 데이터와 충돌 없음
- 프론트엔드 관리자 확인은 Zustand store의 role 값 사용 (API 호출 없이 즉시 참조)
- 기존 라우트(로그인, 프로젝트 등)와 기존 API는 전혀 수정하지 않음 — role은 /admin 영역에만 영향

### Claude's Discretion
- 모바일 사이드바 햄버거 메뉴 구현 방식
- 사이드바 너비, 아이콘 선택 (lucide-react 사용)
- status 필드의 enum 값 설계 (active, suspended, deleted 등)
- requireAdmin 미들웨어의 정확한 구현 패턴
- Next.js middleware vs layout-level 라우트 가드 구현 방식

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/plugins/auth.plugin.ts`: 기존 `authenticate` 데코레이터 — requireAdmin은 이 패턴을 확장하여 구현
- `apps/api/src/services/auth.service.ts`: AuthService 클래스 — JWT payload에 role 추가, generateAccessToken 수정
- `apps/web/src/stores/auth.store.ts`: Zustand persist store — User 인터페이스에 role 필드 추가
- `apps/web/src/components/ui/button.tsx`, `input.tsx`: 기존 UI 컴포넌트 — Admin 레이아웃에서 재사용
- `packages/shared/`: 공유 타입 패키지 — User 타입 확장 시 활용

### Established Patterns
- JWT 인증: `@fastify/jwt` 플러그인 + auth.plugin.ts 데코레이터 패턴
- 에러 응답: `{ success: false, error: { code, message } }` 일관된 형식
- Zod 검증: 모든 라우트에서 Zod 스키마로 입력 검증
- CVA + Tailwind + CSS 변수: 컴포넌트 스타일링 패턴
- 서비스 싱글톤: `export const authService = new AuthService()`

### Integration Points
- `apps/api/src/server.ts`: 새 admin 라우트 등록 위치
- `apps/api/prisma/schema.prisma`: User 모델에 role/status enum 추가
- `apps/web/src/app/`: /admin 디렉토리 추가 (Next.js App Router)
- `apps/web/src/app/layout.tsx`: 루트 레이아웃 (admin 레이아웃은 별도 /admin/layout.tsx)

</code_context>

<specifics>
## Specific Ideas

- 사이드바에서 아직 구현되지 않은 Phase 2~4 메뉴는 링크만 배치 (클릭 시 "준비 중" 또는 빈 페이지)
- 관리자 페이지 존재 자체를 비관리자에게 숨기는 것이 의도 (조용한 리다이렉트)
- 보안 경계는 반드시 Fastify requireAdmin 미들웨어 (프론트 리다이렉트는 UX 편의용)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-auth-foundation*
*Context gathered: 2026-03-10*
