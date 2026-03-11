'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi, type AdminUser, type Pagination } from '@/lib/api';
import { UserSearchBar } from '@/components/admin/user-search-bar';
import { UserTable } from '@/components/admin/user-table';

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export default function UsersPage() {
  const { accessToken, user } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    email?: string;
    role?: string;
    status?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await adminApi.listUsers(accessToken, {
        page: currentPage,
        ...searchParams,
      });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, searchParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (params: { email?: string; role?: string; status?: string }) => {
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
    if (!accessToken) return;
    try {
      await adminApi.updateUserStatus(accessToken, id, status);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const handleRoleChange = async (id: string, role: 'admin' | 'user') => {
    if (!accessToken) return;
    try {
      await adminApi.updateUserRole(accessToken, id, role);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminApi.softDeleteUser(accessToken, id);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">사용자 관리</h1>
      <UserSearchBar onSearch={handleSearch} />
      {pagination.totalPages > 0 || loading ? (
        <UserTable
          users={users}
          pagination={pagination}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
          currentAdminId={user?.id ?? ''}
          loading={loading}
        />
      ) : (
        !loading && (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            사용자가 없습니다
          </div>
        )
      )}
    </div>
  );
}
