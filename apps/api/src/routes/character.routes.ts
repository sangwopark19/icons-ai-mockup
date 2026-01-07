import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { characterService } from '../services/character.service.js';

/**
 * 캐릭터 라우트
 */
const characterRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * 프로젝트의 캐릭터 목록 조회
   * GET /api/characters?projectId=xxx
   */
  fastify.get('/', async (request, reply) => {
    const user = (request as any).user;
    const { projectId } = request.query as { projectId?: string };

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
      const characters = await characterService.findByProject(user.id, projectId);

      return reply.send({
        success: true,
        data: characters.map((c) => ({
          id: c.id,
          name: c.name,
          filePath: c.filePath,
          thumbnailPath: c.thumbnailPath,
          createdAt: c.createdAt,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '캐릭터 목록 조회에 실패했습니다';
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message },
      });
    }
  });

  /**
   * 캐릭터 생성 (이미지 업로드 포함)
   * POST /api/characters
   */
  fastify.post('/', async (request, reply) => {
    const user = (request as any).user;
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({
        success: false,
        error: { code: 'NO_FILE', message: '파일이 업로드되지 않았습니다' },
      });
    }

    const { projectId, name } = request.query as { projectId?: string; name?: string };

    if (!projectId) {
      return reply.code(400).send({
        success: false,
        error: { code: 'MISSING_PROJECT_ID', message: '프로젝트 ID가 필요합니다' },
      });
    }

    if (!name) {
      return reply.code(400).send({
        success: false,
        error: { code: 'MISSING_NAME', message: '캐릭터 이름이 필요합니다' },
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_FILE_TYPE', message: 'PNG, JPG, WEBP 파일만 업로드할 수 있습니다' },
      });
    }

    const buffer = await data.toBuffer();

    try {
      const character = await characterService.create(
        user.id,
        projectId,
        name,
        buffer,
        data.mimetype
      );

      return reply.code(201).send({
        success: true,
        data: {
          id: character.id,
          name: character.name,
          filePath: character.filePath,
          thumbnailPath: character.thumbnailPath,
          createdAt: character.createdAt,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '캐릭터 생성에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'CREATE_FAILED', message },
      });
    }
  });

  /**
   * 캐릭터 삭제
   * DELETE /api/characters/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const deleted = await characterService.delete(user.id, id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '캐릭터를 찾을 수 없습니다' },
      });
    }

    return reply.send({
      success: true,
      message: '캐릭터가 삭제되었습니다',
    });
  });
};

export default characterRoutes;
