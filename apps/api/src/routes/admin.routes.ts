import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { adminService } from '../services/admin.service.js';

const UpdateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const ToggleActiveSchema = z.object({
  isActive: z.boolean(),
});

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 라우트에 인증 + 관리자 권한 필요
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', fastify.requireAdmin);

  /**
   * 시스템 통계
   * GET /api/admin/stats
   */
  fastify.get('/stats', async (request, reply) => {
    const stats = await adminService.getStats();
    return reply.send({ success: true, data: stats });
  });

  /**
   * 사용자 목록
   * GET /api/admin/users
   */
  fastify.get('/users', async (request, reply) => {
    const query = request.query as any;
    const result = await adminService.getUsers({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      role: query.role,
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    });
    return reply.send({ success: true, data: result });
  });

  /**
   * 사용자 역할 변경
   * PATCH /api/admin/users/:id/role
   */
  fastify.patch('/users/:id/role', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateRoleSchema.parse(request.body);
    const adminUser = (request as any).user;

    try {
      const user = await adminService.updateUserRole(id, body.role, adminUser.id);
      return reply.send({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : '역할 변경에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'UPDATE_ROLE_FAILED', message },
      });
    }
  });

  /**
   * 사용자 활성/비활성
   * PATCH /api/admin/users/:id/active
   */
  fastify.patch('/users/:id/active', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = ToggleActiveSchema.parse(request.body);
    const adminUser = (request as any).user;

    try {
      const user = await adminService.toggleUserActive(id, body.isActive, adminUser.id);
      return reply.send({ success: true, data: user });
    } catch (error) {
      const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'TOGGLE_ACTIVE_FAILED', message },
      });
    }
  });

  /**
   * 사용자 삭제
   * DELETE /api/admin/users/:id
   */
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const adminUser = (request as any).user;

    try {
      await adminService.deleteUser(id, adminUser.id);
      return reply.send({ success: true, message: '사용자가 삭제되었습니다' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '삭제에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'DELETE_USER_FAILED', message },
      });
    }
  });

  /**
   * 전체 생성 작업 조회
   * GET /api/admin/generations
   */
  fastify.get('/generations', async (request, reply) => {
    const query = request.query as any;
    const result = await adminService.getGenerations({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      status: query.status,
      userId: query.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    return reply.send({ success: true, data: result });
  });

  /**
   * 전체 프로젝트 조회
   * GET /api/admin/projects
   */
  fastify.get('/projects', async (request, reply) => {
    const query = request.query as any;
    const result = await adminService.getProjects({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      userId: query.userId,
    });
    return reply.send({ success: true, data: result });
  });

  /**
   * 프로젝트 삭제
   * DELETE /api/admin/projects/:id
   */
  fastify.delete('/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await adminService.deleteProject(id);
      return reply.send({ success: true, message: '프로젝트가 삭제되었습니다' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '삭제에 실패했습니다';
      return reply.code(400).send({
        success: false,
        error: { code: 'DELETE_PROJECT_FAILED', message },
      });
    }
  });
};

export default adminRoutes;
