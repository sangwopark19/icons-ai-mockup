import { PrismaClient } from '@prisma/client';

/**
 * Prisma 클라이언트 싱글톤
 * 개발 환경에서 HMR로 인한 다중 인스턴스 생성 방지
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma 클라이언트 생성
 * 
 * 장시간 실행 시 연결 문제 방지를 위한 설정:
 * - datasourceUrl에 connection_limit, pool_timeout, connect_timeout 추가
 * - PostgreSQL idle connection timeout 대응
 */
function createPrismaClient() {
  // DATABASE_URL에 연결 풀 파라미터 추가
  const baseUrl = process.env.DATABASE_URL || '';
  const url = new URL(baseUrl);
  
  // 연결 풀 설정 추가 (기존 파라미터 유지)
  url.searchParams.set('connection_limit', '10'); // API 서버당 최대 10개 연결
  url.searchParams.set('pool_timeout', '20'); // 20초 후 타임아웃
  url.searchParams.set('connect_timeout', '10'); // 연결 시도 10초 타임아웃

  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 연결 테스트 (서버 시작 시)
prisma
  .$connect()
  .then(() => {
    console.log('✅ Prisma DB 연결 성공');
  })
  .catch((err) => {
    console.error('❌ Prisma DB 연결 실패:', err.message);
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown 시 연결 정리
 */
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Prisma 연결 종료');
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('Prisma 연결 종료');
});

export default prisma;
