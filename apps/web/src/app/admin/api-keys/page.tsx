'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi, type AdminApiKey, type AdminProvider } from '@/lib/api';
import { ApiKeyTable } from './ApiKeyTable';
import { AddKeyModal } from './AddKeyModal';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

const PROVIDER_OPTIONS: Array<{ value: AdminProvider; label: string }> = [
  { value: 'gemini', label: 'Gemini' },
  { value: 'openai', label: 'OpenAI' },
];

function getProviderLabel(provider: AdminProvider): string {
  return PROVIDER_OPTIONS.find((option) => option.value === provider)?.label ?? provider;
}

interface ConfirmAction {
  type: 'delete' | 'activate';
  id: string;
  alias: string;
}

export default function ApiKeysPage() {
  const { accessToken } = useAuthStore();
  const [selectedProvider, setSelectedProvider] = useState<AdminProvider>('gemini');
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchKeys = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await adminApi.listApiKeys(accessToken, selectedProvider);
      setKeys(res.data);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      showToast(`${getProviderLabel(selectedProvider)} API 키 목록을 불러오지 못했습니다`, 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedProvider]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleAddKey = async (alias: string, apiKey: string) => {
    if (!accessToken) return;
    try {
      await adminApi.createApiKey(accessToken, { provider: selectedProvider, alias, apiKey });
      setShowAddModal(false);
      await fetchKeys();
      showToast(`${getProviderLabel(selectedProvider)} API 키 '${alias}'가 추가되었습니다`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `${getProviderLabel(selectedProvider)} API 키 추가에 실패했습니다`;
      showToast(message, 'error');
      throw err;
    }
  };

  const handleDeleteClick = (id: string) => {
    const key = keys.find((k) => k.id === id);
    if (!key) return;
    setConfirmAction({ type: 'delete', id, alias: key.alias });
  };

  const handleActivateClick = (id: string) => {
    const key = keys.find((k) => k.id === id);
    if (!key) return;
    setConfirmAction({ type: 'activate', id, alias: key.alias });
  };

  const handleConfirm = async () => {
    if (!confirmAction || !accessToken) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await adminApi.deleteApiKey(accessToken, selectedProvider, confirmAction.id);
        showToast(
          `${getProviderLabel(selectedProvider)} API 키 '${confirmAction.alias}'가 삭제되었습니다`
        );
      } else {
        await adminApi.activateApiKey(accessToken, selectedProvider, confirmAction.id);
        showToast(
          `${getProviderLabel(selectedProvider)} API 키 '${confirmAction.alias}'가 활성화되었습니다`
        );
      }
      setConfirmAction(null);
      await fetchKeys();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : confirmAction.type === 'delete'
            ? 'API 키 삭제에 실패했습니다'
            : 'API 키 활성화에 실패했습니다';
      showToast(message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const confirmTitle =
    confirmAction?.type === 'delete'
      ? `${getProviderLabel(selectedProvider)} API 키 삭제`
      : `${getProviderLabel(selectedProvider)} API 키 활성화`;

  const confirmMessage =
    confirmAction?.type === 'delete'
      ? `${getProviderLabel(selectedProvider)} 키 [${confirmAction?.alias}]을 삭제합니다`
      : `${getProviderLabel(selectedProvider)} 활성 키를 [${confirmAction?.alias}]으로 전환합니다. 새 ${getProviderLabel(selectedProvider)} 생성 작업부터 이 키를 사용합니다.`;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">API 키 관리</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
        >
          {getProviderLabel(selectedProvider)} 키 추가
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-1">
        {PROVIDER_OPTIONS.map((provider) => (
          <button
            key={provider.value}
            type="button"
            onClick={() => setSelectedProvider(provider.value)}
            className={`h-9 min-w-24 rounded-md px-4 text-sm font-medium transition-colors ${
              selectedProvider === provider.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
            }`}
          >
            {provider.label}
          </button>
        ))}
      </div>

      {/* API key table */}
      <ApiKeyTable
        keys={keys}
        provider={selectedProvider}
        onDelete={handleDeleteClick}
        onActivate={handleActivateClick}
        loading={loading}
      />

      {/* Add key modal */}
      <AddKeyModal
        isOpen={showAddModal}
        provider={selectedProvider}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddKey}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmAction?.type === 'delete' ? '삭제' : '활성화'}
        variant={confirmAction?.type === 'delete' ? 'danger' : 'default'}
        loading={confirmLoading}
      />
    </div>
  );
}
