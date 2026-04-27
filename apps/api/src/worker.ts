import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis.js';
import { geminiService } from './services/gemini.service.js';
import { openaiImageService } from './services/openai-image.service.js';
import { uploadService } from './services/upload.service.js';
import { generationService } from './services/generation.service.js';
import { adminService } from './services/admin.service.js';
import type { GenerationJobData } from './lib/queue.js';
import type { ThoughtSignatureData } from '@mockup-ai/shared/types';

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
    const { generationId, userId, projectId, options } = job.data;
    console.log(`🚀 생성 작업 시작: ${generationId}`);

    try {
      const generation = await generationService.getById(userId, generationId);
      if (!generation) {
        throw new Error('생성 기록을 찾을 수 없습니다');
      }

      if (job.data.provider !== generation.provider) {
        throw new Error('저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.');
      }

      if (job.data.providerModel !== generation.providerModel) {
        throw new Error('저장된 providerModel과 큐 providerModel이 일치하지 않습니다.');
      }

      const provider = generation.provider;
      const mode = generation.mode;

      // DB에서 활성 API 키 조회 (작업별 1회, 캐싱 없음 — CONTEXT.md 정책)
      const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(provider);

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

      let generatedImages: Buffer[];
      let thoughtSignatures: ThoughtSignatureData[] = [];
      let openAIMetadata:
        | Awaited<ReturnType<typeof openaiImageService.generateIPChange>>
        | undefined;

      if (mode === 'ip_change') {
        if (!sourceImageBase64 || !characterImageBase64) {
          throw new Error('IP 변경에는 원본 이미지와 캐릭터 이미지가 필요합니다');
        }

        if (provider === 'openai') {
          if (job.data.styleReferenceId) {
            throw new Error('OpenAI IP 변경 v2는 스타일 참조를 지원하지 않습니다');
          }

          await adminService.incrementCallCount(provider, activeKeyId);
          const result = await openaiImageService.generateIPChange(
            activeApiKey,
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
              quality: options.quality,
              prompt: job.data.prompt,
            }
          );
          generatedImages = result.images;
          openAIMetadata = result;
        } else if (job.data.styleReferenceId) {
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

          await adminService.incrementCallCount(provider, activeKeyId);
          const result = await geminiService.generateWithStyleCopy(
            activeApiKey,
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
          await adminService.incrementCallCount(provider, activeKeyId);
          const result = await geminiService.generateIPChange(
            activeApiKey,
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
      } else if (provider === 'openai') {
        throw new Error('OpenAI provider는 현재 IP 변경 v2만 지원합니다.');
      } else if (mode === 'sketch_to_real') {
        if (!sourceImageBase64) {
          throw new Error('스케치 이미지가 필요합니다');
        }

        await adminService.incrementCallCount(provider, activeKeyId);
        const result = await geminiService.generateSketchToReal(
          activeApiKey,
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

      if (openAIMetadata) {
        await generationService.updateOpenAIMetadata(generationId, {
          requestIds: openAIMetadata.requestIds,
          responseId: openAIMetadata.responseId,
          imageCallIds: openAIMetadata.imageCallIds,
          revisedPrompt: openAIMetadata.revisedPrompt,
          providerTrace: openAIMetadata.providerTrace,
        });
      }

      // 완료 상태로 업데이트
      await generationService.updateStatus(generationId, 'completed');
      console.log(`✅ 생성 작업 완료: ${generationId}`);

      return { success: true, imageCount: generatedImages.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error(`❌ 생성 작업 실패: ${generationId}`, error);

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
  console.log(`✅ Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('🔧 Worker 프로세스 시작됨');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker 종료 중...');
  await generationWorker.close();
  process.exit(0);
});
