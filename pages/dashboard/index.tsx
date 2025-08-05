'use client';

import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/pages//dashboard/AdminDashboard';
import HostDashboard from '@/pages/dashboard/HostDashboard';
import { User } from '@/types';

export default function DashboardSwitcherPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (user?.status === '管理者') {
    return <AdminDashboard user={user as User} />;
  }
  
  return <HostDashboard user={user as User} />;
}