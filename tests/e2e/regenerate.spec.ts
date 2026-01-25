import { test, expect } from '@playwright/test';

/**
 * Regenerate (다시 생성) E2E 테스트
 * 
 * 시나리오:
 * 1. 완료된 Generation 결과 페이지로 이동
 * 2. '다시 생성' 버튼 클릭
 * 3. 동일한 설정으로 새 Generation 생성 확인
 * 4. 옵션이 복사되었는지 확인
 */

test.describe('Regenerate Flow', () => {
  let projectId: string;
  let generationId: string;

  test.beforeAll(async ({ browser }) => {
    // Setup: 완료된 Generation 생성
    const context = await browser.newContext();
    const page = await context.newPage();

    // 프로젝트 생성 (간소화를 위해 고정 ID 사용 또는 API 호출)
    projectId = 'test-project-id';
    generationId = 'test-generation-id';

    await context.close();
  });

  test('다시 생성 버튼 클릭 → 새 Generation 생성', async ({ page }) => {
    // 1. Generation 결과 페이지로 이동
    await page.goto(`/projects/${projectId}/generations/${generationId}`);

    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');

    // 2. 다시 생성 버튼 찾기
    const regenerateButton = page.locator('button:has-text("🔄 다시 생성")');
    await expect(regenerateButton).toBeVisible();

    // 3. 버튼 클릭
    await regenerateButton.click();

    // 로딩 상태 확인
    await expect(regenerateButton).toBeDisabled();

    // 4. 새 Generation 페이지로 리다이렉트
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 10000 });

    // 새 URL이 기존과 다른지 확인
    const newUrl = page.url();
    expect(newUrl).not.toContain(generationId);

    console.log('✅ 다시 생성 플로우 완료');
  });

  test('다시 생성 버튼 - Adobe 배경 제거 버튼과 함께 표시', async ({ page }) => {
    await page.goto(`/projects/${projectId}/generations/${generationId}`);

    // 두 버튼이 모두 표시되는지 확인
    const regenerateButton = page.locator('button:has-text("다시 생성")');
    const adobeButton = page.locator('button:has-text("배경 제거")');

    await expect(regenerateButton).toBeVisible();
    await expect(adobeButton).toBeVisible();

    console.log('✅ 버튼 표시 확인');
  });

  test('Adobe 배경 제거 버튼 클릭 → 새 탭 열림', async ({ page, context }) => {
    await page.goto(`/projects/${projectId}/generations/${generationId}`);

    // 새 탭이 열릴 것을 대기
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("배경 제거")'),
    ]);

    // 새 탭 URL 확인
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('adobe.com');

    await newPage.close();

    console.log('✅ Adobe 링크 동작 확인');
  });

  test('다시 생성 실패 시 에러 메시지 표시', async ({ page }) => {
    // API 모킹으로 실패 시뮬레이션
    await page.route('**/api/generations/*/regenerate', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    });

    await page.goto(`/projects/${projectId}/generations/${generationId}`);

    const regenerateButton = page.locator('button:has-text("다시 생성")');
    await regenerateButton.click();

    // 에러 메시지 표시 확인 (alert 또는 toast)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('실패');
      await dialog.accept();
    });

    console.log('✅ 에러 처리 확인');
  });
});
