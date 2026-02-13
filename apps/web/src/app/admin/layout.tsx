'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { SidebarLink } from '@/components/admin/sidebar-link';
import {
  LayoutDashboard,
  Users,
  ImageIcon,
  FolderOpen,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 관리자 레이아웃
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // 대시보드로 돌아가기
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm text-[var(--text-secondary)]">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 권한 없음
  if (!user || user.role !== 'admin') {
    return null;
  }

  // 네비게이션 아이템
  const navItems = [
    {
      href: '/admin',
      icon: LayoutDashboard,
      label: '대시보드',
    },
    {
      href: '/admin/users',
      icon: Users,
      label: '사용자 관리',
    },
    {
      href: '/admin/generations',
      icon: ImageIcon,
      label: '생성 작업',
    },
    {
      href: '/admin/projects',
      icon: FolderOpen,
      label: '프로젝트',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[var(--border-default)] bg-[var(--bg-secondary)] transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 헤더 */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--border-default)] px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-base font-bold text-white shadow-md">
              🛡️
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              관리자
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 사용자 정보 */}
        <div className="border-b border-[var(--border-default)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {user.name}
              </p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* 하단 액션 */}
        <div className="space-y-2 border-t border-[var(--border-default)] p-3">
          <button
            onClick={handleBackToDashboard}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>대시보드로</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* 모바일 헤더 */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/80 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-lg font-bold text-[var(--text-primary)]">
            관리자 패널
          </h1>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
