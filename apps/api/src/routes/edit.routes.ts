import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { geminiService } from '../services/gemini.service.js';
import { uploadService } from '../services/upload.service.js';
import { generationService } from '../services/generation.service.js';
import { adminService } from '../services/admin.service.js';
import { openaiImageService } from '../services/openai-image.service.js';

const OPENAI_KEY_MISSING_MESSAGE =
  'OpenAI v2 API 키가 설정되어 있지 않습니다. 관리자에게 문의해주세요.';

function isOpenAIKeyMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return ['OpenAI API 키', 'openai API 키', '활성화된 API 키', '활성화된 openai'].some(
    (keyMissingText) => message.includes(keyMissingText)
  );
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

/**
 * 부분 수정 요청 스키마
 */
const EditRequestSchema = z.object({
  prompt: z.string().min(1, '수정 내용을 입력해주세요').max(500),
  selectedImageId: z.string().uuid().optional(),
});

async function markChildGenerationCompleted(generationId: string): Promise<void> {
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: 'completed',
      errorMessage: null,
      completedAt: new Date(),
    },
  });
}

async function markChildGenerationFailed(
  generationId: string,
  message: string,
  logError: (error: unknown, message?: string) => void
): Promise<void> {
  await prisma.generation
    .update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMessage: message,
        completedAt: new Date(),
      },
    })
    .catch((statusError) => {
      logError(statusError, '부분 수정 실패 상태 저장에 실패했습니다');
    });
}

/**
 * 부분 수정 라우트
 */
const editRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * 이미지 부분 수정
   * POST /api/generations/:id/edit
   */
  fastify.post('/:id/edit', async (request, reply) => {
    const user = (request as any).user;
    const { id: generationId } = request.params as { id: string };
    const parsedBody = EditRequestSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: parsedBody.error.issues[0]?.message ?? '잘못된 요청입니다',
        },
      });
    }
    const body = parsedBody.data;

    // 기존 생성 기록 조회
    const generation = await generationService.getById(user.id, generationId);
    if (!generation) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '생성 기록을 찾을 수 없습니다' },
      });
    }

    // 선택된 이미지 찾기. selectedImageId는 조회된 generation.images 내부에서만 해석한다.
    const selectedImage = body.selectedImageId
      ? generation.images.find((img) => img.id === body.selectedImageId)
      : generation.images.find((img) => img.isSelected);
    if (!selectedImage) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_SELECTED_IMAGE', message: '선택된 이미지가 없습니다' },
      });
    }

    if (generation.provider !== 'gemini' && generation.provider !== 'openai') {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'UNSUPPORTED_PROVIDER_EDIT',
          message: '지원하지 않는 provider입니다.',
        },
      });
    }

    let childGenerationId: string | null = null;

    try {
      if (generation.provider === 'gemini') {
        // 원본 이미지 로드
        const originalBuffer = await uploadService.readFile(selectedImage.filePath);
        const originalBase64 = originalBuffer.toString('base64');

        // DB에서 활성 API 키 조회
        const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey(
          generation.provider
        );

        // Gemini API로 부분 수정
        await adminService.incrementCallCount(generation.provider, activeKeyId);
        const editResult = await geminiService.generateEdit(
          activeApiKey,
          originalBase64,
          body.prompt
        );

        // 새 생성 기록 저장
        const newGeneration = await prisma.generation.create({
          data: {
            projectId: generation.projectId,
            ipCharacterId: generation.ipCharacterId,
            sourceImageId: selectedImage.id,
            mode: generation.mode,
            status: 'processing',
            provider: generation.provider,
            providerModel: generation.providerModel,
            promptData: {
              ...jsonObject(generation.promptData),
              editPrompt: body.prompt,
              parentGenerationId: generationId,
            },
            options: generation.options as object,
          },
        });
        childGenerationId = newGeneration.id;

        // 수정된 이미지 저장 (첫 번째 이미지를 선택 상태로 설정)
        for (let i = 0; i < editResult.images.length; i++) {
          const result = await uploadService.saveGeneratedImage(
            user.id,
            generation.projectId,
            newGeneration.id,
            editResult.images[i],
            i
          );

          const savedImage = await generationService.saveGeneratedImage(
            newGeneration.id,
            result.filePath,
            result.thumbnailPath,
            result.metadata
          );

          // 첫 번째 이미지를 선택 상태로 설정 (히스토리 썸네일 표시용)
          if (i === 0) {
            await prisma.generatedImage.update({
              where: { id: savedImage.id },
              data: { isSelected: true },
            });
          }
        }

        // 히스토리 저장
        await prisma.imageHistory.create({
          data: {
            imageId: selectedImage.id,
            action: 'edit',
            changes: { prompt: body.prompt },
            filePath: selectedImage.filePath,
          },
        });

        await markChildGenerationCompleted(newGeneration.id);

        return reply.code(201).send({
          success: true,
          data: {
            generationId: newGeneration.id,
            message: '수정이 완료되었습니다',
          },
        });
      }

      const { id: activeKeyId, key: activeApiKey } = await adminService.getActiveApiKey('openai');
      await adminService.incrementCallCount('openai', activeKeyId);

      const originalBuffer = await uploadService.readFile(selectedImage.filePath);
      const originalBase64 = originalBuffer.toString('base64');
      const options = jsonObject(generation.options);
      const quality = (options.quality as 'low' | 'medium' | 'high' | undefined) ?? 'medium';

      if (typeof reply.raw.setTimeout === 'function') {
        try {
          reply.raw.setTimeout(120_000);
        } catch (timeoutError) {
          const message = timeoutError instanceof Error ? timeoutError.message : '';
          if (!message.includes('listener')) {
            throw timeoutError;
          }
          reply.raw.setTimeout(120_000, () => undefined);
        }
      }
      const editResult = await openaiImageService.generatePartialEdit(
        activeApiKey,
        originalBase64,
        body.prompt,
        { quality }
      );

      const newGeneration = await prisma.generation.create({
        data: {
          projectId: generation.projectId,
          ipCharacterId: generation.ipCharacterId,
          sourceImageId: selectedImage.id,
          mode: generation.mode,
          status: 'processing',
          provider: 'openai',
          providerModel: generation.providerModel,
          promptData: {
            ...jsonObject(generation.promptData),
            editPrompt: body.prompt,
            parentGenerationId: generationId,
            selectedImageId: selectedImage.id,
          },
          options: {
            ...options,
            outputCount: 1,
          },
        },
      });
      childGenerationId = newGeneration.id;

      const outputImage = editResult.images[0];
      const result = await uploadService.saveGeneratedImage(
        user.id,
        generation.projectId,
        newGeneration.id,
        outputImage,
        0
      );

      await generationService.saveGeneratedImage(
        newGeneration.id,
        result.filePath,
        result.thumbnailPath,
        result.metadata,
        { isSelected: true }
      );

      await generationService.updateOpenAIMetadata(newGeneration.id, {
        requestIds: editResult.requestIds,
        responseId: editResult.responseId,
        imageCallIds: editResult.imageCallIds,
        revisedPrompt: editResult.revisedPrompt,
        providerTrace: editResult.providerTrace,
      });

      await prisma.imageHistory.create({
        data: {
          imageId: selectedImage.id,
          action: 'edit',
          changes: { prompt: body.prompt },
          filePath: selectedImage.filePath,
        },
      });

      await markChildGenerationCompleted(newGeneration.id);

      return reply.code(201).send({
        success: true,
        data: {
          generationId: newGeneration.id,
          message: '수정이 완료되었습니다',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '수정에 실패했습니다';
      if (childGenerationId) {
        await markChildGenerationFailed(
          childGenerationId,
          message,
          fastify.log.error.bind(fastify.log)
        );
      }

      if (generation.provider === 'openai' && isOpenAIKeyMissingError(error)) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'OPENAI_KEY_MISSING',
            message: OPENAI_KEY_MISSING_MESSAGE,
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: { code: 'EDIT_FAILED', message },
      });
    }
  });
};

export default editRoutes;
