import { prisma } from '../lib/prisma.js';
import { addGenerationJob, GenerationJobData } from '../lib/queue.js';
import type { Generation, GeneratedImage } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

/**
 * 생성 요청 입력 타입 (v3)
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
    // v3 옵션
    viewpointLock?: boolean;
    whiteBackground?: boolean;
    accessoryPreservation?: boolean;
    styleCopy?: boolean;
    userInstructions?: string;
    outputCount?: number;
    // 레거시 옵션
    preserveStructure?: boolean;
    transparentBackground?: boolean;
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

    // 생성 기록 저장 (v3)
    const generation = await prisma.generation.create({
      data: {
        projectId: input.projectId,
        ipCharacterId: input.characterId || null,
        sourceImageId: null, // 나중에 업데이트
        mode: input.mode,
        status: 'pending',
        // v3: Prisma 컬럼에 직접 저장
        viewpointLock: input.options?.viewpointLock ?? false,
        whiteBackground: input.options?.whiteBackground ?? false,
        userInstructions: input.options?.userInstructions || null,
        promptData: {
          sourceImagePath: input.sourceImagePath,
          characterImagePath,
          textureImagePath: input.textureImagePath,
          userPrompt: input.prompt,
        },
        // v3: options JSON 필드
        options: {
          accessoryPreservation: input.options?.accessoryPreservation ?? false,
          styleCopy: input.options?.styleCopy ?? false,
          outputCount: input.options?.outputCount ?? 2,
          // 레거시 옵션 (하위 호환성)
          preserveStructure: input.options?.preserveStructure,
          transparentBackground: input.options?.transparentBackground,
        },
      },
    });

    // 작업 큐에 추가 (v3 옵션)
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
        // v3 옵션
        viewpointLock: input.options?.viewpointLock,
        whiteBackground: input.options?.whiteBackground,
        accessoryPreservation: input.options?.accessoryPreservation,
        styleCopy: input.options?.styleCopy,
        userInstructions: input.options?.userInstructions,
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

  /**
   * 기존 생성 요청 다시 생성 (동일한 설정으로 재생성)
   * @param userId - 사용자 ID
   * @param generationId - 복사할 Generation ID
   * @returns 새로 생성된 Generation 레코드
   */
  async regenerate(userId: string, generationId: string): Promise<Generation> {
    // 기존 Generation 조회 및 권한 확인
    const existingGeneration = await this.getById(userId, generationId);

    if (!existingGeneration) {
      throw new Error('생성 기록을 찾을 수 없습니다');
    }

    // promptData에서 이미지 경로 추출
    const promptData = existingGeneration.promptData as any;
    const sourceImagePath = promptData?.sourceImagePath;
    const characterImagePath = promptData?.characterImagePath;
    const textureImagePath = promptData?.textureImagePath;
    const userPrompt = promptData?.userPrompt;

    // options JSON 필드에서 옵션 추출
    const existingOptions = existingGeneration.options as any;

    // 새 Generation 레코드 생성 (동일한 설정)
    const newGeneration = await prisma.generation.create({
      data: {
        projectId: existingGeneration.projectId,
        ipCharacterId: existingGeneration.ipCharacterId,
        sourceImageId: existingGeneration.sourceImageId,
        mode: existingGeneration.mode,
        status: 'pending',
        // v3: Prisma 컬럼에 직접 저장
        viewpointLock: existingGeneration.viewpointLock,
        whiteBackground: existingGeneration.whiteBackground,
        userInstructions: existingGeneration.userInstructions,
        promptData: {
          sourceImagePath,
          characterImagePath,
          textureImagePath,
          userPrompt,
        },
        // v3: options JSON 필드
        options: {
          accessoryPreservation: existingOptions?.accessoryPreservation ?? false,
          styleCopy: existingOptions?.styleCopy ?? false,
          outputCount: existingOptions?.outputCount ?? 2,
          // 레거시 옵션
          preserveStructure: existingOptions?.preserveStructure,
          transparentBackground: existingOptions?.transparentBackground,
        },
      },
    });

    // 작업 큐에 추가
    await addGenerationJob({
      generationId: newGeneration.id,
      userId,
      projectId: existingGeneration.projectId,
      mode: existingGeneration.mode,
      sourceImagePath,
      characterImagePath,
      textureImagePath,
      prompt: userPrompt,
      options: {
        viewpointLock: existingGeneration.viewpointLock,
        whiteBackground: existingGeneration.whiteBackground,
        accessoryPreservation: existingOptions?.accessoryPreservation,
        styleCopy: existingOptions?.styleCopy,
        userInstructions: existingGeneration.userInstructions || undefined,
        outputCount: existingOptions?.outputCount ?? 2,
      },
    });

    return newGeneration;
  }

  /**
   * 스타일 복사: 기존 결과물의 스타일 유지하며 새 캐릭터 적용
   * @param userId - 사용자 ID
   * @param parentGenId - 스타일을 복사할 부모 Generation ID
   * @param newCharacterId - 새로 적용할 캐릭터 ID
   * @returns 새로 생성된 Generation 레코드
   */
  async styleCopy(
    userId: string,
    parentGenId: string,
    newCharacterId: string
  ): Promise<Generation> {
    // 부모 Generation 조회 및 권한 확인
    const parentGeneration = await this.getById(userId, parentGenId);

    if (!parentGeneration) {
      throw new Error('부모 생성 기록을 찾을 수 없습니다');
    }

    // 완료된 Generation인지 확인
    if (parentGeneration.status !== 'completed') {
      throw new Error('완료된 생성 기록만 스타일 복사가 가능합니다');
    }

    // 새 캐릭터 조회
    const newCharacter = await prisma.iPCharacter.findFirst({
      where: {
        id: newCharacterId,
        projectId: parentGeneration.projectId,
      },
    });

    if (!newCharacter) {
      throw new Error('새 캐릭터를 찾을 수 없습니다');
    }

    // promptData에서 이미지 경로 추출
    const promptData = parentGeneration.promptData as any;
    const sourceImagePath = promptData?.sourceImagePath;
    const textureImagePath = promptData?.textureImagePath;
    const userPrompt = promptData?.userPrompt;

    // options JSON 필드에서 옵션 추출
    const existingOptions = parentGeneration.options as any;

    // 새 Generation 레코드 생성 (styleCopy 활성화)
    const newGeneration = await prisma.generation.create({
      data: {
        projectId: parentGeneration.projectId,
        ipCharacterId: newCharacterId,
        sourceImageId: parentGeneration.sourceImageId,
        parentGenerationId: parentGenId, // 부모 Generation 설정
        mode: parentGeneration.mode,
        status: 'pending',
        // v3: Prisma 컬럼에 직접 저장
        viewpointLock: parentGeneration.viewpointLock,
        whiteBackground: parentGeneration.whiteBackground,
        userInstructions: parentGeneration.userInstructions,
        promptData: {
          sourceImagePath,
          characterImagePath: newCharacter.filePath, // 새 캐릭터 이미지
          textureImagePath,
          userPrompt,
        },
        // v3: options JSON 필드 (styleCopy 활성화)
        options: {
          accessoryPreservation: existingOptions?.accessoryPreservation ?? false,
          styleCopy: true, // 스타일 복사 활성화
          outputCount: existingOptions?.outputCount ?? 2,
          // 레거시 옵션
          preserveStructure: existingOptions?.preserveStructure,
          transparentBackground: existingOptions?.transparentBackground,
        },
      },
    });

    // 작업 큐에 추가 (parentGenerationId 포함)
    await addGenerationJob({
      generationId: newGeneration.id,
      userId,
      projectId: parentGeneration.projectId,
      mode: parentGeneration.mode,
      sourceImagePath,
      characterImagePath: newCharacter.filePath,
      textureImagePath,
      prompt: userPrompt,
      parentGenerationId: parentGenId, // worker에서 기존 이미지 로드용
      options: {
        viewpointLock: parentGeneration.viewpointLock,
        whiteBackground: parentGeneration.whiteBackground,
        accessoryPreservation: existingOptions?.accessoryPreservation,
        styleCopy: true, // 스타일 복사 활성화
        userInstructions: parentGeneration.userInstructions || undefined,
        outputCount: existingOptions?.outputCount ?? 2,
      },
    });

    return newGeneration;
  }
}

export const generationService = new GenerationService();
