/**
 * API 클라이언트
 */

import { useAuthStore } from '@/stores/auth.store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
  skipAuthRefresh?: boolean;
}

interface RefreshResult {
  accessToken: string | null;
  status: 'refreshed' | 'missing-token' | 'unauthorized' | 'failed';
}

let refreshPromise: Promise<RefreshResult> | null = null;

function buildApiUrl(endpoint: string): string {
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  return `${API_URL}${endpoint}`;
}

function emitRefreshFailed() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:refresh-failed'));
  }
}

function shouldEndSession(status: RefreshResult['status']): boolean {
  return status === 'missing-token' || status === 'unauthorized';
}

export function getAccessTokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = JSON.parse(globalThis.atob(padded)) as { exp?: unknown };

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function refreshStoredSession(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken, setTokens } = useAuthStore.getState();

    if (!refreshToken) {
      return { accessToken: null, status: 'missing-token' };
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 401) {
        return { accessToken: null, status: 'unauthorized' };
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        return { accessToken: null, status: 'failed' };
      }

      setTokens(data.data.accessToken, data.data.refreshToken);
      return { accessToken: data.data.accessToken, status: 'refreshed' };
    } catch {
      return { accessToken: null, status: 'failed' };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function refreshAuthSession(): Promise<string | null> {
  const result = await refreshStoredSession();
  if (shouldEndSession(result.status)) {
    emitRefreshFailed();
  }
  return result.accessToken;
}

export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = useAuthStore.getState();

  if (!accessToken) {
    return refreshToken ? refreshAuthSession() : null;
  }

  const expiresAt = getAccessTokenExpiresAt(accessToken);
  if (!refreshToken || !expiresAt || expiresAt - Date.now() > 60_000) {
    return accessToken;
  }

  return refreshAuthSession();
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const { token, skipAuthRefresh = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  const authToken = token ?? useAuthStore.getState().accessToken;

  if (authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  let response = await fetch(buildApiUrl(endpoint), {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !skipAuthRefresh) {
    const refreshResult = await refreshStoredSession();

    if (refreshResult.accessToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${refreshResult.accessToken}`);

      response = await fetch(buildApiUrl(endpoint), {
        ...fetchOptions,
        headers: retryHeaders,
      });
    }

    if (response.status === 401 || shouldEndSession(refreshResult.status)) {
      emitRefreshFailed();
    }
  }

  return response;
}

/**
 * API 요청 함수
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, skipAuthRefresh, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  // body가 있을 때만 Content-Type 설정 (DELETE 등 body 없는 요청에서 Fastify 에러 방지)
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await apiFetch(endpoint, {
    ...fetchOptions,
    token,
    skipAuthRefresh,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
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
        user: { id: string; email: string; name: string; role?: string };
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
      data: { user: { id: string; email: string; name: string; role?: string } };
    }>('/api/auth/me', { token });
  },

  refresh: async (refreshToken: string) => {
    return request<{
      success: true;
      data: { accessToken: string; refreshToken: string };
    }>('/api/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true,
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

/**
 * API 키 타입
 */
export interface AdminApiKey {
  id: string;
  alias: string;
  maskedKey: string;
  isActive: boolean;
  callCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

/**
 * 관리자 API 타입
 */
export interface DashboardStats {
  userCount: number;
  generationCount: number;
  failedJobCount: number;
  queueDepth: number;
  storageBytes: number;
  activeApiKeys: { alias: string; callCount: number } | null;
  userCountYesterday: number;
  generationCountYesterday: number;
  failedJobCountYesterday: number;
}

export interface HourlyChartPoint {
  hour: string;
  count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminGeneration {
  id: string;
  mode: string;
  status: string;
  errorMessage: string | null;
  retryCount: number;
  promptData: unknown;
  options: unknown;
  createdAt: string;
  userEmail: string;
}

export interface AdminImage {
  id: string;
  generationId: string;
  filePath: string;
  thumbnailPath: string | null;
  type: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: string;
  userEmail: string;
  projectName: string;
}

export interface StatusCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

/**
 * 관리자 관련 API
 */
export const adminApi = {
  getDashboardStats: (token: string) =>
    request<{ success: true; data: DashboardStats }>('/api/admin/dashboard/stats', { token }),

  getFailureChart: (token: string) =>
    request<{ success: true; data: HourlyChartPoint[] }>('/api/admin/dashboard/chart', { token }),

  listUsers: (
    token: string,
    params?: { page?: number; email?: string; role?: string; status?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return request<{ success: true; data: AdminUser[]; pagination: Pagination }>(
      `/api/admin/users${qs ? '?' + qs : ''}`,
      { token }
    );
  },

  updateUserStatus: (token: string, id: string, status: 'active' | 'suspended') =>
    request<{ success: true; data: AdminUser }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    }),

  updateUserRole: (token: string, id: string, role: 'admin' | 'user') =>
    request<{ success: true; data: AdminUser }>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ role }),
    }),

  softDeleteUser: (token: string, id: string) =>
    request<{ success: true; message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
      token,
    }),

  listGenerations: (
    token: string,
    params?: { page?: number; limit?: number; status?: string; email?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return request<{
      success: true;
      data: AdminGeneration[];
      pagination: Pagination;
      statusCounts: Record<string, number>;
    }>(`/api/admin/generations${qs ? '?' + qs : ''}`, { token });
  },

  retryGeneration: (token: string, id: string) =>
    request<{ success: true; data: AdminGeneration }>(`/api/admin/generations/${id}/retry`, {
      method: 'POST',
      token,
    }),

  listImages: (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      email?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return request<{ success: true; data: AdminImage[]; pagination: Pagination }>(
      `/api/admin/content/images${qs ? '?' + qs : ''}`,
      { token }
    );
  },

  countImages: (
    token: string,
    params?: {
      email?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) searchParams.set(k, String(v));
      });
    }
    const qs = searchParams.toString();
    return request<{ success: true; data: { count: number } }>(
      `/api/admin/content/images/count${qs ? '?' + qs : ''}`,
      { token }
    );
  },

  deleteImage: (token: string, id: string) =>
    request<{ success: true; message: string }>(`/api/admin/content/images/${id}`, {
      method: 'DELETE',
      token,
    }),

  bulkDeleteImages: (
    token: string,
    params: {
      email?: string;
      projectId?: string;
      startDate?: string;
      endDate?: string;
    }
  ) =>
    request<{ success: true; data: { deletedCount: number } }>('/api/admin/content/images', {
      method: 'DELETE',
      token,
      body: JSON.stringify(params),
    }),

  listContentProjects: (token: string) =>
    request<{ success: true; data: Array<{ id: string; name: string }> }>(
      '/api/admin/content/projects',
      { token }
    ),

  listApiKeys: (token: string) =>
    request<{ success: true; data: AdminApiKey[] }>('/api/admin/api-keys', { token }),

  createApiKey: (token: string, data: { alias: string; apiKey: string }) =>
    request<{ success: true; data: AdminApiKey }>('/api/admin/api-keys', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  deleteApiKey: (token: string, id: string) =>
    request<{ success: true; message: string }>(`/api/admin/api-keys/${id}`, {
      method: 'DELETE',
      token,
    }),

  activateApiKey: (token: string, id: string) =>
    request<{ success: true; data: AdminApiKey }>(`/api/admin/api-keys/${id}/activate`, {
      method: 'PATCH',
      token,
    }),
};

export default { authApi, projectApi, imageApi, adminApi };
