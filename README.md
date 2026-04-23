# MockupAI - AI 목업 이미지 생성 프로그램

제품 기획 초기단계에서 실제 제품과 유사한 비주얼 목업을 빠르게 생성하는 AI 기반 목업 생성 도구입니다.

## 📖 사용자 가이드

> **처음 사용하시나요?** 아래 문서를 먼저 확인하세요!

| 문서 | 대상 | 설명 |
|------|------|------|
| **[Tailscale 접속 가이드](docs/TAILSCALE_ACCESS_GUIDE.md)** | **모든 사용자 (필독)** | VPN 설치 및 접속 방법 |
| **[사용자 가이드](docs/USER_GUIDE.md)** | 디자이너/일반 사용자 | 프로그램 사용법, 기능 설명, FAQ |
| **[빠른 시작 가이드](docs/QUICK_START.md)** | 관리자/설치 담당자 | 설치, 배포, 운영 방법 |

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
| 프론트엔드 | Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Zustand 5, TanStack Query 5 |
| 백엔드 | Node.js 22 LTS, Fastify 5, TypeScript 5.9, Prisma 7, Zod 4, BullMQ 5 |
| DB/캐시 | PostgreSQL 16, Redis 7 |
| AI/이미지 | Gemini 3 Pro Image API, Real-ESRGAN ncnn, Sharp |
| 인프라 | Docker, Docker Compose, GitHub Actions |

## 📁 프로젝트 구조

```
mockup-ai/
├── apps/
│   ├── web/          # Next.js 16 (App Router) 프론트엔드
│   └── api/          # Fastify 5 + Prisma 7 백엔드
├── packages/
│   └── shared/       # 공유 타입/유틸리티
├── docker/           # Docker 설정
├── docs/             # 개발 문서
└── data/             # 업로드 파일 저장소
```

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

### 사용자 문서
- **[Tailscale 접속 가이드](docs/TAILSCALE_ACCESS_GUIDE.md)** - VPN 설치 및 접속 방법 (모든 사용자 필독)
- **[사용자 가이드](docs/USER_GUIDE.md)** - 디자이너를 위한 상세 사용 설명서
- **[빠른 시작 가이드](docs/QUICK_START.md)** - 설치 및 배포 가이드

### 개발 문서
- [PRD (제품 요구사항)](docs/PRD.md)
- [TRD (기술 요구사항)](docs/TRD.md)
- [ERD (데이터베이스 설계)](docs/ERD.md)
- [IA (정보 구조)](docs/IA.md)
- [Design Guide (디자인 가이드)](docs/DESIGN_GUIDE.md)
- [User Journey (사용자 여정)](docs/USER_JOURNEY.md)
- [Code Guideline (코딩 규칙)](docs/CODE_GUIDELINE.md)

## 🔧 개발 명령어

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint

# 타입 체크
pnpm type-check

# Prisma Studio
cd apps/api && npx prisma studio
```

## 📄 라이선스

Private - 내부 사용 전용
