import { prisma } from '../lib/prisma.js';
import type { Project } from '@prisma/client';
import fs from 'fs';

// #region agent log
const logPath =
  process.env.NODE_ENV === 'production'
    ? '/app/data/debug.log'
    : '/Users/sangwopark19/icons/icons-ai-mockup/.cursor/debug.log';
const log = (hypothesisId: string, location: string, message: string, data: any) => {
  try {
    const entry =
      JSON.stringify({
        sessionId: 'debug-session',
        runId: 'server-runtime',
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }) + '\n';
    fs.appendFileSync(logPath, entry);
  } catch (e) {
    // 로그 실패는 무시
  }
};
// #endregion agent log

/**
 * 프로젝트 생성 입력 타입
 */
interface CreateProjectInput {
  name: string;
  description?: string;
}

/**
 * 프로젝트 수정 입력 타입
 */
interface UpdateProjectInput {
  name?: string;
  description?: string;
}

/**
 * 페이지네이션 옵션
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * 프로젝트 서비스
 */
export class ProjectService {
  /**
   * 프로젝트 생성
   */
  async create(userId: string, input: CreateProjectInput): Promise<Project> {
    // #region agent log
    log('H3', 'project.service.ts:create:start', '프로젝트 생성 시작', {
      userId,
      name: input.name,
    });
    // #endregion agent log

    try {
      const project = await prisma.project.create({
        data: {
          userId,
          name: input.name,
          description: input.description || null,
        },
      });

      // #region agent log
      log('H3', 'project.service.ts:create:success', '프로젝트 생성 성공', {
        projectId: project.id,
      });
      // #endregion agent log

      return project;
    } catch (error) {
      // #region agent log
      log('H3', 'project.service.ts:create:error', '프로젝트 생성 실패', {
        errorMessage: error instanceof Error ? error.message : 'unknown',
        errorName: error instanceof Error ? error.name : 'unknown',
      });
      // #endregion agent log
      throw error;
    }
  }

  /**
   * 사용자의 프로젝트 목록 조회
   */
  async findByUser(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<{ projects: Project[]; total: number; totalPages: number }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: { userId } }),
    ]);

    return {
      projects,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 프로젝트 ID로 조회
   */
  async findById(id: string, userId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id, userId },
    });
  }

  /**
   * 프로젝트 상세 조회 (통계 포함)
   */
  async findByIdWithStats(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            generations: true,
            characters: true,
          },
        },
      },
    });

    if (!project) return null;

    // 저장된 이미지 수 계산
    const savedImagesCount = await prisma.generatedImage.count({
      where: {
        generation: {
          projectId: id,
        },
        isSelected: true,
      },
    });

    return {
      ...project,
      generationCount: project._count.generations,
      characterCount: project._count.characters,
      savedImageCount: savedImagesCount,
    };
  }

  /**
   * 프로젝트 수정
   */
  async update(id: string, userId: string, input: UpdateProjectInput): Promise<Project | null> {
    // 소유권 확인
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    return prisma.project.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
  }

  /**
   * 프로젝트 삭제
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // 소유권 확인
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    await prisma.project.delete({ where: { id } });
    return true;
  }
}

export const projectService = new ProjectService();
