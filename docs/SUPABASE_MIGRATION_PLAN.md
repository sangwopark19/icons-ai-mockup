# Supabase 마이그레이션 계획서

## 📊 현재 시스템 분석

### 아키텍처 구성
- **프론트엔드**: Next.js 16 (App Router) + React 19
- **백엔드**: Fastify 5 + Prisma 7
- **데이터베이스**: PostgreSQL 16 (Docker)
- **캐시/큐**: Redis 7 + BullMQ
- **스토리지**: 로컬 파일시스템 (Docker 볼륨)
- **인증**: JWT + 커스텀 세션 관리

### 데이터베이스 구조 (Prisma Schema)
```prisma
- User (사용자)
- Session (JWT 세션)
- Project (프로젝트)
- IPCharacter (캐릭터)
- Generation (생성 기록)
- GeneratedImage (생성된 이미지)
- ImageHistory (이미지 수정 이력)
```

### 파일 스토리지 구조
```
data/
├── uploads/          # 업로드된 원본 이미지
│   └── {userId}/
│       └── {projectId}/
├── characters/       # 캐릭터 이미지
│   └── {userId}/
└── generations/      # AI 생성 이미지
    └── {userId}/
        └── {projectId}/
            └── {generationId}/
```

---

## 🎯 마이그레이션 목표

### Phase 1: 최소 변경 (권장)
**소요 기간: 2-3일 (16-24시간)**

1. ✅ PostgreSQL → Supabase PostgreSQL
2. ✅ 로컬 스토리지 → Supabase Storage
3. ✅ Redis → Upstash Redis
4. ✅ 인증 시스템 유지

### Phase 2: 부분 최적화 (선택)
**소요 기간: 추가 1-2일**

5. 🔄 BullMQ → Supabase Edge Functions + pg_cron

### Phase 3: 완전 통합 (장기)
**소요 기간: 추가 1-2일**

6. 🔄 커스텀 JWT → Supabase Auth

---

## 📋 Phase 1: 최소 변경 마이그레이션

### Step 1: Supabase 프로젝트 설정 (30분)

```bash
# 1. Supabase 프로젝트 생성
# - https://supabase.com 접속
# - 새 프로젝트 생성
# - Region: 서울 또는 도쿄 선택
# - 프로젝트 이름: mockup-ai

# 2. 환경 변수 저장
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### Step 2: 데이터베이스 마이그레이션 (2-4시간)

#### 2.1 Prisma 마이그레이션 실행
```bash
# .env 파일 수정
DATABASE_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Prisma 스키마 수정 (apps/api/prisma/schema.prisma)
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
#   directUrl = env("DIRECT_URL") // 추가
# }

# 마이그레이션 실행
cd apps/api
npx prisma migrate deploy

# Prisma Client 재생성
npx prisma generate
```

#### 2.2 기존 데이터 이전 (필요 시)
```bash
# 기존 Docker PostgreSQL에서 데이터 덤프
docker exec mockup-postgres pg_dump -U user mockup > backup.sql

# Supabase에 복원 (Supabase 대시보드의 SQL Editor 사용)
# 또는
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" < backup.sql
```

#### 2.3 Row Level Security (RLS) 설정
```sql
-- Supabase 대시보드 SQL Editor에서 실행

-- User 테이블: 본인 데이터만 조회 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

-- Project 테이블: 본인 프로젝트만 접근
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR ALL
  USING (auth.uid()::text = user_id);

-- 나머지 테이블도 동일하게 설정...
```

### Step 3: Supabase Storage 마이그레이션 (6-10시간)

#### 3.1 Storage 버킷 생성
```bash
# Supabase 대시보드 > Storage에서 버킷 생성

버킷 이름:
- uploads (공개: false)
- characters (공개: false)
- generations (공개: true) # 다운로드용
- thumbnails (공개: true)
```

#### 3.2 Storage 정책 설정
```sql
-- uploads 버킷: 본인만 업로드/조회
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- generations 버킷: 모두 조회 가능
CREATE POLICY "Anyone can view generations"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generations');

