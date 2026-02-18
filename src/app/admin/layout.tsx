'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { AdminHeader } from '@/components/layout/admin-header';

const ADMIN_ROLES = ['admin', 'super_admin', 'manager'];

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

  // Show nothing while checking auth
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Check if user has admin access
  const userRole = user?.role?.name?.toLowerCase();
  const hasAdminAccess = userRole && ADMIN_ROLES.includes(userRole);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminHeader />
      <main className="pt-16 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}
