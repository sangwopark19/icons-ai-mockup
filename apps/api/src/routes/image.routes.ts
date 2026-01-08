import { FastifyPluginAsync } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';

/**
 * 이미지 라우트
 */
const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요 (다운로드 제외)
  fastify.addHook('preHandler', async (request, reply) => {
    const url = request.url;
    // 다운로드는 쿼리 파라미터로 토큰 전달
    if (url.includes('/download')) {
      const { token } = request.query as { token?: string };
      if (token) {
        request.headers.authorization = `Bearer ${token}`;
      }
    }
    await fastify.authenticate(request, reply);
  });

  /**
   * 이미지 상세 조회
   * GET /api/images/:id
   */
  fastify.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const image = await prisma.generatedImage.findFirst({
      where: { id },
      include: {
        generation: {
          include: { project: true },
        },
      },
    });

    if (!image || image.generation.project.userId !== user.id) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '이미지를 찾을 수 없습니다' },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: image.id,
        filePath: image.filePath,
        thumbnailPath: image.thumbnailPath,
        type: image.type,
        isSelected: image.isSelected,
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        createdAt: image.createdAt,
      },
    });
  });

  /**
   * 이미지 다운로드 (1K)
   * GET /api/images/:id/download
   */
  fastify.get('/:id/download', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const image = await prisma.generatedImage.findFirst({
      where: { id },
      include: {
        generation: {
          include: { project: true },
        },
      },
    });

    if (!image || image.generation.project.userId !== user.id) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '이미지를 찾을 수 없습니다' },
      });
    }

    const filePath = path.join(config.uploadDir, image.filePath);

    try {
      const buffer = await fs.readFile(filePath);
      const filename = path.basename(image.filePath);

      return reply
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Type', 'image/png')
        .send(buffer);
    } catch {
      return reply.code(404).send({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: '파일을 찾을 수 없습니다' },
      });
    }
  });

  /**
   * 이미지 히스토리에 저장
   * POST /api/images/:id/save
   */
  fastify.post('/:id/save', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const image = await prisma.generatedImage.findFirst({
      where: { id },
      include: {
        generation: {
          include: { project: true },
        },
      },
    });

    if (!image || image.generation.project.userId !== user.id) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '이미지를 찾을 수 없습니다' },
      });
    }

    // 히스토리에 저장 (이미지 선택 상태로 마킹)
    await prisma.generatedImage.update({
      where: { id },
      data: { isSelected: true },
    });

    // 히스토리 기록 저장
    await prisma.imageHistory.create({
      data: {
        imageId: id,
        action: 'save',
        changes: { savedAt: new Date().toISOString() },
        filePath: image.filePath,
      },
    });

    return reply.send({
      success: true,
      message: '히스토리에 저장되었습니다',
    });
  });

  /**
   * 이미지 삭제
   * DELETE /api/images/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const image = await prisma.generatedImage.findFirst({
      where: { id },
      include: {
        generation: {
          include: { project: true },
        },
      },
    });

    if (!image || image.generation.project.userId !== user.id) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: '이미지를 찾을 수 없습니다' },
      });
    }

    // 파일 삭제
    try {
      await fs.unlink(path.join(config.uploadDir, image.filePath));
      if (image.thumbnailPath) {
        await fs.unlink(path.join(config.uploadDir, image.thumbnailPath));
      }
    } catch {
      // 파일 삭제 실패해도 DB는 삭제
    }

    // DB 삭제
    await prisma.generatedImage.delete({ where: { id } });

    return reply.send({
      success: true,
      message: '이미지가 삭제되었습니다',
    });
  });
};

export default imageRoutes;
