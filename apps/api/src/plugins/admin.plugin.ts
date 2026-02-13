import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

/**
 * 관리자 권한 검증 플러그인
 */
async function adminPlugin(fastify: FastifyInstance) {
  /**
   * 관리자 권한 데코레이터
   * request.user가 admin 권한을 가지고 있는지 확인
   */
  fastify.decorate(
    'requireAdmin',
    async function (request: FastifyRequest, reply: FastifyReply) {
      const user = (request as any).user;

      if (!user || user.role !== 'admin') {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다',
          },
        });
      }

      if (!user.isActive) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: '비활성화된 계정입니다',
          },
        });
      }
    }
  );
}

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(adminPlugin, {
  name: 'admin-plugin',
  dependencies: ['auth-plugin'],
});
