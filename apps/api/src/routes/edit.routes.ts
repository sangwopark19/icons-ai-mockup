import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { geminiService } from '../services/gemini.service.js';
import { uploadService } from '../services/upload.service.js';
import { generationService } from '../services/generation.service.js';

/**
 * 부분 수정 요청 스키마
 */
const EditRequestSchema = z.object({
  prompt: z.string().min(1, '수정 내용을 입력해주세요').max(500),
});

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
    const body = EditRequestSchema.parse(request.body);

    // 기존 생성 기록 조회
    const generation = await generationService.getById(user.id, generationId);
    if (!generation) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '생성 기록을 찾을 수 없습니다' },
      });
    }

    // 선택된 이미지 찾기
    const selectedImage = generation.images.find((img) => img.isSelected);
    if (!selectedImage) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_SELECTED_IMAGE', message: '선택된 이미지가 없습니다' },
      });
    }

    try {
      // 원본 이미지 로드
      const originalBuffer = await uploadService.readFile(selectedImage.filePath);
      const originalBase64 = originalBuffer.toString('base64');

      // Gemini API로 부분 수정
      const editedImages = await geminiService.generateEdit(originalBase64, body.prompt);

      // 새 생성 기록 저장
      const newGeneration = await prisma.generation.create({
        data: {
          projectId: generation.projectId,
          ipCharacterId: generation.ipCharacterId,
          sourceImageId: selectedImage.id,
          mode: generation.mode,
          status: 'completed',
          promptData: {
            ...(generation.promptData as object),
            editPrompt: body.prompt,
            parentGenerationId: generationId,
          },
          options: generation.options as object,
          completedAt: new Date(),
        },
      });

      // 수정된 이미지 저장
      for (let i = 0; i < editedImages.length; i++) {
        const result = await uploadService.saveGeneratedImage(
          user.id,
          generation.projectId,
          newGeneration.id,
          editedImages[i],
          i
        );

        await generationService.saveGeneratedImage(
          newGeneration.id,
          result.filePath,
          result.thumbnailPath,
          result.metadata
        );
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

      return reply.code(201).send({
        success: true,
        data: {
          generationId: newGeneration.id,
          message: '수정이 완료되었습니다',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '수정에 실패했습니다';
      return reply.code(500).send({
        success: false,
        error: { code: 'EDIT_FAILED', message },
      });
    }
  });
};

export default editRoutes;
