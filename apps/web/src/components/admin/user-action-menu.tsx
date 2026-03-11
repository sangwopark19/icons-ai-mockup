'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import type { AdminUser } from '@/lib/api';
import { ConfirmDialog } from './confirm-dialog';

interface UserActionMenuProps {
  user: AdminUser;
  onStatusChange: (id: string, status: 'active' | 'suspended') => void;
  onRoleChange: (id: string, role: 'admin' | 'user') => void;
  onDelete: (id: string) => void;
  currentAdminId: string;
}

export function UserActionMenu({
  user,
  onStatusChange,
  onRoleChange,
  onDelete,
  currentAdminId,
}: UserActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent actions on self or already-deleted users
  const isSelf = user.id === currentAdminId;
  const isDeleted = user.status === 'deleted';

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (isSelf || isDeleted) {
    return null;
  }

  const handleSuspendConfirm = async () => {
    setActionLoading(true);
    try {
      await onStatusChange(user.id, 'suspended');
    } finally {
      setActionLoading(false);
      setSuspendDialogOpen(false);
      setOpen(false);
    }
  };

  const handleUnsuspend = () => {
    onStatusChange(user.id, 'active');
    setOpen(false);
  };

  const handleRoleToggle = () => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    onRoleChange(user.id, newRole);
    setOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await onDelete(user.id);
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setOpen(false);
    }
  };

  const oppositeRole = user.role === 'admin' ? 'user' : 'admin';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="액션 메뉴"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg py-1">
          {user.status === 'active' && (
            <button
              onClick={() => {
                setSuspendDialogOpen(true);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              계정 정지
            </button>
          )}
          {user.status === 'suspended' && (
            <button
              onClick={handleUnsuspend}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              정지 해제
            </button>
          )}
          <button
            onClick={handleRoleToggle}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {oppositeRole}로 변경
          </button>
          <button
            onClick={() => {
              setDeleteDialogOpen(true);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            계정 삭제
          </button>
        </div>
      )}

      <ConfirmDialog
        open={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        onConfirm={handleSuspendConfirm}
        title="계정 정지"
        message={`정말 ${user.email}을(를) 정지하시겠습니까?`}
        confirmLabel="정지"
        loading={actionLoading}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="계정 삭제"
        message={`정말 ${user.email}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
