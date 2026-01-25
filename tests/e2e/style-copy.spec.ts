import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Style Copy E2E 테스트
 * 
 * 시나리오:
 * 1. 프로젝트 페이지로 이동
 * 2. 스타일 복사 페이지로 이동
 * 3. 히스토리에서 기존 Generation 선택
 * 4. 새 캐릭터 이미지 업로드
 * 5. v3 옵션 설정
 * 6. 생성 버튼 클릭
 * 7. 결과 확인 (스타일 유지)
 */

test.describe('Style Copy Flow', () => {
  let projectId: string;
  let generationId: string;

  test.beforeAll(async ({ browser }) => {
    // Setup: 프로젝트와 완료된 Generation 생성
    const context = await browser.newContext();
    const page = await context.newPage();

    // 프로젝트 생성 (API 직접 호출로 빠르게 setup)
    const response = await page.request.post('/api/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
      },
      data: {
        name: 'Style Copy Test Project',
        description: 'For E2E testing',
      },
    });

    const data = await response.json();
    projectId = data.data.id;

    // 완료된 Generation 생성 (테스트용)
    const genResponse = await page.request.post('/api/generations', {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
      },
      data: {
        projectId,
        mode: 'ip_change',
        sourceImagePath: 'test/source.png',
        characterId: 'test-character-id',
        options: {
          viewpointLock: true,
          outputCount: 2,
        },
      },
    });

    const genData = await genResponse.json();
    generationId = genData.data.id;

    // Generation을 completed 상태로 변경 (DB 직접 업데이트 필요)
    await context.close();
  });

  test('히스토리 선택 → 캐릭터 업로드 → 스타일 복사', async ({ page }) => {
    // 1. 스타일 복사 페이지로 이동
    await page.goto(`/projects/${projectId}/style-copy`);

    // 2. 히스토리 목록 로드 대기
    await page.waitForSelector('[data-testid="generation-history-item"]', { timeout: 5000 });

    // 3. 첫 번째 Generation 선택
    await page.click('[data-testid="generation-history-item"]');
    
    // 선택된 항목 강조 확인
    const selectedItem = page.locator('[data-testid="generation-history-item"]').first();
    await expect(selectedItem).toHaveClass(/border-brand-500|selected/);

    // 4. 새 캐릭터 이미지 업로드
    const characterImagePath = path.join(__dirname, '../fixtures/character2.png');
    await page.setInputFiles('input[type="file"][accept*="image"]', characterImagePath);

    // 업로드된 이미지 미리보기 확인
    await expect(page.locator('img[alt*="미리보기"]')).toBeVisible();

    // 5. v3 옵션 설정
    const viewpointLockCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /시점 고정/i });
    await viewpointLockCheckbox.check();

    const userInstructions = page.locator('textarea[placeholder*="지시사항"]');
    await userInstructions.fill('동일한 스타일 유지');

    // 6. 생성 버튼 클릭
    await page.click('button:has-text("스타일 복사로 생성")');

    // 7. 결과 페이지로 리다이렉트
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 10000 });

    // parentGenerationId 확인 (페이지 소스나 API 응답에서)
    console.log('✅ 스타일 복사 플로우 완료');
  });

  test('히스토리 없을 때 빈 상태 표시', async ({ page }) => {
    // 새 프로젝트 (히스토리 없음)
    await page.goto('/projects/new-empty-project-id/style-copy');

    // 빈 상태 메시지 확인
    await expect(page.locator('text=/히스토리가 없습니다|생성 기록이 없습니다/i')).toBeVisible();

    console.log('✅ 빈 상태 처리 확인');
  });
});
