import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';
import { adminService } from '../../services/admin.service.js';

const listUsersQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  email: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

const updateStatusBodySchema = z.object({
  status: z.enum(['active', 'suspended']),
});

const updateRoleBodySchema = z.object({
  role: z.enum(['admin', 'user']),
});

/**
 * 사용자 관리 라우트
 */
const usersRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/admin/users
   * 사용자 목록 조회 (페이지네이션, 필터링)
   */
  fastify.get('/', async (request, reply) => {
    const query = listUsersQuerySchema.parse(request.query);
    const result = await adminService.listUsers(query);
    return reply.code(200).send({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  });

  /**
   * PATCH /api/admin/users/:id/status
   * 사용자 상태 변경 (active / suspended)
   */
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = updateStatusBodySchema.parse(request.body);
    const user = await adminService.updateUserStatus(id, status);
    return reply.code(200).send({ success: true, data: user });
  });

  /**
   * PATCH /api/admin/users/:id/role
   * 사용자 역할 변경 (admin / user)
   */
  fastify.patch('/:id/role', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { role } = updateRoleBodySchema.parse(request.body);
    const user = await adminService.updateUserRole(id, role);
    return reply.code(200).send({ success: true, data: user });
  });

  /**
   * DELETE /api/admin/users/:id
   * 사용자 소프트 삭제 (PII 익명화)
   */
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await adminService.softDeleteUser(id);
    return reply.code(200).send({ success: true, message: '사용자가 삭제되었습니다' });
  });
};

export default usersRoutes;
