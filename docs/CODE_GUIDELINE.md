# Code Guideline
# AI 목업 이미지 프로그램 - 코딩 규칙 및 컨벤션

## 문서 정보

| 항목 | 내용 |
|------|------|
| 문서 버전 | 1.1 |
| 작성일 | 2026-01-07 |
| 최종 업데이트 | 2026-02-12 |
| 상태 | Draft |

---

## 1. 프로젝트 구조

### 1.1 Monorepo 구조

```
mockup-ai/
├── apps/
│   ├── web/                    # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/            # App Router 페이지
│   │   │   ├── components/     # React 컴포넌트
│   │   │   │   ├── ui/         # 기본 UI 컴포넌트
│   │   │   │   ├── features/   # 기능별 컴포넌트
│   │   │   │   └── layouts/    # 레이아웃 컴포넌트
│   │   │   ├── hooks/          # 커스텀 훅
│   │   │   ├── lib/            # 유틸리티, API 클라이언트
│   │   │   ├── stores/         # Zustand 스토어
│   │   │   ├── styles/         # 글로벌 스타일
│   │   │   └── types/          # 타입 정의
│   │   ├── public/             # 정적 파일
│   │   └── package.json
│   │
│   └── api/                    # Node.js 백엔드
│       ├── src/
│       │   ├── routes/         # API 라우트
│       │   ├── services/       # 비즈니스 로직
│       │   ├── repositories/   # 데이터 접근
│       │   ├── middlewares/    # 미들웨어
│       │   ├── utils/          # 유틸리티
│       │   ├── types/          # 타입 정의
│       │   └── config/         # 설정
│       ├── prisma/             # Prisma 스키마
│       └── package.json
│
├── packages/
│   └── shared/                 # 공유 코드
│       ├── types/              # 공유 타입
│       ├── utils/              # 공유 유틸리티
│       └── constants/          # 공유 상수
│
├── docker/                     # Docker 설정
├── scripts/                    # 유틸리티 스크립트
│
├── docs/                       # 문서
├── package.json                # 루트 package.json
├── pnpm-workspace.yaml         # pnpm 워크스페이스
└── turbo.json                  # Turborepo 설정
```

---

## 2. 네이밍 컨벤션

### 2.1 파일 및 폴더

| 타입 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ImageUploader.tsx` |
| 훅 | camelCase + use 접두사 | `useAuth.ts` |
| 유틸리티 | camelCase | `formatDate.ts` |
| 상수 | camelCase | `apiEndpoints.ts` |
| 타입 | camelCase | `generation.types.ts` |
| 스타일 | camelCase | `button.module.css` |
| API 라우트 | kebab-case | `ip-change.ts` |

### 2.2 변수 및 함수

```typescript
// 변수: camelCase
const userId = 'abc123';
const isLoading = false;

// 상수: UPPER_SNAKE_CASE (모듈 레벨)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_BASE_URL = 'http://localhost:4000';

// 함수: camelCase + 동사로 시작
function getUserById(id: string) { }
function handleSubmit() { }
async function fetchProjects() { }

// 불린 변수: is/has/can 접두사
const isVisible = true;
const hasError = false;
const canEdit = true;

// 이벤트 핸들러: handle 접두사
const handleClick = () => { };
const handleInputChange = () => { };
```

### 2.3 React 컴포넌트

```typescript
// 컴포넌트: PascalCase
function ImageUploader() { }
function ProjectCard() { }

// Props 타입: 컴포넌트명 + Props
interface ImageUploaderProps {
  onUpload: (file: File) => void;
  maxSize?: number;
}

// 컴포넌트 파일 구조
// ImageUploader/
// ├── index.ts           // export
// ├── ImageUploader.tsx   // 컴포넌트
// ├── ImageUploader.test.tsx
// └── ImageUploader.module.css (필요시)
```

### 2.4 타입 및 인터페이스

```typescript
// 인터페이스: PascalCase + I 접두사 없음
interface User {
  id: string;
  email: string;
}

// 타입 별칭: PascalCase
type GenerationMode = 'ip_change' | 'sketch_to_real';
type ProjectId = string;

