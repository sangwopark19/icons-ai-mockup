import { PrismaClient } from '@prisma/client';
import fs from 'fs';

/**
 * Prisma 클라이언트 싱글톤
 * 개발 환경에서 HMR로 인한 다중 인스턴스 생성 방지
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // #region agent log
    datasourceUrl: process.env.DATABASE_URL,
    // #endregion agent log
  });

// #region agent log
log('H1', 'prisma.ts:init', 'Prisma 클라이언트 초기화', {
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'), // 비밀번호 마스킹
});

prisma
  .$connect()
  .then(() => {
    log('H1', 'prisma.ts:connect:success', 'Prisma DB 연결 성공', {});
  })
  .catch((err) => {
    log('H1', 'prisma.ts:connect:error', 'Prisma DB 연결 실패', {
      errorMessage: err.message,
    });
  });
// #endregion agent log

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
