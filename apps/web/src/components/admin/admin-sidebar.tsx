'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ImageIcon, Key, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '사용자 관리', icon: Users },
  { href: '/admin/content', label: '생성/콘텐츠', icon: ImageIcon },
  { href: '/admin/api-keys', label: 'API 키', icon: Key },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col h-screen w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-default)]">
      {/* User info at top */}
      <div className="p-4 border-b border-[var(--border-default)]">
        {onClose && (
          <button
            onClick={onClose}
            className="mb-3 md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="메뉴 닫기"
          >
            <X size={20} />
          </button>
        )}
        <p className="font-semibold text-[var(--text-primary)] truncate">{user?.name}</p>
        <p className="text-sm text-[var(--text-secondary)] truncate">{user?.email}</p>
      </div>

      {/* Nav items in middle */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* "메인으로" link at bottom */}
      <div className="p-4 border-t border-[var(--border-default)]">
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          메인으로
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-primary)]"
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative z-10">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
