# TRD (Technical Requirements Document)
# AI 목업 이미지 프로그램 - 기술 요구사항 정의서

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.0 |
| 작성일 | 2026-01-07 |
| 상태 | Draft |

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 다이어그램

```mermaid
flowchart TB
    subgraph client [Client Layer]
        Browser[웹 브라우저]
        NextJS[Next.js Frontend]
    end
    
    subgraph server [Application Layer - Mac Local Server]
        API[Node.js/Fastify API Server]
        Queue[BullMQ Job Queue]
        Redis[(Redis)]
        Sharp[Sharp - 리사이징/썸네일]
        ESRGAN[Real-ESRGAN ncnn<br/>로컬 업스케일러]
    end
    
    subgraph external [External Services]
        Gemini[Gemini 3 Pro Image API]
    end
    
    subgraph storage [Data Layer]
        DB[(PostgreSQL)]
        FS[Local Filesystem<br/>이미지 저장소]
    end
    
    Browser --> NextJS
    NextJS -->|REST API| API
    API --> Queue
    Queue --> Redis
    Queue -->|이미지 생성 요청| Gemini
    Queue -->|업스케일 요청| ESRGAN
    Gemini -->|생성된 이미지| FS
    ESRGAN -->|업스케일 이미지| FS
    API --> DB
    API --> Sharp
    Sharp --> FS
    API --> FS
```

### 1.2 컨테이너 아키텍처

```mermaid
flowchart LR
    subgraph docker [Docker Compose]
        Web[web<br/>Next.js:3000]
        Api[api<br/>Node.js:4000]
        Worker[worker<br/>Job Processor + Sharp]
        PG[(postgres<br/>:5432)]
        RD[(redis<br/>:6379)]
    end
    
    Web --> Api
    Api --> PG
    Api --> RD
    Worker --> RD
```

---

## 2. 기술 스택

> **Note**: 2026-01-07 기준 Context7 공식문서 확인 완료
> 
> **호환성 매트릭스**:
> - Next.js 16 → Node.js 20.9+ 필수, TypeScript 5.1+
> - Prisma 7 → Node.js 20.19+ 필수, TypeScript 5.4+
> - Fastify 5 → Node.js 20+ 필수
> - Tailwind CSS 4 → Node.js 20+ 필수
> - BullMQ → Redis 6.2+ 권장
> - shadcn/ui → Tailwind CSS v4 지원 (2025년 2월 업데이트)

### 2.1 프론트엔드

| 카테고리 | 기술 | 버전 | 용도 |
|----------|------|------|------|
| Framework | Next.js | 16.x | React 기반 풀스택 프레임워크 (App Router) |
| Runtime | React | 19.x | UI 라이브러리 (Next.js 16 기본 포함) |
| Language | TypeScript | 5.9.x | 타입 안정성 (Prisma 7 요구: 5.4+) |
| Styling | Tailwind CSS | 4.x | 유틸리티 기반 스타일링 (@tailwindcss/vite) |
| UI Components | shadcn/ui | latest | 재사용 가능한 UI 컴포넌트 (OKLCH 색상) |
| State Management | Zustand | 5.x | 경량 상태 관리 (useShallow 훅 사용) |
| Data Fetching | TanStack Query | 5.x | 서버 상태 관리 및 캐싱 (v5.84+) |
| Form | React Hook Form | 7.x | 폼 상태 관리 (v7.66+) |
| Validation | Zod | 4.x | 스키마 기반 유효성 검사 (error 파라미터) |
| Icons | Lucide React | latest | 아이콘 시스템 |

### 2.2 백엔드

| 카테고리 | 기술 | 버전 | 용도 |
|----------|------|------|------|
| Runtime | Node.js | 22.x LTS | JavaScript 런타임 (Prisma 7: 20.19+ 필수) |
| Framework | Fastify | 5.x | 고성능 웹 프레임워크 (listen 옵션 객체 필수) |
| Language | TypeScript | 5.9.x | 타입 안정성 |
| ORM | Prisma | 7.x | 데이터베이스 ORM |
| Validation | Zod | 4.x | 요청/응답 유효성 검사 |
| Job Queue | BullMQ | 5.x | 비동기 작업 처리 |
| Auth | JWT + bcrypt | - | 인증/인가 |
| File Upload | @fastify/multipart | - | 멀티파트 파일 업로드 |

