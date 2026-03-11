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
 * 관리자 API 타입
 */
export interface DashboardStats {
  userCount: number;
  generationCount: number;
  failedJobCount: number;
  queueDepth: number;
  storageBytes: number;
  activeApiKeys: null;
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
};

export default { authApi, projectApi, imageApi, adminApi };
