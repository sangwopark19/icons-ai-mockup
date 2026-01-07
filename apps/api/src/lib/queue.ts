import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis.js';

/**
 * 생성 작업 데이터 타입
 */
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  sourceImagePath?: string;
  characterImagePath?: string;
  textureImagePath?: string;
  prompt?: string;
  options: {
    preserveStructure: boolean;
    transparentBackground: boolean;
    outputCount: number;
  };
}

/**
 * 업스케일 작업 데이터 타입
 */
export interface UpscaleJobData {
  imageId: string;
  inputPath: string;
  outputPath: string;
  scale: number;
  model: string;
}

/**
 * 생성 작업 큐
 */
export const generationQueue = new Queue<GenerationJobData>('generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * 업스케일 작업 큐
 */
export const upscaleQueue = new Queue<UpscaleJobData>('upscale', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

/**
 * 생성 작업 추가
 */
export async function addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  return generationQueue.add('generate', data, {
    priority: 1,
  });
}

/**
 * 업스케일 작업 추가
 */
export async function addUpscaleJob(data: UpscaleJobData): Promise<Job<UpscaleJobData>> {
  return upscaleQueue.add('upscale', data, {
    priority: 2,
  });
}

console.log('✅ 작업 큐 초기화 완료');
