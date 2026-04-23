import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { adminService } from '../../services/admin.service.js';

const listImagesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  email: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const countImagesQuerySchema = z.object({
  email: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const bulkDeleteBodySchema = z.object({
  email: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * 콘텐츠 관리 라우트 (생성된 이미지 CRUD)
 */
const contentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/admin/content/projects
   * 이미지가 있는 프로젝트 목록 조회 (필터 드롭다운용)
   */
  fastify.get('/projects', async (_request, reply) => {
    const projects = await adminService.listContentProjects();
    return reply.code(200).send({ success: true, data: projects });
  });

  /**
   * GET /api/admin/content/images
   * 생성된 이미지 목록 조회 (페이지네이션, 이메일/프로젝트/날짜 필터링)
   */
  fastify.get('/images', async (request, reply) => {
    const query = listImagesQuerySchema.parse(request.query);
    const result = await adminService.listGeneratedImages({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
    return reply.code(200).send({
      success: true,
      data: result.images,
      pagination: result.pagination,
    });
  });

  /**
   * GET /api/admin/content/images/count
   * 벌크 삭제 확인을 위한 이미지 수 조회
   */
  fastify.get('/images/count', async (request, reply) => {
    const query = countImagesQuerySchema.parse(request.query);
    const count = await adminService.countImages({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
    return reply.code(200).send({
      success: true,
      data: { count },
    });
  });

  /**
   * DELETE /api/admin/content/images/:id
   * 개별 이미지 삭제 (DB 레코드 + 파일)
   */
  fastify.delete('/images/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await adminService.deleteGeneratedImage(id);
      return reply.code(200).send({ success: true, message: '이미지가 삭제되었습니다' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found') || message.includes('Image not found')) {
        return reply.code(404).send({ success: false, error: message });
      }
      return reply.code(500).send({ success: false, error: message });
    }
  });

  /**
   * DELETE /api/admin/content/images
   * 필터 조건에 맞는 이미지 벌크 삭제
   */
  fastify.delete('/images', async (request, reply) => {
    const body = bulkDeleteBodySchema.parse(request.body ?? {});
    const result = await adminService.bulkDeleteImages({
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
    return reply.code(200).send({ success: true, data: result });
  });
};

export default contentRoutes;
