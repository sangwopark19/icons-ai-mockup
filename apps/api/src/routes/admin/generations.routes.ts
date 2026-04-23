import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { adminService } from '../../services/admin.service.js';

const listGenerationsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  email: z.string().optional(),
});

/**
 * 생성 작업 모니터링 라우트
 */
const generationsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/admin/generations
   * 생성 작업 목록 조회 (페이지네이션, 상태/이메일 필터링)
   */
  fastify.get('/', async (request, reply) => {
    const query = listGenerationsQuerySchema.parse(request.query);
    const result = await adminService.listGenerations(query);
    return reply.code(200).send({
      success: true,
      data: result.generations,
      pagination: result.pagination,
      statusCounts: result.statusCounts,
    });
  });

  /**
   * POST /api/admin/generations/:id/retry
   * 실패한 생성 작업 재시도 (BullMQ 재큐잉)
   */
  fastify.post('/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await adminService.retryGeneration(id);
      return reply.code(200).send({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        return reply.code(404).send({ success: false, error: message });
      }
      if (message.toLowerCase().includes('not failed') || message.toLowerCase().includes('only failed')) {
        return reply.code(400).send({ success: false, error: message });
      }
      return reply.code(500).send({ success: false, error: message });
    }
  });
};

export default generationsRoutes;
