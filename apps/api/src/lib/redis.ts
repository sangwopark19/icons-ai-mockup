import Redis from 'ioredis';
import { config } from '../config/index.js';
import fs from 'fs';

// #region agent log
const logPath =
  process.env.NODE_ENV === 'production'
    ? '/app/data/debug.log'
    : '/Users/sangwopark19/icons/icons-ai-mockup/.cursor/debug.log';
const log = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    const entry =
      JSON.stringify({
        sessionId: 'debug-session',
        runId: 'server-runtime',
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }) + '\n';
    fs.appendFileSync(logPath, entry);
  } catch (e) {
    // 로그 실패는 무시
  }
};
// #endregion agent log

/**
 * Redis 클라이언트 싱글톤
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForRedis = globalThis as unknown as { redis: any };

// #region agent log
log('H5', 'redis.ts:init', 'Redis 클라이언트 초기화', {
  redisUrl: config.redisUrl.replace(/:\/\/[^@]*@/, '://***@'), // 비밀번호 마스킹
});
// #endregion agent log

export const redis =
  globalForRedis.redis ??
  new (Redis as any)(config.redisUrl, {
    maxRetriesPerRequest: null, // BullMQ 권장 설정
    enableReadyCheck: false,
    // #region agent log
    retryStrategy: (times: number) => {
      log('H5', 'redis.ts:retry', 'Redis 재연결 시도', { times });
      return Math.min(times * 50, 2000);
    },
    // #endregion agent log
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// 연결 이벤트 로깅
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
  // #region agent log
  log('H5', 'redis.ts:connect:success', 'Redis 연결 성공', {});
  // #endregion agent log
});

redis.on('error', (error: Error) => {
  console.error('❌ Redis 연결 에러:', error.message);
  // #region agent log
  log('H5', 'redis.ts:connect:error', 'Redis 연결 에러', {
    errorMessage: error.message,
  });
  // #endregion agent log
});

// #region agent log
redis.on('reconnecting', () => {
  log('H5', 'redis.ts:reconnecting', 'Redis 재연결 중', {});
});
// #endregion agent log

export default redis;