-- 나머지 버킷도 동일하게...
```

#### 3.3 upload.service.ts 리팩토링

**새 파일: `apps/api/src/services/supabase-storage.service.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { config } from '../config/index.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class SupabaseStorageService {
  private readonly thumbnailSize = 200;

  /**
   * 이미지 업로드
   */
  async uploadImage(
    userId: string,
    projectId: string,
    buffer: Buffer,
    mimeType: string
  ) {
    // Sharp로 이미지 처리
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    // 파일명 생성
    const format = metadata.format || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${format}`;
    const path = `${userId}/${projectId}/${fileName}`;

    // 원본 업로드
    const { data: fileData, error: fileError } = await supabase.storage
      .from('uploads')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (fileError) throw fileError;

    // 썸네일 생성 및 업로드
    const thumbnailBuffer = await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbPath = `${userId}/${projectId}/thumb_${fileName}`;
    await supabase.storage
      .from('thumbnails')
      .upload(thumbPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(path);

    const { data: thumbUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(thumbPath);

    return {
      filePath: urlData.publicUrl,
      thumbnailPath: thumbUrlData.publicUrl,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format,
        size: buffer.length,
      },
    };
  }

  /**
   * 캐릭터 이미지 업로드
   */
  async uploadCharacterImage(userId: string, buffer: Buffer, mimeType: string) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    const format = metadata.format || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${format}`;
    const path = `${userId}/${fileName}`;

    // 원본 업로드
    await supabase.storage.from('characters').upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    // 썸네일
    const thumbnailBuffer = await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbPath = `${userId}/thumb_${fileName}`;
    await supabase.storage.from('thumbnails').upload(thumbPath, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    const { data: urlData } = supabase.storage.from('characters').getPublicUrl(path);
    const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath);

    return {
      filePath: urlData.publicUrl,
      thumbnailPath: thumbUrlData.publicUrl,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format,
        size: buffer.length,
      },
    };
  }

  /**
   * 생성된 이미지 저장
   */
  async saveGeneratedImage(
    userId: string,
    projectId: string,
    generationId: string,
    buffer: Buffer,
    index: number
  ) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    const fileName = `output_${index + 1}.png`;
    const path = `${userId}/${projectId}/${generationId}/${fileName}`;

    // PNG로 변환 후 업로드
    const pngBuffer = await image.png().toBuffer();
    await supabase.storage.from('generations').upload(path, pngBuffer, {
      contentType: 'image/png',
      upsert: false,
    });

    // 썸네일
    const thumbnailBuffer = await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbFileName = `thumb_output_${index + 1}.jpg`;
    const thumbPath = `${userId}/${projectId}/${generationId}/${thumbFileName}`;
    await supabase.storage.from('thumbnails').upload(thumbPath, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    const { data: urlData } = supabase.storage.from('generations').getPublicUrl(path);
    const { data: thumbUrlData } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath);

    return {
      filePath: urlData.publicUrl,
      thumbnailPath: thumbUrlData.publicUrl,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: 'png',
        size: pngBuffer.length,
      },
    };
  }

  /**
   * 파일 읽기 (URL에서)
   */
  async readFile(fileUrl: string): Promise<Buffer> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`파일을 읽을 수 없습니다: ${fileUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 파일 삭제
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error && error.message !== 'Object not found') {
      throw error;
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
```

#### 3.4 기존 서비스 파일 수정

**수정: `apps/api/src/services/generation.service.ts`**
```typescript
// import { uploadService } from './upload.service.js';
import { supabaseStorageService } from './supabase-storage.service.js';

// 모든 uploadService 호출을 supabaseStorageService로 변경
```

**수정: `apps/api/src/worker.ts`**
```typescript
// import { uploadService } from './services/upload.service.js';
import { supabaseStorageService as uploadService } from './services/supabase-storage.service.js';
```

#### 3.5 기존 이미지 마이그레이션 스크립트

**새 파일: `scripts/migrate-images-to-supabase.ts`**

```typescript
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { glob } from 'glob';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const prisma = new PrismaClient();

async function migrateImages() {
  console.log('📦 이미지 마이그레이션 시작...');

  // 1. uploads 디렉토리
  const uploadFiles = await glob('data/uploads/**/*.*');
  console.log(`📁 uploads: ${uploadFiles.length}개 파일 발견`);

  for (const file of uploadFiles) {
    const buffer = await fs.readFile(file);
    const relativePath = file.replace('data/uploads/', '');
    
    const { error } = await supabase.storage
      .from('uploads')
      .upload(relativePath, buffer, { upsert: true });

    if (error) {
      console.error(`❌ 업로드 실패: ${file}`, error);
    } else {
      console.log(`✅ 업로드 완료: ${file}`);
    }
  }

  // 2. characters 디렉토리
  const characterFiles = await glob('data/characters/**/*.*');
  console.log(`📁 characters: ${characterFiles.length}개 파일 발견`);

  for (const file of characterFiles) {
    const buffer = await fs.readFile(file);
    const relativePath = file.replace('data/characters/', '');
    
    await supabase.storage
      .from('characters')
      .upload(relativePath, buffer, { upsert: true });

    console.log(`✅ 업로드 완료: ${file}`);
  }

  // 3. generations 디렉토리
  const generationFiles = await glob('data/generations/**/*.*');
  console.log(`📁 generations: ${generationFiles.length}개 파일 발견`);

  for (const file of generationFiles) {
    const buffer = await fs.readFile(file);
    const relativePath = file.replace('data/generations/', '');
    
    const bucketName = file.includes('thumb_') ? 'thumbnails' : 'generations';
    
    await supabase.storage
      .from(bucketName)
      .upload(relativePath, buffer, { upsert: true });

    console.log(`✅ 업로드 완료: ${file}`);
  }

  // 4. DB 경로 업데이트
  console.log('📝 데이터베이스 경로 업데이트 중...');

  // IPCharacter 테이블
  const characters = await prisma.iPCharacter.findMany();
  for (const character of characters) {
    const { data } = supabase.storage
      .from('characters')
      .getPublicUrl(character.filePath);

    await prisma.iPCharacter.update({
      where: { id: character.id },
      data: { filePath: data.publicUrl },
    });
  }

  // GeneratedImage 테이블
  const images = await prisma.generatedImage.findMany();
  for (const image of images) {
    const { data: fileUrl } = supabase.storage
      .from('generations')
      .getPublicUrl(image.filePath);

    const { data: thumbUrl } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(image.thumbnailPath || '');

    await prisma.generatedImage.update({
      where: { id: image.id },
      data: {
        filePath: fileUrl.publicUrl,
        thumbnailPath: thumbUrl.publicUrl,
      },
    });
  }

  console.log('✅ 마이그레이션 완료!');
}

migrateImages().catch(console.error);
```

