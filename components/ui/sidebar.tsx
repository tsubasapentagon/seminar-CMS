'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Sidebar() {
    const { user, isLoading, logout } = useAuth();

  const adminLinks = [
    { href: '/dashboard', label: 'ダッシュボード' },
    { href: '/dashboard/seminars', label: 'セミナー管理' },
    { href: '/dashboard/shift-review', label: 'シフト確認・承認' },
    { href: '/dashboard/shifts', label: 'シフト提出' },
    { href: '/dashboard/users', label: 'ユーザー管理' },
    { href: '/dashboard/settings', label: '設定' },
  ];

  const hostLinks = [
    { href: '/dashboard/shifts', label: 'シフト提出' },
  ];

  const navLinks = user?.status === '管理者' ? adminLinks : hostLinks;

  const handleLogout = () => {
    localStorage.removeItem('loginUser');
    window.location.href = '/login';
    logout();
  };

  return (
    <aside className="fixed top-0 left-0 flex h-screen w-64 flex-col bg-slate-800 p-4 text-white shadow-lg">
      <div className="mb-8 border-b border-slate-700 pb-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold tracking-tight">Seminar CMS</h1>
        </Link>
      </div>

      {isLoading ? (
        <div className="mb-8">
          <p className="text-sm text-slate-400">読み込み中...</p>
        </div>
      ) : user ? (
        <div className="mb-8 border-b border-slate-600 pb-4">
          <p className="text-xs text-slate-400">ログイン中：</p>
          <p className="text-lg font-semibold leading-snug">{user.name}</p>
          <p className="text-xs text-slate-400 mt-1">ステータス：{user.status}</p>
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-sm text-red-400">ログインしていません</p>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-2">
        {user && navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-md bg-slate-700/50 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-600/20 hover:text-red-300"
        >
          ログアウト
        </button>
      </div>
    </aside>
  );
}