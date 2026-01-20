import { prisma } from '../lib/prisma.js';
import { addGenerationJob, GenerationJobData } from '../lib/queue.js';
import { Prisma, type Generation, type GeneratedImage } from '@prisma/client';
import type { ThoughtSignatureData } from '@mockup-ai/shared/types';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

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
   * thoughtSignature 저장
   */
  async updateThoughtSignatures(
    generationId: string,
    signatures: ThoughtSignatureData[]
  ): Promise<void> {
    const payload = signatures.map((signature) => ({
      ...signature,
      createdAt: signature.createdAt.toISOString(),
    }));

    await prisma.generation.update({
      where: { id: generationId },
      data: { thoughtSignatures: payload as Prisma.JsonArray },
    });
  }

  /**
   * 동일 조건으로 재생성
   */
  async regenerate(userId: string, generationId: string): Promise<Generation> {
    const original = await this.getById(userId, generationId);
    if (!original) {
      throw new Error('생성 기록을 찾을 수 없습니다');
    }

    const promptData = (original.promptData as Record<string, unknown>) || {};
    const options = (original.options as Record<string, unknown>) || {};

    return this.create(userId, {
      projectId: original.projectId,
      mode: original.mode,
      sourceImagePath: promptData.sourceImagePath as string | undefined,
      characterId: original.ipCharacterId || undefined,
      characterImagePath: promptData.characterImagePath as string | undefined,
      textureImagePath: promptData.textureImagePath as string | undefined,
      prompt: promptData.userPrompt as string | undefined,
      options: {
        preserveStructure: (options.preserveStructure as boolean | undefined) ?? false,
        transparentBackground: (options.transparentBackground as boolean | undefined) ?? false,
        outputCount: (options.outputCount as number | undefined) ?? 2,
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
   * 생성 기록 삭제 (연관된 모든 이미지 및 폴더 포함)
   */
  async deleteGeneration(userId: string, generationId: string): Promise<void> {
    // 생성 기록 및 권한 확인
    const generation = await prisma.generation.findFirst({
      where: { id: generationId },
      include: {
        project: true,
        images: true,
      },
    });

    if (!generation || generation.project.userId !== userId) {
      throw new Error('생성 기록을 찾을 수 없습니다');
    }

    // 이미지 디렉토리 경로 추출 (generations/{userId}/{generationId}/)
    let generationDir: string | null = null;

    // 이미지 파일 삭제
    for (const image of generation.images) {
      try {
        const fullPath = path.join(config.uploadDir, image.filePath);
        // 원본 이미지 삭제
        await fs.unlink(fullPath);
        // 썸네일 삭제
        if (image.thumbnailPath) {
          await fs.unlink(path.join(config.uploadDir, image.thumbnailPath));
        }
        
        // 디렉토리 경로 추출 (첫 번째 이미지에서만)
        if (!generationDir) {
          generationDir = path.dirname(fullPath);
        }
      } catch {
        // 파일 삭제 실패해도 계속 진행
      }

      // ImageHistory 삭제
      await prisma.imageHistory.deleteMany({ where: { imageId: image.id } });
    }

    // 디렉토리 삭제 (비어있는 경우에만)
    if (generationDir) {
      try {
        await fs.rmdir(generationDir);
      } catch {
        // 디렉토리가 비어있지 않거나 삭제 실패해도 계속 진행
      }
    }

    // GeneratedImage 삭제
    await prisma.generatedImage.deleteMany({ where: { generationId } });

    // Generation 삭제
    await prisma.generation.delete({ where: { id: generationId } });
  }

  /**
   * 프로젝트의 생성 히스토리 조회
   */
  async getProjectHistory(
    userId: string,
    projectId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ generations: any[]; total: number }> {
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
