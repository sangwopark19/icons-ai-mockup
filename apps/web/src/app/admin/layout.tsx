import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
