/**
 * API 클라이언트
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
}

/**
 * API 요청 함수
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const method = fetchOptions.method ?? 'GET';

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

  // #region 에이전트 로그
  fetch('http://127.0.0.1:7243/ingest/b191ce02-4f7f-42aa-8e8d-6f1eb4eff476', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'api.ts:request:start',
      message: '요청 시작',
      data: {
        endpoint,
        method,
        hasToken: Boolean(token),
        hasBody: Boolean(options.body),
        apiUrl: API_URL,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion 에이전트 로그

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  // #region 에이전트 로그
  fetch('http://127.0.0.1:7243/ingest/b191ce02-4f7f-42aa-8e8d-6f1eb4eff476', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H1',
      location: 'api.ts:request:response',
      message: '응답 수신',
      data: {
        endpoint,
        method,
        status: response.status,
        ok: response.ok,
        errorCode: data?.error?.code ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion 에이전트 로그

  if (!response.ok) {
    // 401 에러 시 토큰 만료 이벤트 발생
    if (response.status === 401) {
      // #region 에이전트 로그
      fetch('http://127.0.0.1:7243/ingest/b191ce02-4f7f-42aa-8e8d-6f1eb4eff476', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'api.ts:request:401',
          message: '401 처리 분기',
          data: { endpoint, method },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion 에이전트 로그
      // 브라우저 환경에서만 이벤트 발생
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
