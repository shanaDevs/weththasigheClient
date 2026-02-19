'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

const ADMIN_ROLES = ['admin', 'super_admin', 'manager', 'cashier', 'super_cashier', 'staff', 'pharmacist'];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      const userRole = user?.role?.name?.toLowerCase();
      if (!userRole || !ADMIN_ROLES.includes(userRole)) {
        router.push('/');
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  // Show spinner while checking auth
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  const userRole = user?.role?.name?.toLowerCase();
  const hasAdminAccess = userRole && ADMIN_ROLES.includes(userRole);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content — offset for mobile top bar (pt-14) and desktop sidebar (handled by spacer div in sidebar) */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-auto min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
