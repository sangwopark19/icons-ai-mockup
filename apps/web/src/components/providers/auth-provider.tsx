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
      // 이미 로그아웃 상태면 무시
      if (!isAuthenticated) return;

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
