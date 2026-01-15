import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 개발 환경에서 .env 파일 로드 (production은 docker-compose에서 주입)
if (process.env.NODE_ENV !== 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
}

/**
 * 환경 변수 스키마 정의
 */
const envSchema = z.object({
  // 서버 설정
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(4000),

  // 데이터베이스
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Gemini API
  GEMINI_API_KEY: z.string().optional(),

  // 파일 업로드
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  UPLOAD_DIR: z.string().default('./data'),

  // CORS
  CORS_ORIGIN: z.string().default(''),
});

/**
 * 환경 변수 파싱 및 검증
 */
const BASE_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://172.30.1.40:3000',
  'http://172.30.1.42:3000',
  'http://100.69.75.47:3000',
  'http://175.193.199.147:3000',
  'http://221.147.112.147:3000',
];

function parseCorsOrigins(value: string) {
  // 환경변수와 기본 목록을 병합해 중복 제거
  const extraOrigins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return Array.from(new Set([...BASE_CORS_ORIGINS, ...extraOrigins]));
}

function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ 환경 변수 검증 실패:');
    console.error(parsed.error.format());

    // 개발 환경에서는 기본값 사용
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ 개발 환경에서 기본값을 사용합니다');
      return {
        nodeEnv: 'development' as const,
        port: 4000,
        databaseUrl: 'postgresql://user:password@localhost:5432/mockup?schema=public',
        redisUrl: 'redis://localhost:6379',
        jwtSecret: 'development-secret-key-change-in-production',
        jwtAccessExpiry: '15m',
        jwtRefreshExpiry: '7d',
        geminiApiKey: undefined,
        maxFileSize: 10 * 1024 * 1024,
        uploadDir: './data',
        corsOrigins: parseCorsOrigins(''),
      };
    }

    throw new Error('환경 변수 설정이 올바르지 않습니다');
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.API_PORT,
    databaseUrl: parsed.data.DATABASE_URL,
    redisUrl: parsed.data.REDIS_URL,
    jwtSecret: parsed.data.JWT_SECRET,
    jwtAccessExpiry: parsed.data.JWT_ACCESS_EXPIRY,
    jwtRefreshExpiry: parsed.data.JWT_REFRESH_EXPIRY,
    geminiApiKey: parsed.data.GEMINI_API_KEY,
    maxFileSize: parsed.data.MAX_FILE_SIZE,
    uploadDir: parsed.data.UPLOAD_DIR,
    corsOrigins: parseCorsOrigins(parsed.data.CORS_ORIGIN),
  };
}

export const config = parseEnv();

export type Config = typeof config;
