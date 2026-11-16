"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { joinTeam } from "./actions";

export function JoinForm() {
  const [state, dispatch, pending] = useActionState(joinTeam, null);
  const [v, setV] = useState({ email: "", password: "" });
  const [again, setAgain] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const err = (k: string) =>
    state && !state.ok && state.errors?.[k] ? (
      <div className="err" role="alert">
        {state.errors[k]}
      </div>
    ) : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setMismatch(v.password !== again);
    if (v.password !== again) return;
    startTransition(() => dispatch(v));
  };

  if (state?.ok) {
    return (
      <div className="grid gap-3.5">
        <div className="rounded-[14px] bg-goodbg px-4 py-3 text-[13px] font-medium text-good" role="status">
          {state.message}
        </div>
        <Link href="/dang-nhap" className="btn primary" style={{ height: 48 }}>
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3.5" noValidate>
      <div className="field">
        <label htmlFor="j_email">Email được mời</label>
        <input id="j_email" type="email" autoComplete="email" inputMode="email" className="input" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        {err("email")}
      </div>
      <div className="field">
        <label htmlFor="j_password">Đặt mật khẩu</label>
        <input id="j_password" type="password" autoComplete="new-password" className="input" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        {err("password") ?? <div className="text-xs text-faint">Ít nhất 8 ký tự.</div>}
      </div>
      <div className="field">
        <label htmlFor="j_again">Nhập lại mật khẩu</label>
        <input id="j_again" type="password" autoComplete="new-password" className="input" value={again} onChange={(e) => setAgain(e.target.value)} />
        {mismatch && (
          <div className="err" role="alert">
            Hai lần nhập mật khẩu chưa giống nhau
          </div>
        )}
      </div>
      {state && !state.ok && !pending && (
        <div className="err" role="alert">
          {state.message}
        </div>
      )}
      <button className="btn primary" style={{ height: 48 }} disabled={pending}>
        {pending ? "Đang tạo tài khoản…" : "Tạo mật khẩu và vào đội"}
      </button>
    </form>
  );
}
