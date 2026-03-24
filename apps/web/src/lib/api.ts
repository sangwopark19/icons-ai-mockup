/**
 * API 클라이언트
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
  _retried?: boolean;
}

/**
 * Refresh token으로 새 access token 발급
 * 동시 다발적 401에 대비해 한 번만 실행되도록 중복 방지
 */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

async function tryRefreshToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  // zustand persist 스토어에서 refreshToken 읽기
  const raw = typeof window !== 'undefined' ? localStorage.getItem('auth-storage') : null;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const refreshToken = parsed?.state?.refreshToken;
    if (!refreshToken) return null;

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data as { accessToken: string; refreshToken: string };
  } catch {
    return null;
  }
}

/**
 * 토큰 갱신 후 zustand persist 스토어 업데이트
 */
function updateStoredTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem('auth-storage');
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    parsed.state.accessToken = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  } catch {
    // ignore
  }

  // zustand 스토어에도 동기화 (런타임 상태 업데이트)
  window.dispatchEvent(new CustomEvent('auth:tokens-refreshed', {
    detail: { accessToken, refreshToken },
  }));
}

/**
 * API 요청 함수
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, _retried, ...fetchOptions } = options;

  const headers: HeadersInit = {
    ...options.headers,
  };

  // body가 있을 때만 Content-Type 설정 (DELETE 등 body 없는 요청에서 Fastify 에러 방지)
  if (options.body) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && token && !_retried) {
      // 이미 진행 중인 refresh가 있으면 재사용
      if (!refreshPromise) {
        refreshPromise = tryRefreshToken().then((result) => {
          refreshPromise = null;
          if (!result) throw new Error('refresh failed');
          return result;
        });
      }

      try {
        const newTokens = await refreshPromise;
        updateStoredTokens(newTokens.accessToken, newTokens.refreshToken);

        // 새 access token으로 원래 요청 재시도
        return request<T>(endpoint, {
          ...options,
          token: newTokens.accessToken,
          _retried: true,
        });
      } catch {
        // refresh 실패 시 로그아웃
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:token-expired'));
        }
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    // refresh 재시도 후에도 401이면 로그아웃
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      }
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    throw new Error(data.error?.message || '요청에 실패했습니다');
  }

  return data;
}

/**
 * 인증 관련 API
 */
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    return request<{
      success: true;
      data: { user: { id: string; email: string; name: string } };
      message: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login: async (email: string, password: string) => {
    return request<{
      success: true;
      data: {
        user: { id: string; email: string; name: string };
        accessToken: string;
        refreshToken: string;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (refreshToken: string) => {
    return request<{ success: true; message: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  me: async (token: string) => {
    return request<{
      success: true;
      data: { user: { id: string; email: string; name: string } };
    }>('/api/auth/me', { token });
  },

  refresh: async (refreshToken: string) => {
    return request<{
      success: true;
      data: { accessToken: string; refreshToken: string };
    }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};

/**
 * 프로젝트 타입
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  generationCount?: number;
  characterCount?: number;
  savedImageCount?: number;
}

/**
 * 프로젝트 관련 API
 */
export const projectApi = {
  list: async (token: string, page = 1, limit = 20) => {
    return request<{
      success: true;
      data: Project[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/projects?page=${page}&limit=${limit}`, { token });
  },

  create: async (token: string, name: string, description?: string) => {
    return request<{ success: true; data: Project }>('/api/projects', {
      method: 'POST',
      token,
      body: JSON.stringify({ name, description }),
    });
  },

  get: async (token: string, id: string) => {
    return request<{ success: true; data: Project }>(`/api/projects/${id}`, { token });
  },

  update: async (token: string, id: string, name?: string, description?: string) => {
    return request<{ success: true; data: Project }>(`/api/projects/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ name, description }),
    });
  },

  delete: async (token: string, id: string) => {
    return request<{ success: true; message: string }>(`/api/projects/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

/**
 * 이미지 관련 API
 */
export const imageApi = {
  delete: async (token: string, id: string) => {
    return request<{ success: true; message: string }>(`/api/images/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};

export default { authApi, projectApi, imageApi };
