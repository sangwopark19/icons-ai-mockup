import Redis from 'ioredis';
import { config } from '../config/index.js';

/**
 * Redis 클라이언트 싱글톤
 *
 * 장시간 실행 시 연결 안정성을 위한 설정:
 * - keepAlive: TCP keepalive 활성화
 * - retryStrategy: 지수 백오프로 재연결
 * - maxRetriesPerRequest: null (BullMQ 권장)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForRedis = globalThis as unknown as { redis: any };

export const redis =
  globalForRedis.redis ??
  new (Redis as any)(config.redisUrl, {
    maxRetriesPerRequest: null, // BullMQ 권장 설정
    enableReadyCheck: false,
    // 재연결 전략: 지수 백오프 (최대 2초)
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`🔄 Redis 재연결 시도 ${times}회 (${delay}ms 후)`);
      return delay;
    },
    // TCP keepalive 활성화 (idle connection 유지)
    keepAlive: 30000, // 30초마다 keepalive 패킷 전송
    // 연결 타임아웃 (초기 연결 시에만)
    connectTimeout: 10000, // 10초
    // 명령어 타임아웃: BullMQ blocking 명령어와 충돌하므로 제거
    // commandTimeout 설정하지 않음 (BullMQ가 자체 관리)
    // 자동 재연결
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// 연결 이벤트 로깅
redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});

redis.on('ready', () => {
  console.log('✅ Redis 준비 완료');
});

redis.on('error', (error: Error) => {
  console.error('❌ Redis 에러:', error.message);
});

redis.on('close', () => {
  console.warn('⚠️ Redis 연결 종료');
});

redis.on('reconnecting', (delay: number) => {
  console.log(`🔄 Redis 재연결 중 (${delay}ms 후)`);
});

/**
 * Graceful shutdown 시 연결 정리
 */
process.on('SIGINT', async () => {
  await redis.quit();
  console.log('Redis 연결 종료');
});

process.on('SIGTERM', async () => {
  await redis.quit();
  console.log('Redis 연결 종료');
});

export default redis;
