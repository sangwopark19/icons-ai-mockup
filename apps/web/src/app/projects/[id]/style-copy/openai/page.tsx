'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input } from '@/components/ui/input';
import { API_URL, apiFetch, type GenerationDetail, type GenerationImage } from '@/lib/api';

type CopyTarget = 'ip-change' | 'new-product';

interface GenerationDetailResponse {
  success: boolean;
  data?: GenerationDetail;
}

interface UploadResponse {
  success: boolean;
  data?: {
    filePath: string;
  };
  error?: {
    message?: string;
  };
}

interface CopyStyleResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: {
    message?: string;
  };
}

const GENERIC_START_ERROR =
  '후속 작업을 시작하지 못했습니다. 저장된 입력과 선택 이미지를 확인한 뒤 다시 시도해주세요.';
const MISSING_STYLE_REFERENCE_ERROR =
  '스타일 기준 이미지를 확인할 수 없습니다. 히스토리에서 결과를 다시 열어주세요.';
const REQUIRED_TARGET_ERROR = '새 대상 이미지를 업로드해주세요.';
const SUBMIT_ERROR =
  '스타일 복사 생성에 실패했습니다. 기준 결과와 새 대상 이미지를 확인한 뒤 다시 시도해주세요.';

const COPY_TARGET_CONFIG: Record<
  CopyTarget,
  {
    label: string;
    description: string;
    removeAriaLabel: string;
    uploadEndpoint: (projectId: string) => string;
  }
> = {
  'ip-change': {
    label: '새 캐릭터 이미지',
    description: '교체할 캐릭터/IP 이미지를 업로드하세요',
    removeAriaLabel: '새 캐릭터 이미지 제거',
    uploadEndpoint: () => '/api/upload/character',
  },
  'new-product': {
    label: '새 제품 이미지',
    description: '같은 스타일로 적용할 새 제품 이미지를 업로드하세요',
    removeAriaLabel: '새 제품 이미지 제거',
    uploadEndpoint: (projectId: string) => `/api/upload/image?projectId=${projectId}`,
  },
};

function getValidCopyTarget(value: string | null): CopyTarget | null {
  if (value === 'ip-change' || value === 'new-product') {
    return value;
  }

  return null;
}

