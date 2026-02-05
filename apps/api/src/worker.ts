import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis.js';
import { geminiService } from './services/gemini.service.js';
import { uploadService } from './services/upload.service.js';
import { generationService } from './services/generation.service.js';
import type { GenerationJobData } from './lib/queue.js';
import type { ThoughtSignatureData } from '@mockup-ai/shared/types';
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

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

const parseThoughtSignatures = (value: unknown): ThoughtSignatureData[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: ThoughtSignatureData[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (!isStringArray(record.imageSignatures)) continue;
    const createdAt = parseDate(record.createdAt);
    if (!createdAt) continue;
    const textSignature =
      typeof record.textSignature === 'string' ? record.textSignature : undefined;
    parsed.push({
      textSignature,
      imageSignatures: record.imageSignatures,
      createdAt,
    });
  }

  return parsed;
};

/**
 * 생성 작업 처리 워커
 */
const generationWorker = new Worker<GenerationJobData>(
  'generation',
  async (job: Job<GenerationJobData>) => {
    const { generationId, userId, projectId, mode, options } = job.data;
    console.log(`🚀 생성 작업 시작: ${generationId}`);

    // #region agent log
    log('H4', 'worker.ts:job:start', '작업 시작', {
      generationId,
      jobId: job.id,
      attemptsMade: job.attemptsMade,
    });
    // #endregion agent log

    try {
      // 상태를 processing으로 업데이트
      await generationService.updateStatus(generationId, 'processing');

      // 이미지 파일 로드
      let sourceImageBase64: string | undefined;
      let characterImageBase64: string | undefined;
      let textureImageBase64: string | undefined;

      if (job.data.sourceImagePath) {
        const buffer = await uploadService.readFile(job.data.sourceImagePath);
        sourceImageBase64 = buffer.toString('base64');
      }

      if (job.data.characterImagePath) {
        const buffer = await uploadService.readFile(job.data.characterImagePath);
        characterImageBase64 = buffer.toString('base64');
      }

      if (job.data.textureImagePath) {
        const buffer = await uploadService.readFile(job.data.textureImagePath);
        textureImageBase64 = buffer.toString('base64');
      }

      // Gemini API 호출
      let generatedImages: Buffer[];
      let thoughtSignatures: ThoughtSignatureData[] = [];

      if (mode === 'ip_change') {
        if (!sourceImageBase64 || !characterImageBase64) {
          throw new Error('IP 변경에는 원본 이미지와 캐릭터 이미지가 필요합니다');
        }

        if (job.data.styleReferenceId) {
          const reference = await generationService.getById(userId, job.data.styleReferenceId);
          if (!reference) {
            throw new Error('스타일 참조 생성 기록을 찾을 수 없습니다');
          }

          const referenceImages = reference.images || [];
          if (referenceImages.length === 0) {
            throw new Error('스타일 참조 이미지가 없습니다');
          }

          const selectedIndex = referenceImages.findIndex((img) => img.isSelected);
          const referenceImage = referenceImages[selectedIndex >= 0 ? selectedIndex : 0];
          const referenceBuffer = await uploadService.readFile(referenceImage.filePath);
          const referenceBase64 = referenceBuffer.toString('base64');
          const signatureData = parseThoughtSignatures(reference.thoughtSignatures);
          const signature =
            signatureData[selectedIndex >= 0 ? selectedIndex : 0] || signatureData[0];

          if (!signature) {
            throw new Error('스타일 참조 thoughtSignature가 없습니다');
          }

          const newParts = [
            { text: '캐릭터를 변경하되 동일한 스타일(배치, 각도, 효과) 유지' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: characterImageBase64,
              },
            },
          ];

          const result = await geminiService.generateWithStyleCopy(
            (reference.promptData as any)?.userPrompt || '원본 스타일 생성 요청',
            referenceBase64,
            signature,
            newParts,
            {
              preserveStructure: options.preserveStructure,
              transparentBackground: options.transparentBackground,
              preserveHardware: options.preserveHardware,
              fixedBackground: options.fixedBackground,
              fixedViewpoint: options.fixedViewpoint,
              removeShadows: options.removeShadows,
              userInstructions: options.userInstructions,
              hardwareSpecInput: options.hardwareSpecInput,
              hardwareSpecs: options.hardwareSpecs,
              prompt: job.data.prompt,
            }
          );

          generatedImages = result.images;
          thoughtSignatures = result.signatures;
        } else {
          const result = await geminiService.generateIPChange(
            sourceImageBase64,
            characterImageBase64,
            {
              preserveStructure: options.preserveStructure,
              transparentBackground: options.transparentBackground,
              preserveHardware: options.preserveHardware,
              fixedBackground: options.fixedBackground,
              fixedViewpoint: options.fixedViewpoint,
              removeShadows: options.removeShadows,
              userInstructions: options.userInstructions,
              hardwareSpecInput: options.hardwareSpecInput,
              hardwareSpecs: options.hardwareSpecs,
              prompt: job.data.prompt,
            }
          );
          generatedImages = result.images;
          thoughtSignatures = result.signatures;
        }
      } else if (mode === 'sketch_to_real') {
        if (!sourceImageBase64) {
          throw new Error('스케치 이미지가 필요합니다');
        }

        const result = await geminiService.generateSketchToReal(
          sourceImageBase64,
          textureImageBase64 || null,
          {
            preserveStructure: options.preserveStructure,
            transparentBackground: options.transparentBackground,
            preserveHardware: options.preserveHardware,
            fixedBackground: options.fixedBackground,
            fixedViewpoint: options.fixedViewpoint,
            removeShadows: options.removeShadows,
            userInstructions: options.userInstructions,
            hardwareSpecInput: options.hardwareSpecInput,
            hardwareSpecs: options.hardwareSpecs,
            prompt: job.data.prompt,
          }
        );
        generatedImages = result.images;
        thoughtSignatures = result.signatures;
      } else {
        throw new Error(`알 수 없는 생성 모드: ${mode}`);
      }

      // 생성된 이미지 저장
      for (let i = 0; i < generatedImages.length; i++) {
        const result = await uploadService.saveGeneratedImage(
          userId,
          projectId,
          generationId,
          generatedImages[i],
          i
        );

        await generationService.saveGeneratedImage(
          generationId,
          result.filePath,
          result.thumbnailPath,
          result.metadata
        );
      }

      if (thoughtSignatures.length > 0) {
        await generationService.updateThoughtSignatures(generationId, thoughtSignatures);
      }

      // 완료 상태로 업데이트
      await generationService.updateStatus(generationId, 'completed');
      console.log(`✅ 생성 작업 완료: ${generationId}`);

      return { success: true, imageCount: generatedImages.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`❌ 생성 작업 실패: ${generationId}`, error);

      // #region agent log
      log('H4', 'worker.ts:job:error', '작업 실패', {
        generationId,
        errorMessage: message,
        attemptsMade: job.attemptsMade,
      });
      // #endregion agent log

      await generationService.updateStatus(generationId, 'failed', message);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2, // 동시에 2개 작업 처리
  }
);

// 이벤트 핸들러
generationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
  // #region agent log
  log('H4', 'worker.ts:completed', '작업 완료', {
    jobId: job.id,
  });
  // #endregion agent log
});

generationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
  // #region agent log
  log('H4', 'worker.ts:failed', '작업 실패 (이벤트)', {
    jobId: job?.id,
    errorMessage: err.message,
  });
  // #endregion agent log
});

console.log('🔧 Worker 프로세스 시작됨');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker 종료 중...');
  await generationWorker.close();
  process.exit(0);
});
