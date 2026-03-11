'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, AdminImage, Pagination } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ConfirmDialog } from './confirm-dialog';
import { ImageLightbox } from './image-lightbox';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatDate(dateStr: string): string {
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
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total - 1);
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push(2);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
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

export function ContentGrid() {
  const token = useAuthStore((s) => s.accessToken);

  const [images, setImages] = useState<AdminImage[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter states
  const [emailSearch, setEmailSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Applied filter states (applied on "검색" click)
  const [appliedEmail, setAppliedEmail] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedProjectId, setAppliedProjectId] = useState('');

  // Lightbox
  const [selectedImage, setSelectedImage] = useState<AdminImage | null>(null);

  // Bulk delete
  const [bulkDeleteCount, setBulkDeleteCount] = useState<number | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const hasActiveFilter =
    appliedEmail.length > 0 ||
    appliedStartDate.length > 0 ||
    appliedEndDate.length > 0 ||
    appliedProjectId.length > 0;

  const fetchImages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await adminApi.listImages(token, {
        page,
        limit: 20,
        email: appliedEmail || undefined,
        projectId: appliedProjectId || undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
      });
      setImages(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, appliedEmail, appliedProjectId, appliedStartDate, appliedEndDate]);

  // Fetch projects on mount
  useEffect(() => {
    if (!token) return;
    adminApi
      .listContentProjects(token)
      .then((res) => setProjects(res.data))
      .catch(console.error);
  }, [token]);

  // Fetch images when deps change
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // 30-second polling
  useEffect(() => {
    const interval = setInterval(fetchImages, 30_000);
    return () => clearInterval(interval);
  }, [fetchImages]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleSearch() {
    setAppliedEmail(emailSearch);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedProjectId(projectId);
    setPage(1);
  }

  async function handleBulkDeleteClick() {
    if (!token) return;
    try {
      const result = await adminApi.countImages(token, {
        email: appliedEmail || undefined,
        projectId: appliedProjectId || undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
      });
      setBulkDeleteCount(result.data.count);
      setShowBulkDeleteConfirm(true);
    } catch (err) {
      console.error('Failed to count images:', err);
    }
  }

  async function handleBulkDeleteConfirm() {
    if (!token) return;
    setBulkDeleting(true);
    try {
      const result = await adminApi.bulkDeleteImages(token, {
        email: appliedEmail || undefined,
        projectId: appliedProjectId || undefined,
        startDate: appliedStartDate || undefined,
        endDate: appliedEndDate || undefined,
      });
      setShowBulkDeleteConfirm(false);
      setBulkDeleteCount(null);
      setToast(`${result.data.deletedCount}건의 이미지가 삭제되었습니다`);
      setPage(1);
      await fetchImages();
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleDeleteImage(id: string): Promise<void> {
    if (!token) return;
    await adminApi.deleteImage(token, id);
    setSelectedImage(null);
    setToast('이미지가 삭제되었습니다');
    await fetchImages();
  }

  const pageNumbers = getPageNumbers(page, pagination.totalPages);

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-default)]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">사용자 이메일</label>
          <input
            type="text"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="이메일 검색"
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[180px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--text-secondary)]">프로젝트</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500 min-w-[160px]"
          >
            <option value="">전체 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="h-9 px-4 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-400 active:bg-brand-600 transition-colors"
        >
          검색
        </button>

        {hasActiveFilter && (
          <button
            onClick={handleBulkDeleteClick}
            className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
          >
            필터 조건 일괄 삭제
          </button>
        )}
      </div>

      {/* Image grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="h-8 w-8 animate-spin text-brand-500"
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
      ) : images.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-tertiary)] text-sm">
          이미지가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="group flex flex-col rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden hover:border-brand-500 hover:shadow-md transition-all text-left"
            >
              <div className="relative" style={{ aspectRatio: '1', width: '100%' }}>
                <img
                  src={`${API_URL}/uploads/${image.thumbnailPath || image.filePath}`}
                  alt={`Generated image by ${image.userEmail}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2 space-y-0.5">
                <p className="text-xs text-[var(--text-primary)] font-medium truncate">
                  {image.userEmail}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{image.projectName}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{formatDate(image.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(p as number)}
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
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
            className="h-8 w-8 flex items-center justify-center rounded text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &rsaquo;
          </button>
        </div>
      )}

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="일괄 삭제 확인"
        message={`필터 조건에 매칭되는 ${bulkDeleteCount ?? 0}건의 이미지를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="danger"
        loading={bulkDeleting}
      />

      {/* Lightbox */}
      <ImageLightbox
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDelete={handleDeleteImage}
      />
    </div>
  );
}
