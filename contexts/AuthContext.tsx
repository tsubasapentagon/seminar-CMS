'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // next/navigationを使用
import { User } from '@/types';

// Contextに保存するデータの型にloginとlogoutを追加
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // ページ読み込み時にlocalStorageから復元するロジックはそのまま
    try {
      const storedUser = localStorage.getItem('loginUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('loginUser');
    }
    setIsLoading(false);
  }, []);

  // ★ login関数を定義
  const login = (userData: User) => {
    localStorage.setItem('loginUser', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard'); // ダッシュボードへ遷移
  };

  // ★ logout関数を定義
  const logout = () => {
    localStorage.removeItem('loginUser');
    setUser(null);
    router.push('/login'); // ログインページへ遷移
  };

  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}