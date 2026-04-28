'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  API_URL,
  apiFetch,
  getValidAccessToken,
  type GenerationDetail,
  type GenerationImage,
  type GenerationMode,
} from '@/lib/api';

const V2_CANDIDATE_LABELS = ['후보 1', '후보 2'];

const V2_WORKFLOW_COPY: Record<
  GenerationMode,
  {
    loadingHeading: string;
    loadingBody: string;
    failedBody: string;
    formPath: string;
    selectedAlt: string;
    candidateAltPrefix: string;
    downloadLabel: string;
  }
> = {
  ip_change: {
    loadingHeading: 'v2 목업을 생성하고 있습니다...',
    loadingBody: '두 후보를 준비 중입니다. 완료되면 바로 선택할 수 있습니다.',
    failedBody: 'v2 IP 변경 생성에 실패했습니다. 이미지를 확인한 뒤 다시 시도해주세요.',
    formPath: 'ip-change/openai',
    selectedAlt: '선택된 v2 IP 변경 결과',
    candidateAltPrefix: 'v2 IP 변경 후보',
    downloadLabel: '다운로드',
  },
  sketch_to_real: {
    loadingHeading: 'v2 목업을 생성하고 있습니다...',
    loadingBody: '스케치 구조를 보존한 두 후보를 준비 중입니다. 완료되면 바로 선택할 수 있습니다.',
    failedBody:
      'v2 스케치 실사화 생성에 실패했습니다. 스케치와 재질 정보를 확인한 뒤 다시 시도해주세요.',
    formPath: 'sketch-to-real/openai',
    selectedAlt: '선택된 v2 스케치 실사화 결과',
    candidateAltPrefix: 'v2 스케치 실사화 후보',
    downloadLabel: '선택 이미지 다운로드',
  },
};

function getV2WorkflowCopy(mode: GenerationMode) {
  return V2_WORKFLOW_COPY[mode];
}

function getV2WorkflowPath(projectId: string, mode: GenerationMode) {
  return `/projects/${projectId}/${getV2WorkflowCopy(mode).formPath}`;
}

function getOutputIndex(image: GenerationImage, fallbackIndex: number) {
  const path = image.filePath || image.thumbnailPath || '';
  const match = path.match(/output[_-](\d+)/i);

  return match ? Number(match[1]) : fallbackIndex + 1;
}

function getImagesInOutputOrder(images: GenerationImage[]) {
  return images
    .map((image, index) => ({ image, index, outputIndex: getOutputIndex(image, index) }))
    .sort((a, b) => a.outputIndex - b.outputIndex || a.index - b.index)
    .map(({ image }) => image);
}

/**
 * 생성 결과 페이지
 */
