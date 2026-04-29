# AI Mockup Platform

## What This Is

디자이너와 기획자가 기존 제품 이미지, 캐릭터 IP, 스케치를 바탕으로 실제 제품에 가까운 목업 이미지를 빠르게 생성하고 비교하는 AI 목업 플랫폼이다. 현재 Gemini 기반 이미지 워크플로와 관리자 패널이 운영 중이며, 이번 마일스톤에서는 동일 기능군을 OpenAI GPT Image 2 provider로 병행 제공한다.

## Core Value

사용자가 원하는 제품 목업을 구조와 디테일을 잃지 않고 빠르게 생성하고 비교할 수 있어야 한다.

## Current Milestone: v1.1 OpenAI GPT Image 2 Dual Provider

**Goal:** 기존 Gemini 기능을 유지한 채, 같은 제품 흐름 옆에 OpenAI GPT Image 2 버전을 병행 추가한다.

**Target features:**
- OpenAI GPT Image 2 기반 `IP 변경`, `스케치 실사화`, `부분 수정`, `스타일 복사`, `동일 조건 재생성`
- provider-aware generation model, queue routing, history badges, and result metadata
- provider-scoped API key management and operational debugging for OpenAI runs

## Requirements

### Validated

- ✓ 사용자 인증 (로그인/회원가입/토큰 갱신) — existing
- ✓ 프로젝트 기반 이미지 생성 및 관리 — existing
- ✓ Gemini 기반 IP Change, Sketch to Real, Style Copy — existing
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
- ✓ Provider-aware generation schema, queue payloads, and worker guardrails — Phase 7
- ✓ Provider-scoped Gemini/OpenAI admin API key management — Phase 7
- ✓ Admin provider/model/support metadata monitoring — Phase 7
- ✓ Provider-aware result/history labels, same-provider regeneration, OpenAI partial edit, and OpenAI style-copy continuation — Phase 10

### Active

- [ ] OpenAI GPT Image 2 provider를 기존 Gemini 옆에 병행 추가
- [ ] OpenAI 버전의 핵심 이미지 워크플로를 기존 UI 흐름과 동일한 수준으로 제공
- [ ] OpenAI runtime에서 request/response linkage를 실제 생성 결과에 기록하기

### Future Candidates

- [ ] provider 비교 뷰 (Gemini vs OpenAI side-by-side)
- [ ] region mask 기반 편집 UI
- [ ] provider별 비용/지연시간 분석 대시보드
- [ ] 저장형 provider-specific prompt presets
- [ ] API 키 자동 로테이션
- [ ] 이벤트 기반 이메일 알림

### Out of Scope

- Gemini 제거 또는 전면 마이그레이션 — 기존 사용 흐름을 안정적으로 유지해야 함
- OpenAI direct transparent background 출력 — `gpt-image-2` 제약으로 후처리 누끼 방식 유지
- video/audio 등 비이미지 OpenAI 기능 확장 — 이번 milestone은 이미지 워크플로 병행 제공에 집중
- cross-provider style memory 호환 — Gemini `thoughtSignature`와 OpenAI response linkage는 별도 처리 필요

## Context

- 서비스의 본체는 AI 목업 생성 기능이며, v1.0에서는 관리자 패널 운영 기반이 강화되었다
- 현재 핵심 runtime은 Next.js 16 + Fastify 5 + Prisma + PostgreSQL + Redis + BullMQ
- Gemini 이미지 생성은 `apps/api/src/services/gemini.service.ts`와 `apps/api/src/worker.ts` 중심으로 동작한다
- v1.1 OpenAI phase planning/execution must follow `.planning/OPENAI-SKILL-GUARDRAILS.md` so the GPT Image 2 skills are applied consistently.
- OpenAI GPT Image 2 공식 조사 결과:
  - direct image generation/editing은 `v1/images/generations` / `v1/images/edits`
  - multi-turn image iteration은 Responses API + `image_generation` tool
  - `gpt-image-2`는 transparent background 미지원, `input_fidelity` 지정 불가
- 이번 milestone은 기존 기능 교체가 아니라 parallel provider rollout이다

## Constraints

- **Tech stack**: 기존 monorepo stack 유지 — Next.js, Fastify, Prisma, Tailwind, BullMQ
- **Runtime safety**: Gemini 경로는 깨지면 안 됨 — OpenAI 추가는 병렬 구조여야 함
- **Provider UX**: 사용자는 같은 기능군 안에서 provider 차이를 이해할 수 있어야 함 — 메뉴/히스토리/결과 뷰에 provider 표시 필요
- **Background output**: OpenAI transparent background 미지원 — 누끼는 후처리로 유지
- **Operational debugging**: OpenAI request/response linkage를 저장해야 함 — support/debugging용 metadata 필요

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini와 OpenAI를 병행 provider로 운영 | 기존 사용자 흐름을 유지하면서 OpenAI 품질을 검증해야 함 | Foundation complete in Phase 7 |
| 기존 메뉴 옆에 OpenAI 버전을 노출 | 기능 parity를 사용자에게 명확히 보여주면서 비교 가능하게 함 | — Pending |
| provider/model을 Generation의 1급 데이터로 저장 | history, regenerate, support, queue routing에서 provider 구분이 필요함 | Complete in Phases 7 and 10 |
| OpenAI phase마다 필수 skill matrix를 적용 | GPT Image 2 API 제약, prompt contract, runtime 분리, smoke 검증을 빠뜨리지 않기 위함 | Guardrail added |
| OpenAI runtime을 별도 service로 추가 | `gemini.service.ts`를 provider 혼합 blob으로 만들지 않기 위함 | — Pending |
| OpenAI transparent output은 후처리로 해결 | `gpt-image-2` API 제약을 제품 옵션과 양립시키기 위함 | — Pending |
| OpenAI style copy는 Responses linkage 사용 | Gemini `thoughtSignature`를 그대로 재사용할 수 없음 | Complete in Phase 10; live smoke pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after Phase 10 provider-aware continuation completion*
