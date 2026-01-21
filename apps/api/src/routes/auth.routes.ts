import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

/**
 * 요청 스키마 정의
 */
const RegisterSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  name: z.string().min(1, '이름을 입력해주세요').max(100),
});

const LoginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh Token이 필요합니다'),
});

/**
 * 인증 라우트
 */
const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * 회원가입
   * POST /api/auth/register
   */
  fastify.post('/register', async (request, reply) => {
    const body = RegisterSchema.parse(request.body);

    try {
      const user = await authService.register(body.email, body.password, body.name);

      return reply.code(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
          },
        },
        message: '회원가입이 완료되었습니다',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: {
          code: 'REGISTER_FAILED',
          message,
        },
      });
    }
  });

  /**
   * 로그인
   * POST /api/auth/login
   */
  fastify.post('/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    try {
      // #region 에이전트 로그
      fetch('http://127.0.0.1:7243/ingest/b191ce02-4f7f-42aa-8e8d-6f1eb4eff476', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'auth.routes.ts:login:start',
          message: '로그인 요청 수신',
          data: { hasBody: Boolean(body) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion 에이전트 로그

      const { user, accessToken, refreshToken } = await authService.login(
        body.email,
        body.password
      );

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인에 실패했습니다';
      // #region 에이전트 로그
      fetch('http://127.0.0.1:7243/ingest/b191ce02-4f7f-42aa-8e8d-6f1eb4eff476', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'auth.routes.ts:login:error',
          message: '로그인 실패',
          data: { errorMessage: message },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion 에이전트 로그
      return reply.code(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message,
        },
      });
    }
  });

  /**
   * 로그아웃
   * POST /api/auth/logout
   */
  fastify.post('/logout', async (request, reply) => {
    const body = RefreshSchema.safeParse(request.body);

    if (body.success && body.data.refreshToken) {
      await authService.logout(body.data.refreshToken);
    }

    return reply.send({
      success: true,
      message: '로그아웃되었습니다',
    });
  });

  /**
   * 토큰 갱신
   * POST /api/auth/refresh
   */
  fastify.post('/refresh', async (request, reply) => {
    const body = RefreshSchema.parse(request.body);

    try {
      const tokens = await authService.refreshTokens(body.refreshToken);

      return reply.send({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '토큰 갱신에 실패했습니다';
      return reply.code(401).send({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message,
        },
      });
    }
  });

  /**
   * 현재 사용자 정보 조회
   * GET /api/auth/me
   */
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = (request as any).user;

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          },
        },
      });
    },
  });
};

export default authRoutes;
