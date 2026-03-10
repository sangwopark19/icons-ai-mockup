import { FastifyInstance, FastifyPluginAsync } from 'fastify';

/**
 * 관리자 라우트
 * 모든 라우트에 requireAdmin preHandler 적용
 */
const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 모든 admin 라우트에 requireAdmin 적용
  fastify.addHook('preHandler', fastify.requireAdmin);

  /**
   * 관리자 헬스체크 엔드포인트
   */
  fastify.get('/health', async (_request, reply) => {
    return reply.code(200).send({ success: true, data: { status: 'ok' } });
  });
};

export default adminRoutes;
