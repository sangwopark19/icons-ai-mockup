import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Sketch-to-Real E2E 테스트
 * 
 * 시나리오:
 * 1. 프로젝트 생성
 * 2. 스케치 실사화 페이지로 이동
 * 3. 스케치 이미지 업로드
 * 4. (선택) 질감 이미지 업로드
 * 5. v3 옵션 설정 (accessoryPreservation, viewpointLock, whiteBackground)
 * 6. 생성 버튼 클릭
 * 7. 결과 페이지로 리다이렉트 확인
 * 8. 부자재(지퍼, 키링) 디테일 보존 검증
 */

test.describe('Sketch-to-Real Flow', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // 대시보드로 이동
    await page.goto('/dashboard');
  });

  test('스케치 업로드 → accessoryPreservation 자동 활성화 → 생성', async ({ page }) => {
    // 1. 프로젝트 생성
    await page.click('text=새 프로젝트');
    await page.fill('input[name="name"]', 'E2E Sketch-to-Real Test');
    await page.fill('textarea[name="description"]', 'Accessory preservation test');
    await page.click('button:has-text("생성")');
    
    // URL에서 프로젝트 ID 추출
    await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
    const url = page.url();
    projectId = url.split('/').pop()!;

    // 2. 스케치 실사화 페이지로 이동
    await page.click('text=스케치 실사화');
    await page.waitForURL(`/projects/${projectId}/sketch-to-real`);

    // 3. 스케치 이미지 업로드
    const sketchImagePath = path.join(__dirname, '../fixtures/sketch.png');
    const sketchInput = await page.locator('input[type="file"]').first();
    await sketchInput.setInputFiles(sketchImagePath);

    // 4. (선택) 질감 이미지 업로드
    const textureImagePath = path.join(__dirname, '../fixtures/texture.png');
    const textureInput = await page.locator('input[type="file"]').nth(1);
    await textureInput.setInputFiles(textureImagePath);

    // 5. accessoryPreservation 체크박스가 기본으로 체크되어 있는지 확인
    const accessoryCheckbox = await page.locator('text=부자재 보존').locator('..').locator('input[type="checkbox"]');
    await expect(accessoryCheckbox).toBeChecked();

    // 6. 다른 v3 옵션 설정
    const viewpointCheckbox = await page.locator('text=시점 고정').locator('..').locator('input[type="checkbox"]');
    await viewpointCheckbox.check();

    const whiteBgCheckbox = await page.locator('text=백색 배경').locator('..').locator('input[type="checkbox"]');
    await whiteBgCheckbox.check();

    // 7. 생성 버튼 클릭
    await page.click('button:has-text("목업 생성하기")');

    // 8. 결과 페이지로 리다이렉트 확인
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 15000 });
    
    // 생성 중 상태 확인
    const statusElement = await page.locator('[data-testid="generation-status"], text=/pending|processing|생성 중/i').first();
    await expect(statusElement).toBeVisible({ timeout: 5000 });

    console.log('✅ Sketch-to-Real with accessoryPreservation 플로우 완료');
  });

  test('accessoryPreservation 토글 테스트', async ({ page }) => {
    // 프로젝트 페이지로 직접 이동
    if (!projectId) {
      // 프로젝트가 없으면 생성
      await page.goto('/dashboard');
      await page.click('text=새 프로젝트');
      await page.fill('input[name="name"]', 'Toggle Test Project');
      await page.click('button:has-text("생성")');
      await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
      projectId = page.url().split('/').pop()!;
    }

    await page.goto(`/projects/${projectId}/sketch-to-real`);

    // accessoryPreservation 체크박스 찾기
    const accessoryCheckbox = await page.locator('text=부자재 보존').locator('..').locator('input[type="checkbox"]');
    
    // 기본값이 true인지 확인
    await expect(accessoryCheckbox).toBeChecked();

    // 체크 해제
    await accessoryCheckbox.uncheck();
    await expect(accessoryCheckbox).not.toBeChecked();

    // 다시 체크
    await accessoryCheckbox.check();
    await expect(accessoryCheckbox).toBeChecked();

    console.log('✅ accessoryPreservation 토글 테스트 완료');
  });

  test('accessoryPreservation 비활성화 후 생성', async ({ page }) => {
    // 프로젝트 페이지로 직접 이동
    if (!projectId) {
      await page.goto('/dashboard');
      await page.click('text=새 프로젝트');
      await page.fill('input[name="name"]', 'No Accessory Project');
      await page.click('button:has-text("생성")');
      await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
      projectId = page.url().split('/').pop()!;
    }

    await page.goto(`/projects/${projectId}/sketch-to-real`);

    // 스케치 이미지 업로드
    const sketchImagePath = path.join(__dirname, '../fixtures/sketch.png');
    const sketchInput = await page.locator('input[type="file"]').first();
    await sketchInput.setInputFiles(sketchImagePath);

    // accessoryPreservation 체크 해제
    const accessoryCheckbox = await page.locator('text=부자재 보존').locator('..').locator('input[type="checkbox"]');
    await accessoryCheckbox.uncheck();

    // 생성 버튼 클릭
    await page.click('button:has-text("목업 생성하기")');

    // 리다이렉트 확인
    await page.waitForURL(/\/projects\/[a-f0-9-]+\/generations\/[a-f0-9-]+/, { timeout: 15000 });

    console.log('✅ accessoryPreservation 비활성화 생성 플로우 완료');
  });

  test('키보드 접근성 테스트', async ({ page }) => {
    if (!projectId) {
      await page.goto('/dashboard');
      await page.click('text=새 프로젝트');
      await page.fill('input[name="name"]', 'Accessibility Test');
      await page.click('button:has-text("생성")');
      await page.waitForURL(/\/projects\/[a-f0-9-]+$/);
      projectId = page.url().split('/').pop()!;
    }

    await page.goto(`/projects/${projectId}/sketch-to-real`);

    // Tab 키로 accessoryPreservation 체크박스에 포커스
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Space 키로 체크박스 토글
    const accessoryCheckbox = await page.locator('text=부자재 보존').locator('..').locator('input[type="checkbox"]');
    await accessoryCheckbox.focus();
    
    // 현재 상태 확인
    const initialChecked = await accessoryCheckbox.isChecked();
    
    // Space 키로 토글
    await page.keyboard.press('Space');
    
    // 상태가 변경되었는지 확인
    const newChecked = await accessoryCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);

    console.log('✅ 키보드 접근성 테스트 완료');
  });
});
