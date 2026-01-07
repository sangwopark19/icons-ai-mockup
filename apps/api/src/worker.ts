import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { redis } from './lib/redis.js';
import { prisma } from './lib/prisma.js';
import { geminiService } from './services/gemini.service.js';
import { uploadService } from './services/upload.service.js';
import { generationService } from './services/generation.service.js';
import { config } from './config/index.js';
import type { GenerationJobData, UpscaleJobData } from './lib/queue.js';

/**
 * 생성 작업 처리 워커
 */
const generationWorker = new Worker<GenerationJobData>(
  'generation',
  async (job: Job<GenerationJobData>) => {
    const { generationId, userId, projectId, mode, options } = job.data;
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

      // Gemini API 호출
      let generatedImages: Buffer[];

      if (mode === 'ip_change') {
        if (!sourceImageBase64 || !characterImageBase64) {
          throw new Error('IP 변경에는 원본 이미지와 캐릭터 이미지가 필요합니다');
        }

        generatedImages = await geminiService.generateIPChange(
          sourceImageBase64,
          characterImageBase64,
          {
            preserveStructure: options.preserveStructure,
            transparentBackground: options.transparentBackground,
            prompt: job.data.prompt,
          }
        );
      } else if (mode === 'sketch_to_real') {
        if (!sourceImageBase64) {
          throw new Error('스케치 이미지가 필요합니다');
        }

        generatedImages = await geminiService.generateSketchToReal(
          sourceImageBase64,
          textureImageBase64 || null,
          {
            preserveStructure: options.preserveStructure,
            transparentBackground: options.transparentBackground,
            prompt: job.data.prompt,
          }
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

/**
 * 업스케일 작업 처리 워커
 */
const upscaleWorker = new Worker<UpscaleJobData>(
  'upscale',
  async (job: Job<UpscaleJobData>) => {
    const { imageId, inputPath, outputPath, scale, model } = job.data;
    console.log(`🔍 업스케일 작업 시작: ${imageId}`);

    try {
      const inputFullPath = path.join(config.uploadDir, inputPath);
      const outputFullPath = path.join(config.uploadDir, outputPath);

      // 출력 디렉토리 생성
      await fs.mkdir(path.dirname(outputFullPath), { recursive: true });

      // Real-ESRGAN ncnn 실행
      await new Promise<void>((resolve, reject) => {
        const proc = spawn(config.realesrganPath, [
          '-i', inputFullPath,
          '-o', outputFullPath,
          '-s', String(scale),
          '-n', model,
        ]);

        proc.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });

        proc.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Real-ESRGAN 프로세스가 코드 ${code}로 종료되었습니다`));
          }
        });

        proc.on('error', (err) => {
          reject(new Error(`Real-ESRGAN 실행 실패: ${err.message}`));
        });
      });

      // 결과 파일 정보
      const stats = await fs.stat(outputFullPath);
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(outputFullPath).metadata();

      // DB에 업스케일 이미지 저장
      await prisma.upscaledImage.create({
        data: {
          originalImageId: imageId,
          filePath: outputPath,
          scale,
          width: metadata.width || 0,
          height: metadata.height || 0,
          fileSize: stats.size,
        },
      });

      console.log(`✅ 업스케일 작업 완료: ${imageId}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ 업스케일 작업 실패: ${imageId}`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // GPU 사용으로 동시 1개만
  }
);

// 이벤트 핸들러
generationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

upscaleWorker.on('completed', (job) => {
  console.log(`Upscale job ${job.id} completed`);
});

upscaleWorker.on('failed', (job, err) => {
  console.error(`Upscale job ${job?.id} failed:`, err);
});

console.log('🔧 Worker 프로세스 시작됨');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker 종료 중...');
  await generationWorker.close();
  await upscaleWorker.close();
  process.exit(0);
});
