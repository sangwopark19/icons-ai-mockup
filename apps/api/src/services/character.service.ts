import { prisma } from '../lib/prisma.js';
import { uploadService } from './upload.service.js';
import type { IPCharacter } from '@prisma/client';

/**
 * IP 캐릭터 서비스
 */
export class CharacterService {
  /**
   * 캐릭터 생성
   */
  async create(
    userId: string,
    projectId: string,
    name: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<IPCharacter> {
    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다');
    }

    // 이미지 업로드
    const uploadResult = await uploadService.uploadCharacterImage(
      userId,
      imageBuffer,
      mimeType
    );

    // 캐릭터 저장
    return prisma.iPCharacter.create({
      data: {
        projectId,
        name,
        filePath: uploadResult.filePath,
        thumbnailPath: uploadResult.thumbnailPath,
      },
    });
  }

  /**
   * 프로젝트의 캐릭터 목록 조회
   */
  async findByProject(userId: string, projectId: string): Promise<IPCharacter[]> {
    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다');
    }

    return prisma.iPCharacter.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 캐릭터 조회
   */
  async findById(userId: string, id: string): Promise<IPCharacter | null> {
    const character = await prisma.iPCharacter.findFirst({
      where: { id },
      include: { project: true },
    });

    if (!character || character.project.userId !== userId) {
      return null;
    }

    return character;
  }

  /**
   * 캐릭터 삭제
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const character = await this.findById(userId, id);
    if (!character) return false;

    // 파일 삭제
    if (character.filePath) {
      await uploadService.deleteFile(character.filePath);
    }
    if (character.thumbnailPath) {
      await uploadService.deleteFile(character.thumbnailPath);
    }

    // DB 삭제
    await prisma.iPCharacter.delete({ where: { id } });
    return true;
  }
}

export const characterService = new CharacterService();
