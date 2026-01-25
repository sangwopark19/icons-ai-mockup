import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Sketch-to-Real E2E 테스트
 * 
 * 시나리오:
 * 1. 프로젝트 생성
 * 2. IP 변경 페이지로 이동
 * 3. 원본 이미지 업로드
 * 4. 캐릭터 이미지 업로드
 * 5. v3 옵션 설정 (viewpointLock, whiteBackground, userInstructions)
 * 6. 생성 버튼 클릭
 * 7. 결과 페이지로 리다이렉트 확인
 */

test.describe('Sketch-to-Real Flow', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // 대시보드로 이동
    await page.goto('/dashboard');
  });

  test('이미지 업로드 → 옵션 설정 → 생성', async ({ page }) => {
    // 1. 프로젝트 생성
    await page.click('text=새 프로젝트');
    await page.fill('input[name="name"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.click('button:has-text("생성")');
    
    // URL에서 프로젝트 ID 추출
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
    const url = page.url();
    projectId = url.split('/').pop()!;

    // 2. IP 변경 페이지로 이동
    await page.click('text=IP 변경');
    await page.waitForURL(`/projects/${projectId}/ip-change`);

    // 3. 원본 이미지 업로드 (테스트 이미지 경로)
    const sourceImagePath = path.join(__dirname, '../fixtures/source.png');
    await page.setInputFiles('input[type="file"][accept*="image"]', sourceImagePath);

    // 4. 캐릭터 이미지 업로드
    const characterImagePath = path.join(__dirname, '../fixtures/character.png');
    const characterInput = await page.locator('input[type="file"]').nth(1);
    await characterInput.setInputFiles(characterImagePath);

    // 5. v3 옵션 설정
    // viewpointLock 체크박스
    const viewpointLockCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /시점 고정|viewpoint/i });
    await viewpointLockCheckbox.check();

    // whiteBackground 체크박스
    const whiteBgCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /백색 배경|white background/i });
    await whiteBgCheckbox.check();

    // userInstructions textarea
    const instructionsTextarea = page.locator('textarea[placeholder*="지시사항"]');
    await instructionsTextarea.fill('캐릭터의 표정을 밝게 해주세요');

    // 6. 생성 버튼 클릭
    await page.click('button:has-text("생성")');

    // 7. 결과 페이지로 리다이렉트 확인
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 10000 });
    
    // 생성 중 상태 확인
    const statusText = await page.locator('text=/pending|processing|생성 중/i').first();
    await expect(statusText).toBeVisible();

    console.log('✅ Sketch-to-Real 플로우 완료');
  });

  test('옵션 없이 생성', async ({ page }) => {
    // 프로젝트 페이지로 직접 이동
    await page.goto(`/projects/${projectId}/ip-change`);

    // 이미지만 업로드하고 옵션은 설정하지 않음
    const sourceImagePath = path.join(__dirname, '../fixtures/source.png');
    await page.setInputFiles('input[type="file"][accept*="image"]', sourceImagePath);

    const characterImagePath = path.join(__dirname, '../fixtures/character.png');
    const characterInput = await page.locator('input[type="file"]').nth(1);
    await characterInput.setInputFiles(characterImagePath);

    // 생성 버튼 클릭
    await page.click('button:has-text("생성")');

    // 리다이렉트 확인
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 10000 });

    console.log('✅ 기본 생성 플로우 완료');
  });
});
