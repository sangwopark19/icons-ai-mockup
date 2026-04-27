'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { API_URL, apiFetch, type HistoryGenerationItem } from '@/lib/api';

/**
 * 히스토리 페이지
 */
export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [history, setHistory] = useState<HistoryGenerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * 히스토리(생성 전체) 삭제
   */
  const handleDeleteGeneration = async (e: React.MouseEvent, generationId: string) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation();

    if (!accessToken) return;
    if (
      !confirm(
        '히스토리 삭제\n이 생성 기록과 모든 이미지를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.'
      )
    )
      return;

    try {
      setDeletingId(generationId);

      const response = await apiFetch(`/api/generations/${generationId}`, {
        method: 'DELETE',
        token: accessToken,
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      // 로컬 상태에서 삭제된 항목 제거
      setHistory((prev) => prev.filter((item) => item.id !== generationId));
      alert('히스토리가 삭제되었습니다.');
    } catch (error) {
      console.error('히스토리 삭제 실패:', error);
      alert('히스토리 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * 히스토리 로드
   */
  const loadHistory = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await apiFetch(
        `/api/generations/project/${projectId}/history?page=${page}&limit=20`,
        { token: accessToken }
      );

      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, projectId, page]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadHistory();
    }
  }, [authLoading, isAuthenticated, loadHistory]);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

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
              ← 뒤로
            </Link>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">📚 히스토리</h1>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {history.length > 0 ? (
          <>
            {/* 갤러리 그리드 */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {history.map((item) => (
                <Link
                  key={item.id}
                  href={`/projects/${projectId}/generations/${item.id}`}
                  className="hover:border-brand-500 group overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] transition-all hover:shadow-lg"
                >
                  <div className="aspect-square bg-[var(--bg-tertiary)]">
                    {item.selectedImage ? (
                      <img
                        src={`${API_URL}/uploads/${item.selectedImage.thumbnailPath || item.selectedImage.filePath}`}
                        alt="저장된 목업"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl text-[var(--text-tertiary)]">
                        🖼️
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{item.mode === 'ip_change' ? '⚡' : '✏️'}</span>
                        <span className="text-[var(--text-secondary)]">
                          {item.mode === 'ip_change' ? 'IP 변경' : '스케치 실사화'}
                        </span>
                        {item.mode === 'ip_change' && (
                          <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
                            {item.provider === 'openai' ? 'v2' : 'v1'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeleteGeneration(e, item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-full p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                        title="히스토리 삭제"
                      >
                        {deletingId === item.id ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <span className="text-base">🗑️</span>
                        )}
                      </button>
                    </div>
                    {item.character && (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        캐릭터: {item.character.name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="flex items-center px-4 text-sm text-[var(--text-secondary)]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-12 text-center">
            <div className="mb-4 text-5xl">📂</div>
            <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
              아직 저장된 목업이 없습니다
            </h3>
            <p className="mb-4 text-[var(--text-secondary)]">
              IP 변경 결과를 저장하면 여기에서 다시 열 수 있습니다.
            </p>
            <Button onClick={() => router.push(`/projects/${projectId}`)}>목업 생성하기</Button>
          </div>
        )}
      </main>
    </div>
  );
}
