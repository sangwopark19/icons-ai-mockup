'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { getAccessTokenExpiresAt, refreshAuthSession } from '@/lib/api';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const FALLBACK_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const RETRY_REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * 인증 관련 전역 이벤트를 처리하는 Provider
 * - access token 만료 전 자동 갱신 및 refresh 실패 시 로그아웃
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, refreshToken, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleRefreshFailed = () => {
      // 이미 로그아웃 상태면 무시
      if (!useAuthStore.getState().isAuthenticated) return;

      alert('세션 갱신에 실패했습니다. 다시 로그인해주세요.');
      logout();
      router.push('/login');
    };

    window.addEventListener('auth:refresh-failed', handleRefreshFailed);

    return () => {
      window.removeEventListener('auth:refresh-failed', handleRefreshFailed);
    };
  }, [logout, router]);

  useEffect(() => {
    if (!isAuthenticated || !refreshToken) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleRefresh = (delay: number) => {
      refreshTimer = setTimeout(async () => {
        const nextAccessToken = await refreshAuthSession();

        if (!cancelled && !nextAccessToken) {
          scheduleRefresh(RETRY_REFRESH_INTERVAL_MS);
        }
      }, delay);
    };

    const expiresAt = accessToken ? getAccessTokenExpiresAt(accessToken) : null;
    const delay = expiresAt
      ? Math.max(expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS, 0)
      : FALLBACK_REFRESH_INTERVAL_MS;

    scheduleRefresh(delay);

    return () => {
      cancelled = true;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [accessToken, refreshToken, isAuthenticated]);

  useEffect(() => {
    const refreshIfNeeded = () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.refreshToken) return;

      const expiresAt = state.accessToken ? getAccessTokenExpiresAt(state.accessToken) : null;
      if (!state.accessToken || !expiresAt || expiresAt - Date.now() <= REFRESH_BEFORE_EXPIRY_MS) {
        void refreshAuthSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfNeeded();
      }
    };

    window.addEventListener('focus', refreshIfNeeded);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshIfNeeded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
