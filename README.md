# MockupAI - AI 목업 이미지 생성 도구

제품 기획 초기단계에서 실제 제품과 유사한 비주얼 목업을 빠르게 생성하는 AI 기반 도구입니다.

## 📖 시작하기

> **처음 사용하시나요?** 역할에 맞는 문서를 확인하세요!

| 문서 | 대상 | 설명 |
|------|------|------|
| **[Tailscale 접속 가이드](docs/TAILSCALE_ACCESS_GUIDE.md)** | **모든 사용자 필독** | VPN 설치 및 접속 방법 |
| **[사용자 가이드](docs/USER_GUIDE.md)** | 디자이너/기획자 | 프로그램 사용법, 기능 설명, FAQ |
| **[빠른 시작 가이드](docs/QUICK_START.md)** | 개발자/관리자 | 설치, 배포, 운영 가이드 |

## 📌 주요 기능

### 1. IP 변경
- 기존 출시 제품의 캐릭터 IP를 새로운 캐릭터로 변경
- 제품 형태와 구조 유지하며 캐릭터만 교체

### 2. 스케치 실사화
- 2D 스케치/드로잉을 실제 제품 사진처럼 변환
- 참조 질감 이미지로 원하는 재질감 적용 가능

### 3. 히스토리 관리
- 프로젝트 단위로 생성 기록 관리
- 저장된 이미지 재사용 및 수정 가능

### 4. 고해상도 다운로드
- 1K 기본 해상도 제공
- Real-ESRGAN ncnn을 활용한 2K 업스케일 다운로드

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **프론트엔드** | Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 4 |
| **상태 관리** | Zustand 5, TanStack Query 5 |
| **백엔드** | Node.js 22 LTS, Fastify 5, Prisma 7, BullMQ 5, Zod 3 |
| **데이터베이스** | PostgreSQL 16, Redis 7 |
| **AI/이미지** | Gemini 3 Pro Image API (`@google/genai`), Real-ESRGAN ncnn, Sharp |
| **모노레포** | Turborepo 2.3, pnpm 9.15 |
| **인프라** | Docker, Docker Compose, Tailscale VPN |

## 📁 프로젝트 구조

```
mockup-ai/
├── apps/
│   ├── web/              # Next.js 16 프론트엔드 (포트 3000)
│   └── api/              # Fastify 5 백엔드 (포트 4000)
│       ├── src/
│       │   ├── server.ts       # API 서버 (REST API 엔드포인트)
│       │   ├── worker.ts       # Worker 프로세스 (BullMQ 작업 처리)
│       │   ├── routes/         # API 라우트
│       │   ├── services/       # 비즈니스 로직 (Gemini API 통합)
│       │   └── lib/            # Prisma, Redis, Queue 클라이언트
│       └── prisma/
│           └── schema.prisma   # 데이터베이스 스키마
├── packages/
│   └── shared/           # 공유 타입/유틸리티 (workspace:*)
├── docs/                 # 프로젝트 문서
├── data/                 # 업로드/생성 이미지 저장소
└── docker-compose.yml    # Docker 설정
```

### 아키텍처 특징

- **API 서버 + Worker 분리**: API는 요청을 큐에 추가하고 즉시 응답, Worker는 백그라운드에서 이미지 생성
- **BullMQ 작업 큐**: Redis 기반 분산 작업 처리 (동시 2개 작업)
- **Gemini API 통합**: `@google/genai` 패키지로 IP 변경 및 스케치 실사화
- **Tailscale VPN**: 모든 외부 접근은 VPN을 통해서만 허용

## 🚀 시작하기

### 사전 요구사항

- Node.js 22 LTS
- pnpm 9.x
- Docker & Docker Compose
- Real-ESRGAN ncnn (업스케일용, macOS M1/M2 권장)

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값 입력

# Docker로 DB 시작
docker-compose up -d postgres redis

# Prisma 마이그레이션
cd apps/api && npx prisma migrate dev

# 개발 서버 시작
pnpm dev
```

### 접속

- 프론트엔드: http://localhost:3000
- API 서버: http://localhost:4000
- API 문서: http://localhost:4000/api

## 📋 환경 변수

```env
# 데이터베이스
DATABASE_URL="postgresql://user:password@localhost:5432/mockup?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# 파일 업로드
UPLOAD_DIR="./data"
MAX_FILE_SIZE=10485760

# Real-ESRGAN
REALESRGAN_PATH="/usr/local/bin/realesrgan-ncnn-vulkan"
```

## 🐳 Docker 배포

### 간편 배포 (권장)

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일에 GEMINI_API_KEY와 JWT_SECRET 설정

# 2. 전체 스택 실행
docker compose up -d --build

# 3. 접속
# 웹: http://localhost:3000
# API: http://localhost:4000
```

> 자세한 배포 방법은 **[빠른 시작 가이드](docs/QUICK_START.md)** 를 참조하세요.

### 개발 환경

```bash
# DB만 Docker로 실행
docker compose up -d postgres redis

# 로컬에서 개발 서버 실행
pnpm dev
```

## 📚 문서

### 사용자 문서 (필독)
| 문서 | 설명 |
|------|------|
| **[Tailscale 접속 가이드](docs/TAILSCALE_ACCESS_GUIDE.md)** | VPN 설치 및 접속 방법 (모든 사용자 필독) |
| **[사용자 가이드](docs/USER_GUIDE.md)** | 프로그램 사용법, 기능 설명, FAQ |
| **[빠른 시작 가이드](docs/QUICK_START.md)** | 설치, 배포, 운영 가이드 |

### 개발 문서
| 문서 | 설명 |
|------|------|
| [PRD (제품 요구사항)](docs/PRD.md) | 제품 기능 및 요구사항 정의 |
| [TRD (기술 요구사항)](docs/TRD.md) | 기술 스택 및 아키텍처 설계 |
| [ERD (데이터베이스 설계)](docs/ERD.md) | 데이터베이스 스키마 및 관계 |
| [IA (정보 구조)](docs/IA.md) | 화면 구조 및 네비게이션 |
| [Design Guide (디자인 가이드)](docs/DESIGN_GUIDE.md) | UI/UX 디자인 시스템 |
| [User Journey (사용자 여정)](docs/USER_JOURNEY.md) | 사용자 시나리오 및 흐름 |
| [Code Guideline (코딩 규칙)](docs/CODE_GUIDELINE.md) | 코딩 컨벤션 및 규칙 |

### 기술 문서
- **CLAUDE.md**: AI 코딩 어시스턴트를 위한 프로젝트 가이드

## 🔧 개발 명령어

### 모노레포 전체

```bash
# 전체 개발 서버 실행 (Web + API)
pnpm dev

# Worker 프로세스 실행 (별도 터미널)
pnpm dev:worker

# 전체 빌드
pnpm build

# 전체 린트
pnpm lint

# 전체 타입 체크
pnpm type-check

# 코드 포맷팅
pnpm format

# 의존성 정리
pnpm clean
```

### Prisma (데이터베이스)

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

## 🔐 환경 구분

### 로컬 개발 환경

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
4. [서버] docker compose restart api worker
5. [서버] 로그 확인 & 테스트
```

## 📄 라이선스

Private - 내부 사용 전용