export default function OpenAIStyleCopyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const styleRef = searchParams.get('styleRef');
  const imageId = searchParams.get('imageId');
  const copyTarget = getValidCopyTarget(searchParams.get('copyTarget'));
  const targetConfig = copyTarget ? COPY_TARGET_CONFIG[copyTarget] : null;

  const [styleGeneration, setStyleGeneration] = useState<GenerationDetail | null>(null);
  const [styleImage, setStyleImage] = useState<GenerationImage | null>(null);
  const [isFetchingStyle, setIsFetchingStyle] = useState(false);
  const [styleFetchError, setStyleFetchError] = useState<string | null>(
    copyTarget ? null : GENERIC_START_ERROR
  );
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [userInstructions, setUserInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasBlockingError = Boolean(styleFetchError) || !styleGeneration || !styleImage || !copyTarget;
  const isTargetDisabled = hasBlockingError || isFetchingStyle;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!copyTarget) {
      setStyleFetchError(GENERIC_START_ERROR);
    }
  }, [copyTarget]);

  const fetchStyleReference = useCallback(async () => {
    if (!accessToken || !styleRef || !imageId || !copyTarget) {
      if (!styleRef || !imageId || !copyTarget) {
        setStyleFetchError(GENERIC_START_ERROR);
      }
      return;
    }

    setIsFetchingStyle(true);
    setStyleFetchError(null);

    try {
      const response = await apiFetch(`/api/generations/${styleRef}`, { token: accessToken });

      if (response.status === 401) {
        setStyleFetchError(GENERIC_START_ERROR);
        router.push('/login');
        return;
      }

      if (response.status === 404) {
        setStyleFetchError(MISSING_STYLE_REFERENCE_ERROR);
        return;
      }

      if (response.status >= 500) {
        setStyleFetchError(GENERIC_START_ERROR);
        return;
      }

      if (!response.ok) {
        setStyleFetchError(GENERIC_START_ERROR);
        return;
      }

      const data = (await response.json()) as GenerationDetailResponse;
      if (!data.success || !data.data || data.data.provider !== 'openai') {
        setStyleFetchError(GENERIC_START_ERROR);
        return;
      }

      const selectedStyleImage = data.data.images.find((image) => image.id === imageId);
      if (!selectedStyleImage) {
        setStyleFetchError(MISSING_STYLE_REFERENCE_ERROR);
        return;
      }

      setStyleGeneration(data.data);
      setStyleImage(selectedStyleImage);
    } catch {
      setStyleFetchError(GENERIC_START_ERROR);
    } finally {
      setIsFetchingStyle(false);
    }
  }, [accessToken, copyTarget, imageId, router, styleRef]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return;

    fetchStyleReference();
  }, [accessToken, authLoading, fetchStyleReference, isAuthenticated]);

  const handleTargetUpload = (file: File) => {
    setTargetImage(file);
    setSubmitError(null);

    const reader = new FileReader();
    reader.onload = (event) => setTargetPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTargetRemove = () => {
    setTargetImage(null);
    setTargetPreview(null);
  };

  const uploadTargetImage = async (file: File): Promise<string> => {
    if (!accessToken || !targetConfig) {
      throw new Error(SUBMIT_ERROR);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(targetConfig.uploadEndpoint(projectId), {
      method: 'POST',
      token: accessToken,
      body: formData,
    });

    const data = (await response.json()) as UploadResponse;
    if (!response.ok || !data.success || !data.data?.filePath) {
      throw new Error(data.error?.message || SUBMIT_ERROR);
    }

    return data.data.filePath;
  };

  const handleGenerate = async () => {
    if (
      !accessToken ||
      !styleRef ||
      !imageId ||
      !copyTarget ||
      !styleGeneration ||
      !styleImage ||
      hasBlockingError ||
      isGenerating
    ) {
      return;
    }

    setSubmitError(null);

    if (!targetImage) {
      setSubmitError(REQUIRED_TARGET_ERROR);
      return;
    }

    setIsGenerating(true);

    try {
      const uploadedTargetPath = await uploadTargetImage(targetImage);
      const trimmedInstructions = userInstructions.trim();
      const body =
        copyTarget === 'ip-change'
          ? {
              copyTarget: 'ip-change',
              selectedImageId: imageId,
              characterImagePath: uploadedTargetPath,
              userInstructions: trimmedInstructions || undefined,
            }
          : {
              copyTarget: 'new-product',
              selectedImageId: imageId,
              sourceImagePath: uploadedTargetPath,
              userInstructions: trimmedInstructions || undefined,
            };

      const response = await apiFetch(`/api/generations/${styleRef}/copy-style`, {
        method: 'POST',
        token: accessToken,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as CopyStyleResponse;
      if (!response.ok || !data.success || !data.data?.id) {
        throw new Error(data.error?.message || SUBMIT_ERROR);
      }

      router.push(`/projects/${projectId}/generations/${data.data.id}`);
    } catch {
      setSubmitError(SUBMIT_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← 프로젝트로
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">스타일 복사 v2</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                선택한 결과의 구도와 완성도를 유지하면서 새 대상만 교체합니다.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {styleFetchError && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
            {styleFetchError}
          </div>
        )}
        {submitError && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
            {submitError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">스타일 기준</h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  이 결과의 구도, 시점, 조명, 배경, 제품 처리 방식을 유지합니다.
                </p>
              </div>
              <span className="rounded bg-brand-500/10 px-2 py-1 text-xs font-semibold text-brand-500">
                스타일 기준 · v2
              </span>
            </div>

            <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-4">
              {isFetchingStyle && (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              )}
              {!isFetchingStyle && styleImage && (
                <img
                  src={`${API_URL}/uploads/${styleImage.filePath}`}
                  alt="스타일 기준 v2 결과 이미지"
                  className="max-h-[560px] w-full rounded-lg object-contain"
                />
              )}
              {!isFetchingStyle && !styleImage && (
                <p className="text-center text-sm text-[var(--text-tertiary)]">
                  스타일 기준 이미지를 불러오는 중입니다.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">새 대상</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                새 이미지는 교체 대상에만 사용하고 나머지 스타일은 기준 결과를 따릅니다.
              </p>
            </div>

            <ImageUploader
              label={targetConfig?.label ?? '새 대상 이미지'}
              description={targetConfig?.description ?? '교체할 이미지를 업로드하세요'}
              removeAriaLabel={targetConfig?.removeAriaLabel ?? '새 대상 이미지 제거'}
              onUpload={handleTargetUpload}
              onRemove={handleTargetRemove}
              onError={setSubmitError}
              preview={targetPreview}
              className={isTargetDisabled ? 'pointer-events-none opacity-50' : undefined}
            />

            <div>
              <Input
                label="추가 지시사항"
                value={userInstructions}
                onChange={(event) => setUserInstructions(event.target.value)}
                disabled={isTargetDisabled || isGenerating}
              />
              <p className="mt-2 text-sm text-[var(--text-tertiary)]">
                교체 대상에 대한 요청만 입력하세요. 구도와 배경 변경 요청은 반영하지 않습니다.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={isTargetDisabled}
            >
              {isGenerating ? '스타일을 복사한 두 후보를 생성 중...' : 'v2 스타일 복사 생성하기'}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
