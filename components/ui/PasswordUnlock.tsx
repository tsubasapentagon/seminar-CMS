// components/ui/PasswordUnlock.tsx
import { useState } from "react";

type Props = {
  hash?: string;
  plain?: string;
  global?: boolean;
};

export default function PasswordUnlock({ plain, global }: Props) {
  const [show, setShow] = useState(false);

  // globalの場合は表示切り替えだけ
  if (global) {
    return (
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-sm text-blue-600 underline"
      >
        {show ? "すべて表示中" : "パスワードを表示"}
      </button>
    );
  }

  // 通常のユーザー行の表示
  return (
    <div className="flex items-center gap-2">
      <span className="truncate max-w-[60px]">{show ? plain : "●●●●●"}</span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-xs text-blue-600 underline"
      >
        {show ? "非表示" : "表示"}
      </button>
    </div>
  );
}