### 2.3 데이터베이스 및 캐시

| 카테고리 | 기술 | 버전 | 용도 |
|----------|------|------|------|
| Database | PostgreSQL | 16.x | 주 데이터베이스 |
| Cache/Queue | Redis | 7.x | 캐싱 및 작업 큐 (BullMQ: 6.2+ 권장) |

### 2.4 AI 및 이미지 처리

| 카테고리 | 기술 | 용도 |
|----------|------|------|
| Image Generation | Gemini 3 Pro Image Preview API | 목업 이미지 생성 |
| Upscaling | Real-ESRGAN ncnn (로컬) | AI 기반 이미지 업스케일링 (1K → 2K+) |
| Image Processing | Sharp | 이미지 리사이징, 포맷 변환, 썸네일 생성 |

> **Note**: Real-ESRGAN ncnn은 Vulkan/Metal 백엔드를 통해 M1/M2 Mac에서 GPU 가속을 지원합니다.

### 2.5 인프라

| 카테고리 | 기술 | 용도 |
|----------|------|------|
| Container | Docker | 컨테이너화 |
| Orchestration | Docker Compose | 로컬 컨테이너 관리 |
| CI/CD | GitHub Actions | 자동 배포 |
| OS | macOS | 로컬 서버 환경 |

---

## 3. API 설계

### 3.1 인증 API

```
POST   /api/auth/register     # 회원가입
POST   /api/auth/login        # 로그인
POST   /api/auth/logout       # 로그아웃
GET    /api/auth/me           # 현재 사용자 정보
```

### 3.2 프로젝트 API

```
GET    /api/projects          # 프로젝트 목록 조회
POST   /api/projects          # 프로젝트 생성
GET    /api/projects/:id      # 프로젝트 상세 조회
PATCH  /api/projects/:id      # 프로젝트 수정
DELETE /api/projects/:id      # 프로젝트 삭제
```

### 3.3 생성 API

```
POST   /api/generations              # 목업 생성 요청
GET    /api/generations/:id          # 생성 상태 조회
GET    /api/generations/:id/images   # 생성된 이미지 목록
POST   /api/generations/:id/select   # 이미지 선택
POST   /api/generations/:id/edit     # 부분 수정 요청
```

### 3.4 이미지 API

```
GET    /api/images/:id              # 이미지 조회
GET    /api/images/:id/download     # 이미지 다운로드 (원본)
GET    /api/images/:id/download/2k  # 2K 업스케일 다운로드
DELETE /api/images/:id              # 이미지 삭제
```

### 3.5 히스토리 API

```
GET    /api/projects/:id/history    # 프로젝트 히스토리 조회
POST   /api/history/:imageId/save   # 히스토리에 저장
DELETE /api/history/:id             # 히스토리 삭제
```

### 3.6 IP 캐릭터 API

```
GET    /api/projects/:id/characters     # IP 캐릭터 목록
POST   /api/projects/:id/characters     # IP 캐릭터 등록
DELETE /api/characters/:id              # IP 캐릭터 삭제
```

---

## 4. Gemini API 연동 설계

### 4.1 API 구성

```typescript
// Gemini API 클라이언트 설정
interface GeminiConfig {
  apiKey: string;
  model: 'gemini-3-pro-image-preview'; // nanobanana pro
  maxOutputTokens: number;
  temperature: number;
}

// 생성 요청 타입
interface GenerationRequest {
  mode: 'ip-change' | 'sketch-to-real';
  sourceImage: Buffer;           // 원본 제품 이미지 또는 스케치
  characterImage?: Buffer;       // IP 캐릭터 이미지 (mode: ip-change)
  referenceTexture?: Buffer;     // 참조 질감 이미지 (선택)
  prompt: string;                // 추가 프롬프트
  preserveStructure: boolean;    // 구조 우선 여부
  transparentBackground: boolean; // 투명 배경 여부
}

// 생성 응답 타입
interface GenerationResponse {
  images: Array<{
    data: Buffer;
    mimeType: string;
  }>;
  metadata: {
    processingTime: number;
    model: string;
  };
}
```

### 4.2 프롬프트 엔지니어링 전략

