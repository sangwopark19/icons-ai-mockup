'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { projectApi, type Project } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRelativeTime } from '@/lib/utils';

/**
 * 프로젝트 목록 페이지
 */
export default function ProjectsPage() {
  const router = useRouter();
  const { accessToken, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (accessToken) {
      loadProjects();
    }
  }, [accessToken]);

  const loadProjects = async () => {
    if (!accessToken) return;
    
    try {
      setIsLoading(true);
      const response = await projectApi.list(accessToken);
      setProjects(response.data);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로젝트 생성
  const handleCreateProject = async () => {
    if (!accessToken || !newProjectName.trim()) return;

    try {
      setIsCreating(true);
      const response = await projectApi.create(accessToken, newProjectName.trim());
      setProjects((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('');
      // 생성된 프로젝트로 이동
      router.push(`/projects/${response.data.id}`);
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
    } finally {
      setIsCreating(false);
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
          <Link href="/dashboard" className="text-xl font-bold text-[var(--text-primary)]">
            🎨 MockupAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-sm font-medium text-brand-500"
            >
              프로젝트
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/login'); }}>
              로그아웃
            </Button>
          </nav>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">프로젝트</h1>
            <p className="mt-1 text-[var(--text-secondary)]">
              {projects.length}개의 프로젝트
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            ➕ 새 프로젝트
          </Button>
        </div>

        {/* 프로젝트 그리드 */}
        {projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-brand-500 hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-xl">
                  📁
                </div>
                <h3 className="mb-1 font-medium text-[var(--text-primary)] group-hover:text-brand-500">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-[var(--text-tertiary)]">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-[var(--text-tertiary)]">
                  {formatRelativeTime(project.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-12 text-center">
            <div className="mb-4 text-5xl">📂</div>
            <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
              아직 프로젝트가 없습니다
            </h3>
            <p className="mb-4 text-[var(--text-secondary)]">
              첫 프로젝트를 만들어 목업 생성을 시작하세요!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              프로젝트 만들기
            </Button>
          </div>
        )}
      </main>

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-secondary)] p-6">
            <h2 className="mb-4 text-xl font-semibold text-[var(--text-primary)]">
              새 프로젝트 만들기
            </h2>
            <Input
              label="프로젝트 이름"
              placeholder="예: 2026 봄 신상품"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </Button>
              <Button
                onClick={handleCreateProject}
                isLoading={isCreating}
                disabled={!newProjectName.trim()}
              >
                만들기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
