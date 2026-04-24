import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { adminService } from '../../services/admin.service.js';

const ProviderSchema = z.enum(['gemini', 'openai']);

const providerQuerySchema = z.object({
  provider: ProviderSchema,
});

const createApiKeyBodySchema = z.object({
  provider: ProviderSchema,
  alias: z.string().min(1).max(50),
  apiKey: z.string().min(1),
});

/**
 * API 키 관리 라우트
 * GET /    — 목록 조회
 * POST /   — 키 등록
 * DELETE /:id — 키 삭제
 * PATCH /:id/activate — 키 활성화
 */
const apiKeysRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET / — API 키 목록 조회 (KEY-01)
   */
  fastify.get('/', async (request, reply) => {
    try {
      const parsed = providerQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.message },
        });
      }

      const keys = await adminService.listApiKeys(parsed.data.provider);
      return reply.code(200).send({ success: true, data: keys });
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message },
      });
    }
  });

  /**
   * POST / — API 키 등록 (KEY-02)
   */
  fastify.post('/', async (request, reply) => {
    try {
      const parsed = createApiKeyBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.message },
        });
      }

      const { provider, alias, apiKey } = parsed.data;
      const createdKey = await adminService.createApiKey(provider, alias, apiKey);
      return reply.code(201).send({ success: true, data: createdKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return reply.code(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message },
      });
    }
  });

  /**
   * DELETE /:id — API 키 삭제 (KEY-03)
   */
  fastify.delete<{ Params: { id: string }; Querystring: { provider?: string } }>(
    '/:id',
    async (request, reply) => {
      const { id } = request.params;
      try {
        const parsed = providerQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: parsed.error.message },
          });
        }

        await adminService.deleteApiKey(parsed.data.provider, id);
        return reply.code(200).send({ success: true, message: 'API 키가 삭제되었습니다' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        if (message.includes('활성 키')) {
          return reply.code(400).send({
            success: false,
            error: { code: 'ACTIVE_KEY_CANNOT_BE_DELETED', message },
          });
        }
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message },
        });
      }
    }
  );

  /**
   * PATCH /:id/activate — API 키 활성화 (KEY-04)
   */
  fastify.patch<{ Params: { id: string }; Querystring: { provider?: string } }>(
    '/:id/activate',
    async (request, reply) => {
      const { id } = request.params;
      try {
        const parsed = providerQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: parsed.error.message },
          });
        }

        const activatedKey = await adminService.activateApiKey(parsed.data.provider, id);
        return reply.code(200).send({ success: true, data: activatedKey });
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류';
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message },
        });
      }
    }
  );
};

export default apiKeysRoutes;