```typescript
// 기본 시스템 프롬프트
const SYSTEM_PROMPT = {
  ipChange: `You are a product mockup generator. 
    Replace the character in the product image with the provided character IP.
    CRITICAL: Maintain the exact physical structure of the product.
    CRITICAL: Preserve the character's proportions and facial features.
    CRITICAL: Keep the same lighting and perspective.`,
  
  sketchToReal: `You are a product visualization expert.
    Convert the 2D sketch into a photorealistic product mockup.
    CRITICAL: Preserve every detail of the original design.
    CRITICAL: Apply realistic materials and lighting.
    CRITICAL: Maintain the exact proportions from the sketch.`
};

// 조건부 프롬프트 추가
const conditionalPrompts = {
  preserveStructure: 'Strictly maintain the structural composition.',
  transparentBackground: 'Generate with transparent background (PNG).',
  textureReference: 'Apply the texture from the reference image.',
};
```

### 4.3 에러 처리

```typescript
// 재시도 전략
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

// 에러 타입
enum GenerationError {
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  INVALID_IMAGE = 'INVALID_IMAGE',
  CONTENT_POLICY = 'CONTENT_POLICY',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}
```

---

## 5. 이미지 처리 파이프라인

### 5.1 처리 흐름

```mermaid
flowchart LR
    subgraph input [입력]
        Upload[이미지 업로드]
    end
    
    subgraph processing [처리]
        Validate[유효성 검사]
        Resize[리사이징]
        Queue[작업 큐 등록]
        Generate[Gemini API 호출]
    end
    
    subgraph storage [저장]
        Save1K[1K 이미지 저장]
    end
    
    subgraph output [출력]
        Serve[이미지 서빙]
        Upscale[2K 업스케일]
        Download[다운로드]
    end
    
    Upload --> Validate
    Validate --> Resize
    Resize --> Queue
    Queue --> Generate
    Generate --> Save1K
    Save1K --> Serve
    Serve -->|다운로드 요청| Upscale
    Upscale --> Download
```

### 5.2 이미지 저장 구조

```
/data/
├── uploads/                    # 업로드된 원본 이미지
│   └── {userId}/
│       └── {projectId}/
│           └── {uuid}.{ext}
├── generations/                # 생성된 목업 이미지 (1K)
│   └── {userId}/
│       └── {projectId}/
│           └── {generationId}/
│               ├── output_1.png
│               └── output_2.png
├── upscaled/                   # 업스케일된 이미지 (2K)
│   └── {imageId}_2k.png
└── characters/                 # IP 캐릭터 이미지
    └── {userId}/
        └── {characterId}.png
```

### 5.3 Real-ESRGAN ncnn 업스케일러

> Real-ESRGAN ncnn은 Vulkan/Metal 백엔드를 통해 M1/M2 Mac에서 GPU 가속을 지원하는 고성능 업스케일러입니다.

#### 설치 (macOS)

```bash
# Homebrew로 설치
brew install realesrgan-ncnn-vulkan

# 또는 GitHub 릴리즈에서 다운로드
# https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan/releases
```

#### Node.js 연동 코드

