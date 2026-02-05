import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config/index.js';
import { authService } from '../services/auth.service.js';
import fs from 'fs';

// #region agent log
const logPath =
  process.env.NODE_ENV === 'production'
    ? '/app/data/debug.log'
    : '/Users/sangwopark19/icons/icons-ai-mockup/.cursor/debug.log';
const log = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    const entry =
      JSON.stringify({
        sessionId: 'debug-session',
        runId: 'server-runtime',
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }) + '\n';
    fs.appendFileSync(logPath, entry);
  } catch (e) {
    // 로그 실패는 무시
  }
};
// #endregion agent log

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
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    // #region agent log
    log('H2', 'auth.plugin.ts:authenticate:start', '인증 시작', {
      hasAuthHeader: Boolean(request.headers.authorization),
      url: request.url,
      method: request.method,
    });
    // #endregion agent log

    try {
      // Authorization 헤더에서 토큰 추출
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        // #region agent log
        log('H2', 'auth.plugin.ts:authenticate:no-token', '토큰 없음', {});
        // #endregion agent log
        throw new Error('인증 토큰이 필요합니다');
      }

      const token = authHeader.substring(7);

      // #region agent log
      log('H2', 'auth.plugin.ts:authenticate:before-db', 'DB 조회 전', {
        tokenLength: token.length,
      });
      // #endregion agent log

      // 토큰 검증 및 사용자 조회
      const user = await authService.getUserFromToken(token);

      // #region agent log
      log('H2', 'auth.plugin.ts:authenticate:after-db', 'DB 조회 후', {
        userFound: Boolean(user),
      });
      // #endregion agent log

      if (!user) {
        // #region agent log
        log('H2', 'auth.plugin.ts:authenticate:invalid-token', '유효하지 않은 토큰', {});
        // #endregion agent log
        throw new Error('유효하지 않은 토큰입니다');
      }

      // request에 사용자 정보 첨부
      (request as any).user = user;

      // #region agent log
      log('H2', 'auth.plugin.ts:authenticate:success', '인증 성공', {
        userId: user.id,
      });
      // #endregion agent log
    } catch (error) {
      const message = error instanceof Error ? error.message : '인증에 실패했습니다';
      // #region agent log
      log('H2', 'auth.plugin.ts:authenticate:error', '인증 실패', {
        errorMessage: message,
        errorName: error instanceof Error ? error.name : 'unknown',
      });
      // #endregion agent log
      return reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      });
    }
  });
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
