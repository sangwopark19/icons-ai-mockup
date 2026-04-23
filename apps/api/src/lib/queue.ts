import { Queue, Job } from 'bullmq';
import { redis } from './redis.js';

/**
 * 생성 작업 데이터 타입
 */
export interface GenerationJobData {
  generationId: string;
  userId: string;
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  styleReferenceId?: string;
  sourceImagePath?: string;
  characterImagePath?: string;
  textureImagePath?: string;
  prompt?: string;
  options: {
    preserveStructure: boolean;
    transparentBackground: boolean;
    preserveHardware?: boolean;
    fixedBackground?: boolean;
    fixedViewpoint?: boolean;
    removeShadows?: boolean;
    userInstructions?: string;
    hardwareSpecInput?: string;
    hardwareSpecs?: {
      items: Array<{
        type: 'zipper' | 'ring' | 'buckle' | 'patch' | 'button' | 'other';
        material: string;
        color: string;
        position: string;
        size?: string;
      }>;
    };
    outputCount: number;
  };
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
 * 생성 작업 추가
 */
export async function addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  return generationQueue.add('generate', data, {
    priority: 1,
  });
}

console.log('✅ 작업 큐 초기화 완료');
