import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import dashboardRoutes from './dashboard.routes.js';
import usersRoutes from './users.routes.js';
import generationsRoutes from './generations.routes.js';
import contentRoutes from './content.routes.js';
import apiKeysRoutes from './api-keys.routes.js';

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

  // 대시보드 라우트 등록
  fastify.register(dashboardRoutes, { prefix: '/dashboard' });

  // 사용자 관리 라우트 등록
  fastify.register(usersRoutes, { prefix: '/users' });

  // 생성 작업 모니터링 라우트 등록
  fastify.register(generationsRoutes, { prefix: '/generations' });

  // 콘텐츠 관리 라우트 등록
  fastify.register(contentRoutes, { prefix: '/content' });

  // API 키 관리 라우트 등록
  fastify.register(apiKeysRoutes, { prefix: '/api-keys' });
};

export default adminRoutes;
