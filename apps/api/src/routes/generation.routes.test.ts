import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../server.js';
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

/**
 * Generation Routes 통합 테스트
 * 
 * 테스트 범위:
 * - POST /api/generations (생성 요청)
 * - GET /api/generations/:id (상태 조회)
 * - POST /api/generations/:id/regenerate (다시 생성 + 옵션 오버라이드)
 * - POST /api/generations/:id/style-copy (스타일 복사)
 * - POST /api/generations/:id/select (이미지 선택)
 * - DELETE /api/generations/:id (삭제)
 * - GET /api/generations/project/:projectId/history (히스토리 조회)
 */

describe('Generation Routes Integration Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let generationId: string;
  let characterId: string;

  beforeAll(async () => {
    // Fastify 앱 빌드
    app = await build();

    // 테스트 사용자 생성 및 로그인
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test-gen-routes@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test-gen-routes@example.com',
        password: 'TestPassword123!',
      },
    });

    const loginData = JSON.parse(loginResponse.body);
    authToken = loginData.data.token;
    userId = loginData.data.user.id;

    // 테스트 프로젝트 생성
    const projectResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'Test Project for Routes',
        description: 'Integration test project',
      },
    });

    const projectData = JSON.parse(projectResponse.body);
    projectId = projectData.data.id;

    // 테스트 캐릭터 생성 (style-copy 테스트용)
    const character = await prisma.iPCharacter.create({
      data: {
        projectId,
        name: 'Test Character',
        filePath: 'test/character.png',
        description: 'Test character for integration tests',
      },
    });
    characterId = character.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.generation.deleteMany({ where: { projectId } });
    await prisma.iPCharacter.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { email: 'test-gen-routes@example.com' } });

    await app.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 기존 Generation 삭제
    await prisma.generation.deleteMany({ where: { projectId } });
  });

  describe('POST /api/generations', () => {
    it('생성 요청 성공 (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generations',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          projectId,
          mode: 'ip_change',
          characterId,
          sourceImagePath: 'test/source.png',
          options: {
            viewpointLock: true,
            whiteBackground: false,
            outputCount: 2,
          },
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.status).toBe('pending');
      expect(data.data.mode).toBe('ip_change');

      // 테스트용으로 저장
      generationId = data.data.id;
    });

    it('유효성 검증 실패 - 잘못된 projectId (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/generations',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          projectId: 'invalid-uuid',
          mode: 'ip_change',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/generations/:id', () => {
    beforeEach(async () => {
      // 테스트용 Generation 생성
      const gen = await prisma.generation.create({
        data: {
          projectId,
          mode: 'ip_change',
          status: 'completed',
          viewpointLock: true,
          whiteBackground: false,
          promptData: { sourceImagePath: 'test/source.png' },
          options: { outputCount: 2 },
        },
      });
      generationId = gen.id;
    });

    it('상태 조회 성공 (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/generations/${generationId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(generationId);
      expect(data.data.status).toBe('completed');
    });

    it('존재하지 않는 ID (404)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/generations/00000000-0000-0000-0000-000000000000`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/generations/:id/regenerate', () => {
    beforeEach(async () => {
      // 테스트용 Generation 생성
      const gen = await prisma.generation.create({
        data: {
          projectId,
          mode: 'ip_change',
          ipCharacterId: characterId,
          status: 'completed',
          viewpointLock: false,
          whiteBackground: false,
          userInstructions: 'Original instructions',
          promptData: {
            sourceImagePath: 'test/source.png',
            characterImagePath: 'test/character.png',
          },
          options: {
            accessoryPreservation: false,
            styleCopy: false,
            outputCount: 2,
          },
        },
      });
      generationId = gen.id;
    });

    it('다시 생성 성공 - 옵션 없이 (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${generationId}/regenerate`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.id).not.toBe(generationId); // 새 Generation
    });

    it('다시 생성 성공 - 옵션 오버라이드 (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${generationId}/regenerate`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          viewpointLock: true,
          whiteBackground: true,
          userInstructions: 'New instructions',
          outputCount: 4,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);

      // 새 Generation 확인
      const newGen = await prisma.generation.findUnique({
        where: { id: data.data.id },
      });

      expect(newGen).toBeDefined();
      expect(newGen!.viewpointLock).toBe(true); // 오버라이드됨
      expect(newGen!.whiteBackground).toBe(true); // 오버라이드됨
      expect(newGen!.userInstructions).toBe('New instructions'); // 오버라이드됨

      const options = newGen!.options as any;
      expect(options.outputCount).toBe(4); // 오버라이드됨
    });

    it('존재하지 않는 ID (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/00000000-0000-0000-0000-000000000000/regenerate`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('유효성 검증 실패 - 잘못된 outputCount (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${generationId}/regenerate`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          outputCount: 10, // max는 4
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/generations/:id/style-copy', () => {
    let secondCharacterId: string;

    beforeEach(async () => {
      // 두 번째 캐릭터 생성
      const char2 = await prisma.iPCharacter.create({
        data: {
          projectId,
          name: 'Second Character',
          filePath: 'test/character2.png',
        },
      });
      secondCharacterId = char2.id;

      // 테스트용 완료된 Generation 생성
      const gen = await prisma.generation.create({
        data: {
          projectId,
          mode: 'ip_change',
          ipCharacterId: characterId,
          status: 'completed',
          viewpointLock: true,
          whiteBackground: false,
          promptData: {
            sourceImagePath: 'test/source.png',
            characterImagePath: 'test/character.png',
          },
          options: {
            accessoryPreservation: true,
            styleCopy: false,
            outputCount: 2,
          },
        },
      });
      generationId = gen.id;

      // 선택된 이미지 생성
      await prisma.generatedImage.create({
        data: {
          generationId: gen.id,
          filePath: 'test/output.png',
          type: 'output',
          isSelected: true,
          hasTransparency: false,
          width: 512,
          height: 512,
          fileSize: 1024,
        },
      });
    });

    afterEach(async () => {
      await prisma.iPCharacter.deleteMany({ where: { id: secondCharacterId } });
    });

    it('스타일 복사 성공 (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${generationId}/style-copy`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          characterId: secondCharacterId,
        },
      });

      expect(response.statusCode).toBe(201);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.parentGenerationId).toBe(generationId);

      // 새 Generation 확인
      const newGen = await prisma.generation.findUnique({
        where: { id: data.data.id },
      });

      expect(newGen).toBeDefined();
      expect(newGen!.parentGenerationId).toBe(generationId);
      expect(newGen!.ipCharacterId).toBe(secondCharacterId);

      const options = newGen!.options as any;
      expect(options.styleCopy).toBe(true); // styleCopy 활성화
    });

    it('완료되지 않은 Generation으로 스타일 복사 시도 (400)', async () => {
      // 진행 중인 Generation 생성
      const pendingGen = await prisma.generation.create({
        data: {
          projectId,
          mode: 'ip_change',
          status: 'pending',
          viewpointLock: false,
          whiteBackground: false,
          promptData: {},
          options: {},
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${pendingGen.id}/style-copy`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          characterId: secondCharacterId,
        },
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(false);
    });

    it('유효성 검증 실패 - 잘못된 characterId (400)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/generations/${generationId}/style-copy`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          characterId: 'invalid-uuid',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/generations/:id', () => {
    beforeEach(async () => {
      const gen = await prisma.generation.create({
        data: {
          projectId,
          mode: 'ip_change',
          status: 'completed',
          viewpointLock: false,
          whiteBackground: false,
          promptData: {},
          options: {},
        },
      });
      generationId = gen.id;
    });

    it('삭제 성공 (200)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/generations/${generationId}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);

      // DB에서 삭제 확인
      const deleted = await prisma.generation.findUnique({
        where: { id: generationId },
      });
      expect(deleted).toBeNull();
    });

    it('존재하지 않는 ID (404)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/generations/00000000-0000-0000-0000-000000000000`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/generations/project/:projectId/history', () => {
    beforeEach(async () => {
      // 여러 개의 완료된 Generation 생성
      for (let i = 0; i < 5; i++) {
        await prisma.generation.create({
          data: {
            projectId,
            mode: 'ip_change',
            status: 'completed',
            viewpointLock: false,
            whiteBackground: false,
            promptData: {},
            options: {},
          },
        });
      }
    });

    it('히스토리 조회 성공 (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/generations/project/${projectId}/history`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        query: {
          page: '1',
          limit: '3',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.pagination.total).toBe(5);
      expect(data.pagination.totalPages).toBe(2);
    });

    it('페이지네이션 - 2페이지 (200)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/generations/project/${projectId}/history`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        query: {
          page: '2',
          limit: '3',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2); // 5개 중 3개는 1페이지, 나머지 2개
    });
  });
});
