import { test as setup } from '@playwright/test';

/**
 * 인증 설정 테스트
 * 로그인 상태를 저장하여 다른 테스트에서 재사용
 */

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('/login');

  // 테스트 사용자로 로그인
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  // 로그인 성공 대기 (대시보드로 리다이렉트)
  await page.waitForURL('/dashboard');

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
