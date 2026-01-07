'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectApi, type Project } from '@/lib/api';

/**
 * 대시보드 페이지
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, logout, isLoading } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (accessToken) {
      loadProjects();
    }
  }, [accessToken]);

  const loadProjects = async () => {
    if (!accessToken) return;
    try {
      const response = await projectApi.list(accessToken, 1, 5);
      setProjects(response.data);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
    }
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  /**
   * 프로젝트 생성
   */
  const handleCreateProject = async () => {
    if (!accessToken || !newProjectName.trim()) return;

    try {
      setIsCreating(true);
      const response = await projectApi.create(accessToken, newProjectName.trim());
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
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            🎨 MockupAI
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              프로젝트
            </Link>
            <span className="text-sm text-[var(--text-secondary)]">
              {user.name}님
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 환영 메시지 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            안녕하세요, {user.name}님! 👋
          </h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            새로운 목업을 만들어 볼까요?
          </p>
        </div>

        {/* 빠른 시작 */}
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
            빠른 시작
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 새 프로젝트 */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 transition-colors hover:border-brand-500 hover:bg-[var(--bg-tertiary)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-2xl">
                ➕
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                새 프로젝트 만들기
              </span>
            </button>

            {/* IP 변경 */}
            <button
              onClick={() => {
                if (projects.length > 0) {
                  router.push(`/projects/${projects[0].id}/ip-change`);
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 transition-colors hover:border-brand-500 hover:bg-[var(--bg-tertiary)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-2xl">
                ⚡
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                IP 변경
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                캐릭터 교체 목업
              </span>
            </button>

            {/* 스케치 실사화 */}
            <button
              onClick={() => {
                if (projects.length > 0) {
                  router.push(`/projects/${projects[0].id}/sketch-to-real`);
                } else {
                  setShowCreateModal(true);
                }
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 transition-colors hover:border-brand-500 hover:bg-[var(--bg-tertiary)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-2xl">
                ✏️
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                스케치 실사화
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                2D → 3D 변환
              </span>
            </button>
          </div>
        </section>

        {/* 최근 프로젝트 */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              최근 프로젝트
            </h3>
            {projects.length > 0 && (
              <Link
                href="/projects"
                className="text-sm text-brand-500 hover:text-brand-400"
              >
                전체 보기 →
              </Link>
            )}
          </div>

          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 transition-all hover:border-brand-500 hover:shadow-lg"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-xl">
                    📁
                  </div>
                  <h4 className="font-medium text-[var(--text-primary)] group-hover:text-brand-500">
                    {project.name}
                  </h4>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-tertiary)]">
                      {project.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 text-center">
              <p className="text-[var(--text-tertiary)]">
                아직 프로젝트가 없습니다. 새 프로젝트를 만들어 보세요!
              </p>
            </div>
          )}
        </section>
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
            <div className="mt-6 flex justify-end gap-3">
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