// Enum: PascalCase (멤버도 PascalCase)
enum GenerationStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

// 제네릭 타입: 의미 있는 이름 또는 T/K/V
type ApiResponse<TData> = {
  data: TData;
  error: string | null;
};
```

---

## 3. TypeScript 스타일 가이드

### 3.1 기본 규칙

```typescript
// ✅ 타입 추론 활용 (명확한 경우)
const count = 0;  // number로 추론됨

// ✅ 함수 반환 타입 명시
function getUser(id: string): User | null {
  // ...
}

// ✅ 유니온 타입 사용
type Status = 'idle' | 'loading' | 'success' | 'error';

// ❌ any 사용 금지
function bad(data: any) { }

// ✅ unknown 사용 후 타입 가드
function good(data: unknown) {
  if (typeof data === 'string') {
    // data는 string
  }
}
```

### 3.2 Null 처리

```typescript
// ✅ Optional chaining 사용
const name = user?.profile?.name;

// ✅ Nullish coalescing 사용
const displayName = name ?? 'Unknown';

// ✅ 타입 가드 사용
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}
```

### 3.3 Zod 스키마

```typescript
// API 요청/응답 스키마 정의
import { z } from 'zod';

// 스키마 정의
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

// 타입 추출
type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// 유효성 검사
const result = CreateProjectSchema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error);
}
```

---

## 4. Worker 프로세스 실행

### 4.1 개발 환경에서 Worker 실행

API 서버와 Worker는 별도의 프로세스로 실행됩니다:

```bash
# API 서버 실행 (터미널 1)
cd apps/api && pnpm dev

# Worker 별도 실행 (터미널 2)
pnpm dev:worker
# 또는
cd apps/api && pnpm dev:worker
```

Worker는 BullMQ를 사용하여 이미지 생성 작업을 비동기로 처리합니다.

---

## 5. Gemini API 사용 규칙

### 5.1 필수 패키지

**반드시 `@google/genai` 패키지를 사용합니다:**

```typescript
// ✅ 올바른 사용
import { GoogleGenAI } from '@google/genai';

// ❌ 사용 금지 (deprecated)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai';
```

### 5.2 모델 선택

```typescript
// 이미지 생성 (IP 변경, 스케치 실사화)
const model = 'gemini-3-pro-image-preview';

// 복잡한 추론이 필요한 경우
const model = 'gemini-3-pro-preview';

// 간단한 작업
const model = 'gemini-3-flash-preview';
```

### 5.3 thoughtSignature 저장

**중요**: Gemini API 응답의 `thoughtSignature`는 반드시 데이터베이스에 저장해야 합니다.

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: [...],
});

// thoughtSignature 추출 및 저장
const thoughtSignatures = response.candidates?.map(c => c.thoughtSignature).filter(Boolean);

await prisma.generation.update({
  where: { id: generationId },
  data: {
    thoughtSignatures: thoughtSignatures, // JSON 필드에 저장
  },
});
```

이 데이터는 스타일 참조(Style Copy) 기능에서 재사용됩니다.

---

## 6. BullMQ 작업 큐 패턴

### 6.1 작업 추가 (API 서버)

```typescript
// API 라우트에서 작업 추가
import { generationQueue } from '@/lib/queue';

// 작업 큐에 추가
await generationQueue.add('generation', {
  generationId: generation.id,
  userId: request.user.id,
  mode: generation.mode,
  // ...기타 작업 데이터
});

// 즉시 응답 반환 (비동기 처리)
return reply.code(201).send({
  success: true,
  data: generation,
});
```

### 6.2 작업 처리 (Worker)

