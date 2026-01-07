import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/index.js';

/**
 * 이미지 메타데이터 타입
 */
interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * 업로드 결과 타입
 */
interface UploadResult {
  filePath: string;
  thumbnailPath: string | null;
  metadata: ImageMetadata;
}

/**
 * 업로드 서비스
 */
export class UploadService {
  private readonly baseDir: string;
  private readonly thumbnailSize = 200;

  constructor() {
    this.baseDir = config.uploadDir;
  }

  /**
   * 디렉토리 생성 (없으면)
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 고유 파일명 생성
   */
  private generateFileName(extension: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * 이미지 업로드 (원본 제품/스케치)
   */
  async uploadImage(
    userId: string,
    projectId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    // 디렉토리 생성
    const uploadDir = path.join(this.baseDir, 'uploads', userId, projectId);
    await this.ensureDir(uploadDir);

    // 이미지 처리
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    // 확장자 결정
    const format = metadata.format || 'png';
    const fileName = this.generateFileName(format);
    const filePath = path.join(uploadDir, fileName);

    // 원본 저장
    await image.toFile(filePath);

    // 썸네일 생성
    const thumbnailFileName = `thumb_${fileName}`;
    const thumbnailPath = path.join(uploadDir, thumbnailFileName);
    await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    const stats = await fs.stat(filePath);

    return {
      filePath: path.relative(this.baseDir, filePath),
      thumbnailPath: path.relative(this.baseDir, thumbnailPath),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format,
        size: stats.size,
      },
    };
  }

  /**
   * 캐릭터 이미지 업로드
   */
  async uploadCharacterImage(
    userId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<UploadResult> {
    const uploadDir = path.join(this.baseDir, 'characters', userId);
    await this.ensureDir(uploadDir);

    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    const format = metadata.format || 'png';
    const fileName = this.generateFileName(format);
    const filePath = path.join(uploadDir, fileName);

    // 원본 저장
    await image.toFile(filePath);

    // 썸네일 생성
    const thumbnailFileName = `thumb_${fileName}`;
    const thumbnailPath = path.join(uploadDir, thumbnailFileName);
    await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    const stats = await fs.stat(filePath);

    return {
      filePath: path.relative(this.baseDir, filePath),
      thumbnailPath: path.relative(this.baseDir, thumbnailPath),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format,
        size: stats.size,
      },
    };
  }

  /**
   * 생성된 이미지 저장
   */
  async saveGeneratedImage(
    userId: string,
    projectId: string,
    generationId: string,
    buffer: Buffer,
    index: number
  ): Promise<UploadResult> {
    const outputDir = path.join(
      this.baseDir,
      'generations',
      userId,
      projectId,
      generationId
    );
    await this.ensureDir(outputDir);

    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 메타데이터를 읽을 수 없습니다');
    }

    const fileName = `output_${index + 1}.png`;
    const filePath = path.join(outputDir, fileName);

    await image.png().toFile(filePath);

    // 썸네일 생성
    const thumbnailFileName = `thumb_output_${index + 1}.jpg`;
    const thumbnailPath = path.join(outputDir, thumbnailFileName);
    await image
      .resize(this.thumbnailSize, this.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    const stats = await fs.stat(filePath);

    return {
      filePath: path.relative(this.baseDir, filePath),
      thumbnailPath: path.relative(this.baseDir, thumbnailPath),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: 'png',
        size: stats.size,
      },
    };
  }

  /**
   * 파일 삭제
   */
  async deleteFile(relativePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // 파일이 없어도 에러 무시
    }
  }

  /**
   * 파일 읽기
   */
  async readFile(relativePath: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, relativePath);
    return fs.readFile(fullPath);
  }

  /**
   * 파일 존재 확인
   */
  async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

export const uploadService = new UploadService();
