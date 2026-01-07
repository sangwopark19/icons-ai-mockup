import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config/index.js';
import { authService } from '../services/auth.service.js';

/**
 * JWT 인증 플러그인
 */
async function authPlugin(fastify: FastifyInstance) {
  // JWT 플러그인 등록
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtAccessExpiry,
    },
  });

  /**
   * 인증 데코레이터
   * request.user에 사용자 정보 추가
   */
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          throw new Error('인증 토큰이 필요합니다');
        }

        const token = authHeader.substring(7);

        // 토큰 검증 및 사용자 조회
        const user = await authService.getUserFromToken(token);
        if (!user) {
          throw new Error('유효하지 않은 토큰입니다');
        }

        // request에 사용자 정보 첨부
        (request as any).user = user;
      } catch (error) {
        const message = error instanceof Error ? error.message : '인증에 실패했습니다';
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message,
          },
        });
      }
    }
  );
}

// Fastify 타입 확장
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, {
  name: 'auth-plugin',
});
