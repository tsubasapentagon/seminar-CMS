'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`, // リセット後にリダイレクトするページのURL
    });

    if (error) {
      toast.error(`エラーが発生しました: ${error.message}`);
    } else {
      toast.success('もし登録されているメールアドレスであれば、パスワードリセット用のメールを送信しました。');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">パスワードリセット</CardTitle>
          <CardDescription>登録したメールアドレスを入力してください。パスワードリセット用のリンクを送信します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handlePasswordReset} disabled={isLoading} className="w-full">
            {isLoading ? '送信中...' : 'リセットメールを送信'}
          </Button>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline hover:text-primary">
              ログインページに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}