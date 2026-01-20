import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { generationService } from '../services/generation.service.js';

/**
 * 요청 스키마
 */
const CreateGenerationSchema = z.object({
  projectId: z.string().uuid(),
  mode: z.enum(['ip_change', 'sketch_to_real']),
  sourceImagePath: z.string().optional(),
  characterId: z.string().uuid().optional(),
  characterImagePath: z.string().optional(), // 직접 업로드된 캐릭터 이미지 경로
  textureImagePath: z.string().optional(),
  prompt: z.string().max(2000).optional(),
  options: z
    .object({
      preserveStructure: z.boolean().optional(),
      transparentBackground: z.boolean().optional(),
      outputCount: z.number().int().min(1).max(4).optional(),
    })
    .optional(),
});

const SelectImageSchema = z.object({
  imageId: z.string().uuid(),
});

/**
 * 생성 라우트
 */
const generationRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * 생성 요청
   * POST /api/generations
   */
  fastify.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = CreateGenerationSchema.parse(request.body);

    try {
      const generation = await generationService.create(user.id, body);

      return reply.code(201).send({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
          mode: generation.mode,
          createdAt: generation.createdAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '생성 요청에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'GENERATION_FAILED', message },
      });
    }
  });

  /**
   * 생성 상태 조회
   * GET /api/generations/:id
   */
  fastify.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const generation = await generationService.getById(user.id, id);

    if (!generation) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '생성 기록을 찾을 수 없습니다' },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        mode: generation.mode,
        options: generation.options,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt,
        completedAt: generation.completedAt,
        images: generation.images.map((img) => ({
          id: img.id,
          filePath: img.filePath,
          thumbnailPath: img.thumbnailPath,
          isSelected: img.isSelected,
          width: img.width,
          height: img.height,
        })),
      },
    });
  });

  /**
   * 이미지 선택
   * POST /api/generations/:id/select
   */
  fastify.post('/:id/select', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = SelectImageSchema.parse(request.body);

    try {
      const image = await generationService.selectImage(user.id, id, body.imageId);

      if (!image) {
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: '이미지를 찾을 수 없습니다' },
        });
      }

      return reply.send({
        success: true,
        data: {
          id: image.id,
          isSelected: image.isSelected,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '이미지 선택에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'SELECT_FAILED', message },
      });
    }
  });

  /**
   * 동일 조건 재생성
   * POST /api/generations/:id/regenerate
   */
  fastify.post('/:id/regenerate', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    try {
      const generation = await generationService.regenerate(user.id, id);

      return reply.code(201).send({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '재생성에 실패했습니다';
      const statusCode = message.includes('찾을 수 없습니다') ? 404 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: { code: 'REGENERATE_FAILED', message },
      });
    }
  });

  /**
   * 생성 기록 삭제 (연관된 모든 이미지 포함)
   * DELETE /api/generations/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    try {
      await generationService.deleteGeneration(user.id, id);

      return reply.send({
        success: true,
        message: '생성 기록이 삭제되었습니다',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '삭제에 실패했습니다';
      return reply.code(404).send({
        success: false,
        error: { code: 'DELETE_FAILED', message },
      });
    }
  });

  /**
   * 프로젝트 히스토리 조회
   * GET /api/generations/project/:projectId/history
   */
  fastify.get('/project/:projectId/history', async (request, reply) => {
    const user = (request as any).user;
    const { projectId } = request.params as { projectId: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    try {
      const { generations, total } = await generationService.getProjectHistory(
        user.id,
        projectId,
        parseInt(page),
        parseInt(limit)
      );

      return reply.send({
        success: true,
        data: generations.map((g) => ({
          id: g.id,
          mode: g.mode,
          createdAt: g.createdAt,
          selectedImage: g.images[0] || null,
          character: g.ipCharacter
            ? { id: g.ipCharacter.id, name: g.ipCharacter.name }
            : null,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '히스토리 조회에 실패했습니다';
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message },
      });
    }
  });
};

export default generationRoutes;
