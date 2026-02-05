'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

/**
 * 인증 관련 전역 이벤트를 처리하는 Provider
 * - 토큰 만료 시 자동 로그아웃 및 알림
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    /**
     * 토큰 만료 이벤트 핸들러
     */
    const handleTokenExpired = () => {
      // #region 에이전트 로그
      fetch('http://127.0.0.1:7242/ingest/f337c984-557e-42d9-83cb-8dbe96bc791f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'auth-provider.tsx:19',
          message: '토큰 만료 이벤트 수신',
          data: { isAuthenticated },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H2,H5',
          runId: 'debug-1',
        }),
      }).catch(() => {});
      // #endregion 에이전트 로그

      // 이미 로그아웃 상태면 무시
      if (!isAuthenticated) {
        // #region 에이전트 로그
        fetch('http://127.0.0.1:7242/ingest/f337c984-557e-42d9-83cb-8dbe96bc791f', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'auth-provider.tsx:25',
            message: '이미 로그아웃 상태 - 무시',
            data: {},
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'H5',
            runId: 'debug-1',
          }),
        }).catch(() => {});
        // #endregion 에이전트 로그
        return;
      }

      // #region 에이전트 로그
      fetch('http://127.0.0.1:7242/ingest/f337c984-557e-42d9-83cb-8dbe96bc791f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'auth-provider.tsx:31',
          message: '로그아웃 처리 실행',
          data: {},
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'H2,H5',
          runId: 'debug-1',
        }),
      }).catch(() => {});
      // #endregion 에이전트 로그

      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      logout();
      router.push('/login');
    };

    // 이벤트 리스너 등록
    window.addEventListener('auth:token-expired', handleTokenExpired);

    // 클린업
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [logout, router, isAuthenticated]);

  return <>{children}</>;
}
