# AI Mockup Admin Panel

## What This Is

AI 목업 생성 서비스의 관리자 패널. 기존 Next.js 앱 내 `/admin` 경로에서 사용자 관리, 생성 작업 모니터링, 시스템 대시보드, 콘텐츠 관리, Gemini API 키 관리 기능을 제공한다. DB에서 특정 계정의 role을 admin으로 지정하여 접근 권한을 부여한다.

## Core Value

관리자가 한 곳에서 시스템 전체 현황을 파악하고 사용자/콘텐츠/API 키를 관리할 수 있어야 한다.

## Requirements

### Validated

- ✓ 사용자 인증 (로그인/회원가입/토큰 갱신) — existing
- ✓ AI 이미지 생성 (IP Change, Sketch to Real, Style Copy) — existing
- ✓ 프로젝트 기반 이미지 관리 — existing
- ✓ 이미지 편집 및 히스토리 추적 — existing
- ✓ BullMQ 기반 비동기 작업 처리 — existing

### Active

- [ ] 관리자 역할(role) 시스템 — User 모델에 role 필드 추가, admin 권한 체크 미들웨어
- [ ] 관리자 대시보드 — 사용량 통계, 실시간 큐 상태, API 사용량, 스토리지 현황
- [ ] 사용자 관리 — 사용자 목록 조회, 계정 정지/삭제, 역할 변경
- [ ] 생성 작업 모니터링 — 전체 생성 작업 현황, 실패 작업 확인, 큐 상태
- [ ] 콘텐츠 관리 — 전체 이미지 검색(사용자/날짜/프로젝트별), 이미지 삭제, 사용자 생성 내역 조회, 조건별 대량 삭제
- [ ] Gemini API 키 관리 — 여러 API 키 등록, 관리자가 수동으로 활성 키 전환, 키별 사용량 표시

### Out of Scope

- 별도 관리자 앱 — 기존 앱 내 /admin 경로로 충분
- API 키 자동 로테이션 — v1에서는 수동 전환만
- 관리자 초대/등록 플로우 — DB에서 직접 role 지정
- 실시간 WebSocket 알림 — 폴링으로 충분

## Context

- 기존 앱: Next.js 16 + Fastify 5 + PostgreSQL + Redis + BullMQ 모노레포 구조
- 인증: JWT 기반, Zustand 상태 관리
- 현재 User 모델에 role 필드 없음 — Prisma 마이그레이션 필요
- Gemini API 키는 현재 .env의 단일 GEMINI_API_KEY 사용 — DB에 키 테이블 추가 필요
- 관리자 페이지는 기존 Next.js 앱의 /admin/* 라우트로 추가
- 백엔드에 admin 전용 API 엔드포인트 추가 필요

## Constraints

- **Tech stack**: 기존 스택 유지 (Next.js, Fastify, Prisma, Tailwind)
- **Auth**: 기존 JWT 인증 시스템 위에 role 기반 권한 추가
- **접근 방식**: /admin 경로에서 role=admin 체크, 실패 시 리다이렉트

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| /admin 경로 사용 | 별도 앱 불필요, 기존 인증 시스템 재사용 | — Pending |
| DB role 직접 지정 | 초기에 관리자 수 적음, 초대 플로우 불필요 | — Pending |
| API 키 수동 전환 | 자동 로테이션은 복잡도 대비 가치 낮음 | — Pending |
| API 키 DB 저장 | .env 단일 키 한계, 여러 키 관리 및 전환 필요 | — Pending |

---
*Last updated: 2026-03-10 after initialization*