```typescript
// services/upscaler.ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Real-ESRGAN ncnn 실행 파일 경로
const REALESRGAN_PATH = process.env.REALESRGAN_PATH || 'realesrgan-ncnn-vulkan';

// 사용 가능한 모델
type UpscaleModel = 
  | 'realesrgan-x4plus'      // 일반 이미지용 4x
  | 'realesrgan-x4plus-anime' // 애니메이션용 4x
  | 'realesr-animevideov3';   // 애니메이션 비디오용

interface UpscaleOptions {
  scale?: 2 | 3 | 4;           // 업스케일 배율 (기본: 2)
  model?: UpscaleModel;        // 모델 선택 (기본: realesrgan-x4plus)
  tileSize?: number;           // 타일 크기 (GPU 메모리 조절)
  gpuId?: number;              // GPU ID (기본: 0)
}

/**
 * Real-ESRGAN ncnn을 사용하여 이미지 업스케일
 * M1/M2 Mac에서 Metal API를 통해 GPU 가속 지원
 */
export async function upscaleImage(
  inputPath: string,
  outputPath: string,
  options: UpscaleOptions = {}
): Promise<{ success: boolean; outputPath: string }> {
  const {
    scale = 2,
    model = 'realesrgan-x4plus',
    tileSize = 0,  // 0 = 자동
    gpuId = 0,
  } = options;

  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputPath,
      '-o', outputPath,
      '-s', scale.toString(),
      '-n', model,
      '-g', gpuId.toString(),
    ];

    // 타일 크기 지정 (메모리 부족 시 조절)
    if (tileSize > 0) {
      args.push('-t', tileSize.toString());
    }

    const process = spawn(REALESRGAN_PATH, args);

    let stderr = '';

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, outputPath });
      } else {
        reject(new Error(`Real-ESRGAN 실패 (code: ${code}): ${stderr}`));
      }
    });

    process.on('error', (err) => {
      reject(new Error(`Real-ESRGAN 실행 오류: ${err.message}`));
    });
  });
}

/**
 * 이미지를 2K (2048px)로 업스케일
 */
export async function upscaleTo2K(
  inputPath: string,
  outputDir: string
): Promise<string> {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${fileName}_2k.png`);

  await upscaleImage(inputPath, outputPath, { scale: 2 });

  return outputPath;
}
```

### 5.4 Sharp 이미지 처리

```typescript
// services/imageProcessor.ts
import sharp from 'sharp';

/**
 * 이미지 썸네일 생성
 */
export async function createThumbnail(
  inputPath: string,
  outputPath: string,
  size: number = 200
): Promise<void> {
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
}

/**
 * 이미지 포맷 변환
 */
export async function convertFormat(
  inputPath: string,
  outputPath: string,
  format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<void> {
  let pipeline = sharp(inputPath);

  switch (format) {
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 6 });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 85 });
      break;
  }

  await pipeline.toFile(outputPath);
}

/**
 * 이미지 메타데이터 조회
 */
export async function getImageMetadata(inputPath: string) {
  return sharp(inputPath).metadata();
}
```

---

## 6. 작업 큐 설계

### 6.1 BullMQ 작업 타입

```typescript
// 작업 타입 정의
enum JobType {
  GENERATE_MOCKUP = 'generate-mockup',
  UPSCALE_IMAGE = 'upscale-image',
  REMOVE_BACKGROUND = 'remove-background',
}

// 생성 작업 데이터
interface GenerateMockupJob {
  type: JobType.GENERATE_MOCKUP;
  data: {
    generationId: string;
    userId: string;
    projectId: string;
    mode: 'ip-change' | 'sketch-to-real';
    sourceImagePath: string;
    characterImagePath?: string;
    options: GenerationOptions;
  };
}

// 작업 우선순위
const QUEUE_PRIORITY = {
  HIGH: 1,    // 부분 수정
  NORMAL: 5,  // 일반 생성
  LOW: 10,    // 배치 작업
};
```

### 6.2 작업 처리 워커

```typescript
// 워커 설정
const worker = new Worker('mockup-queue', async (job) => {
  switch (job.data.type) {
    case JobType.GENERATE_MOCKUP:
      return await processGeneration(job.data);
    case JobType.UPSCALE_IMAGE:
      return await processUpscale(job.data);
    case JobType.REMOVE_BACKGROUND:
      return await processRemoveBackground(job.data);
  }
}, {
  connection: redisConnection,
  concurrency: 3,  // 동시 처리 수
  limiter: {
    max: 10,       // 분당 최대 요청
    duration: 60000,
  },
});
```

---

## 7. Docker 구성

### 7.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js 프론트엔드
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
    depends_on:
      - api

  # Node.js API 서버
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/mockup
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis

  # 작업 처리 워커 (Sharp 이미지 처리 포함)
  worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.worker
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/mockup
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mockup
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 7.2 Dockerfile (API)

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### 7.3 Dockerfile (Worker)

```dockerfile
# apps/api/Dockerfile.worker
FROM node:22-alpine AS builder

WORKDIR /app

# Sharp를 위한 빌드 도구 설치
RUN apk add --no-cache python3 make g++ vips-dev

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

# Sharp 런타임 의존성 및 Real-ESRGAN ncnn
RUN apk add --no-cache vips vulkan-loader

