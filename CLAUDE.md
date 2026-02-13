# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**MockupAI** - AI 기반 목업 이미지 생성 도구. 제품 기획 초기단계에서 실제 제품과 유사한 비주얼 목업을 빠르게 생성합니다.

**주요 기능:**
- IP 변경: 기존 제품의 캐릭터를 새로운 캐릭터로 변경
- 스케치 실사화: 2D 스케치를 실제 제품 사진처럼 변환
- 히스토리 관리: 프로젝트 단위 생성 기록 관리
- 고해상도 다운로드: Real-ESRGAN ncnn 업스케일링

## 기술 스택

- **Node.js**: v22 LTS (엔진 요구사항)
- **패키지 매니저**: pnpm 9.x
- **모노레포**: Turborepo
- **프론트엔드**: Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4, Zustand 5, TanStack Query 5
- **백엔드**: Fastify 5, Prisma 7, BullMQ 5, Zod 3
- **AI/이미지**: Gemini 3 Pro Image API (`@google/genai`), Real-ESRGAN ncnn, Sharp
- **데이터베이스**: PostgreSQL 16, Redis 7
- **인프라**: Docker, Docker Compose, Tailscale VPN

## 아키텍처

### 모노레포 구조

```
mockup-ai/
├── apps/
│   ├── web/              # Next.js 16 프론트엔드 (포트 3000)
│   └── api/              # Fastify 5 백엔드 (포트 4000)
│       ├── src/
│       │   ├── server.ts       # API 서버 (REST API)
│       │   ├── worker.ts       # Worker 프로세스 (작업 큐 처리)
│       │   ├── routes/         # API 엔드포인트
│       │   ├── services/       # 비즈니스 로직
│       │   ├── plugins/        # Fastify 플러그인
│       │   └── lib/            # Prisma, Redis, Queue 클라이언트
│       └── prisma/
│           └── schema.prisma   # 데이터베이스 스키마
└── packages/
    └── shared/           # 공유 타입/유틸리티 (workspace:*)
```

### 핵심 아키텍처 패턴

#### 1. API 서버 + Worker 분리 구조

**API 서버** (`apps/api/src/server.ts`):
- REST API 엔드포인트 제공
- 클라이언트 요청 수신 및 검증
- 작업을 BullMQ 큐에 추가
- 즉시 응답 반환 (비동기 처리)

**Worker 프로세스** (`apps/api/src/worker.ts`):
- BullMQ 큐에서 작업 수신
- Gemini API 호출하여 이미지 생성
- 생성된 이미지를 파일 시스템에 저장
- Prisma로 데이터베이스 업데이트
- 동시성: 2개 작업 병렬 처리

#### 2. Gemini API 통합

**중요**: 반드시 `@google/genai` 패키지 사용 (레거시 `@google/generative-ai` 사용 금지)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [...],
});
```

**주요 패턴**:
- IP 변경: `generateIPChange()` - 원본 이미지 + 캐릭터 이미지 → 새 목업
- 스케치 실사화: `generateSketchToReal()` - 스케치 + 질감 이미지 → 실사 이미지
- 스타일 참조: `generateWithStyleCopy()` - thoughtSignatures로 스타일 복제

#### 3. 데이터베이스 구조

핵심 모델:
- `User`: 사용자 계정
- `Project`: 프로젝트 (1:N Generation)
- `Generation`: 생성 작업 (상태: pending → processing → completed/failed)
  - `mode`: ip_change | sketch_to_real
  - `thoughtSignatures`: Gemini 스타일 복제용 메타데이터 (JSON)
  - `styleReferenceId`: 스타일 참조 생성 ID (자기 참조)
- `GeneratedImage`: 생성된 이미지 (1 Generation : N Images)
- `IPCharacter`: 프로젝트별 캐릭터 라이브러리

**중요 관계**:
- `Generation.styleReferenceId` → 이전 생성 결과를 스타일 참조로 사용
- `Generation.thoughtSignatures` → Gemini의 내부 생성 메타데이터 저장

#### 4. 작업 큐 (BullMQ)

```typescript
// API 서버: 작업 추가
await generationQueue.add('generation', { generationId, userId, ... });

// Worker: 작업 처리
const worker = new Worker('generation', async (job) => {
  // 1. 상태 업데이트 (processing)
  // 2. 이미지 로드 및 Base64 변환
  // 3. Gemini API 호출
  // 4. 생성 이미지 저장
  // 5. 상태 업데이트 (completed/failed)
});
```

## 개발 명령어

### 모노레포 전체

```bash
# 개발 서버 실행 (전체)
pnpm dev

# 빌드 (전체)
pnpm build

# 린트 (전체)
pnpm lint

# 타입 체크 (전체)
pnpm type-check

# Prettier 포맷팅
pnpm format
```

### 워크스페이스별

```bash
# Web 개발 서버
cd apps/web && pnpm dev

# API 개발 서버
cd apps/api && pnpm dev

# Worker 개발 서버 (별도 터미널)
pnpm dev:worker
# 또는
cd apps/api && pnpm dev:worker
```

### Prisma

```bash
cd apps/api

# 마이그레이션 생성 및 적용
npx prisma migrate dev

# Prisma Client 재생성
npx prisma generate

