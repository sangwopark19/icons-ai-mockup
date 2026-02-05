import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 사용자 타입
 */
interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * 인증 상태 타입
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * 인증 액션 타입
 */
interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * 인증 스토어
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // 액션
      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () => {
        // #region 에이전트 로그
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/f337c984-557e-42d9-83cb-8dbe96bc791f', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'auth.store.ts:64',
              message: 'logout 호출됨',
              data: {},
              timestamp: Date.now(),
              sessionId: 'debug-session',
              hypothesisId: 'H3,H5',
              runId: 'debug-1',
            }),
          }).catch(() => {});
        }
        // #endregion 에이전트 로그
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // hydration 완료 시 isLoading을 false로 설정
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false);
        }
      },
    }
  )
);
