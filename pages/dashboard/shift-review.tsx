'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, Shift, Seminar } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Check, Mail } from "lucide-react";

type ShiftWithSeminar = Shift & {
  seminars: { title: string } | null;
};

type HostWithSeminars = User & {
  seminars: Pick<Seminar, 'id' | 'title'>[];
};

export default function ShiftReviewPage() {
  const [hosts, setHosts] = useState<HostWithSeminars[]>([]);
  const [shiftCounts, setShiftCounts] = useState<{
    [key: string]: { submitted: number; approved: number; pendingDelete: number };
  }>({});
  const [selectedHost, setSelectedHost] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [shifts, setShifts] = useState<ShiftWithSeminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data: hostData, error: hostError } = await supabase
      .from("users").select("*").eq("status", "主催");
    if (hostError) {
      console.error("主催者取得エラー:", hostError.message);
      setIsLoading(false);
      return;
    }
    if (!hostData) {
      setIsLoading(false);
      return;
    }

    const { data: seminarData, error: seminarError } = await supabase
      .from("seminars").select("id, title, host_id");
    if (seminarError) {
      console.error("セミナー取得エラー:", seminarError.message);
      setIsLoading(false);
      return;
    }
    
    const hostIds = hostData.map(h => h.id);
    const { data: allShifts, error: allShiftsError } = await supabase
      .from("shifts").select("user_id, status").in("user_id", hostIds);
    if (allShiftsError) {
      console.error("全シフト取得エラー:", allShiftsError.message);
      setIsLoading(false);
      return;
    }

    const counts: { [key: string]: { submitted: number; approved: number; pendingDelete: number } } = {};
    const hostsWithDetails: HostWithSeminars[] = hostData.map(host => {
      const assignedSeminars = seminarData?.filter(s => s.host_id === host.id) || [];
      const userShifts = allShifts?.filter(s => s.user_id === host.id) || [];
      counts[host.id] = {
        submitted: userShifts.filter((s) => s.status === "申").length,
        approved: userShifts.filter((s) => s.status === "済").length,
        pendingDelete: userShifts.filter((s) => s.status === "削").length,
      };
      return { ...host, seminars: assignedSeminars };
    });
    
    setHosts(hostsWithDetails);
    setShiftCounts(counts);
    setIsLoading(false);
  };
  
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  const handleSendCompletionEmail = async (host: HostWithSeminars) => {
    if (!confirm(`${host.name}さんに承認完了メールを送信しますか？(現在承認済みのシフトが通知されます)`)) return;

    setIsSendingEmail(host.id);

    const { error } = await supabase.functions.invoke('shift-approval-mailer', {
      body: { host_id: host.id }
    });

    if (error) {
      toast.error(`メールの送信に失敗しました: ${error.message}`);
    } else {
      toast.success(`${host.name}さんに承認完了メールを送信しました。`);
    }
    
    setIsSendingEmail(null);
  };

  const fetchShifts = async (hostId: string) => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*, seminars(title)")
      .eq("user_id", hostId)
      .order("shift_date", { ascending: true });

    if (error) {
      toast.error("シフト詳細の取得に失敗しました。");
    } else {
      setShifts(data || []);
    }
  };

  const openModal = (host: User) => {
    setSelectedHost(host);
    fetchShifts(host.id);
    setShowModal(true);
  };

  const handleApproveShift = async (shiftId: string) => {
    const { error } = await supabase
      .from("shifts")
      .update({ status: "済" })
      .eq("id", shiftId);
    if (error) {
      toast.error("承認に失敗しました");
    } else {
      toast.success("シフトを1件承認しました");
      if (selectedHost) fetchShifts(selectedHost.id);
      fetchInitialData();
    }
  }

  const handleConfirmDelete = async (shiftId: string) => {
    if (!confirm("このシフトを完全に削除します。よろしいですか？")) return;
    const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
    if (error) {
      toast.error("削除に失敗しました");
    } else {
      toast.success("シフトを削除しました");
      if (selectedHost) fetchShifts(selectedHost.id);
      fetchInitialData();
    }
  }

  const confirmAllShifts = async () => {
    if (!selectedHost) return;
    const { error } = await supabase
      .from("shifts")
      .update({ status: "済" })
      .eq("user_id", selectedHost.id)
      .eq("status", "申");

    if (error) {
      toast.error("一括承認に失敗しました");
    } else {
      toast.success("申請中シフトをすべて承認しました");
      fetchShifts(selectedHost.id);
      fetchInitialData();
    }
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
  }

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">シフト確認・承認</h2>

          {isLoading ? (
            <p>読み込み中...</p>
          ) : hosts.length === 0 ? (
            <p className="text-sm text-gray-500">
              主催者ユーザーが見つかりません。
            </p>
          ) : (
            <div className="space-y-4">
              {hosts.map((host) => (
                <Card key={host.id}>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold">{host.name}</span>
                              <span className="text-sm text-muted-foreground">{host.company || "会社名なし"}</span>
                            </div>
                            <div className="text-sm text-right">
                              {shiftCounts[host.id]?.submitted > 0 && <p>申請中: <span className="font-bold">{shiftCounts[host.id].submitted}件</span></p>}
                              {shiftCounts[host.id]?.pendingDelete > 0 && <p className="text-red-500">削除申請: <span className="font-bold">{shiftCounts[host.id].pendingDelete}件</span></p>}
                            </div>
                          </div>
                          <div className="flex items-start justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              {host.seminars && host.seminars.length > 0 ? (
                                host.seminars.map(seminar => (
                                  <Badge key={seminar.id} variant="outline">{seminar.title}</Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">担当セミナーなし</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">承認済: {shiftCounts[host.id]?.approved || 0}件</p>
                          </div>
                        </div>
                        <div className="ml-6 flex items-center gap-2">
                          <Button 
                            onClick={() => handleSendCompletionEmail(host)} 
                            variant="outline"
                            size="sm"
                            disabled={isSendingEmail === host.id}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {isSendingEmail === host.id ? '送信中...' : '完了メールを送る'}
                          </Button>
                          <Button onClick={() => openModal(host)}>詳細を見る</Button>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedHost?.name}さんのシフト詳細</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-2">
                {shifts.length > 0 ? (
                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="flex justify-between items-center text-sm border-b py-2 pr-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">{shift.seminars?.title ?? 'セミナー情報なし'}</span>
                          <span className="text-muted-foreground">{shift.shift_date} {shift.shift_time ? shift.shift_time.slice(0, 5) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(shift.status)}
                          {shift.status === '申' && (
                            <Button size="sm" variant="outline" onClick={() => handleApproveShift(shift.id)}>
                              <Check className="h-4 w-4 mr-2" />承認
                            </Button>
                          )}
                          {shift.status === '削' && (
                            <Button size="sm" variant="destructive" onClick={() => handleConfirmDelete(shift.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />削除を確定
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">この主催者からのシフトはありません。</p>
                )}
              </ScrollArea>
              <DialogFooter>
                <p className="text-sm text-muted-foreground mr-auto">一括操作</p>
                <Button variant="default" onClick={confirmAllShifts} disabled={shifts.filter(s => s.status === '申').length === 0}>
                  全ての「申請中」を承認
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
