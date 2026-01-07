import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';

/**
 * 요청 스키마 정의
 */
const CreateProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력해주세요').max(200),
  description: z.string().max(1000).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * 프로젝트 라우트
 */
const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 필요
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * 프로젝트 목록 조회
   * GET /api/projects
   */
  fastify.get('/', async (request, reply) => {
    const user = (request as any).user;
    const query = PaginationSchema.parse(request.query);

    const { projects, total, totalPages } = await projectService.findByUser(
      user.id,
      query
    );

    return reply.send({
      success: true,
      data: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  });

  /**
   * 프로젝트 생성
   * POST /api/projects
   */
  fastify.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = CreateProjectSchema.parse(request.body);

    const project = await projectService.create(user.id, body);

    return reply.code(201).send({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  });

  /**
   * 프로젝트 상세 조회
   * GET /api/projects/:id
   */
  fastify.get('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const project = await projectService.findByIdWithStats(id, user.id);

    if (!project) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '프로젝트를 찾을 수 없습니다',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        generationCount: project.generationCount,
        characterCount: project.characterCount,
        savedImageCount: project.savedImageCount,
      },
    });
  });

  /**
   * 프로젝트 수정
   * PATCH /api/projects/:id
   */
  fastify.patch('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = UpdateProjectSchema.parse(request.body);

    const project = await projectService.update(id, user.id, body);

    if (!project) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '프로젝트를 찾을 수 없습니다',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  });

  /**
   * 프로젝트 삭제
   * DELETE /api/projects/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const deleted = await projectService.delete(id, user.id);

    if (!deleted) {
      return reply.code(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '프로젝트를 찾을 수 없습니다',
        },
      });
    }

    return reply.send({
      success: true,
      message: '프로젝트가 삭제되었습니다',
    });
  });
};

export default projectRoutes;
