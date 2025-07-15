'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/ui/sidebar';
import { format } from 'date-fns';
import { User, Seminar, Shift } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';

export default function ShiftsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [dateList, setDateList] = useState<string[]>([]);
  const [startTimes, setStartTimes] = useState<{ [key: string]: string }>({});
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const timeOptions: string[] = Array.from({ length: (21 - 9 + 1) * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
  });

  useEffect(() => {
    const stored = localStorage.getItem('loginUser');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      fetchInitialData(parsedUser.id);
    } else {
      toast.error('ユーザー情報が取得できていません。再ログインしてください。');
    }
  }, []);
  
  const fetchInitialData = async (userId: string) => {
    const { data: shiftData, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('shift_date', { ascending: false });

    if (shiftError) console.error('シフト取得失敗', shiftError);
    else setShifts(shiftData || []);

    const { data: seminarData, error: seminarError } = await supabase
      .from('seminars')
      .select('*')
      .eq('host_id', userId);
    
    if(seminarError) console.error('担当セミナー取得失敗', seminarError);
    else setSeminars(seminarData || []);
  };

  useEffect(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return format(d, 'yyyy-MM-dd');
    });
    setDateList(dates);
  }, []);

  const handleTimeChange = (date: string, time: string) => {
    setStartTimes((prev) => ({ ...prev, [date]: time }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('ユーザー情報が見つかりません');
      return;
    }

    const autoSelectedSeminarId = seminars.length > 0 ? seminars[0].id : null;
    const existingDates = new Set(shifts.map((s) => s.shift_date));

    const insertData = dateList
      .filter((date) => startTimes[date] && !existingDates.has(date))
      .map((date) => ({
        user_id: user.id,
        seminar_id: autoSelectedSeminarId,
        shift_date: date,
        shift_time: startTimes[date],
        status: '申' as const,
      }));

    if (insertData.length === 0) {
      toast.info('申請できる新しいシフトがありません。');
      return;
    }

    // 1. データベースにデータを挿入
    const { error } = await supabase.from('shifts').insert(insertData);

    // 2. エラーがあったかチェック
    if (error) {
      toast.error('送信に失敗しました：' + error.message);
    } else {
      // 3. 成功した場合、モーダル表示とフォームリセット
      setShowSuccessModal(true);
      setStartTimes({});
      
      // 4. 最後に、最新のデータをデータベースから再取得して画面を更新
      await fetchInitialData(user.id);
      toast.success('シフトを申請しました！');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('このシフトの削除を申請しますか？管理者の承認後に削除されます。')) return;

    // 1. データベースのstatusを'削除申請中'に更新
    const { error } = await supabase
      .from('shifts')
      .update({ status: '削' as const })
      .eq('id', id);

    // 2. エラーがあったかチェック
    if (error) {
      toast.error('削除申請に失敗しました：' + error.message);
    } else if (user) {
      // 3. 成功した場合、最新のデータをデータベースから再取得して画面を更新
      await fetchInitialData(user.id);
      toast.success('シフトの削除を申請しました。');
    }
  };

  const getWeekdayJp = (date: string) => {
    const day = new Date(date).getDay();
    return ['日', '月', '火', '水', '木', '金', '土'][day];
  };

  const renderStatusBadge = (status: '申' | '済' | '削' | string) => {
    switch (status) {
      case '済':
        return <Badge variant="default">承認済</Badge>;
      case '申':
        return <Badge variant="secondary">申請中</Badge>;
      case '削':
        return <Badge variant="destructive">削除申請中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">📝 シフト提出</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>担当セミナー</CardTitle>
              <CardDescription>担当セミナーがある場合、シフトは自動で紐付けられます。</CardDescription>
            </CardHeader>
            <CardContent>
              {seminars.length > 0 ? (
                <div className="space-y-2">
                  {seminars.map(seminar => (
                    <div key={seminar.id} className="p-2 border rounded-md text-sm font-medium">
                      {seminar.title}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">担当セミナーが登録されていません。</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>希望シフトを選択</CardTitle>
                <CardDescription>今月の希望シフトを提出してください。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dateList.map((date) => {
                const weekday = getWeekdayJp(date);
                const day = new Date(date).getDay();
                const submittedShift = shifts.find((s) => s.shift_date === date);
                const textColor = day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';
                
                return (
                  <div key={date} className={`flex items-center justify-between rounded-md border p-3 ${submittedShift ? 'bg-muted opacity-70' : 'bg-background'}`}>
                    <div className={`font-medium ${textColor}`}>
                      {format(new Date(date), 'M月d日')} ({weekday})
                    </div>
                    {submittedShift ? (
                        renderStatusBadge(submittedShift.status)
                    ) : (
                        <Select
                            value={startTimes[date] || ''}
                            onValueChange={(value) => handleTimeChange(date, value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="時間を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                    {time}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={handleSubmit}>
              この内容で申請する
            </Button>
          </div>

          <h3 className="text-xl font-bold mt-16 mb-4">📅 提出済みシフト履歴</h3>
          <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>時間</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.length > 0 ? (
                    shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{format(new Date(shift.shift_date), 'yyyy/MM/dd')}</TableCell>
                        <TableCell>{shift.shift_time}</TableCell>
                        <TableCell>
                          {renderStatusBadge(shift.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600" 
                            onClick={() => handleDeleteRequest(shift.id)}
                            disabled={shift.status === '削' || shift.status === '済'}
                          >
                            {shift.status === '削' ? '申請中' : '削除申請'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        提出済みシフトはまだありません。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </Card>
        </div>
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl text-green-600 font-bold">
                申請完了
              </DialogTitle>
              <div className="text-center text-muted-foreground pt-4">
                <p>シフトの申請が完了いたしました。</p>
                <p>管理者からの承認をお待ちください。</p>
              </div>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={() => setShowSuccessModal(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}