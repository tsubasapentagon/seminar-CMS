'use client';
import Sidebar from "@/components/ui/sidebar";
import { useEffect, useState } from 'react';
import { Seminar, User, Industry,  } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image'; // ★ Imageコンポーネントをインポート

export default function SeminarPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Seminar | null>(null);

  const [form, setForm] = useState({
    title: '',
    banner_url: '',
    host_id: '',
    industry_id: '',
    description: '',
    line_url: '',
    online: true,
    is_recommend: false,
  });

  useEffect(() => {
    fetchSeminars();
    fetchUsers();
    fetchIndustries();
  }, []);

  const fetchSeminars = async () => {
    const { data, error } = await supabase
      .from('seminars')
      .select(`
        id,
        created_at,
        title,
        banner_url,
        description,
        line_url,
        online,
        is_recommend,
        host_id,
        industry_id,
        users ( name ),
        industries ( name )
      `);

    if (error || !data) {
      console.error('取得エラー:', error?.message);
      setSeminars([]);
      return;
    }

    // ★ ここで、dataを安全にSeminar[]型に変換します
    const formatted: Seminar[] = data.map((s: any) => ({
      id: s.id,
      created_at: s.created_at,
      title: s.title,
      description: s.description,
      banner_url: s.banner_url,
      line_url: s.line_url,
      online: s.online,
      is_recommend: s.is_recommend,
      host_id: s.host_id,
      industry_id: s.industry_id,
      users: s.users, // usersオブジェクトはそのまま
      industries: s.industries, // industriesオブジェクトもそのまま
    }));

    setSeminars(formatted);
  };

  const fetchIndustries = async () => {
    const { data, error } = await supabase.from('industries').select('id, name');
    if (!error && data) {
      setIndustries(data as Industry[]);
    } else {
      console.error('業界取得エラー:', error?.message);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, name').eq('status', '主催');
    if (!error && data) {
    setUsers(data as User[]);
    } else {
      console.error('ユーザー取得エラー:', error?.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
   const target = e.target;
   const name = target.name;

   if (target instanceof HTMLInputElement && target.type === 'checkbox') {
     setForm((prev) => ({ ...prev, [name]: target.checked }));
   } else {
     setForm((prev) => ({ ...prev, [name]: target.value }));
   }
 };

  const handleSubmit = async () => {
    const { error } = await supabase.from('seminars').insert([{...form, industry_id: form.industry_id || null}]);
    if (!error) {
      fetchSeminars();
      setOpen(false);
      resetForm();
    }
  };

  const handleEditClick = (seminar: Seminar) => {
    setEditTarget(seminar);
    setForm({
      title: seminar.title,
      banner_url: seminar.banner_url,
      host_id: seminar.host_id,
      industry_id: seminar.industry_id?.toString() || '',
      description: seminar.description || '',
      line_url: seminar.line_url || '',
      online: seminar.online,
      is_recommend: seminar.is_recommend ?? false,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;

    // ★ 1. まず、セミナー情報を通常通り更新します
    const { error: updateError } = await supabase
      .from('seminars')
      .update({ ...form, industry_id: form.industry_id || null })
      .eq('id', editTarget.id);

    if (updateError) {
      console.error('セミナー更新エラー:', updateError.message);
      return; // エラーがあればここで処理を中断
    }
    
    // ★ 2. セミナー更新が成功したら、次に関連する未割り当てシフトを更新します
    if (form.host_id) { // 主催者が設定されている場合のみ実行
      const { error: shiftUpdateError } = await supabase
        .from('shifts')
        .update({ seminar_id: editTarget.id })
        .eq('user_id', form.host_id)   // 今回のセミナーの主催者IDと一致し、
        .is('seminar_id', null);       // かつ、seminar_idがNULLのシフトを対象

      if (shiftUpdateError) {
        console.error('未割り当てシフトの更新に失敗:', shiftUpdateError.message);
      }
    }

    // ★ 3. 最後に、画面を更新してモーダルを閉じます
    setEditOpen(false);
    setEditTarget(null);
    fetchSeminars(); // 最新のセミナー情報を再取得
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('このセミナーを削除しますか？関連するシフトの紐付けも解除されます。');
    if (!confirmDelete) return;
  
    // 1. shiftsのseminar_idをnullにする（対象セミナーIDのもの）
    const { error: shiftUpdateError } = await supabase
      .from('shifts')
      .update({ seminar_id: null })
      .eq('seminar_id', id);
  
    if (shiftUpdateError) {
      console.error('シフトのseminar_id解除に失敗:', shiftUpdateError.message);
      return;
    }
  
    // 2. seminar自体を削除
    const { error: deleteError } = await supabase
      .from('seminars')
      .delete()
      .eq('id', id);
  
    if (deleteError) {
      console.error('セミナー削除エラー:', deleteError.message);
    } else {
      fetchSeminars();
    }
  };
  

  const resetForm = () => {
    setForm({
      title: '',
      banner_url: '',
      host_id: '',
      industry_id: '',
      description: '',
      line_url: '',
      online: true,
      is_recommend: false,
    });
  };

  const renderFormFields = () => (
    <ScrollArea className="h-[70vh]">
    <div className="space-y-4 pr-6">
      <div>
        <Label>タイトル</Label>
        <Input name="title" value={form.title} onChange={handleChange} />
      </div>

      <div>
        <Label>概要</Label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-2 py-1 min-h-[100px]" />
      </div>

      <div>
        <Label>業界</Label>
        <select name="industry_id" value={form.industry_id} onChange={handleChange} className="w-full border rounded px-2 py-1">
          <option value="">選択してください</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>{industry.name}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>主催者</Label>
        <select name="host_id" value={form.host_id} onChange={handleChange} className="w-full border rounded px-2 py-1">
          <option value="">選択してください</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>

      <div>
        <Label>LINE URL</Label>
        <Input name="line_url" value={form.line_url} onChange={handleChange} />
      </div>

      <div>
        <Label>バナーURL</Label>
        <Input name="banner_url" value={form.banner_url} onChange={handleChange} />
        {form.banner_url && (
          <Image src={form.banner_url} alt="バナー画像プレビュー" width={128} height={72} className="mt-2 w-32 h-auto rounded object-contain" />
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="online" className="text-base">オンライン開催</Label>
        <Switch
          id="online"
          checked={form.online}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, online: checked }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
        <Label htmlFor="is_recommend" className="text-base">おすすめ表示</Label>
        <Switch
          id="is_recommend"
          checked={form.is_recommend}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_recommend: checked }))}
        />
      </div>
    </div>
    </ScrollArea>
  );

  return (
    <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">セミナー管理</h1>
                    <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>セミナー追加</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>セミナー新規登録</DialogTitle></DialogHeader>
                        {renderFormFields()}
                        <DialogFooter><Button onClick={handleSubmit}>登録</Button></DialogFooter>
                    </DialogContent>
                    </Dialog>
                </div>
                <SeminarTable data={seminars} onEdit={handleEditClick} onDelete={handleDelete} />
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                    <DialogHeader><DialogTitle>セミナー編集</DialogTitle></DialogHeader>
                    {renderFormFields()}
                    <DialogFooter><Button onClick={handleEditSubmit}>保存</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    </div>
  );
}

function SeminarTable({ data, onEdit, onDelete }: {
  data: Seminar[],
  onEdit: (s: Seminar) => void,
  onDelete: (id: string) => void
}) {
  return (
    <table className="w-full border-collapse border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="w-[10%] border px-2 py-1">バナー</th>
          <th className="border px-2 py-1">タイトル</th>
          <th className="w-[15%] border px-2 py-1">業界</th>
          <th className="w-[15%] border px-2 py-1">主催者</th>
          <th className="w-[10%] border px-2 py-1">おすすめ</th>
          <th className="w-[20%] border px-2 py-1">操作</th>
        </tr>
      </thead>
      <tbody>
        {data.map((s) => (
          <tr key={s.id}>
            <td className="border px-2 py-1">
              <Image src={s.banner_url || 'https://placehold.co/200x100'} alt={s.title} width={200} height={100} className="w-20 h-auto object-contain rounded" />
            </td>
            <td className="border px-2 py-1">{s.title}</td>
            <td className="border px-2 py-1">{s.industries?.name}</td>
            <td className="border px-2 py-1">{s.users?.name ?? s.host_id}</td>
            <td className="border px-2 py-1 text-center">{s.is_recommend ? '🌸' : ''}</td>
            <td className="border px-2 py-1">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(s)}>編集</Button>
                <Button variant="destructive" onClick={() => onDelete(s.id)}>削除</Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}