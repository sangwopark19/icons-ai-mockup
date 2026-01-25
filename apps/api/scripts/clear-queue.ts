#!/usr/bin/env tsx
/**
 * Redis 큐에서 실패한 작업들을 제거하는 스크립트
 */
import { Queue } from 'bullmq';
import { redis } from '../src/lib/redis.js';

async function clearQueue() {
  const generationQueue = new Queue('generation', { connection: redis });

  console.log('🧹 큐 정리 시작...');

  // 실패한 작업 제거
  const failedJobs = await generationQueue.getFailed();
  console.log(`❌ 실패한 작업 ${failedJobs.length}개 발견`);
  for (const job of failedJobs) {
    await job.remove();
    console.log(`  - 작업 ${job.id} 제거 완료`);
  }

  // 대기 중인 작업 제거 (선택적)
  const waitingJobs = await generationQueue.getWaiting();
  console.log(`⏳ 대기 중인 작업 ${waitingJobs.length}개 발견`);
  for (const job of waitingJobs) {
    await job.remove();
    console.log(`  - 작업 ${job.id} 제거 완료`);
  }

  // 활성 작업 제거 (선택적)
  const activeJobs = await generationQueue.getActive();
  console.log(`🔄 활성 작업 ${activeJobs.length}개 발견`);
  for (const job of activeJobs) {
    await job.remove();
    console.log(`  - 작업 ${job.id} 제거 완료`);
  }

  // 지연된 작업 제거 (선택적)
  const delayedJobs = await generationQueue.getDelayed();
  console.log(`⏰ 지연된 작업 ${delayedJobs.length}개 발견`);
  for (const job of delayedJobs) {
    await job.remove();
    console.log(`  - 작업 ${job.id} 제거 완료`);
  }

  await generationQueue.close();
  await redis.quit();

  console.log('✅ 큐 정리 완료');
}

clearQueue().catch((error) => {
  console.error('❌ 큐 정리 실패:', error);
  process.exit(1);
});
