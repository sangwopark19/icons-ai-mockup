import { FastifyPluginAsync, type FastifyReply } from 'fastify';
import { z } from 'zod';
import { generationService } from '../services/generation.service.js';

function hasTrimmedValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 요청 스키마
 */
const CreateGenerationSchema = z
  .object({
    projectId: z.string().uuid(),
    mode: z.enum(['ip_change', 'sketch_to_real']),
    provider: z.enum(['gemini', 'openai']).optional(),
    providerModel: z.string().min(1).optional(),
    sourceImagePath: z.string().optional(),
    characterId: z.string().uuid().optional(),
    characterImagePath: z.string().optional(), // 직접 업로드된 캐릭터 이미지 경로
    textureImagePath: z.string().optional(),
    prompt: z.string().max(2000).optional(),
    options: z
      .object({
        preserveStructure: z.boolean().optional(),
        transparentBackground: z.boolean().optional(),
        preserveHardware: z.boolean().optional(),
        fixedBackground: z.boolean().optional(),
        fixedViewpoint: z.boolean().optional(),
        removeShadows: z.boolean().optional(),
        userInstructions: z.string().max(2000).optional(),
        hardwareSpecInput: z.string().max(2000).optional(),
        productCategory: z.string().max(100).optional(),
        productCategoryOther: z.string().max(500).optional(),
        materialPreset: z.string().max(100).optional(),
        materialOther: z.string().max(500).optional(),
        quality: z.enum(['low', 'medium', 'high']).optional(),
        hardwareSpecs: z
          .object({
            items: z.array(
              z.object({
                type: z.enum(['zipper', 'ring', 'buckle', 'patch', 'button', 'other']),
                material: z.string(),
                color: z.string(),
                position: z.string(),
                size: z.string().optional(),
              })
            ),
          })
          .optional(),
        outputCount: z.number().int().min(1).max(4).optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'openai' && value.providerModel !== undefined) {
      const providerModel = value.providerModel.trim();
      if (providerModel !== 'gpt-image-2') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['providerModel'],
          message: 'OpenAI providerModel은 gpt-image-2여야 합니다',
        });
      }
    }

    if (value.provider === 'openai' && !['ip_change', 'sketch_to_real'].includes(value.mode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['provider'],
        message: 'OpenAI provider는 현재 IP 변경 v2와 스케치 실사화 v2만 지원합니다',
      });
    }

    if (value.mode === 'ip_change' && !value.sourceImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceImagePath'],
        message: 'IP 변경에는 원본 이미지가 필요합니다',
      });
    }

    if (value.mode === 'ip_change' && !value.characterId && !value.characterImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['characterImagePath'],
        message: 'IP 변경에는 캐릭터 이미지가 필요합니다',
      });
    }

    if (value.mode === 'sketch_to_real' && !value.sourceImagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sourceImagePath'],
        message: '스케치 실사화에는 원본 이미지가 필요합니다',
      });
    }

    if (
      value.provider === 'openai' &&
      value.mode === 'ip_change' &&
      value.options?.transparentBackground
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options', 'transparentBackground'],
        message: 'OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다',
      });
    }

    if (
      value.provider === 'openai' &&
      value.options?.outputCount !== undefined &&
      value.options.outputCount !== 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options', 'outputCount'],
        message: 'OpenAI v2는 후보 2개 생성만 지원합니다',
      });
    }

    if (value.provider === 'openai' && value.mode === 'sketch_to_real') {
      const { options } = value;
      if (!hasTrimmedValue(options?.productCategory)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', 'productCategory'],
          message: 'OpenAI 스케치 실사화 v2에는 제품 종류가 필요합니다',
        });
      }

      if (!hasTrimmedValue(options?.materialPreset)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', 'materialPreset'],
          message: 'OpenAI 스케치 실사화 v2에는 재질 가이드가 필요합니다',
        });
      }

      if (
        options?.productCategory?.trim() === '기타' &&
        !hasTrimmedValue(options.productCategoryOther)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', 'productCategoryOther'],
          message: '기타 제품 종류를 선택한 경우 상세 내용을 입력해주세요',
        });
      }

      if (options?.materialPreset?.trim() === '기타' && !hasTrimmedValue(options.materialOther)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options', 'materialOther'],
          message: '기타 재질을 선택한 경우 상세 내용을 입력해주세요',
        });
      }
    }
  });

const SelectImageSchema = z.object({
  imageId: z.string().uuid(),
});

const CopyStyleSchema = z.object({
  characterImagePath: z.string().optional(),
  sourceImagePath: z.string().optional(),
  copyTarget: z.enum(['ip-change', 'new-product']).default('ip-change'),
  selectedImageId: z.string().uuid().optional(),
  userInstructions: z.string().max(2000).optional(),
});

const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function sendInvalidRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({
    success: false,
    error: { code: 'INVALID_REQUEST', message },
  });
}

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
    const parsed = CreateGenerationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: parsed.error.issues[0]?.message ?? '생성 요청에 실패했습니다',
        },
      });
    }

    try {
      const generation = await generationService.create(user.id, parsed.data);

      return reply.code(201).send({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
          mode: generation.mode,
          provider: generation.provider,
          providerModel: generation.providerModel,
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

    const options = (generation.options as Record<string, unknown>) || {};
    const userInstructions =
      typeof generation.userInstructions === 'string' && generation.userInstructions.trim()
        ? generation.userInstructions
        : (options.userInstructions as string | undefined);

    return reply.send({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        mode: generation.mode,
        provider: generation.provider,
        providerModel: generation.providerModel,
        options: userInstructions ? { ...options, userInstructions } : options,
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
    const parsed = SelectImageSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendInvalidRequest(
        reply,
        parsed.error.issues[0]?.message ?? '요청이 유효하지 않습니다'
      );
    }

    const body = parsed.data;

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
          provider: generation.provider,
          providerModel: generation.providerModel,
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
   * 스타일 복사
   * POST /api/generations/:id/copy-style
   */
  fastify.post('/:id/copy-style', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const parsed = CopyStyleSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendInvalidRequest(
        reply,
        parsed.error.issues[0]?.message ?? '요청이 유효하지 않습니다'
      );
    }

    const body = parsed.data;

    if (!body.characterImagePath && !body.sourceImagePath) {
      return sendInvalidRequest(reply, '새 캐릭터 또는 제품 이미지를 제공해야 합니다');
    }

    try {
      const generation = await generationService.copyStyle(user.id, id, body);
      return reply.code(201).send({
        success: true,
        data: {
          id: generation.id,
          status: generation.status,
          provider: generation.provider,
          providerModel: generation.providerModel,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '스타일 복사에 실패했습니다';
      const statusCode = message.includes('찾을 수 없습니다') ? 404 : 400;
      return reply.code(statusCode).send({
        success: false,
        error: { code: 'COPY_STYLE_FAILED', message },
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
    const parsed = HistoryQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return sendInvalidRequest(
        reply,
        parsed.error.issues[0]?.message ?? '요청이 유효하지 않습니다'
      );
    }

    const { page, limit } = parsed.data;

    try {
      const { generations, total } = await generationService.getProjectHistory(
        user.id,
        projectId,
        page,
        limit
      );

      return reply.send({
        success: true,
        data: generations.map((g) => ({
          id: g.id,
          mode: g.mode,
          provider: g.provider,
          providerModel: g.providerModel,
          createdAt: g.createdAt,
          selectedImage: g.images[0] || null,
          character: g.ipCharacter ? { id: g.ipCharacter.id, name: g.ipCharacter.name } : null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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
