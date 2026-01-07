'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * 스케치 실사화 페이지
 */
export default function SketchToRealPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [sketchImage, setSketchImage] = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [textureImage, setTextureImage] = useState<File | null>(null);
  const [texturePreview, setTexturePreview] = useState<string | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [transparentBg, setTransparentBg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  /**
   * 이미지 업로드
   */
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/image?projectId=${projectId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || '업로드 실패');
    }

    return data.data.filePath;
  };

  /**
   * 목업 생성
   */
  const handleGenerate = async () => {
    if (!sketchImage || !accessToken) return;

    setError(null);
    setIsGenerating(true);

    try {
      // 이미지 업로드
      const uploads: Promise<string>[] = [uploadImage(sketchImage)];
      if (textureImage) {
        uploads.push(uploadImage(textureImage));
      }

      const [sourceImagePath, textureImagePath] = await Promise.all(uploads);

      // 생성 요청
      const response = await fetch(`${API_URL}/api/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectId,
          mode: 'sketch_to_real',
          sourceImagePath,
          textureImagePath,
          prompt: additionalPrompt || undefined,
          options: {
            transparentBackground: transparentBg,
            outputCount: 2,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '생성 요청 실패');
      }

      // 결과 페이지로 이동
      router.push(`/projects/${projectId}/generations/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 파일 선택 핸들러
   */
  const handleSketchUpload = (file: File) => {
    setSketchImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setSketchPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTextureUpload = (file: File) => {
    setTextureImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setTexturePreview(e.target?.result as string);
    reader.readAsDataURL(file);
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
      {/* 헤더 */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}`} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              ← 뒤로
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              ✏️ 스케치 실사화
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-8 text-[var(--text-secondary)]">
          2D 스케치를 실제 제품처럼 변환합니다
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 스케치 이미지 */}
          <ImageUploader
            label="스케치 이미지"
            description="2D 스케치/드로잉을 업로드하세요"
            onUpload={handleSketchUpload}
            onError={setError}
            preview={sketchPreview}
          />

          {/* 참조 질감 이미지 */}
          <ImageUploader
            label="참조 질감 이미지 (선택)"
            description="원하는 질감/재질 참조 이미지"
            onUpload={handleTextureUpload}
            onError={setError}
            preview={texturePreview}
          />
        </div>

        {/* 추가 프롬프트 */}
        <div className="mt-8">
          <Input
            label="추가 지시사항 (선택)"
            placeholder="예: 봉제 인형 느낌으로, 광택있는 플라스틱 재질..."
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
          />
        </div>

        {/* 옵션 */}
        <div className="mt-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
          <h3 className="mb-4 font-medium text-[var(--text-primary)]">생성 옵션</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-tertiary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">
                투명 배경 (누끼)
              </span>
            </label>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            onClick={handleGenerate}
            isLoading={isGenerating}
            disabled={!sketchImage}
          >
            목업 생성하기
          </Button>
        </div>
      </main>
    </div>
  );
}
