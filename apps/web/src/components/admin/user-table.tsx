'use client';

import React from 'react';
import type { AdminUser, Pagination } from '@/lib/api';
import { UserActionMenu } from './user-action-menu';

interface UserTableProps {
  users: AdminUser[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onStatusChange: (id: string, status: 'active' | 'suspended') => void;
  onRoleChange: (id: string, role: 'admin' | 'user') => void;
  onDelete: (id: string) => void;
  currentAdminId: string;
  loading?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '-')
    .replace('.', '');
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    // Show 1-5, ..., last2
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total - 1);
    pages.push(total);
  } else if (current >= total - 3) {
    // Show first2, ..., last5
    pages.push(1);
    pages.push(2);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    // Show 1, ..., current-1, current, current+1, ..., last
    pages.push(1);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }

  return pages;
}

export function UserTable({
  users,
  pagination,
  onPageChange,
  onStatusChange,
  onRoleChange,
  onDelete,
  currentAdminId,
  loading = false,
}: UserTableProps) {
  const { page, totalPages } = pagination;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="space-y-4">
      <div className="relative overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                이메일
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                이름
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                역할
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                상태
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                가입일
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                마지막 로그인
              </th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)]">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="relative">
            {loading && (
              <tr>
                <td colSpan={7} className="p-0">
                  <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 animate-spin text-brand-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            )}
            {users.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-[var(--text-tertiary)]"
                >
                  사용자가 없습니다
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {user.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3">
                    <UserActionMenu
                      user={user}
                      onStatusChange={onStatusChange}
                      onRoleChange={onRoleChange}
                      onDelete={onDelete}
                      currentAdminId={currentAdminId}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 w-8 flex items-center justify-center rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &lsaquo;
          </button>
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="h-8 w-8 flex items-center justify-center text-sm text-[var(--text-tertiary)]"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`h-8 w-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-brand-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 w-8 flex items-center justify-center rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
