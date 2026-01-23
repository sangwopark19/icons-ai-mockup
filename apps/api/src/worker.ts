import { Worker, Job } from 'bullmq';
import { redis } from './lib/redis.js';
import { geminiService } from './services/gemini.service.js';
import { uploadService } from './services/upload.service.js';
import { generationService } from './services/generation.service.js';
import { prisma } from './lib/prisma.js';
import type { GenerationJobData } from './lib/queue.js';

/**
 * 생성 작업 처리 워커
 */
const generationWorker = new Worker<GenerationJobData>(
  'generation',
  async (job: Job<GenerationJobData>) => {
    const { generationId, userId, projectId, mode, options, parentGenerationId } = job.data;
    console.log(`🚀 생성 작업 시작: ${generationId}`);

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

      // 스타일 복사: 부모 Generation의 선택된 이미지 로드
      let chatHistory: Array<{ role: 'user' | 'model'; parts: any[] }> | undefined;

      if (parentGenerationId && options.styleCopy) {
        console.log(`🎨 스타일 복사 모드: 부모 Generation ${parentGenerationId}에서 이미지 로드`);

        try {
          const parentGeneration = await prisma.generation.findFirst({
            where: { id: parentGenerationId },
            include: {
              images: {
                where: { isSelected: true },
                take: 1,
              },
            },
          });

          if (parentGeneration?.images[0]) {
            const parentImagePath = parentGeneration.images[0].filePath;
            const parentImageBuffer = await uploadService.readFile(parentImagePath);
            const parentImageBase64 = parentImageBuffer.toString('base64');

            // chatHistory 구성: 이전 대화 턴으로 부모 이미지 전달
            chatHistory = [
              {
                role: 'model',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: parentImageBase64,
                    },
                  },
                ],
              },
            ];

            console.log(`✅ 부모 이미지 로드 완료: ${parentImagePath}`);
          } else {
            console.warn(`⚠️ 부모 Generation에 선택된 이미지가 없습니다: ${parentGenerationId}`);
          }
        } catch (error) {
          console.error(`❌ 부모 이미지 로드 실패:`, error);
          // 스타일 복사 실패 시에도 계속 진행 (일반 생성으로 대체)
        }
      }

      // v3 옵션 준비
      const v3Options = {
        viewpointLock: options.viewpointLock,
        whiteBackground: options.whiteBackground,
        accessoryPreservation: options.accessoryPreservation,
        styleCopy: options.styleCopy,
        userInstructions: options.userInstructions,
      };

      console.log(`📋 v3 옵션:`, v3Options);

      // Gemini API 호출 (v3 통합 함수 사용)
      let generatedImages: Buffer[];

      if (mode === 'ip_change') {
        if (!sourceImageBase64 || !characterImageBase64) {
          throw new Error('IP 변경에는 원본 이미지와 캐릭터 이미지가 필요합니다');
        }

        // IP 변경 기본 프롬프트
        const basePrompt = `당신은 제품 목업 이미지 생성 전문가입니다.
주어진 제품 이미지에서 기존 캐릭터/IP를 새로운 캐릭터로 교체하여 실제 제품처럼 보이는 목업을 생성하세요.

핵심 요구사항:
1. 제품의 물리적 형태와 구조를 정확히 유지
2. 새 캐릭터의 비율과 실루엣을 변형 없이 적용
3. 원본 제품의 재질감과 조명을 유지
4. 캐릭터의 색상과 디테일을 정확히 재현`;

        // 참조 이미지: [원본 제품, 캐릭터]
        const referenceImages = [sourceImageBase64, characterImageBase64];

        generatedImages = await geminiService.generateImage(
          basePrompt,
          v3Options,
          referenceImages,
          chatHistory // 스타일 복사 시 chatHistory 전달
        );
      } else if (mode === 'sketch_to_real') {
        if (!sourceImageBase64) {
          throw new Error('스케치 이미지가 필요합니다');
        }

        // 스케치 실사화 기본 프롬프트
        const basePrompt = `당신은 2D 스케치를 실제 제품 사진으로 변환하는 전문가입니다.
주어진 스케치를 실제 제품처럼 보이는 고품질 3D 렌더링으로 변환하세요.

핵심 요구사항:
1. 스케치의 형태와 비율을 정확히 유지
2. 실제 제품처럼 보이는 사실적인 재질감 적용
3. 자연스러운 조명과 그림자 추가
4. 제품 사진 수준의 고품질 출력`;

        // 참조 이미지: [스케치, 텍스처(선택)]
        const referenceImages = textureImageBase64
          ? [sourceImageBase64, textureImageBase64]
          : [sourceImageBase64];

        generatedImages = await geminiService.generateImage(
          basePrompt,
          v3Options,
          referenceImages,
          chatHistory // 스타일 복사 시 chatHistory 전달
        );
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
  console.log(`Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('🔧 Worker 프로세스 시작됨');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker 종료 중...');
  await generationWorker.close();
  process.exit(0);
});
