# Requirements: AI Mockup Admin Panel

**Defined:** 2026-03-10
**Core Value:** 관리자가 한 곳에서 시스템 전체 현황을 파악하고 사용자/콘텐츠/API 키를 관리할 수 있어야 한다.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Authorization

- [ ] **AUTH-01**: User 모델에 role 필드(admin/user) 추가 — Prisma 마이그레이션
- [ ] **AUTH-02**: Fastify requireAdmin 미들웨어 — /api/admin/* 엔드포인트에 admin 권한 체크
- [ ] **AUTH-03**: JWT 토큰 payload에 role 포함 — 로그인 시 role 정보 반환
- [ ] **AUTH-04**: Next.js /admin 라우트 가드 — 비관리자 접근 시 리다이렉트
- [ ] **AUTH-05**: Admin 레이아웃 — /admin 전용 사이드바/네비게이션

### Dashboard

- [ ] **DASH-01**: 전체 사용자 수, 전체 생성 건수 KPI 카드 표시
- [ ] **DASH-02**: 최근 24시간 실패 작업 수, 현재 큐 깊이 표시
- [ ] **DASH-03**: 전체 이미지 스토리지 사용량 표시
- [ ] **DASH-04**: 활성 Gemini API 키 정보 및 호출 횟수 표시
- [ ] **DASH-05**: 시간대별 생성 실패율 차트 표시

### User Management

- [ ] **USER-01**: 관리자가 전체 사용자 목록을 페이지네이션으로 조회할 수 있다
- [ ] **USER-02**: 관리자가 이메일로 사용자를 검색하고 상태별 필터링할 수 있다
- [ ] **USER-03**: 관리자가 사용자 계정을 정지/해제할 수 있다 (soft suspend)
- [ ] **USER-04**: 관리자가 사용자 계정을 삭제할 수 있다 (soft delete, PII 익명화)
- [ ] **USER-05**: 관리자가 사용자의 역할을 admin/user로 변경할 수 있다

### Generation Monitoring

- [ ] **GEN-01**: 관리자가 전체 생성 작업 목록을 상태별 필터로 조회할 수 있다
- [ ] **GEN-02**: 관리자가 실패한 작업의 에러 상세 정보를 확인할 수 있다
- [ ] **GEN-03**: 관리자가 실패한 작업을 BullMQ 큐에 재시도할 수 있다

### Content Management

- [ ] **CONT-01**: 관리자가 전체 생성 이미지를 사용자/날짜/프로젝트별로 검색할 수 있다
- [ ] **CONT-02**: 관리자가 개별 이미지를 삭제할 수 있다 (DB + 파일시스템)
- [ ] **CONT-03**: 관리자가 특정 사용자의 전체 생성 이력을 조회할 수 있다
- [ ] **CONT-04**: 관리자가 조건별(날짜/사용자/프로젝트) 대량 삭제를 실행할 수 있다

### API Key Management

- [ ] **KEY-01**: 관리자가 Gemini API 키 목록을 조회할 수 있다 (별칭, 마지막 4자리, 상태)
- [ ] **KEY-02**: 관리자가 새 API 키를 등록할 수 있다 (암호화 저장)
- [ ] **KEY-03**: 관리자가 API 키를 삭제할 수 있다
- [ ] **KEY-04**: 관리자가 활성 키를 수동 전환할 수 있다 (단일 활성 키 제약)
- [ ] **KEY-05**: GeminiService가 DB의 활성 키를 읽어 사용한다 (.env 대신)
- [ ] **KEY-06**: 각 API 키의 호출 횟수가 표시된다

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Monitoring

- **MON-01**: 큐 깊이 트렌드 차트 (시계열 데이터 저장 필요)
- **MON-02**: 사용자별 스토리지 사용량 분석

### Audit & Security

- **AUD-01**: 관리자 작업 감사 로그
- **AUD-02**: 다단계 RBAC (super admin / support admin)

### Automation

- **AUTO-01**: API 키 자동 로테이션 (할당량 소진 시 자동 전환)
- **AUTO-02**: 이벤트 기반 이메일 알림

## Out of Scope

| Feature | Reason |
|---------|--------|
| 별도 관리자 앱 | 기존 앱 내 /admin 경로로 충분 |
| 관리자 초대/등록 플로우 | DB에서 직접 role 지정, 관리자 수 적음 |
| 실시간 WebSocket | 폴링으로 충분한 트래픽 수준 |
| AI 콘텐츠 모더레이션 | 사내 B2B 도구, 알려진 사용자만 사용 |
| API 키 자동 로테이션 | v1은 수동 전환만, 자동화는 v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| DASH-04 | Phase 2 | Pending |
| DASH-05 | Phase 2 | Pending |
| USER-01 | Phase 2 | Pending |
| USER-02 | Phase 2 | Pending |
| USER-03 | Phase 2 | Pending |
| USER-04 | Phase 2 | Pending |
| USER-05 | Phase 2 | Pending |
| GEN-01 | Phase 3 | Pending |
| GEN-02 | Phase 3 | Pending |
| GEN-03 | Phase 3 | Pending |
| CONT-01 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| KEY-01 | Phase 4 | Pending |
| KEY-02 | Phase 4 | Pending |
| KEY-03 | Phase 4 | Pending |
| KEY-04 | Phase 4 | Pending |
| KEY-05 | Phase 4 | Pending |
| KEY-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
