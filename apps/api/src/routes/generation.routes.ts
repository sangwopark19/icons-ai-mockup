import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { generationService } from '../services/generation.service.js';

/**
 * 공통 응답 스키마
 */
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

/**
 * 요청 스키마 (v3)
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
      // v3 옵션
      viewpointLock: z.boolean().optional(),
      whiteBackground: z.boolean().optional(),
      accessoryPreservation: z.boolean().optional(),
      styleCopy: z.boolean().optional(),
      userInstructions: z.string().max(500).optional(),
      outputCount: z.number().int().min(1).max(4).optional(),
      // 레거시 옵션 (하위 호환성)
      preserveStructure: z.boolean().optional(),
      transparentBackground: z.boolean().optional(),
    })
    .optional(),
});

const SelectImageSchema = z.object({
  imageId: z.string().uuid(),
});

const StyleCopySchema = z.object({
  characterId: z.string().uuid(),
});

/**
 * Regenerate 요청 스키마 (v3)
 * 기존 Generation을 재생성하되, 일부 옵션을 덮어쓸 수 있음
 */
const RegenerateSchema = z
  .object({
    viewpointLock: z.boolean().optional(),
    whiteBackground: z.boolean().optional(),
    userInstructions: z.string().max(500).optional(),
    accessoryPreservation: z.boolean().optional(),
    styleCopy: z.boolean().optional(),
    outputCount: z.number().int().min(1).max(4).optional(),
  })
  .optional();

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
  fastify.post('/', {
    schema: {
      description: 'AI 이미지 생성 요청 생성',
      tags: ['generations'],
      body: zodToJsonSchema(CreateGenerationSchema),
      response: {
        201: zodToJsonSchema(SuccessResponseSchema),
      },
    },
  }, async (request, reply) => {
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
  fastify.get('/:id', {
    schema: {
      description: '생성 요청 상태 및 결과 이미지 조회',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ id: z.string().uuid() })),
      response: {
        200: zodToJsonSchema(SuccessResponseSchema),
        404: zodToJsonSchema(ErrorResponseSchema),
      },
    },
  }, async (request, reply) => {
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
  fastify.post('/:id/select', {
    schema: {
      description: '생성된 이미지 중 하나를 선택',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ id: z.string().uuid() })),
      body: zodToJsonSchema(SelectImageSchema),
      response: {
        200: zodToJsonSchema(SuccessResponseSchema),
        404: zodToJsonSchema(ErrorResponseSchema),
      },
    },
  }, async (request, reply) => {
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
   * 생성 기록 삭제 (연관된 모든 이미지 포함)
   * DELETE /api/generations/:id
   */
  fastify.delete('/:id', {
    schema: {
      description: '생성 기록 및 연관된 이미지 삭제',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ id: z.string().uuid() })),
      response: {
        200: zodToJsonSchema(z.object({ success: z.literal(true), message: z.string() })),
        404: zodToJsonSchema(ErrorResponseSchema),
      },
    },
  }, async (request, reply) => {
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
   * 다시 생성 (기존 설정으로 재생성, 일부 옵션 덮어쓰기 가능)
   * POST /api/generations/:id/regenerate
   */
  fastify.post('/:id/regenerate', {
    schema: {
      description: '기존 생성 요청을 재실행 (일부 옵션 덮어쓰기 가능)',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ id: z.string().uuid() })),
      body: zodToJsonSchema(RegenerateSchema),
      response: {
        201: zodToJsonSchema(SuccessResponseSchema),
      },
    },
  }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    
    // 요청 body 파싱 (옵션 오버라이드)
    const optionOverrides = RegenerateSchema.parse(request.body);

    try {
      const generation = await generationService.regenerate(user.id, id, optionOverrides);

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
      const message = error instanceof Error ? error.message : '다시 생성에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'REGENERATE_FAILED', message },
      });
    }
  });

  /**
   * 스타일 복사 (기존 스타일 + 새 캐릭터)
   * POST /api/generations/:id/style-copy
   */
  fastify.post('/:id/style-copy', {
    schema: {
      description: '기존 생성 결과의 스타일을 유지하며 새 캐릭터 적용',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ id: z.string().uuid() })),
      body: zodToJsonSchema(StyleCopySchema),
      response: {
        201: zodToJsonSchema(SuccessResponseSchema),
      },
    },
  }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = StyleCopySchema.parse(request.body);

    try {
      const generation = await generationService.styleCopy(user.id, id, body.characterId);

      return reply.code(201).send({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
          mode: generation.mode,
          parentGenerationId: generation.parentGenerationId,
          createdAt: generation.createdAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '스타일 복사에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'STYLE_COPY_FAILED', message },
      });
    }
  });

  /**
   * 프로젝트 히스토리 조회
   * GET /api/generations/project/:projectId/history
   */
  fastify.get('/project/:projectId/history', {
    schema: {
      description: '프로젝트의 완료된 생성 기록 조회 (페이지네이션)',
      tags: ['generations'],
      params: zodToJsonSchema(z.object({ projectId: z.string().uuid() })),
      querystring: zodToJsonSchema(
        z.object({
          page: z.string().optional(),
          limit: z.string().optional(),
        })
      ),
      response: {
        200: zodToJsonSchema(
          z.object({
            success: z.literal(true),
            data: z.array(z.any()),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          })
        ),
        404: zodToJsonSchema(ErrorResponseSchema),
      },
    },
  }, async (request, reply) => {
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
