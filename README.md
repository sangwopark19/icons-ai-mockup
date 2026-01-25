# MockupAI - AI 목업 이미지 생성 프로그램

제품 기획 초기단계에서 실제 제품과 유사한 비주얼 목업을 빠르게 생성하는 AI 기반 목업 생성 도구입니다.

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

```bash
# 개발 환경 (DB만)
docker-compose up -d postgres redis

# 프로덕션 빌드 및 실행 (전체 서비스)
docker-compose up -d --build
```

**📖 서버 배포 상세 가이드는 [DEPLOYMENT.md](docs/DEPLOYMENT.md)를 참고하세요.**

## 📚 개발 문서

- [PRD (제품 요구사항)](docs/PRD.md)
- [TRD (기술 요구사항)](docs/TRD.md)
- [ERD (데이터베이스 설계)](docs/ERD.md)
- [IA (정보 구조)](docs/IA.md)
- [Design Guide (디자인 가이드)](docs/DESIGN_GUIDE.md)
- [User Journey (사용자 여정)](docs/USER_JOURNEY.md)
- [Code Guideline (코딩 규칙)](docs/CODE_GUIDELINE.md)
- [Deployment (서버 배포 가이드)](docs/DEPLOYMENT.md)

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
