# AI Mockup Admin Panel

## What This Is

AI 목업 생성 서비스의 관리자 패널. 기존 Next.js 앱의 `/admin` 경로에서 관리자가 사용자, 생성 작업, 생성 콘텐츠, 시스템 KPI, Gemini API 키를 운영 관리한다. Fastify backend의 `requireAdmin` 권한 경계가 실제 보안을 담당하고, frontend guard는 UX 차원의 접근 차단을 담당한다.

## Core Value

관리자가 한 곳에서 시스템 전체 현황을 파악하고 사용자/콘텐츠/API 키를 관리할 수 있어야 한다.

## Current State

- **Shipped:** v1.0 AI Mockup Admin Panel on 2026-04-23
- **Requirements:** 28/28 v1 requirements satisfied and archived
- **Planning archive:** `.planning/milestones/v1.0-*`
- **Phase artifacts:** `.planning/milestones/v1.0-phases/`
- **Next step:** define the next milestone with `$gsd-new-milestone`

## Requirements

### Validated

- ✓ 사용자 인증 (로그인/회원가입/토큰 갱신) — existing
- ✓ AI 이미지 생성 (IP Change, Sketch to Real, Style Copy) — existing
- ✓ 프로젝트 기반 이미지 관리 — existing
- ✓ 이미지 편집 및 히스토리 추적 — existing
- ✓ BullMQ 기반 비동기 작업 처리 — existing
- ✓ 관리자 역할(role/status) 시스템 — v1.0
- ✓ `/api/admin/*` backend admin authorization — v1.0
- ✓ `/admin` frontend route guard and admin layout — v1.0
- ✓ 관리자 대시보드 KPI, failure chart, 30s polling — v1.0
- ✓ 사용자 목록, 검색/필터, suspend/delete/role lifecycle actions — v1.0
- ✓ 생성 작업 모니터링, 실패 상세, retry — v1.0
- ✓ 생성 콘텐츠 검색, lightbox, 개별/대량 삭제 — v1.0
- ✓ encrypted Gemini API key CRUD, activation, usage call count — v1.0
- ✓ Dashboard active API key alias/callCount display — v1.0
- ✓ Edit-mode Gemini call count tracking — v1.0

### Active

- [ ] Next milestone requirements are not defined yet.

### Future Candidates

- [ ] 관리자 작업 감사 로그
- [ ] 다단계 RBAC (super admin / support admin)
- [ ] 큐 깊이 트렌드 차트
- [ ] 사용자별 스토리지 사용량 분석
- [ ] API 키 자동 로테이션
- [ ] 이벤트 기반 이메일 알림

### Out of Scope

- 별도 관리자 앱 — 기존 앱 내 `/admin` 경로로 충분
- 관리자 초대/등록 플로우 — DB에서 직접 role 지정, 관리자 수 적음
- 실시간 WebSocket 알림 — 현재 운영 규모는 polling으로 충분
- AI 콘텐츠 모더레이션 — 사내 B2B 도구, 알려진 사용자만 사용
- API 키 자동 로테이션 — v1.0은 수동 전환만 제공

## Context

- 기존 앱: Next.js 16 + Fastify 5 + PostgreSQL + Redis + BullMQ monorepo
- Auth: JWT 기반, Zustand 상태 관리
- User model now includes `role` and `status`
- API keys are stored encrypted in DB via AES-256-GCM
- GeminiService no longer reads `process.env.GEMINI_API_KEY`; callers pass active DB key explicitly
- Admin dashboard/user/content/API key pages live under `/admin/*`
- Archived milestone audit notes three deferred runtime/browser verification checks from early phase verification frontmatter; later phase summaries include human approval for Phase 2-4 user-facing flows

## Constraints

- **Tech stack:** existing stack remains Next.js, Fastify, Prisma, Tailwind
- **Auth boundary:** Fastify `requireAdmin` is authoritative; Next.js guard is UX-only
- **Admin access:** admin role granted by DB update, no invite flow in v1.0
- **API key operation:** manual activation only; no automatic rotation in v1.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| `/admin` 경로 사용 | 별도 앱 없이 기존 인증과 deployment 재사용 | ✓ Good |
| DB role 직접 지정 | 초기 관리자 수가 적고 invite flow 불필요 | ✓ Good |
| Fastify `requireAdmin` as security boundary | Next.js middleware/guard는 우회 가능성이 있으므로 backend가 권한을 강제 | ✓ Good |
| API keys encrypted in DB | 단일 env key 한계 해소, 수동 전환과 사용량 표시 가능 | ✓ Good |
| GeminiService stateless refactor | active key를 호출 시점마다 주입해 env fallback 제거 | ✓ Good |
| Polling over WebSocket | 운영 대시보드 요구사항 대비 단순하고 충분함 | ✓ Good |
| Recharts 3.x for React 19 | React 19 compatibility를 위해 2.x override 대신 3.x 사용 | ✓ Good |

---
*Last updated: 2026-04-23 after v1.0 milestone*
