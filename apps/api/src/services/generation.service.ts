import { prisma } from '../lib/prisma.js';
import { addGenerationJob, GenerationJobData } from '../lib/queue.js';
import type { Generation, GeneratedImage } from '@prisma/client';

/**
 * 생성 요청 입력 타입
 */
interface CreateGenerationInput {
  projectId: string;
  mode: 'ip_change' | 'sketch_to_real';
  sourceImagePath?: string;
  characterId?: string;
  characterImagePath?: string; // 직접 업로드된 캐릭터 이미지 경로
  textureImagePath?: string;
  prompt?: string;
  options?: {
    preserveStructure?: boolean;
    transparentBackground?: boolean;
    outputCount?: number;
  };
}

/**
 * 생성 서비스
 */
export class GenerationService {
  /**
   * 생성 요청 생성 및 큐에 추가
   */
  async create(userId: string, input: CreateGenerationInput): Promise<Generation> {
    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, userId },
    });

    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다');
    }

    // 캐릭터 이미지 경로 결정 (IP 변경 모드일 경우)
    let characterImagePath: string | undefined = input.characterImagePath;
    
    // characterId가 제공된 경우 DB에서 가져옴
    if (input.mode === 'ip_change' && input.characterId && !characterImagePath) {
      const character = await prisma.iPCharacter.findFirst({
        where: { id: input.characterId, projectId: input.projectId },
      });

      if (!character) {
        throw new Error('캐릭터를 찾을 수 없습니다');
      }

      characterImagePath = character.filePath;
    }

    // 생성 기록 저장
    const generation = await prisma.generation.create({
      data: {
        projectId: input.projectId,
        ipCharacterId: input.characterId || null,
        sourceImageId: null, // 나중에 업데이트
        mode: input.mode,
        status: 'pending',
        promptData: {
          sourceImagePath: input.sourceImagePath,
          characterImagePath,
          textureImagePath: input.textureImagePath,
          userPrompt: input.prompt,
        },
        options: {
          preserveStructure: input.options?.preserveStructure ?? false,
          transparentBackground: input.options?.transparentBackground ?? false,
          outputCount: input.options?.outputCount ?? 2,
        },
      },
    });

    // 작업 큐에 추가
    await addGenerationJob({
      generationId: generation.id,
      userId,
      projectId: input.projectId,
      mode: input.mode,
      sourceImagePath: input.sourceImagePath,
      characterImagePath,
      textureImagePath: input.textureImagePath,
      prompt: input.prompt,
      options: {
        preserveStructure: input.options?.preserveStructure ?? false,
        transparentBackground: input.options?.transparentBackground ?? false,
        outputCount: input.options?.outputCount ?? 2,
      },
    });

    return generation;
  }

  /**
   * 생성 상태 조회
   */
  async getById(
    userId: string,
    generationId: string
  ): Promise<(Generation & { images: GeneratedImage[] }) | null> {
    const generation = await prisma.generation.findFirst({
      where: { id: generationId },
      include: {
        project: true,
        images: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!generation || generation.project.userId !== userId) {
      return null;
    }

    return generation;
  }

  /**
   * 이미지 선택
   */
  async selectImage(userId: string, generationId: string, imageId: string): Promise<GeneratedImage | null> {
    const generation = await this.getById(userId, generationId);
    if (!generation) {
      throw new Error('생성 기록을 찾을 수 없습니다');
    }

    // 모든 이미지 선택 해제
    await prisma.generatedImage.updateMany({
      where: { generationId },
      data: { isSelected: false },
    });

    // 선택된 이미지 표시
    const image = await prisma.generatedImage.update({
      where: { id: imageId },
      data: { isSelected: true },
    });

    return image;
  }

  /**
   * 생성 상태 업데이트
   */
  async updateStatus(
    generationId: string,
    status: 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status,
        errorMessage: errorMessage || null,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
      },
    });
  }

  /**
   * 생성된 이미지 저장
   */
  async saveGeneratedImage(
    generationId: string,
    filePath: string,
    thumbnailPath: string | null,
    metadata: { width: number; height: number; size: number }
  ): Promise<GeneratedImage> {
    return prisma.generatedImage.create({
      data: {
        generationId,
        filePath,
        thumbnailPath,
        type: 'output',
        isSelected: false,
        hasTransparency: false,
        width: metadata.width,
        height: metadata.height,
        fileSize: metadata.size,
      },
    });
  }

  /**
   * 프로젝트의 생성 히스토리 조회
   */
  async getProjectHistory(
    userId: string,
    projectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ generations: Generation[]; total: number }> {
    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다');
    }

    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: { projectId, status: 'completed' },
        include: {
          images: {
            where: { isSelected: true },
            take: 1,
          },
          ipCharacter: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.generation.count({
        where: { projectId, status: 'completed' },
      }),
    ]);

    return { generations, total };
  }
}

export const generationService = new GenerationService();
