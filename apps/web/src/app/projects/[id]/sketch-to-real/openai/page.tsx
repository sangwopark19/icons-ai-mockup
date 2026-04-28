'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

type QualityValue = 'low' | 'medium' | 'high';

const OPENAI_IMAGE_ACCEPT = 'image/png,image/jpeg';
const OPENAI_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const OPENAI_MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const INVALID_IMAGE_TYPE_MESSAGE = 'PNG 또는 JPEG 이미지만 업로드할 수 있습니다.';
const MAX_IMAGE_SIZE_MESSAGE = '이미지는 10MB 이하로 업로드해주세요.';
const REQUIRED_INPUT_MESSAGE = '스케치 이미지, 제품 종류, 재질 가이드를 입력해주세요.';
const OTHER_VALUE_MESSAGE = '기타를 선택한 경우 상세 내용을 입력해주세요.';

const QUALITY_OPTIONS: Array<{ label: string; value: QualityValue }> = [
  { label: '빠른모드', value: 'low' },
  { label: '균형모드', value: 'medium' },
  { label: '퀄리티모드', value: 'high' },
];

const PRODUCT_CATEGORY_OPTIONS = [
  '머그',
  '텀블러',
  '플레이트',
  '키링',
  '그립톡',
  '인형',
  '쿠션',
  '피규어',
  '마그넷',
  '기타',
];

const MATERIAL_OPTIONS = [
  '세라믹',
  '플라스틱',
  '아크릴',
  '금속',
  '봉제/패브릭',
  '레진/비닐',
  '고무',
  '투명 소재',
  '기타',
];

function getChipClass(isSelected: boolean) {
  return [
    'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
    isSelected
      ? 'border-brand-500 bg-brand-500 text-white'
      : 'border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-brand-500 hover:text-[var(--text-primary)]',
  ].join(' ');
}

function validateOpenAIImage(file: File): string | null {
  if (!OPENAI_IMAGE_TYPES.includes(file.type)) {
    return INVALID_IMAGE_TYPE_MESSAGE;
  }

  if (file.size > OPENAI_MAX_IMAGE_SIZE) {
    return MAX_IMAGE_SIZE_MESSAGE;
  }

  return null;
}

