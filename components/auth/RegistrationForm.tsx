'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // ★ Dialog関連をインポート

type RegistrationFormProps = {
  role: '管理者' | '主催';
};

export default function RegistrationForm({ role }: RegistrationFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [furigana, setFurigana] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ★ モーダル表示用のstateを追加
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRegister = async () => {
    setIsLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      toast.error(`登録に失敗しました: ${authError.message}`);
      setIsLoading(false);
      return;
    }
    if (!authData.user) {
      toast.error('ユーザー情報の作成に失敗しました。');
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: name,
        email: email,
        status: role,
        company: company,
        furigana: furigana,
      });

    if (profileError) {
      toast.error(`プロフィール情報の保存に失敗しました: ${profileError.message}`);
    } else {
      // ★ router.pushの代わりに、モーダルを表示する
      setShowSuccessModal(true);
    }
    setIsLoading(false);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.push('/login'); // モーダルを閉じた後にログインページへ
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">新規登録 ({role})</CardTitle>
            <CardDescription>必要な情報を入力してください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="furigana">フリガナ</Label>
              <Input id="furigana" value={furigana} onChange={(e) => setFurigana(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">会社名</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleRegister} disabled={isLoading} className="w-full">
              {isLoading ? '登録中...' : 'この内容で登録する'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ★★★ ここに登録完了モーダルを追加 ★★★ */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onEscapeKeyDown={handleCloseModal}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600 font-bold">
              仮登録が完了しました！
            </DialogTitle>
            <DialogDescription className="text-center pt-4 text-base">
              ご入力いただいたメールアドレス宛に、<br />本人確認用のメールを送信しました。
              <br /><br />
              メール内のリンクをクリックして、本登録を完了してください。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button type="button" onClick={handleCloseModal}>
              ログインページに戻る
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}