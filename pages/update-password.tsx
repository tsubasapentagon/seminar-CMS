'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // URLにパスワードリセット用のトークンが含まれているか確認
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // パスワードリセットモードであることを示す
        // 何もしなくても、この後のupdateUserで自動的に処理される
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      toast.error(`パスワードの更新に失敗しました: ${error.message}`);
    } else {
      toast.success('パスワードが正常に更新されました。ログインページに移動します。');
      router.push('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">新しいパスワードを設定</CardTitle>
          <CardDescription>新しいパスワードを入力してください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">新しいパスワード</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={handleUpdatePassword} disabled={isLoading} className="w-full">
            {isLoading ? '更新中...' : 'パスワードを更新'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}