# Real-ESRGAN ncnn 바이너리 복사 (호스트에서 마운트 또는 빌드 시 포함)
# M1/M2 Mac에서는 로컬 설치된 바이너리를 볼륨 마운트로 사용
ENV REALESRGAN_PATH=/usr/local/bin/realesrgan-ncnn-vulkan

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["node", "dist/worker.js"]
```

> **Note (M1/M2 Mac)**: Docker 대신 로컬에서 직접 Worker를 실행하면 Metal GPU 가속을 활용할 수 있습니다.
> `brew install realesrgan-ncnn-vulkan`으로 설치 후 네이티브로 실행하는 것을 권장합니다.

---

## 8. CI/CD 파이프라인

### 8.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to Mac Server

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build Docker images
        run: docker compose build
        
      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker compose push
          
      - name: Deploy to Mac Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.MAC_SERVER_HOST }}
          username: ${{ secrets.MAC_SERVER_USER }}
          key: ${{ secrets.MAC_SERVER_SSH_KEY }}
          script: |
            cd /path/to/mockup-ai
            git pull origin main
            docker compose pull
            docker compose up -d --remove-orphans
            docker system prune -f
```

### 8.2 배포 전략

```mermaid
flowchart LR
    Dev[개발자 Push] --> GH[GitHub]
    GH --> Actions[GitHub Actions]
    Actions --> Test[테스트 실행]
    Test --> Build[Docker 빌드]
    Build --> Push[Registry Push]
    Push --> SSH[SSH 배포]
    SSH --> Mac[Mac 서버]
    Mac --> Compose[Docker Compose Up]
```

---

## 9. 보안 요구사항

### 9.1 인증/인가

```typescript
// JWT 토큰 구조
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// 토큰 설정
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
};

// 비밀번호 해싱
const BCRYPT_ROUNDS = 12;
```

### 9.2 API 보안

- 모든 API 엔드포인트 HTTPS 적용 (리버스 프록시)
- Rate Limiting: 분당 60 요청
- CORS 설정: 허용된 도메인만
- 파일 업로드 크기 제한: 10MB
- 허용 파일 타입: PNG, JPG, WEBP

### 9.3 데이터 보안

- 사용자별 데이터 격리 (userId 기반)
- 파일 경로에 userId 포함하여 접근 제어
- 데이터베이스 연결 암호화

---

## 10. 성능 요구사항

### 10.1 응답 시간 목표

| 작업 | 목표 시간 |
|------|-----------|
| API 일반 요청 | < 200ms |
| 이미지 업로드 | < 3s |
| 목업 생성 (2장) | < 30s |
| 업스케일링 | < 10s |
| 이미지 다운로드 | < 2s |

### 10.2 동시성

- 동시 사용자: 5~20명
- 동시 생성 작업: 최대 3개
- 큐 대기 작업: 최대 100개

### 10.3 저장소

- 이미지당 평균 크기: 1~2MB (1K), 4~8MB (2K)
- 프로젝트당 예상 이미지: 50~100장
- 사용자당 예상 저장공간: 1~5GB

---

## 11. 모니터링 및 로깅

### 11.1 로깅 전략

```typescript
// 로그 레벨
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// 로그 포맷
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: Error;
}
```

### 11.2 모니터링 항목

- API 응답 시간
- 생성 작업 성공/실패율
- 큐 길이 및 처리 시간
- 디스크 사용량
- 메모리/CPU 사용률

---

## 부록: 기술 의사결정 기록

### ADR-001: Fastify 선택 이유
- Express 대비 2~3배 빠른 성능
- 스키마 기반 유효성 검사 내장
- TypeScript 지원 우수

### ADR-002: Real-ESRGAN ncnn 선택 이유 (업스케일링)
- 로컬 실행 (외부 API 의존성 없음)
- Vulkan/Metal 백엔드로 M1/M2 Mac GPU 가속 지원
- 고품질 AI 기반 초해상도 업스케일링
- 단일 바이너리로 간편한 배포
- 다양한 모델 지원 (일반/애니메이션)
- 오픈소스 (MIT 라이선스)

### ADR-003: BullMQ 선택 이유
- Redis 기반으로 간단한 설정
- 작업 재시도, 우선순위 지원
- 실시간 작업 상태 추적
