import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from './config/index.js';
import authPlugin from './plugins/auth.plugin.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import characterRoutes from './routes/character.routes.js';
import generationRoutes from './routes/generation.routes.js';
import imageRoutes from './routes/image.routes.js';
import editRoutes from './routes/edit.routes.js';

/**
 * Fastify 서버 인스턴스 생성
 */
const server = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
    transport:
      config.nodeEnv === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

/**
 * 플러그인 등록
 */
async function registerPlugins() {
  // CORS 설정
  await server.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        console.log('[CORS] ✅ ALLOWED: origin 없음');
        callback(null, true);
        return;
      }

      if (config.corsOrigins.includes(origin)) {
        console.log(`[CORS] ✅ ALLOWED: ${origin}`);
        callback(null, true);
        return;
      }

      console.warn(`[CORS] ❌ BLOCKED: ${origin}`);
      callback(new Error('CORS policy violation: Origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Multipart 파일 업로드
  await server.register(multipart, {
    limits: {
      fileSize: config.maxFileSize,
    },
  });

  // JWT 인증 플러그인
  await server.register(authPlugin);
}

/**
 * 라우트 등록
 */
async function registerRoutes() {
  // 헬스체크 엔드포인트
  server.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // API 버전 정보
  server.get('/api', async () => {
    return {
      name: 'MockupAI API',
      version: '0.1.0',
      description: 'AI 목업 이미지 생성 API 서버',
    };
  });

  // 인증 라우트
  await server.register(authRoutes, { prefix: '/api/auth' });

  // 프로젝트 라우트
  await server.register(projectRoutes, { prefix: '/api/projects' });

  // 업로드 라우트
  await server.register(uploadRoutes, { prefix: '/api/upload' });

  // 캐릭터 라우트
  await server.register(characterRoutes, { prefix: '/api/characters' });

  // 생성 라우트
  await server.register(generationRoutes, { prefix: '/api/generations' });

  // 이미지 라우트
  await server.register(imageRoutes, { prefix: '/api/images' });

  // 부분 수정 라우트
  await server.register(editRoutes, { prefix: '/api/generations' });

  // 정적 파일 서빙 (업로드된 이미지)
  server.get('/uploads/*', async (request, reply) => {
    const filePath = (request.params as any)['*'];
    const fullPath = `${config.uploadDir}/${filePath}`;
    
    try {
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(fullPath);
      const ext = filePath.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
      };
      
      return reply
        .header('Content-Type', mimeTypes[ext || ''] || 'application/octet-stream')
        .send(buffer);
    } catch {
      return reply.code(404).send({ error: 'File not found' });
    }
  });
}

/**
 * 에러 핸들러 설정
 */
function setupErrorHandler() {
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    const err = error as Error & { statusCode?: number; code?: string };

    // Zod 유효성 검사 에러
    if (err.name === 'ZodError') {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '입력값이 올바르지 않습니다',
          details: error,
        },
      });
    }

    // 일반 에러
    const statusCode = err.statusCode || 500;
    return reply.code(statusCode).send({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || '서버 오류가 발생했습니다',
      },
    });
  });
}

/**
 * 서버 시작
 */
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    setupErrorHandler();

    await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    server.log.info(`🚀 서버가 http://localhost:${config.port} 에서 실행 중입니다`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

// 서버 시작
start();

// Graceful shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    server.log.info(`${signal} 신호 수신, 서버 종료 중...`);
    await server.close();
    process.exit(0);
  });
});
