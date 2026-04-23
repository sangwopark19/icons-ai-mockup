'use client';

import React, { useState, useRef } from 'react';

interface UserSearchBarProps {
  onSearch: (params: { email?: string; role?: string; status?: string }) => void;
}

export function UserSearchBar({ onSearch }: UserSearchBarProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSearch = (
    newEmail: string,
    newRole: string,
    newStatus: string
  ) => {
    const params: { email?: string; role?: string; status?: string } = {};
    if (newEmail) params.email = newEmail;
    if (newRole) params.role = newRole;
    if (newStatus) params.status = newStatus;
    onSearch(params);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      triggerSearch(value, role, status);
    }, 300);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRole(value);
    triggerSearch(email, value, status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value);
    triggerSearch(email, role, value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={email}
        onChange={handleEmailChange}
        placeholder="이메일 검색..."
        className="flex h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-hover)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors sm:w-64"
      />
      <select
        value={role}
        onChange={handleRoleChange}
        className="flex h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:border-[var(--border-hover)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
      >
        <option value="">전체 역할</option>
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select>
      <select
        value={status}
        onChange={handleStatusChange}
        className="flex h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] hover:border-[var(--border-hover)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
      >
        <option value="">전체 상태</option>
        <option value="active">active</option>
        <option value="suspended">suspended</option>
        <option value="deleted">deleted</option>
      </select>
    </div>
  );
}
