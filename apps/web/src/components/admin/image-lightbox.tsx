'use client';

import React, { useState, useEffect } from 'react';
import { AdminImage } from '@/lib/api';
import { ConfirmDialog } from './confirm-dialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ImageLightboxProps {
  image: AdminImage | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '-')
    .replace('.', '');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageLightbox({ image, onClose, onDelete }: ImageLightboxProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Escape key to close
  useEffect(() => {
    if (!image) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose, showDeleteConfirm]);

  if (!image) return null;

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await onDelete(image!.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/80"
        onClick={onClose}
      >
        {/* Lightbox card */}
        <div
          className="relative z-50 flex flex-col bg-white rounded-xl shadow-2xl max-w-[90vw] max-h-[95vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full-size image */}
          <div className="flex items-center justify-center bg-gray-100 rounded-t-xl overflow-hidden">
            <img
              src={`${API_URL}/uploads/${image.filePath}`}
              alt={`Generated image by ${image.userEmail}`}
              className="max-w-[90vw] max-h-[70vh] object-contain"
            />
          </div>

          {/* Metadata panel */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500 font-medium">크기</span>
                <p className="text-gray-900">
                  {image.width} x {image.height}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">파일 크기</span>
                <p className="text-gray-900">{formatFileSize(image.fileSize)}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">생성일</span>
                <p className="text-gray-900">{formatDate(image.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">사용자</span>
                <p className="text-gray-900 truncate max-w-[200px]">{image.userEmail}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 font-medium">프로젝트</span>
                <p className="text-gray-900">{image.projectName}</p>
              </div>
            </div>

            {/* Delete button */}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="이미지 삭제"
        message="이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
