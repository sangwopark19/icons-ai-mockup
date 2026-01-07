import { FastifyPluginAsync } from 'fastify';
import { uploadService } from '../services/upload.service.js';

/**
 * 업로드 라우트
 */
const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * 이미지 업로드
   * POST /api/upload/image
   */
  fastify.post('/image', async (request, reply) => {
    const user = (request as any).user;
    
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '파일이 업로드되지 않았습니다',
        },
      });
    }

    // MIME 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'PNG, JPG, WEBP 파일만 업로드할 수 있습니다',
        },
      });
    }

    const buffer = await data.toBuffer();
    const projectId = (request.query as any).projectId;

    if (!projectId) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: '프로젝트 ID가 필요합니다',
        },
      });
    }

    try {
      const result = await uploadService.uploadImage(
        user.id,
        projectId,
        buffer,
        data.mimetype
      );

      return reply.send({
        success: true,
        data: {
          filePath: result.filePath,
          thumbnailPath: result.thumbnailPath,
          width: result.metadata.width,
          height: result.metadata.height,
          size: result.metadata.size,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '업로드에 실패했습니다';
      return reply.code(500).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message,
        },
      });
    }
  });

  /**
   * 캐릭터 이미지 업로드
   * POST /api/upload/character
   */
  fastify.post('/character', async (request, reply) => {
    const user = (request as any).user;
    
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '파일이 업로드되지 않았습니다',
        },
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'PNG, JPG, WEBP 파일만 업로드할 수 있습니다',
        },
      });
    }

    const buffer = await data.toBuffer();

    try {
      const result = await uploadService.uploadCharacterImage(
        user.id,
        buffer,
        data.mimetype
      );

      return reply.send({
        success: true,
        data: {
          filePath: result.filePath,
          thumbnailPath: result.thumbnailPath,
          width: result.metadata.width,
          height: result.metadata.height,
          size: result.metadata.size,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '업로드에 실패했습니다';
      return reply.code(500).send({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message,
        },
      });
    }
  });
};

export default uploadRoutes;