```typescript
// worker.ts
import { Worker } from 'bullmq';
import { redisConnection } from '@/lib/redis';

const worker = new Worker('generation', async (job) => {
  const { generationId, mode } = job.data;

  // 1. 상태 업데이트 (processing)
  await prisma.generation.update({
    where: { id: generationId },
    data: { status: 'processing' },
  });

  try {
    // 2. 이미지 로드 및 Base64 변환
    const images = await loadImages(job.data);

    // 3. Gemini API 호출
    const response = await generateImage(mode, images);

    // 4. 생성 이미지 저장
    await saveGeneratedImages(generationId, response);

    // 5. 상태 업데이트 (completed)
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'completed' },
    });
  } catch (error) {
    // 에러 처리 및 상태 업데이트 (failed)
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });
  }
}, {
  connection: redisConnection,
  concurrency: 2, // 동시 처리 작업 수
});
```

---

## 7. React / Next.js 패턴

### 7.1 컴포넌트 구조

```typescript
// 권장 컴포넌트 구조
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import type { ProjectCardProps } from './ProjectCard.types';

/**
 * 프로젝트 카드 컴포넌트
 * 프로젝트 목록에서 개별 프로젝트를 표시
 */
export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  // 1. 상태
  const [isHovered, setIsHovered] = useState(false);

  // 2. 파생 상태 (useMemo)
  const formattedDate = useMemo(
    () => formatDate(project.createdAt),
    [project.createdAt]
  );

  // 3. 이벤트 핸들러 (useCallback)
  const handleClick = useCallback(() => {
    onSelect(project.id);
  }, [project.id, onSelect]);

  // 4. 렌더링
  return (
    <div
      className="project-card"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{project.name}</h3>
      <p>{formattedDate}</p>
    </div>
  );
}
```

### 7.2 커스텀 훅

```typescript
// hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getAll(),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### 7.3 Server Components vs Client Components

```typescript
// 기본: Server Component (데이터 페칭)
// app/projects/page.tsx
export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}

// 필요시: Client Component (상호작용)
// components/ProjectList.tsx
'use client';

export function ProjectList({ projects }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  // ...
}
```

---

## 8. API 설계 규칙

### 8.1 RESTful 엔드포인트

```typescript
// 리소스 기반 URL
GET    /api/projects           // 목록 조회
POST   /api/projects           // 생성
GET    /api/projects/:id       // 상세 조회
PATCH  /api/projects/:id       // 부분 수정
DELETE /api/projects/:id       // 삭제

// 중첩 리소스
GET    /api/projects/:id/generations
POST   /api/projects/:id/generations

// 액션 (동사가 필요한 경우)
POST   /api/generations/:id/select
POST   /api/images/:id/upscale
```

### 8.2 응답 형식

```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// 페이지네이션 응답
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 8.3 실제 API 응답 예시

#### 프로젝트 생성
```typescript
POST /api/projects
Response:
{
  "success": true,
  "data": {
    "id": "cm123abc",
    "name": "새 프로젝트",
    "description": "테스트 프로젝트",
    "userId": "user123",
    "createdAt": "2026-02-12T10:00:00.000Z",
    "updatedAt": "2026-02-12T10:00:00.000Z"
  }
}
```

#### 이미지 생성 (IP 변경)
```typescript
POST /api/projects/:projectId/generations
Body:
{
  "mode": "ip_change",
  "originalImageId": "img123",
  "ipCharacterId": "char456"
}

Response:
{
  "success": true,
  "data": {
    "id": "gen789",
    "projectId": "cm123abc",
    "mode": "ip_change",
    "status": "pending",
    "createdAt": "2026-02-12T10:01:00.000Z"
  }
}
```

#### 생성 결과 조회 (Polling)
```typescript
GET /api/generations/:generationId

// 처리 중
{
  "success": true,
  "data": {
    "id": "gen789",
    "status": "processing",
    "generatedImages": []
  }
}

// 완료
{
  "success": true,
  "data": {
    "id": "gen789",
    "status": "completed",
    "generatedImages": [
      {
        "id": "result1",
        "imageUrl": "/uploads/generations/gen789/result1.png",
        "isSelected": false
      },
      {
        "id": "result2",
        "imageUrl": "/uploads/generations/gen789/result2.png",
        "isSelected": false
      }
    ]
  }
}
```

