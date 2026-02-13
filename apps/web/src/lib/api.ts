/**
 * API 클라이언트
 */

import type { AdminStats, AdminUser } from '@mockup-ai/shared';

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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // 401 에러 시 토큰 만료 이벤트 발생
    if (response.status === 401) {
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
      data: { user: { id: string; email: string; name: string; role: 'user' | 'admin' } };
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
        user: { id: string; email: string; name: string; role: 'user' | 'admin' };
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
      data: { user: { id: string; email: string; name: string; role: 'user' | 'admin' } };
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

/**
 * 관리자 관련 API
 */
export const adminApi = {
  getStats: async (token: string) => {
    return request<{ success: true; data: AdminStats }>('/api/admin/stats', { token });
  },

  getUsers: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      isActive?: boolean;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.isActive !== undefined) query.append('isActive', params.isActive.toString());

    return request<{
      success: true;
      data: AdminUser[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/admin/users?${query}`, { token });
  },

  updateUserRole: async (token: string, userId: string, role: 'user' | 'admin') => {
    return request(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      token,
    });
  },

  toggleUserActive: async (token: string, userId: string, isActive: boolean) => {
    return request(`/api/admin/users/${userId}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      token,
    });
  },

  deleteUser: async (token: string, userId: string) => {
    return request(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      token,
    });
  },

  getGenerations: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.userId) query.append('userId', params.userId);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);

    return request(`/api/admin/generations?${query}`, { token });
  },

  getProjects: async (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
    }
  ) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.userId) query.append('userId', params.userId);

    return request<{
      success: true;
      projects: Array<{
        id: string;
        name: string;
        description: string | null;
        createdAt: string;
        updatedAt: string;
        user: { id: string; email: string; name: string };
        _count: { generations: number; characters: number };
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/projects?${query}`, { token });
  },

  deleteProject: async (token: string, projectId: string) => {
    return request(`/api/admin/projects/${projectId}`, {
      method: 'DELETE',
      token,
    });
  },
};

export default { authApi, projectApi, imageApi, adminApi };