export default function OpenAISketchToRealPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [sketchImage, setSketchImage] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [textureImage, setTextureImage] = useState<File | null>(null);
  const [texturePreview, setTexturePreview] = useState<string | null>(null);
  const [productCategory, setProductCategory] = useState('');
  const [productCategoryOther, setProductCategoryOther] = useState('');
  const [materialPreset, setMaterialPreset] = useState('');
  const [materialOther, setMaterialOther] = useState('');
  const [quality, setQuality] = useState<QualityValue>('medium');
  const [preserveStructure, setPreserveStructure] = useState(true);
  const [fixedViewpoint, setFixedViewpoint] = useState(true);
  const [fixedBackground, setFixedBackground] = useState(true);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOtherCategory = productCategory === '기타';
  const isOtherMaterial = materialPreset === '기타';
  const isSubmitReady =
    Boolean(sketchImage && productCategory && materialPreset) &&
    (!isOtherCategory || productCategoryOther.trim().length > 0) &&
    (!isOtherMaterial || materialOther.trim().length > 0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const uploadImage = async (file: File): Promise<string> => {
    if (!accessToken) {
      throw new Error('인증이 필요합니다');
    }

    const validationMessage = validateOpenAIImage(file);
    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(`/api/upload/image?projectId=${projectId}`, {
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

    if (!sketchImage || !productCategory || !materialPreset) {
      setError(REQUIRED_INPUT_MESSAGE);
      return;
    }

    if (
      (isOtherCategory && !productCategoryOther.trim()) ||
      (isOtherMaterial && !materialOther.trim())
    ) {
      setError(OTHER_VALUE_MESSAGE);
      return;
    }

    const sketchValidationMessage = validateOpenAIImage(sketchImage);
    const textureValidationMessage = textureImage ? validateOpenAIImage(textureImage) : null;
    if (sketchValidationMessage || textureValidationMessage) {
      setError(sketchValidationMessage || textureValidationMessage);
      return;
    }

    setIsGenerating(true);

    try {
      const uploads: Promise<string>[] = [uploadImage(sketchImage)];
      if (textureImage) {
        uploads.push(uploadImage(textureImage));
      }

      const [sourceImagePath, textureImagePath] = await Promise.all(uploads);
      const trimmedInstructions = userInstructions.trim();

      const response = await apiFetch('/api/generations', {
        method: 'POST',
        token: accessToken,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          mode: 'sketch_to_real',
          provider: 'openai',
          providerModel: 'gpt-image-2',
          sourceImagePath,
          textureImagePath,
          prompt: trimmedInstructions || undefined,
          options: {
            outputCount: 2,
            quality,
            preserveStructure,
            fixedViewpoint,
            fixedBackground,
            transparentBackground,
            userInstructions: trimmedInstructions || undefined,
            productCategory,
            productCategoryOther: isOtherCategory ? productCategoryOther.trim() : undefined,
            materialPreset,
            materialOther: isOtherMaterial ? materialOther.trim() : undefined,
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

  const handleSketchUpload = (file: File) => {
    const validationMessage = validateOpenAIImage(file);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setSketchImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setSketchPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTextureUpload = (file: File) => {
    const validationMessage = validateOpenAIImage(file);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setTextureImage(file);
    const reader = new FileReader();
    reader.onload = (event) => setTexturePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSketchRemove = () => {
    setSketchImage(null);
    setSketchPreview(null);
  };

  const handleTextureRemove = () => {
    setTextureImage(null);
    setTexturePreview(null);
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
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              ✏️ 스케치 실사화 v2
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-8 text-[var(--text-secondary)]">
          스케치의 레이아웃과 비율을 유지하면서 실제 제품 재질로 표현합니다.
        </p>

        {error && <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500">{error}</div>}

        <div className="grid gap-8 lg:grid-cols-2">
          <ImageUploader
            label="스케치 이미지"
            description="제품화할 2D 스케치/드로잉을 업로드하세요"
            accept={OPENAI_IMAGE_ACCEPT}
            maxSize={OPENAI_MAX_IMAGE_SIZE}
            invalidTypeMessage={INVALID_IMAGE_TYPE_MESSAGE}
            maxSizeMessage={MAX_IMAGE_SIZE_MESSAGE}
            removeAriaLabel="스케치 이미지 제거"
            onUpload={handleSketchUpload}
            onRemove={handleSketchRemove}
            onError={setError}
            preview={sketchPreview}
          />

          <ImageUploader
            label="재질/질감 참조 이미지 (선택)"
            description="재질과 마감만 참고합니다"
            accept={OPENAI_IMAGE_ACCEPT}
            maxSize={OPENAI_MAX_IMAGE_SIZE}
            invalidTypeMessage={INVALID_IMAGE_TYPE_MESSAGE}
            maxSizeMessage={MAX_IMAGE_SIZE_MESSAGE}
            removeAriaLabel="재질 참조 이미지 제거"
            onUpload={handleTextureUpload}
            onRemove={handleTextureRemove}
            onError={setError}
            preview={texturePreview}
          />
        </div>

        <section className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-medium text-[var(--text-primary)]">제품 종류</legend>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                제품 형태는 스케치와 선택한 종류를 기준으로 유지합니다.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRODUCT_CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={productCategory === option}
                    onClick={() => setProductCategory(option)}
                    className={getChipClass(productCategory === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {isOtherCategory && (
                <div className="mt-4">
                  <Input
                    id="product-category-other"
                    label="기타 제품 종류"
                    value={productCategoryOther}
                    onChange={(event) => setProductCategoryOther(event.target.value)}
                    placeholder="예: 스마트톡 거치대"
                  />
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-[var(--text-primary)]">재질 가이드</legend>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                재질 참조 이미지가 있으면 마감과 질감은 참조 이미지를 우선합니다.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MATERIAL_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={materialPreset === option}
                    onClick={() => setMaterialPreset(option)}
                    className={getChipClass(materialPreset === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {isOtherMaterial && (
                <div className="mt-4">
                  <Input
                    id="material-other"
                    label="기타 재질 상세"
                    value={materialOther}
                    onChange={(event) => setMaterialOther(event.target.value)}
                    placeholder="예: 반투명 실리콘, 무광 코팅"
                  />
                </div>
              )}
            </fieldset>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
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
                  className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors has-[:checked]:bg-brand-500 has-[:checked]:text-white"
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
              <span className="text-sm text-[var(--text-secondary)]">구조 우선 유지</span>
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
                checked={fixedBackground}
                onChange={(event) => setFixedBackground(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">배경 고정</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={transparentBackground}
                onChange={(event) => setTransparentBackground(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">투명 배경 (누끼)</span>
            </label>
          </div>

          <div className="mt-6">
            <label
              htmlFor="sketch-v2-user-instructions"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              추가 지시사항
            </label>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              스케치 보존 규칙 안에서 추가 요청을 반영합니다.
            </p>
            <textarea
              id="sketch-v2-user-instructions"
              value={userInstructions}
              onChange={(event) => setUserInstructions(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="예: 세라믹 광택을 강하게, 모서리는 부드럽게"
              className="mt-3 w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
            <div className="mt-2 text-right text-xs text-[var(--text-secondary)]">
              {userInstructions.length}/2000
            </div>
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!isSubmitReady}
          >
            v2 목업 생성하기
          </Button>
        </div>
      </main>
    </div>
  );
}
