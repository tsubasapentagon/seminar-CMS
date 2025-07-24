// 変更箇所にコメント付きでマークしています

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import PasswordUnlock from "@/components/ui/PasswordUnlock";
import type { User } from "@/types";
import Sidebar from '@/components/ui/sidebar'

const generateRandomPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("主催");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editFurigana, setEditFurigana] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [generatedLink, setGeneratedLink] = useState(""); // 追加：生成されたリンク保持


  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .returns<User[]>();

    if (error || !data) {
      console.error("ユーザー取得エラー", error);
      setUsers([]);
    } else {
      setUsers(data);
    }

    setLoading(false);
  };

  const handleAddUser = async () => {
    const randomPass = generateRandomPassword();
  
    const { error } = await supabase.from("users").insert({
      status,
      password: randomPass,
      password_plain: randomPass,
    }).select().single();
  
    if (error) {
      console.error("登録エラー", error.message);
      alert("登録に失敗しました：" + error.message);
    } else {
      fetchUsers();
      setOpen(false);
      setStatus("主催");

      const link = `${window.location.origin}/user/survey/${randomPass}`;
      setGeneratedLink(link);
      try {
        await navigator.clipboard.writeText(link);
        alert("リンクをコピーしました！");
      } catch (e) {
        console.warn("コピー失敗", e);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    await supabase.from("users").delete().eq("id", id);
    fetchUsers();
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    await supabase
      .from("users")
      .update({
        email: editEmail,
        password: editPassword,
        password_plain: editPassword,
        name: editName,
        furigana: editFurigana,
        company: editCompany,
        status: editStatus,
      })
      .eq("id", editingUser.id);
    setEditingUser(null);
    fetchUsers();
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">ユーザー管理</h2>
          <div className="flex gap-2">
            <PasswordUnlock global />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>＋ ユーザー追加</Button>
              </DialogTrigger>
              <DialogContent className="space-y-4">
                <Label>ステータス</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="主催">主催</option>
                  <option value="管理者">管理者</option>
                </select>
                <Button onClick={handleAddUser}>登録</Button>
                {generatedLink && (
                  <div className="mt-4 p-2 bg-gray-50 border rounded text-sm">
                    <p className="text-gray-600">生成されたアンケートリンク：</p>
                    <a href={generatedLink} target="_blank" className="text-blue-600 underline break-all">
                      {generatedLink}
                    </a>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-sm border table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-2 w-[100px] truncate">名前</th>
                    <th className="border px-2 py-2 w-[100px] truncate">フリガナ</th>
                    <th className="border px-2 py-2 w-[100px] truncate">会社</th>
                    <th className="border px-2 py-2 w-[200px] truncate">メール</th>
                    <th className="border px-2 py-2 w-[80px] truncate">ステータス</th>
                    <th className="border px-2 py-2 w-[100px] truncate">登録日</th>
                    <th className="border px-2 py-2 w-[80px] truncate">パス</th>
                    <th className="border px-2 py-2 w-[100px] truncate">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="whitespace-nowrap">
                      <td className="border px-2 py-2 truncate">{user.name || "-"}</td>
                      <td className="border px-2 py-2 truncate">{user.furigana || "-"}</td>
                      <td className="border px-2 py-2 truncate">{user.company || "-"}</td>
                      <td className="border px-2 py-2 truncate">{user.email || "-"}</td>
                      <td className="border px-2 py-2 truncate">{user.status}</td>
                      <td className="border px-2 py-2 truncate">
                        {user.created_at?.slice(2, 10).replace(/-/g, "/")}
                      </td>
                      <td className="border px-2 py-2 truncate">
                        <PasswordUnlock
                          hash={user.password}
                          plain={user.password_plain}
                        />
                      </td>
                      <td className="border px-2 py-2 space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setEditEmail(user.email);
                            setEditPassword(user.password_plain);
                            setEditName(user.name);
                            setEditFurigana(user.furigana);
                            setEditCompany(user.company);
                            setEditStatus(user.status);
                          }}
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {editingUser && (
          <Dialog open onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="space-y-4">
              <h3 className="text-lg font-semibold">
                編集: {editingUser.email}
              </h3>
              <Label>名前</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Label>フリガナ</Label>
              <Input
                value={editFurigana}
                onChange={(e) => setEditFurigana(e.target.value)}
              />
              <Label>会社</Label>
              <Input
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
              />
              <Label>メール</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <Label>パスワード</Label>
              <Input
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
              <Label>ステータス</Label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="border rounded p-2 w-full"
              >
                <option value="主催">主催</option>
                <option value="管理者">管理者</option>
              </select>
              <Button onClick={handleEditSave}>保存</Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
