'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GenerationImage {
  id: string;
  filePath: string;
  thumbnailPath: string | null;
  isSelected: boolean;
  width: number;
  height: number;
}

interface GenerationData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mode: string;
  errorMessage: string | null;
  images: GenerationImage[];
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

  const [generation, setGeneration] = useState<GenerationData | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  /**
   * 생성 상태 조회
   */
  const fetchGeneration = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_URL}/api/generations/${genId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setGeneration(data.data);

        // 선택된 이미지 설정
        const selected = data.data.images.find((img: GenerationImage) => img.isSelected);
        if (selected) {
          setSelectedImageId(selected.id);
        } else if (data.data.images.length > 0) {
          setSelectedImageId(data.data.images[0].id);
        }

        // 완료되면 폴링 중지
        if (data.data.status === 'completed' || data.data.status === 'failed') {
          setIsPolling(false);
        }
      }
    } catch (error) {
      console.error('생성 상태 조회 실패:', error);
    }
  }, [accessToken, genId]);

  // 폴링
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchGeneration();

      if (isPolling) {
        const interval = setInterval(fetchGeneration, 2000);
        return () => clearInterval(interval);
      }
    }
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

    await fetch(`${API_URL}/api/generations/${genId}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageId }),
    });
  };

  /**
   * 다운로드
   */
  const handleDownload = async (imageId: string) => {
    if (!accessToken) return;

    const endpoint = `/api/images/${imageId}/download`;
    window.open(`${API_URL}${endpoint}?token=${accessToken}`, '_blank');
  };

  /**
   * 부분 수정 요청
   */
  const handleEdit = async () => {
    if (!accessToken || !selectedImageId || !editPrompt.trim()) return;

    setIsEditing(true);
    try {
      // 올바른 경로: /api/generations/:id/edit
      const response = await fetch(`${API_URL}/api/generations/${genId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
      const response = await fetch(`${API_URL}/api/images/${selectedImageId}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSaveMessage('✅ 히스토리에 저장되었습니다!');
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage('❌ 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      setSaveMessage('❌ 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 동일 조건 재생성
   */
  const handleRegenerateWithSameInputs = async () => {
    if (!accessToken) return;

    setIsRegenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/generations/${genId}/regenerate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
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
    if (generation?.mode === 'ip_change') {
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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
        <div className="border-brand-500 mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          목업을 생성하고 있습니다...
        </h2>
        <p className="mt-2 text-[var(--text-secondary)]">
          {generation?.status === 'processing' ? 'AI가 이미지를 생성 중입니다' : '작업 대기 중...'}
        </p>
        <p className="mt-3 max-w-md text-center text-sm text-[var(--text-secondary)]">
          고품질 결과를 위해 고성능 AI로 처리 중이라 시간이 오래 걸릴 수 있습니다. 완료까지 잠시만
          다른작업을 하면서 기다려주세요.
        </p>
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
          {generation.errorMessage || '알 수 없는 오류가 발생했습니다'}
        </p>
        <Button className="mt-6" onClick={() => router.back()}>
          다시 시도
        </Button>
      </div>
    );
  }

  const selectedImage = generation.images.find((img) => img.id === selectedImageId);

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
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">생성 결과</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => handleDownload(selectedImageId!)}>다운로드</Button>
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
                alt="Generated mockup"
                className="max-h-[600px] rounded-lg object-contain"
              />
            )}
          </div>

          {/* 이미지 목록 */}
          <div className="space-y-4">
            <h3 className="font-medium text-[var(--text-primary)]">
              생성된 이미지 ({generation.images.length}개)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {generation.images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleSelectImage(image.id)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImageId === image.id
                      ? 'border-brand-500 shadow-lg'
                      : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <img
                    src={`${API_URL}/uploads/${image.thumbnailPath || image.filePath}`}
                    alt="Generated option"
                    className="aspect-square w-full object-cover"
                  />
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
              <Button variant="secondary" className="w-full" onClick={() => setShowEditModal(true)}>
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
              >
                🎨 스타일 복사 (IP 변경)
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleStyleCopy('new-product')}
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
