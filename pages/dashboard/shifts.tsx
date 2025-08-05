'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/ui/sidebar'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { User, Seminar, Shift } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';


export default function ShiftsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateList, setDateList] = useState<string[]>([]);
  // const [startTimes, setStartTimes] = useState<{ [key: string]: string }>({});
  const [startTimes, setStartTimes] = useState<{ [date: string]: string[] }>({});
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const timeOptions: string[] = Array.from({ length: 21 - 9 + 1 }, (_, i) => {
    const hour = i + 9;
    return `${String(hour).padStart(2, '0')}:00`;
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
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const dates = eachDayOfInterval({ start, end });
    setDateList(dates.map(d => format(d, 'yyyy-MM-dd')));
  }, [currentMonth]);

  // const handleTimeChange = (date: string, time: string) => {
  //   setStartTimes((prev) => {
  //     const newTimes = { ...prev };
  //     if (time === 'NONE') {
  //       // 'NONE'が選択されたら、その日付のキーを削除する
  //       delete newTimes[date];
  //     } else {
  //       // それ以外の時間が選択されたら、時間を設定する
  //       newTimes[date] = time;
  //     }
  //     return newTimes;
  //   });
  // };

  const handleTimeChange = (date: string, time: string, index: number) => {
    setStartTimes((prev) => {
      const times = prev[date] ? [...prev[date]] : [];
      if (time === 'NONE') {
        times.splice(index, 1); // 指定インデックスの時刻を削除
      } else {
        times[index] = time;
      }
      return { ...prev, [date]: times };
    });
  };

  const addNewTimeSlot = (date: string) => {
    setStartTimes((prev) => {
      const times = prev[date] ? [...prev[date]] : [];
      times.push(''); // 空の時刻枠を追加
      return { ...prev, [date]: times };
    });
  };
  
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('ユーザー情報が見つかりません');
      return;
    }

    const autoSelectedSeminarId = seminars.length > 0 ? seminars[0].id : null;
    const existingShiftKeys = new Set(shifts.map((s) => `${s.shift_date}_${s.shift_time}`));

    const insertData = dateList.flatMap((date) => {
      const times = startTimes[date];
      if (!times) return [];
    
      return times
        .filter((time) => !existingShiftKeys.has(`${date}_${time}`))
        .map((time) => ({
          user_id: user.id,
          seminar_id: autoSelectedSeminarId,
          shift_date: date,
          shift_time: time,
          status: '申' as const,
        }));
    });

    if (insertData.length === 0) {
      toast.info('申請できる新しいシフトがありません。');
      return;
    }

    const { error } = await supabase.from('shifts').insert(insertData);

    if (error) {
      toast.error('送信に失敗しました：' + error.message);
    } else {
      setShowSuccessModal(true);
      setStartTimes({});
      await fetchInitialData(user.id);
      toast.success('シフトを申請しました！');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('このシフトの削除を申請しますか？管理者の承認後に削除されます。')) return;

    const { error } = await supabase
      .from('shifts')
      .update({ status: '削' as const })
      .eq('id', id);

    if (error) {
      toast.error('削除申請に失敗しました：' + error.message);
    } else if (user) {
      await fetchInitialData(user.id);
      toast.success('シフトの削除を申請しました。');
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
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
          <h2 className="text-2xl font-bold mb-6">シフト提出</h2>

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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>希望シフトを選択</CardTitle>
                  <CardDescription>希望シフトを提出してください。</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={goToPreviousMonth}>＜ 前の月</Button>
                  <span className="font-bold text-lg w-32 text-center">
                    {format(currentMonth, 'yyyy年 M月')}
                  </span>
                  <Button variant="outline" onClick={goToNextMonth}>次の月 ＞</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
            {dateList.map((date) => {
              const weekday = getWeekdayJp(date);
              const day = new Date(date).getDay();
              const textColor = day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';
              const existingShifts = shifts.filter(s => s.shift_date === date);
                        
              return (
                <div key={date} className="rounded-md border p-3 bg-background">
                  <div className="flex justify-between items-start">
                    <div className={`font-medium ${textColor}`}>
                      {format(new Date(date), 'M月d日')} ({weekday})
                    </div>
              
                    <div className="flex flex-col gap-2 items-end w-[200px]">
                      {/* ✅ 既に提出済みのシフト表示（申請中・削除中も含む） */}
                      {existingShifts.map((s) => (
                        <div key={s.id} className="text-sm flex items-center gap-2">
                          <span>{s.shift_time ? s.shift_time.slice(0, 5) : '-'}</span>
                          {renderStatusBadge(s.status)}
                        </div>
                      ))}
            
                      {/* ✅ 新たに追加するシフトの選択欄（複数可） */}
                      {startTimes[date]?.map((time, idx) => (
                        <Select
                          key={idx}
                          value={time}
                          onValueChange={(value) => handleTimeChange(date, value, idx)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="時間を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE" className="text-red-500">削除</SelectItem>
                            {timeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ))}
            
                      {/* ✅ 常に追加ボタンを表示 */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addNewTimeSlot(date)}
                      >
                        +追加
                      </Button>
                    </div>
                  </div>
                </div>
              );
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
                        <TableCell>
                          {shift.shift_time ? shift.shift_time.slice(0, 5) : '-'}
                        </TableCell>
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
  )
}