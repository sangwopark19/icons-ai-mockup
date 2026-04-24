'use client';

import * as React from 'react';
import { Clipboard, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ImageUploader Props
 */
interface ImageUploaderProps {
  label?: string;
  description?: string;
  accept?: string;
  maxSize?: number; // bytes
  onUpload: (file: File) => void;
  onRemove?: () => void;
  onError?: (error: string) => void;
  preview?: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * 이미지 업로더 컴포넌트
 */
export function ImageUploader({
  label,
  description,
  accept = 'image/png,image/jpeg,image/webp',
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  onRemove,
  onError,
  preview,
  isLoading,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pasteAreaRef = React.useRef<HTMLDivElement>(null);

  const displayPreview = preview || localPreview;

  /**
   * 파일 유효성 검사
   */
  const validateFile = (file: File): boolean => {
    // 타입 검사
    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      onError?.('PNG, JPG, WEBP 파일만 업로드할 수 있습니다');
      return false;
    }

    // 크기 검사
    if (file.size > maxSize) {
      onError?.(`파일 크기가 ${Math.round(maxSize / 1024 / 1024)}MB를 초과합니다`);
      return false;
    }

    return true;
  };

  /**
   * 파일 처리
   */
  const handleFile = (file: File) => {
    if (!validateFile(file)) return;

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  /**
   * 드래그 이벤트 핸들러
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * 붙여넣기 이미지 처리
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(e.clipboardData.items)
      .find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      ?.getAsFile();

    if (!file) return;

    e.preventDefault();

    const extension = file.type.split('/')[1] || 'png';
    const pastedFile = new File([file], `pasted-image-${Date.now()}.${extension}`, {
      type: file.type,
      lastModified: Date.now(),
    });

    handleFile(pastedFile);
  };

  /**
   * 붙여넣기 영역 클릭 핸들러
   */
  const handlePasteAreaClick = () => {
    pasteAreaRef.current?.focus();
  };

  /**
   * 파일 선택 핸들러
   */
  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  /**
   * 파일 선택 핸들러
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * 미리보기 제거
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onRemove?.();
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative min-h-[200px] overflow-hidden rounded-xl border-2 border-dashed transition-all',
          'border-[var(--border-default)] bg-[var(--bg-tertiary)]',
          isDragging && 'border-brand-500 bg-brand-500/10',
          isLoading && 'pointer-events-none opacity-50'
        )}
      >
        {displayPreview ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6">
            <img
              src={displayPreview}
              alt="Preview"
              className="max-h-40 rounded-lg object-contain"
            />
            <button
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-[var(--bg-primary)] p-1.5 text-[var(--text-secondary)] hover:bg-red-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="grid min-h-[200px] grid-cols-1 sm:grid-cols-2">
            <div
              ref={pasteAreaRef}
              tabIndex={0}
              onClick={handlePasteAreaClick}
              onPaste={handlePaste}
              aria-label="붙여넣기 이미지 영역"
              className={cn(
                'flex cursor-copy flex-col items-center justify-center gap-3 p-6 text-center transition-colors',
                'hover:bg-brand-500/5 focus:outline-none focus-visible:bg-brand-500/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <Clipboard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">붙여넣기</p>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  복사한 이미지 사용
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBrowseClick}
              className={cn(
                'flex flex-col items-center justify-center gap-3 border-t border-[var(--border-default)] p-6 text-center transition-colors',
                'hover:bg-brand-500/5 focus:outline-none focus-visible:bg-brand-500/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500',
                'sm:border-l sm:border-t-0'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">파일 선택</p>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  {description || '기기에서 이미지 업로드'}
                </p>
              </div>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
