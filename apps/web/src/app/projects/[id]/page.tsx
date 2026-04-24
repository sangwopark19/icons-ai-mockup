'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { projectApi, type Project } from '@/lib/api';
import { Button } from '@/components/ui/button';

/**
 * 프로젝트 상세 페이지
 */
export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { accessToken, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 프로젝트 로드
  useEffect(() => {
    if (accessToken && projectId) {
      loadProject();
    }
  }, [accessToken, projectId]);

  const loadProject = async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const response = await projectApi.get(accessToken, projectId);
      setProject(response.data);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      router.push('/projects');
    } finally {
      setIsLoading(false);
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-[var(--text-primary)]">
              🎨 MockupAI
            </Link>
            <span className="text-[var(--text-tertiary)]">/</span>
            <Link href="/projects" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              프로젝트
            </Link>
            <span className="text-[var(--text-tertiary)]">/</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{project.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login'); }}>
            로그아웃
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <aside className="w-60 border-r border-[var(--border-default)] bg-[var(--bg-secondary)] min-h-[calc(100vh-64px)]">
          <nav className="p-4">
            <div className="mb-4">
              <h3 className="text-xs font-medium uppercase text-[var(--text-tertiary)]">작업 선택</h3>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href={`/projects/${projectId}/ip-change`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span>⚡</span>
                  <span>IP 변경 v1</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/projects/${projectId}/ip-change/openai`}
                  className="flex items-center gap-3 rounded-lg border border-brand-500/30 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span>⚡</span>
                  <span>IP 변경 v2</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/projects/${projectId}/sketch-to-real`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span>✏️</span>
                  <span>스케치 실사화</span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/projects/${projectId}/history`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span>📚</span>
                  <span>히스토리</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-[var(--text-secondary)]">{project.description}</p>
            )}
          </div>

          {/* 통계 */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {project.generationCount || 0}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">생성 횟수</div>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {project.savedImageCount || 0}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">저장된 목업</div>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {project.characterCount || 0}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">IP 캐릭터</div>
            </div>
          </div>

          {/* 작업 선택 */}
          <h2 className="mb-4 text-lg font-medium text-[var(--text-primary)]">작업 선택</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={`/projects/${projectId}/ip-change`}
              className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-brand-500 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10 text-2xl">
                ⚡
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-medium text-[var(--text-primary)] group-hover:text-brand-500">
                  IP 변경 v1
                </h3>
                <span className="rounded border border-[var(--border-default)] px-1.5 py-0.5 text-xs font-semibold text-[var(--text-tertiary)]">
                  v1
                </span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                기존 방식으로 제품의 캐릭터를 변경합니다.
              </p>
            </Link>

            <Link
              href={`/projects/${projectId}/ip-change/openai`}
              className="group rounded-xl border border-brand-500/60 bg-[var(--bg-secondary)] p-6 transition-all hover:border-brand-400 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/10 text-2xl">
                ⚡
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-lg font-medium text-[var(--text-primary)] group-hover:text-brand-500">
                  IP 변경 v2
                </h3>
                <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-xs font-semibold text-brand-400">
                  v2
                </span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                제품 구조와 시점을 더 강하게 유지하며 새 캐릭터를 적용합니다.
              </p>
            </Link>

            <Link
              href={`/projects/${projectId}/sketch-to-real`}
              className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-brand-500 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-2xl">
                ✏️
              </div>
              <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)] group-hover:text-brand-500">
                스케치 실사화
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                2D 스케치를 실제 제품처럼 변환합니다
              </p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
