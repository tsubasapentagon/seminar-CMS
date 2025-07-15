// app/dashboard/settings/page.tsx
'use client';
import Sidebar from "@/components/ui/sidebar";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Industry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner'; // sonnerなど、通知ライブラリがあると便利です

export default function SettingsPage() {
  // 業界リストを保持するstate
  const [industries, setIndustries] = useState<Industry[]>([]);
  // 新規追加用の業界名を保持するstate
  const [newIndustryName, setNewIndustryName] = useState('');
  // 編集中の業界情報を保持するstate
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  // ローディング状態を管理するstate
  const [isLoading, setIsLoading] = useState(false);

  // 初回レンダリング時に業界リストを取得
  useEffect(() => {
    fetchIndustries();
  }, []);

  // industriesテーブルから全データを取得する関数
  const fetchIndustries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      toast.error('業界リストの取得に失敗しました。');
      console.error(error);
    } else {
      setIndustries(data || []);
    }
    setIsLoading(false);
  };

  // 新しい業界を追加する関数
  const handleAddIndustry = async () => {
    if (newIndustryName.trim() === '') {
      toast.error('業界名を入力してください。');
      return;
    }
    
    const { error } = await supabase
      .from('industries')
      .insert({ name: newIndustryName.trim() });

    if (error) {
      toast.error('業界の追加に失敗しました。');
      console.error(error);
    } else {
      toast.success('業界を追加しました。');
      setNewIndustryName('');
      fetchIndustries(); // リストを再取得して画面を更新
    }
  };
  
  // 業界を削除する関数
  const handleDeleteIndustry = async (id: number) => {
    if (!window.confirm('この業界を本当に削除しますか？関連するセミナーがある場合、問題が発生する可能性があります。')) {
      return;
    }

    const { error } = await supabase
      .from('industries')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('業界の削除に失敗しました。');
    } else {
      toast.success('業界を削除しました。');
      fetchIndustries(); // リストを再取得
    }
  };

  // 業界名を更新する関数
  const handleUpdateIndustry = async () => {
    if (!editingIndustry || editingIndustry.name.trim() === '') {
      toast.error('業界名を入力してください。');
      return;
    }

    const { error } = await supabase
      .from('industries')
      .update({ name: editingIndustry.name.trim() })
      .eq('id', editingIndustry.id);
      
    if (error) {
      toast.error('業界の更新に失敗しました。');
    } else {
      toast.success('業界を更新しました。');
      setEditingIndustry(null); // 編集モードを終了
      fetchIndustries(); // リストを再取得
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">設定：業界管理</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>新しい業界を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="例：IT・通信"
              value={newIndustryName}
              onChange={(e) => setNewIndustryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddIndustry()}
            />
            <Button onClick={handleAddIndustry}>追加</Button>
          </div>
        </CardContent>
      </Card>

      {/* 業界一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>業界一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>読み込み中...</p>
          ) : (
            <div className="space-y-2">
              {industries.map((industry) => (
                <div key={industry.id} className="flex items-center justify-between p-2 border rounded-md">
                  {editingIndustry?.id === industry.id ? (
                    // 編集モードのUI
                    <Input
                      value={editingIndustry.name}
                      onChange={(e) => setEditingIndustry({ ...editingIndustry, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateIndustry()}
                      className="flex-1"
                    />
                  ) : (
                    // 通常表示のUI
                    <span className="flex-1">{industry.name}</span>
                  )}

                  <div className="flex gap-2 ml-4">
                    {editingIndustry?.id === industry.id ? (
                      // 編集モードのボタン
                      <>
                        <Button size="sm" onClick={handleUpdateIndustry}>保存</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingIndustry(null)}>キャンセル</Button>
                      </>
                    ) : (
                      // 通常表示のボタン
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditingIndustry(industry)}>編集</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteIndustry(industry.id)}>削除</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </main>
    </div>
  );
}