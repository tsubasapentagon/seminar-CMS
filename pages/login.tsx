'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // ★ エラーメッセージ用のstate

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(''); // エラーメッセージをリセット

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      // ★ エラー内容に応じてメッセージを分岐
      if (authError.message === 'Email not confirmed') {
        setErrorMessage('メールアドレスの認証が完了していません。受信したメールを確認してください。');
      } else if (authError.message === 'Invalid login credentials') {
        setErrorMessage('メールアドレスまたはパスワードが違います。');
      } else {
        setErrorMessage('ログイン中にエラーが発生しました。');
      }
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        setErrorMessage('ユーザー情報の取得に失敗しました。');
        setIsLoading(false);
        return;
      }

      login(userData);
      toast.success('ログインしました。');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Seminar CMS ログイン</CardTitle>
          <CardDescription>メールアドレスとパスワードを入力してください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ★ エラーメッセージ表示エリア */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="text-sm text-right">
            <Link href="/forgot-password" className="underline hover:text-primary">
              パスワードをお忘れですか？
            </Link>
          </div>
          <Button onClick={handleLogin} disabled={isLoading} className="w-full">
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
          <div className="mt-4 text-center text-sm">
            新しい主催者として登録しますか？{' '}
            <Link href="/register/host" className="underline hover:text-primary">
              新規登録はこちら
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}