'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Seminar, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, CalendarClock, Users, Settings, FileSignature} from 'lucide-react';

type DashboardStats = {
  seminarCount: number;
  pendingShiftCount: number;
  hostCount: number;
};

// propsでuser情報を受け取るように変更
export default function AdminDashboard({ user }: { user: User | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSeminars, setRecentSeminars] = useState<Seminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [seminarCountRes, pendingShiftCountRes, hostCountRes, recentSeminarsRes] = await Promise.all([
        supabase.from('seminars').select('id', { count: 'exact', head: true }),
        supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('status', '申'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', '主催'),
        supabase.from('seminars').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        seminarCount: seminarCountRes.count ?? 0,
        pendingShiftCount: pendingShiftCountRes.count ?? 0,
        hostCount: hostCountRes.count ?? 0,
      });

      setRecentSeminars(recentSeminarsRes.data || []);
      
      setIsLoading(false);
    };

    fetchData();
  }, []); // このコンポーネントが表示された時に一度だけデータを取得

  // ローディング中の表示
  if (isLoading) {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">ようこそ、{user?.name || 'ゲスト'}さん！</h1>
            <p>データを読み込んでいます...</p>
        </div>
    )
  }

  return (
    <div className="p-6 bg-muted/40 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">ようこそ、{user?.name || 'ゲスト'}さん！</h1>
        
        {/* サマリーカード */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総セミナー数</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.seminarCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">申請中のシフト</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingShiftCount}</div>
              <p className="text-xs text-muted-foreground">件のシフトが承認待ちです</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総主催者数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.hostCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* 最近のセミナー */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>最近追加されたセミナー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSeminars.map(seminar => (
                  <div key={seminar.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{seminar.title}</p>
                      <p className="text-sm text-muted-foreground">
                        作成日: {new Date(seminar.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* クイックリンク */}
          <Card className="lg:col-span-3">
              <CardHeader>
              <CardTitle>クイックメニュー</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Link href="/dashboard/seminars" passHref>
                <Button className="w-full justify-start gap-2" variant="outline"><BookOpen size={16} /> セミナー管理</Button>
              </Link>
              <Link href="/dashboard/shift-review" passHref>
                  <Button className="w-full justify-start gap-2" variant="outline"><FileSignature size={16}/> シフト確認・承認</Button>
              </Link>
              <Link href="/dashboard/settings" passHref>
                <Button className="w-full justify-start gap-2" variant="outline"><Settings size={16} /> 設定</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}