export default function GenerationResultPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const genId = params.genId as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [generation, setGeneration] = useState<GenerationDetail | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const isV2 = generation?.provider === 'openai';
  const isV2SketchToReal = Boolean(isV2 && generation?.mode === 'sketch_to_real');
  const v2WorkflowCopy = isV2 && generation ? getV2WorkflowCopy(generation.mode) : null;
  const disabledFollowupId = 'v2-disabled-followups';

  // Interval 관리를 위한 ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // 경쟁 조건 방지를 위한 로딩 플래그
  const isLoadingRef = useRef(false);

  /**
   * 생성 상태 조회
   */
  const fetchGeneration = useCallback(async () => {
    // 이미 요청 중이거나 토큰이 없으면 중단
    if (!accessToken || isLoadingRef.current) return;

    isLoadingRef.current = true;
    try {
      const response = await apiFetch(`/api/generations/${genId}`, { token: accessToken });

      // 기타 HTTP 에러 처리
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const fetchedGeneration = data.data as GenerationDetail;
        const orderedImages = getImagesInOutputOrder(fetchedGeneration.images);

        setGeneration(fetchedGeneration);

        // 선택된 이미지 설정
        const selected = orderedImages.find((img: GenerationImage) => img.isSelected);
        if (selected) {
          setSelectedImageId(selected.id);
        } else if (orderedImages.length > 0) {
          setSelectedImageId(orderedImages[0].id);
        }

        // 완료되면 폴링 중지
        if (fetchedGeneration.status === 'completed' || fetchedGeneration.status === 'failed') {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('생성 상태 조회 실패:', error);

      // 인증 에러, 네트워크 에러 등 심각한 에러 시 폴링 중지
      if (
        error instanceof Error &&
        (error.message.includes('인증') ||
          error.message.includes('401') ||
          error.message.includes('Network'))
      ) {
        setIsPolling(false);
      }
    } finally {
      // 로딩 플래그 해제
      isLoadingRef.current = false;
    }
  }, [accessToken, genId]);

  // 폴링
  useEffect(() => {
    // 기존 interval 정리
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!authLoading && isAuthenticated) {
      // 즉시 한 번 실행
      fetchGeneration();

      // 새 interval 시작
      if (isPolling) {
        intervalRef.current = setInterval(fetchGeneration, 2000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authLoading, isAuthenticated, isPolling, fetchGeneration]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * 이미지 선택
   */
  const handleSelectImage = async (imageId: string) => {
    if (!accessToken) return;

    setSelectedImageId(imageId);

    await apiFetch(`/api/generations/${genId}/select`, {
      method: 'POST',
      token: accessToken,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId }),
    });
  };

  /**
   * 다운로드
   */
  const handleDownload = async (imageId: string) => {
    if (!imageId) return;
    const validToken = await getValidAccessToken();
    if (!validToken) return;

    const response = await apiFetch(`/api/images/${imageId}/download`, {
      token: validToken,
    });

    if (!response.ok) {
      setSaveMessage('다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${imageId}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  /**
   * 부분 수정 요청
   */
  const handleEdit = async () => {
    if (isV2) return;
    if (!accessToken || !selectedImageId || !editPrompt.trim()) return;

    setIsEditing(true);
    try {
      // 올바른 경로: /api/generations/:id/edit
      const response = await apiFetch(`/api/generations/${genId}/edit`, {
        method: 'POST',
        token: accessToken,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: editPrompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 새 생성 결과 페이지로 이동
        router.push(`/projects/${projectId}/generations/${data.data.generationId}`);
      } else {
        alert(data.error?.message || '편집 요청에 실패했습니다');
      }
    } catch (error) {
      console.error('편집 요청 실패:', error);
      alert('편집 요청에 실패했습니다');
    } finally {
      setIsEditing(false);
      setShowEditModal(false);
      setEditPrompt('');
    }
  };

  /**
   * 히스토리에 저장
   */
  const handleSaveToHistory = async () => {
    if (!accessToken || !selectedImageId) return;

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const response = await apiFetch(`/api/images/${selectedImageId}/save`, {
        method: 'POST',
        token: accessToken,
      });

      const data = await response.json();
      if (data.success) {
        setSaveMessage('히스토리에 저장되었습니다');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 동일 조건 재생성
   */
  const handleRegenerateWithSameInputs = async () => {
    if (isV2) return;
    if (!accessToken) return;

    setIsRegenerating(true);
    try {
      const response = await apiFetch(`/api/generations/${genId}/regenerate`, {
        method: 'POST',
        token: accessToken,
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/projects/${projectId}/generations/${data.data.id}`);
        return;
      }

      alert(data.error?.message || '동일 조건 재생성에 실패했습니다');
    } catch (error) {
      console.error('동일 조건 재생성 실패:', error);
      alert('동일 조건 재생성에 실패했습니다');
    } finally {
      setIsRegenerating(false);
    }
  };

  /**
   * 조건 수정
   */
  const handleModifyConditions = () => {
    // 모드에 따라 해당 페이지로 이동
    if (generation?.provider === 'openai') {
      router.push(getV2WorkflowPath(projectId, generation.mode));
    } else if (generation?.mode === 'ip_change') {
      router.push(`/projects/${projectId}/ip-change`);
    } else if (generation?.mode === 'sketch_to_real') {
      router.push(`/projects/${projectId}/sketch-to-real`);
    } else {
      router.back();
    }
  };

  /**
   * 스타일 복사
   */
  const handleStyleCopy = (copyTarget: 'ip-change' | 'new-product') => {
    if (isV2) return;
    const styleRef = generation?.id ?? genId;
    const query = new URLSearchParams({ styleRef, copyTarget });
    router.push(`/projects/${projectId}/ip-change?${query.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  // 로딩 중
  if (!generation || generation.status === 'pending' || generation.status === 'processing') {
    const pendingCopy =
      generation?.provider === 'openai' ? getV2WorkflowCopy(generation.mode) : null;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="border-brand-500 mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          {pendingCopy ? pendingCopy.loadingHeading : '목업을 생성하고 있습니다...'}
        </h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          {pendingCopy
            ? pendingCopy.loadingBody
            : generation?.status === 'processing'
              ? 'AI가 이미지를 생성 중입니다'
              : '작업 대기 중...'}
        </p>
        {!pendingCopy && (
          <p className="mt-3 max-w-md text-center text-sm text-[var(--text-secondary)]">
            고품질 결과를 위해 고성능 AI로 처리 중이라 시간이 오래 걸릴 수 있습니다. 완료까지
            잠시만 다른작업을 하면서 기다려주세요.
          </p>
        )}
      </div>
    );
  }

  // 실패
  if (generation.status === 'failed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="mb-4 text-5xl">❌</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">생성에 실패했습니다</h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          {v2WorkflowCopy
            ? v2WorkflowCopy.failedBody
            : generation.errorMessage || '알 수 없는 오류가 발생했습니다'}
        </p>
        <Button
          className="mt-6"
          onClick={() =>
            v2WorkflowCopy
              ? router.push(getV2WorkflowPath(projectId, generation.mode))
              : router.back()
          }
        >
          다시 시도
        </Button>
      </div>
    );
  }

  const orderedImages = getImagesInOutputOrder(generation.images);

  if (isV2SketchToReal && orderedImages.length !== 2) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-4 text-center">
        <div className="mb-4 text-5xl">❌</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          v2 스케치 실사화 결과를 확인할 수 없습니다
        </h2>
        <p className="mt-2 max-w-md text-[var(--text-secondary)]">
          후보 2개가 필요하지만 현재 {orderedImages.length}개가 저장되어 있습니다. 스케치와 재질
          정보를 확인한 뒤 다시 생성해주세요.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push(`/projects/${projectId}/sketch-to-real/openai`)}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  const selectedImage = orderedImages.find((img) => img.id === selectedImageId);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← 프로젝트로
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">생성 결과</h1>
              {(generation.mode === 'ip_change' || generation.mode === 'sketch_to_real') && (
                <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
                  {isV2 ? 'v2' : 'v1'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => selectedImageId && handleDownload(selectedImageId)}
              disabled={!selectedImageId}
            >
              {v2WorkflowCopy?.downloadLabel ?? '다운로드'}
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* 선택된 이미지 */}
          <div className="flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
            {selectedImage && (
              <img
                src={`${API_URL}/uploads/${selectedImage.filePath}`}
                alt={v2WorkflowCopy?.selectedAlt ?? '생성된 목업 결과'}
                className="max-h-[600px] rounded-lg object-contain"
              />
            )}
          </div>

          {/* 이미지 목록 */}
          <div className="space-y-4">
            <h3 className="font-medium text-[var(--text-primary)]">
              {isV2 ? '생성된 이미지 (2개)' : `생성된 이미지 (${orderedImages.length}개)`}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {orderedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => handleSelectImage(image.id)}
                  aria-label={isV2 ? `후보 ${index + 1} 선택` : `이미지 ${index + 1} 선택`}
                  aria-pressed={selectedImageId === image.id}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImageId === image.id
                      ? 'border-brand-500 shadow-lg'
                      : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <img
                    src={`${API_URL}/uploads/${image.thumbnailPath || image.filePath}`}
                    alt={
                      v2WorkflowCopy
                        ? `${v2WorkflowCopy.candidateAltPrefix} ${index + 1}`
                        : `생성 후보 ${index + 1}`
                    }
                    className="aspect-square w-full object-cover"
                  />
                  {isV2 && (
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {V2_CANDIDATE_LABELS[index] ?? `후보 ${index + 1}`}
                    </span>
                  )}
                  {selectedImageId === image.id && (
                    <div className="bg-brand-500/20 absolute inset-0 flex items-center justify-center">
                      <span className="bg-brand-500 rounded-full px-2 py-1 text-xs text-white">
                        선택됨
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 추가 액션 */}
            <div className="space-y-2 pt-4">
              {isV2 && (
                <p id={disabledFollowupId} className="text-center text-xs text-[var(--text-tertiary)]">
                  v2 후속 편집은 다음 업데이트에서 지원됩니다
                </p>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowEditModal(true)}
                disabled={isV2}
                aria-describedby={isV2 ? disabledFollowupId : undefined}
              >
                ✏️ 부분 수정
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleSaveToHistory}
                isLoading={isSaving}
              >
                📚 히스토리에 저장
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleStyleCopy('ip-change')}
                disabled={isV2}
                aria-describedby={isV2 ? disabledFollowupId : undefined}
              >
                🎨 스타일 복사 (IP 변경)
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleStyleCopy('new-product')}
                disabled={isV2}
                aria-describedby={isV2 ? disabledFollowupId : undefined}
              >
                🧩 스타일 복사 (새 제품 적용)
              </Button>
              {saveMessage && (
                <p className="text-center text-sm text-[var(--text-secondary)]">{saveMessage}</p>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleRegenerateWithSameInputs}
                isLoading={isRegenerating}
                disabled={isV2}
                aria-describedby={isV2 ? disabledFollowupId : undefined}
              >
                🔁 동일 조건 재생성
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleModifyConditions}>
                🛠️ 조건 수정
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* 부분 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-secondary)] p-6">
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">✏️ 부분 수정</h2>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              수정하고 싶은 부분을 자세히 설명해주세요. 요청한 부분만 변경되고 나머지는 유지됩니다.
            </p>
            <Input
              label="수정 요청"
              placeholder="예: 캐릭터 색상을 파란색으로 변경해주세요"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditPrompt('');
                }}
              >
                취소
              </Button>
              <Button onClick={handleEdit} isLoading={isEditing} disabled={!editPrompt.trim()}>
                수정 요청
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
