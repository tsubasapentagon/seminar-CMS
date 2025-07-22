import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SurveyPage() {
  const router = useRouter();
  const { password } = router.query;

  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    furigana: "",
    company: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [savedForm, setSavedForm] = useState<typeof form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!password || typeof password !== "string") return;

    const fetchUser = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("password_plain", password)
        .single();

      if (error || !data) {
        console.error("ユーザーが見つかりません");
        return;
      }

      setUserId(data.id);
      setLoading(false);
    };

    fetchUser();
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      console.error("userIdがありません");
      return;
    }
  
    if (form.password !== form.passwordConfirm) {
      alert("パスワードが一致しません");
      return;
    }
  
    const updatePayload = {
      name: form.name,
      furigana: form.furigana,
      company: form.company,
      email: form.email,
      password: form.password,
      password_plain: form.password,
    };
  
    console.log("送信前データ:", updatePayload);
    console.log("対象ユーザーID:", userId);
  
    const { error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", userId);
  
    if (error) {
      console.error("更新エラー:", error);
      alert("送信に失敗しました：" + error.message);
    } else {
      setSavedForm(form);
      setForm({
        name: "",
        furigana: "",
        company: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });
      setSubmitted(true);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white p-6 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">アンケート入力フォーム</h2>

        {showConfirmation && savedForm ? (
          <div className="space-y-4">
            <p className="text-green-700 font-semibold">以下の内容で登録されました：</p>
            <div><Label>名前</Label><Input value={savedForm.name} readOnly /></div>
            <div><Label>フリガナ</Label><Input value={savedForm.furigana} readOnly /></div>
            <div><Label>会社名</Label><Input value={savedForm.company} readOnly /></div>
            <div><Label>メールアドレス</Label><Input value={savedForm.email} readOnly /></div>
          </div>
        ) : (
          !loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>名前</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>フリガナ</Label>
                <Input
                  required
                  value={form.furigana}
                  onChange={(e) => setForm({ ...form, furigana: e.target.value })}
                />
              </div>
              <div>
                <Label>会社名</Label>
                <Input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div>
                <Label>メールアドレス</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>パスワード</Label>
                <Input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Label>確認用パスワード</Label>
                <Input
                  required
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">送信</Button>
            </form>
          )
        )}

        {loading && <p className="text-gray-600">読み込み中...</p>}
      </div>

      {/* モーダル */}
      {submitted && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md text-center max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-2">送信完了</h3>
            <p className="text-gray-600 mb-4">ご回答ありがとうございました。</p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setShowConfirmation(true);
              }}
              className="w-full"
            >
              入力内容を確認する
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