# DB 푸시 (마이그레이션 없이)
npx prisma db push

# Prisma Studio (DB GUI)
npx prisma studio
```

### Docker

```bash
# DB와 Redis만 실행 (로컬 개발용)
docker compose up -d postgres redis

# 전체 스택 실행 (프로덕션)
docker compose up -d --build

# 로그 확인
docker compose logs api --tail=100
docker compose logs worker --tail=50
docker compose logs -f api    # 실시간

# 컨테이너 재시작
docker compose restart api worker

# 컨테이너 상태 확인
docker compose ps
```

## 환경 구분

### 로컬 개발 환경 (현재 컴퓨터)

**위치**: `/Users/sangwopark19/icons/icons-ai-mockup/`
**용도**: 코드 작성, 수정, 테스트, 커밋
**Docker**: 실행 안 함 (코드만 존재)

가능한 작업:
- ✅ 코드 읽기/수정/저장
- ✅ Git 커밋/푸시
- ✅ 린트/타입 체크
- ❌ Docker 명령어 (컨테이너 없음)
- ❌ 서버 로그 확인
- ❌ 런타임 디버깅

### 프로덕션 서버 (iconsui-MacStudio)

**위치**: 별도의 Mac Studio 서버
**용도**: 실제 앱 실행, 사용자 서비스
**Docker**: 실행 중 (API, Worker, DB, Redis, Web)

가능한 작업:
- ✅ Docker 명령어 실행
- ✅ 서버 로그 확인
- ✅ 컨테이너 재시작
- ✅ 런타임 디버깅
- ❌ 코드 직접 수정 (Git pull로만 업데이트)

### 작업 흐름

```
1. [로컬] 코드 수정
2. [로컬] Git 커밋 & 푸시
3. [서버] Git pull
4. [서버] Docker restart
5. [서버] 로그 확인 & 테스트
```

## 코딩 규칙

### Gemini API 사용

1. **반드시 `@google/genai` 사용**
   - ❌ `@google/generative-ai` (deprecated)
   - ❌ `@google-ai/generativelanguage` (deprecated)
   - ✅ `@google/genai` (최신)

2. **모델 선택**
   - 기본: `gemini-3-flash-preview`
   - 복잡한 추론: `gemini-3-pro-preview`
   - 이미지 생성: `gemini-3-pro-image-preview`

3. **초기화**
   ```typescript
   import { GoogleGenAI } from '@google/genai';
   const ai = new GoogleGenAI({}); // GEMINI_API_KEY 환경변수 자동 사용
   ```

4. **공식 문서 우선**
   - 문서: https://googleapis.github.io/js-genai/
   - 코드 작성 전 반드시 최신 문서 확인
   - 추측 금지, deprecated 코드 금지

### 타입스크립트

- 엄격 모드 사용
- `any` 타입 금지
- 공유 타입은 `@mockup-ai/shared`에 정의
- Zod로 런타임 검증

### Git 커밋

- **Author**: sangwopark19 <sangwopark19@gmail.com>
- **메시지 형식**: `<type>: <한글 설명>`
- **타입**: feat, fix, refactor, docs, test, chore, perf, ci

```bash
git -c user.name="sangwopark19" -c user.email="sangwopark19@gmail.com" commit -m "feat: 새 기능 추가"
```

## 보안

### Tailscale VPN

- 모든 외부 포트는 Tailscale VPN IP(`100.69.75.47`)로만 바인딩
- PostgreSQL, Redis 포트는 외부 노출 금지 (Docker 내부 네트워크만)
- 웹/API 서버는 Tailscale IP로만 접근 가능

### 환경 변수

필수 환경 변수:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `REDIS_URL`: Redis 연결 문자열
- `GEMINI_API_KEY`: Gemini API 키
- `JWT_SECRET`: JWT 서명 키
- `UPLOAD_DIR`: 업로드 파일 저장 경로

## 문제 해결

### API 서버가 응답하지 않을 때

1. 서버 환경에서 로그 확인:
   ```bash
   docker compose logs api --tail=100
   ```

2. Worker 상태 확인:
   ```bash
   docker compose logs worker --tail=50
   docker compose ps worker
   ```

3. Redis 연결 확인:
   ```bash
   docker compose exec redis redis-cli ping
   ```

### Gemini API 에러

1. API 키 확인: `echo $GEMINI_API_KEY`
2. Worker 로그에서 에러 메시지 확인
3. Rate limit 확인: https://ai.google.dev/rate-limits
4. 모델 availability 확인: https://ai.google.dev/models

### Prisma 마이그레이션 실패

```bash
cd apps/api

# 마이그레이션 상태 확인
npx prisma migrate status

# 마이그레이션 리셋 (개발 전용!)
npx prisma migrate reset

# 새 마이그레이션 생성
npx prisma migrate dev --name <migration-name>
```

## 참고 문서

- [PRD (제품 요구사항)](docs/PRD.md)
- [TRD (기술 요구사항)](docs/TRD.md)
- [ERD (데이터베이스 설계)](docs/ERD.md)
- [사용자 가이드](docs/USER_GUIDE.md)
- [빠른 시작 가이드](docs/QUICK_START.md)
- [Tailscale 접속 가이드](docs/TAILSCALE_ACCESS_GUIDE.md)
