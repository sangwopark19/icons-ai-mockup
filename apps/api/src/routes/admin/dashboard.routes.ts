import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { adminService } from '../../services/admin.service.js';

/**
 * 대시보드 라우트
 */
const dashboardRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /api/admin/dashboard/stats
   * 대시보드 통계 데이터
   */
  fastify.get('/stats', async (_request, reply) => {
    const stats = await adminService.getDashboardStats();
    return reply.code(200).send({ success: true, data: stats });
  });

  /**
   * GET /api/admin/dashboard/chart
   * 시간별 실패 차트 데이터 (최근 24시간)
   */
  fastify.get('/chart', async (_request, reply) => {
    const chart = await adminService.getHourlyFailureChart();
    return reply.code(200).send({ success: true, data: chart });
  });
};

export default dashboardRoutes;
