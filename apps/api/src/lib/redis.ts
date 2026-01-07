import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Redis 클라이언트 싱글톤
 */

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(config.redisUrl, {
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

redis.on('error', (error) => {
  console.error('❌ Redis 연결 에러:', error.message);
});

export default redis;
