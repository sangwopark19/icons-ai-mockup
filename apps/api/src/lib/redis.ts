import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Redis 클라이언트 싱글톤
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForRedis = globalThis as unknown as { redis: any };

export const redis =
  globalForRedis.redis ??
  new (Redis as any)(config.redisUrl, {
    maxRetriesPerRequest: null, // BullMQ 권장 설정
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// 연결 이벤트 로깅
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});

redis.on('error', (error: Error) => {
  console.error('❌ Redis 연결 에러:', error.message);
});

export default redis;