#### 이미지 업스케일 (🚧 구현 예정)
```typescript
POST /api/images/:imageId/upscale
Body:
{
  "scale": 2
}

Response:
{
  "success": true,
  "data": {
    "id": "upscaled123",
    "originalImageId": "result1",
    "scale": 2,
    "status": "pending"
  }
}
```

### 8.4 Fastify 라우트 예시

```typescript
// routes/projects.ts
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // 프로젝트 목록 조회
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const userId = request.user.id;
      const projects = await projectService.findByUser(userId);
      return { success: true, data: projects };
    },
  });

  // 프로젝트 생성
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: CreateProjectSchema,
    },
    handler: async (request, reply) => {
      const input = request.body as z.infer<typeof CreateProjectSchema>;
      const project = await projectService.create(request.user.id, input);
      return reply.code(201).send({ success: true, data: project });
    },
  });
};

export default projectRoutes;
```

---

## 9. 에러 처리

### 9.1 에러 클래스

```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 구체적 에러 클래스
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource}를 찾을 수 없습니다`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', '입력값이 올바르지 않습니다', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('UNAUTHORIZED', '인증이 필요합니다', 401);
  }
}
```

### 9.2 에러 핸들링 미들웨어

```typescript
// middlewares/errorHandler.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../errors/AppError';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 로깅
  request.log.error(error);

  // AppError 처리
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Zod 유효성 검사 에러
  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값이 올바르지 않습니다',
        details: error.validation,
      },
    });
  }

  // 알 수 없는 에러
  return reply.code(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다',
    },
  });
}
```

---

## 10. 테스트 전략

### 10.1 테스트 구조

```
__tests__/
├── unit/               # 단위 테스트
│   ├── utils/
│   └── services/
├── integration/        # 통합 테스트
│   └── api/
└── e2e/               # E2E 테스트
    └── flows/
```

### 10.2 테스트 네이밍

```typescript
// 단위 테스트
describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
    expect(formatDate(new Date('2026-01-07'))).toBe('2026-01-07');
  });

  it('null이 입력되면 빈 문자열을 반환한다', () => {
    expect(formatDate(null)).toBe('');
  });
});

// API 테스트
describe('POST /api/projects', () => {
  it('유효한 데이터로 프로젝트를 생성한다', async () => {
    // ...
  });

  it('이름이 없으면 400 에러를 반환한다', async () => {
    // ...
  });
});
```

---

## 11. Git 컨벤션

### 11.1 브랜치 전략

```
main           # 프로덕션 브랜치
├── develop    # 개발 브랜치
│   ├── feature/user-auth       # 기능 개발
│   ├── feature/ip-change       # 기능 개발
│   ├── fix/upload-error        # 버그 수정
│   └── refactor/api-structure  # 리팩토링
└── hotfix/critical-bug         # 긴급 수정
```

### 11.2 커밋 메시지

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**예시:**
```
feat(generation): IP 변경 기능 구현

- 이미지 업로드 컴포넌트 추가
- Gemini API 연동
- 결과 이미지 표시

Closes #123
```

---

## 12. ESLint / Prettier 설정

### 12.1 ESLint

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'react/display-name': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
  },
};
```

### 12.2 Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 13. 주석 규칙

### 13.1 주석 언어

**모든 주석은 한글로 작성합니다.**

```typescript
// ✅ 좋은 예시
// 사용자 인증 상태를 확인합니다
function checkAuth() { }

/**
 * 이미지를 업스케일합니다
 * @param imageId - 원본 이미지 ID
 * @param scale - 업스케일 배율 (2 = 2배)
 * @returns 업스케일된 이미지 정보
 */
async function upscaleImage(imageId: string, scale: number) { }

// ❌ 나쁜 예시
// Check user authentication
function checkAuth() { }
```

### 13.2 TODO / FIXME

```typescript
// TODO: 추후 배치 처리 기능 추가 필요
// FIXME: 대용량 파일 업로드 시 메모리 누수 발생
// NOTE: Gemini API 응답 형식이 변경될 수 있음
// HACK: 임시 해결책, 리팩토링 필요
```

---

## 부록: VS Code 권장 설정

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```
