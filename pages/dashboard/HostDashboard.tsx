'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, CheckCircle, Hourglass } from 'lucide-react';

// propsでuser情報を受け取る
export default function HostDashboard({ user }: { user: User | null }) {
  const [shiftStats, setShiftStats] = useState({ pending: 0, approved: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchShiftStats = async () => {
      setIsLoading(true);
      
      // ログインしているユーザーIDに紐づくシフトのみを取得
      const { data, error } = await supabase
        .from('shifts')
        .select('status')
        .eq('user_id', user.id);

      if (error) {
        console.error("シフト状況の取得に失敗しました", error);
      } else {
        const pending = data?.filter(s => s.status === '申').length || 0;
        const approved = data?.filter(s => s.status === '済').length || 0;
        setShiftStats({ pending, approved });
      }
      setIsLoading(false);
    };

    fetchShiftStats();
  }, [user]); // userオブジェクトが取得できたら実行

  return (
    <div className="p-6 bg-muted/40 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">ようこそ、{user?.name || 'ゲスト'}さん！</h1>
        <p className="text-muted-foreground">今月のシフト提出状況を確認しましょう。</p>

        {/* シフト状況サマリー */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">申請中のシフト</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{shiftStats.pending}件</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">承認済のシフト</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{shiftStats.approved}件</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* クイックリンク */}
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>シフトを提出・確認する</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/shifts" passHref>
              <Button className="w-full justify-start gap-2">
                <Edit size={16} /> シフト提出ページへ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}