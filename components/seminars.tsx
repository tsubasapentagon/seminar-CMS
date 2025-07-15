'use client';

import { useEffect, useState } from 'react';
import { Seminar } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export default function SeminarPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [hosts, setHosts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    id: '',
    title: '',
    banner_url: '',
    description: '',
    line_url: '',
    host_id: '',
    online: true,
    is_recommend: false,
  });
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await fetchSeminars();
      await fetchHosts();
    };
    fetchData();
  }, []);

  const fetchSeminars = async () => {
    const { data, error } = await supabase
      .from('seminars')
      .select(`
        id,
        title,
        banner_url,
        description,
        line_url,
        online,
        is_recommend,
        host_id,
        users ( id, name )
      `) as unknown as { data: unknown[] | null, error: unknown };

    if (error) {
      // ここでエラーが起きた
      console.error('取得エラー:', error);
      return;
    }
    setSeminars((data ?? []) as Seminar[]);
  };

  const fetchHosts = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('status', '主催');
    if (error) {
      console.error('主催者取得エラー:', error.message);
      return;
    }
    setHosts(data ?? []);
  };

  const handleChange = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenNew = () => {
    setForm({
      id: '',
      title: '',
      banner_url: '',
      description: '',
      line_url: '',
      host_id: '',
      online: true,
      is_recommend: false,
    });
    setIsEditMode(false);
    setOpen(true);
  };

  const handleEdit = (seminar: Seminar) => {
    setForm({
      id: seminar.id,
      title: seminar.title,
      banner_url: seminar.banner_url,
      description: seminar.description,
      line_url: seminar.line_url,
      host_id: seminar.host_id,
      online: seminar.online,
      is_recommend: seminar.is_recommend ?? false,
    });
    setIsEditMode(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (isEditMode) {
      const { error } = await supabase
        .from('seminars')
        .update({
          title: form.title,
          banner_url: form.banner_url,
          description: form.description,
          line_url: form.line_url,
          host_id: form.host_id,
          online: form.online,
          is_recommend: form.is_recommend,
        })
        .eq('id', form.id);

      if (error) {
        console.error('更新エラー:', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('seminars').insert({
        title: form.title,
        banner_url: form.banner_url,
        description: form.description,
        line_url: form.line_url,
        host_id: form.host_id,
        online: form.online,
        is_recommend: form.is_recommend,
      });

      if (error) {
        console.error('登録エラー:', error.message);
        return;
      }
    }

    await fetchSeminars();
    setOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">セミナー管理</h1>
        <Button onClick={handleOpenNew}>セミナー追加</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'セミナー編集' : 'セミナー新規登録'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>タイトル</Label>
            <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} />

            <Label>概要</Label>
            <Input value={form.description} onChange={(e) => handleChange('description', e.target.value)} />

            <Label>バナーURL</Label>
            <Input value={form.banner_url} onChange={(e) => handleChange('banner_url', e.target.value)} />

            <Label>LINE追加URL</Label>
            <Input value={form.line_url} onChange={(e) => handleChange('line_url', e.target.value)} />

            <Label>主催者</Label>
            <Select value={form.host_id} onValueChange={(value) => handleChange('host_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="主催者を選択" />
              </SelectTrigger>
              <SelectContent>
                {hosts.map((host) => (
                  <SelectItem key={host.id} value={host.id}>
                    {host.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between">
              <Label>オンライン開催</Label>
              <Switch checked={form.online} onCheckedChange={(value) => handleChange('online', value)} />
            </div>

            <div className="flex items-center justify-between">
              <Label>おすすめ表示</Label>
              <Switch checked={form.is_recommend} onCheckedChange={(value) => handleChange('is_recommend', value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>{isEditMode ? '更新' : '登録'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">セミナー一覧</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">画像</th>
              <th className="p-2">タイトル</th>
              <th className="p-2">おすすめ</th>
              <th className="p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {seminars.map((seminar) => (
              <tr key={seminar.id} className="border-t">
                <td className="p-2">
                  {seminar.banner_url ? (
                    <img src={seminar.banner_url} alt="バナー" className="w-20 h-12 object-cover" />
                  ) : (
                    '画像なし'
                  )}
                </td>
                <td className="p-2">{seminar.title}</td>
                <td className="p-2 text-center">{seminar.is_recommend ? '◯' : 'ー'}</td>
                <td className="p-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(seminar)}>
                    編集
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
