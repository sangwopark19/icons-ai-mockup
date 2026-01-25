'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { GenerationOptions } from '@/components/generation-options';
import type { GenerationOptionsV3 } from '@icons/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Generation 히스토리 아이템 타입
 */
interface GenerationHistoryItem {
  id: string;
  mode: string;
  createdAt: string;
  selectedImage: {
    id: string;
    filePath: string;
    thumbnailPath: string | null;
  } | null;
  character: {
    id: string;
    name: string;
  } | null;
}

/**
 * 스타일 복사 페이지
 * 
 * 기존 결과물(히스토리)을 선택하고 새 캐릭터 이미지를 업로드하여
 * 스타일을 복사한 새로운 이미지를 생성합니다.
 */
export default function StyleCopyPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  // 상태 관리
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<string | null>(null);
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterPreview, setCharacterPreview] = useState<string | null>(null);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptionsV3>({
    viewpointLock: false,
    whiteBackground: false,
    userInstructions: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 히스토리 로드
  useEffect(() => {
    if (!authLoading && isAuthenticated && accessToken) {
      loadHistory();
    }
  }, [authLoading, isAuthenticated, accessToken]);

  /**
   * 히스토리 목록 로드
   */
  const loadHistory = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/generations/project/${projectId}/history?page=1&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 캐릭터 이미지 선택 핸들러
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setCharacterImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setCharacterPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * 스타일 복사 요청 핸들러
   */
  const handleSubmit = async () => {
    if (!selectedGeneration) {
      alert('스타일을 복사할 히스토리를 선택해주세요.');
      return;
    }

    if (!characterImage) {
      alert('새 캐릭터 이미지를 업로드해주세요.');
      return;
    }

    if (!accessToken) return;

    try {
      setIsSubmitting(true);

      // 1단계: 캐릭터 이미지 업로드 (Character 생성)
      const characterFormData = new FormData();
      characterFormData.append('file', characterImage);

      const characterName = `style-copy-${Date.now()}`;
      const uploadResponse = await fetch(
        `${API_URL}/api/characters?projectId=${projectId}&name=${encodeURIComponent(characterName)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: characterFormData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error?.message || '캐릭터 이미지 업로드 실패');
      }

      const characterId = uploadData.data.id;

      // 2단계: 스타일 복사 API 호출
      const styleCopyResponse = await fetch(
        `${API_URL}/api/generations/${selectedGeneration}/style-copy`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId,
          }),
        }
      );

      const styleCopyData = await styleCopyResponse.json();

      if (!styleCopyResponse.ok) {
        throw new Error(styleCopyData.error?.message || '스타일 복사 요청 실패');
      }

      // 성공 시 생성 결과 페이지로 이동
      if (styleCopyData.data?.id) {
        router.push(`/projects/${projectId}/generations/${styleCopyData.data.id}`);
      } else {
        router.push(`/projects/${projectId}/history`);
      }
    } catch (error) {
      console.error('스타일 복사 실패:', error);
      alert(error instanceof Error ? error.message : '스타일 복사에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중
  if (authLoading || isLoading) {
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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ← 뒤로
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              🎨 스타일 복사
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-[var(--text-secondary)]">
            기존 결과물의 스타일을 유지하면서 새로운 캐릭터로 이미지를 생성합니다.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 왼쪽: 히스토리 선택 */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
              1. 스타일을 복사할 히스토리 선택
            </h2>
            
            {history.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedGeneration(item.id)}
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
                      selectedGeneration === item.id
                        ? 'border-brand-500 shadow-lg'
                        : 'border-[var(--border-default)] hover:border-brand-300'
                    }`}
                  >
                    {/* 이미지 */}
                    <div className="aspect-square bg-[var(--bg-tertiary)]">
                      {item.selectedImage ? (
                        <img
                          src={`${API_URL}/uploads/${item.selectedImage.thumbnailPath || item.selectedImage.filePath}`}
                          alt="Generated mockup"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-[var(--text-tertiary)]">
                          🖼️
                        </div>
                      )}
                    </div>
                    {/* 정보 */}
                    <div className="bg-[var(--bg-secondary)] p-2 text-left">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span>{item.mode === 'ip_change' ? '⚡' : '✏️'}</span>
                        <span>{item.mode === 'ip_change' ? 'IP 변경' : '스케치'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 text-center">
                <div className="mb-4 text-4xl">📂</div>
                <p className="text-[var(--text-secondary)]">
                  아직 히스토리가 없습니다.
                </p>
              </div>
            )}
          </section>

          {/* 오른쪽: 캐릭터 업로드 & 옵션 */}
          <section className="space-y-6">
            {/* 캐릭터 업로드 */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
                2. 새 캐릭터 이미지 업로드
              </h2>
              
              <div className="rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)] p-8">
                {characterPreview ? (
                  <div className="space-y-4">
                    <img
                      src={characterPreview}
                      alt="Character preview"
                      className="mx-auto max-h-64 rounded-lg object-contain"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCharacterImage(null);
                        setCharacterPreview(null);
                      }}
                      className="w-full"
                    >
                      다른 이미지 선택
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-4">
                    <div className="text-5xl">📤</div>
                    <div className="text-center">
                      <p className="text-[var(--text-primary)]">
                        클릭하여 이미지 업로드
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                        PNG, JPG (최대 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 생성 옵션 */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
                3. 생성 옵션 설정
              </h2>
              <GenerationOptions
                defaultOptions={generationOptions}
                onOptionsChange={setGenerationOptions}
              />
            </div>

            {/* 생성 버튼 */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedGeneration || !characterImage || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  생성 중...
                </>
              ) : (
                '스타일 복사 시작'
              )}
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