**실행:**
```bash
# 필요한 패키지 설치
pnpm add glob

# 스크립트 실행
npx tsx scripts/migrate-images-to-supabase.ts
```

### Step 4: Redis → Upstash Redis (2-3시간)

#### 4.1 Upstash 계정 생성 및 Redis 인스턴스 생성
```bash
# 1. https://upstash.com 가입
# 2. 새 Redis 데이터베이스 생성
#    - Region: 서울 선택
#    - 무료 플랜으로 시작 가능 (10,000 commands/day)

# 3. .env 파일 수정
REDIS_URL="rediss://default:[password]@[endpoint]:6379"
```

#### 4.2 코드 수정
```bash
# 기존 Redis 연결 코드는 그대로 유지 가능
# apps/api/src/lib/redis.ts
# apps/api/src/lib/queue.ts

# REDIS_URL만 변경하면 자동으로 Upstash에 연결됨
```

#### 4.3 Docker Compose 수정
```yaml
# docker-compose.yml에서 redis 서비스 제거
services:
  postgres:
    # ...
  
  # redis:  # 이 부분 전체 주석 처리 또는 삭제
  #   image: redis:7-alpine
  #   ...

  api:
    # ...
    depends_on:
      postgres:
        condition: service_healthy
      # redis 의존성 제거
```

### Step 5: 환경 변수 업데이트

**수정: `.env`**
```env
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# 데이터베이스
DATABASE_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Redis (Upstash)
REDIS_URL="rediss://default:[password]@[endpoint]:6379"

# Gemini API (그대로)
GEMINI_API_KEY="your-gemini-key"

# JWT (그대로)
JWT_SECRET="your-jwt-secret"

# 파일 업로드 (제거 - 더 이상 로컬 스토리지 사용 안 함)
# UPLOAD_DIR="./data"

# Real-ESRGAN (그대로)
REALESRGAN_PATH="/usr/local/bin/realesrgan-ncnn-vulkan"
```

### Step 6: 테스트 및 배포 (2시간)

```bash
# 1. 로컬 테스트
pnpm dev

# 2. 기능 테스트
# - 회원가입/로그인
# - 프로젝트 생성
# - 캐릭터 업로드
# - IP 변경 생성
# - 스케치 실사화
# - 이미지 다운로드

# 3. Docker 빌드 (Supabase 사용 시 Docker는 선택적)
docker compose build

# 4. 배포
# - Vercel/Railway 등으로 배포 가능
# - Docker Compose는 더 이상 필요하지 않음 (DB/Redis가 클라우드에 있으므로)
```

---

## 📊 예상 비용

| 서비스 | 무료 플랜 | 유료 플랜 | 비고 |
|--------|-----------|-----------|------|
| **Supabase** | 500MB DB, 1GB Storage | $25/월 (8GB DB, 100GB Storage) | Pro 플랜 권장 |
| **Upstash Redis** | 10,000 commands/day | $20/월 (무제한) | BullMQ 워크로드에 따라 |
| **합계** | **$0/월** | **$45/월** | 기존 서버 유지비 대비 저렴 |

---

## ⚠️ 주의사항

### 1. Supabase Storage 제한
- 무료: 1GB
- Pro: 100GB ($25/월)
- 이미지가 많으면 추가 스토리지 필요 ($0.021/GB/월)

### 2. Upstash Redis 제한
- 무료: 10,000 commands/day
- BullMQ는 명령어 사용이 많으므로 유료 플랜 고려

### 3. Supabase RLS (Row Level Security)
- 반드시 설정해야 보안 유지
- 각 테이블마다 정책 생성 필요

### 4. 이미지 URL 변경
- 로컬 파일 경로 → Supabase Storage URL
- 기존 DB의 모든 filePath 업데이트 필요

---

## 🚀 다음 단계 (Phase 2: 선택적)

### BullMQ → Supabase Edge Functions 전환

**장점:**
- Redis 비용 절감
- Supabase 생태계 통합
- 서버리스 아키텍처

**단점:**
- 복잡한 리팩토링
- Edge Functions 실행 시간 제한 (60초)
- 긴 작업에는 부적합할 수 있음

**권장 사항:**
- Phase 1 완료 후 안정화
- 이후 필요 시 점진적 전환

---

## 📞 지원

마이그레이션 중 문제 발생 시:
- Supabase 문서: https://supabase.com/docs
- Upstash 문서: https://docs.upstash.com
- Prisma + Supabase: https://supabase.com/docs/guides/integrations/prisma
