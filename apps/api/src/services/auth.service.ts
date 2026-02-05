import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import type { User } from '@prisma/client';

/**
 * JWT 토큰 페이로드 타입
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * 인증 서비스
 */
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 12;

  /**
   * 회원가입
   */
  async register(email: string, password: string, name: string): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('이미 등록된 이메일입니다');
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, AuthService.BCRYPT_ROUNDS);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    return user;
  }

  /**
   * 로그인
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 토큰 생성
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // 세션 저장
    await this.saveSession(user.id, refreshToken);

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * 로그아웃
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * 토큰 갱신
   */
  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 세션 확인
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new Error('유효하지 않은 세션입니다');
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new Error('세션이 만료되었습니다');
    }

    // 새 토큰 생성
    const newAccessToken = this.generateAccessToken(session.user);
    const newRefreshToken = this.generateRefreshToken(session.user);

    // 기존 세션 삭제 후 새 세션 생성
    await prisma.session.delete({ where: { id: session.id } });
    await this.saveSession(session.user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * 사용자 ID로 조회
   */
  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * 토큰에서 사용자 조회
   */
  async getUserFromToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
      return this.getUserById(payload.userId);
    } catch {
      return null;
    }
  }

  /**
   * Access Token 생성
   */
  private generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtAccessExpiry,
    } as jwt.SignOptions);
  }

  /**
   * Refresh Token 생성
   */
  private generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtRefreshExpiry,
    } as jwt.SignOptions);
  }

  /**
   * 세션 저장
   */
  private async saveSession(userId: string, token: string): Promise<void> {
    // Refresh Token 만료 시간 계산 (기본 7일)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * 만료된 세션 정리
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}

export const authService = new AuthService();
