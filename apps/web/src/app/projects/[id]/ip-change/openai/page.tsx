'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { apiFetch } from '@/lib/api';

type QualityValue = 'low' | 'medium' | 'high';

const QUALITY_OPTIONS: Array<{ label: string; value: QualityValue }> = [
  { label: '빠른모드', value: 'low' },
  { label: '균형모드', value: 'medium' },
  { label: '퀄리티모드', value: 'high' },
];

export default function OpenAIIPChangePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [transparentBg, setTransparentBg] = useState(false);
  const [preserveHardware, setPreserveHardware] = useState(false);
  const [fixedBackground, setFixedBackground] = useState(true);
  const [fixedViewpoint, setFixedViewpoint] = useState(true);
  const [removeShadows, setRemoveShadows] = useState(false);
  const [quality, setQuality] = useState<QualityValue>('medium');
  const [userInstructions, setUserInstructions] = useState('');
  const [hardwareSpecInput, setHardwareSpecInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const maxUserInstructionsLength = 2000;
  const maxHardwareSpecLength = 2000;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const uploadImage = async (file: File, type: 'source' | 'character'): Promise<string> => {
    if (!accessToken) {
      throw new Error('인증이 필요합니다');
    }

    const formData = new FormData();
    formData.append('file', file);

    const endpoint =
      type === 'source' ? `/api/upload/image?projectId=${projectId}` : '/api/upload/character';

    const response = await apiFetch(endpoint, {
      method: 'POST',
      token: accessToken,
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || '업로드 실패');
    }

    return data.data.filePath;
  };

  const handleGenerate = async () => {
    if (!accessToken) return;

    setError(null);
    if (!sourceImage || !characterImage) {
      setError('원본 제품 이미지와 새 캐릭터 이미지를 모두 업로드해주세요.');
      return;
    }
    if (userInstructions.length > maxUserInstructionsLength) {
      setError('사용자 지시문은 2000자 이내로 입력해주세요');
      return;
    }
    if (hardwareSpecInput.length > maxHardwareSpecLength) {
      setError('부자재 상세는 2000자 이내로 입력해주세요');
      return;
    }

    setIsGenerating(true);

    try {
      const [sourceImagePath, characterImagePath] = await Promise.all([
        uploadImage(sourceImage, 'source'),
        uploadImage(characterImage, 'character'),
      ]);

      const response = await apiFetch('/api/generations', {
        method: 'POST',
        token: accessToken,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          mode: 'ip_change',
          provider: 'openai',
          providerModel: 'gpt-image-2',
          sourceImagePath,
          characterImagePath,
          options: {
            preserveStructure,
            transparentBackground: transparentBg,
            preserveHardware,
            fixedBackground,
            fixedViewpoint,
            removeShadows,
            userInstructions: userInstructions.trim() || undefined,
            hardwareSpecInput: preserveHardware ? hardwareSpecInput.trim() || undefined : undefined,
            outputCount: 2,
            quality,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '생성 요청 실패');
      }

      router.push(`/projects/${projectId}/generations/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSourceUpload = (file: File) => {
    setSourceImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setSourcePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCharacterUpload = (file: File) => {
    setCharacterImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setCharacterPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSourceRemove = () => {
    setSourceImage(null);
    setSourcePreview(null);
  };

  const handleCharacterRemove = () => {
    setCharacterImage(null);
    setCharacterPreview(null);
  };

  const handleUserInstructionsChange = (value: string) => {
    if (value.length > maxUserInstructionsLength) return;
    setUserInstructions(value);
  };

  const handleHardwareSpecChange = (value: string) => {
    if (value.length > maxHardwareSpecLength) return;
    setHardwareSpecInput(value);
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
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← 뒤로
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">⚡ IP 변경 v2</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-8 text-[var(--text-secondary)]">
          기존 제품의 구조와 시점을 유지하면서 새 캐릭터를 적용합니다.
        </p>

        {error && <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-2">
          <ImageUploader
            label="원본 제품 이미지"
            description="변경할 제품 사진을 업로드하세요"
            onUpload={handleSourceUpload}
            onRemove={handleSourceRemove}
            onError={setError}
            preview={sourcePreview}
          />

          <ImageUploader
            label="새 캐릭터 이미지"
            description="적용할 캐릭터 이미지를 업로드하세요"
            onUpload={handleCharacterUpload}
            onRemove={handleCharacterRemove}
            onError={setError}
            preview={characterPreview}
          />
        </div>

        <div className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
          <h3 className="mb-4 font-medium text-[var(--text-primary)]">생성 옵션</h3>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              품질 모드
            </legend>
            <div
              role="radiogroup"
              aria-label="품질 모드"
              className="grid gap-2 rounded-lg bg-[var(--bg-tertiary)] p-1 sm:grid-cols-3"
            >
              {QUALITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="relative flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors has-[:checked]:bg-brand-500 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="quality"
                    value={option.value}
                    checked={quality === option.value}
                    onChange={() => setQuality(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preserveStructure}
                onChange={(event) => setPreserveStructure(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">원본 구조 우선 유지</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(event) => setTransparentBg(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">투명 배경 (누끼)</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preserveHardware}
                onChange={(event) => setPreserveHardware(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">부자재 보존</span>
            </label>
            {preserveHardware && (
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3 text-sm text-[var(--text-secondary)]">
                <p className="text-xs text-[var(--text-tertiary)]">
                  부자재 상세를 입력하면 해당 사양을 우선적으로 보존합니다.
                </p>
                <textarea
                  value={hardwareSpecInput}
                  onChange={(event) => handleHardwareSpecChange(event.target.value)}
                  maxLength={maxHardwareSpecLength}
                  rows={3}
                  placeholder="예: 지퍼: YKK #5, 건메탈 그레이, 상단 중앙"
                  className="mt-2 w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
                <div className="mt-1 text-right text-xs text-[var(--text-tertiary)]">
                  {hardwareSpecInput.length}/{maxHardwareSpecLength}
                </div>
              </div>
            )}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={fixedBackground}
                onChange={(event) => setFixedBackground(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">배경 고정</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={fixedViewpoint}
                onChange={(event) => setFixedViewpoint(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">시점 고정</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={removeShadows}
                onChange={(event) => setRemoveShadows(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">그림자 제거</span>
            </label>
          </div>

          <div className="mt-6">
            <label
              htmlFor="user-instructions"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              사용자 지시문
            </label>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              보존 규칙 안에서 추가 요청을 반영합니다.
            </p>
            <textarea
              id="user-instructions"
              value={userInstructions}
              onChange={(event) => handleUserInstructionsChange(event.target.value)}
              maxLength={maxUserInstructionsLength}
              rows={4}
              placeholder="예: 배경은 항상 흰색, 캐릭터는 정면에서 보이도록 유지"
              className="mt-3 w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
            <div className="mt-2 text-right text-xs text-[var(--text-secondary)]">
              {userInstructions.length}/{maxUserInstructionsLength}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!sourceImage || !characterImage}
          >
            v2 목업 생성하기
          </Button>
        </div>
      </main>
    </div>
  );
}
