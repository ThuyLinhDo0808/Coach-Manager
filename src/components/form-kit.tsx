"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { FormState } from "@/lib/settings-types";

/**
 * Form lưu bằng server action + useActionState. Component giữ giá trị trong state rồi gửi cả gói,
 * nên ô nhập không bị xoá khi server báo lỗi. "Đã lưu" chỉ hiện khi chưa sửa gì thêm sau lần lưu.
 */
export function useSave<T>(action: (prev: FormState, payload: T) => Promise<FormState>, payload: T) {
  const [state, dispatch, pending] = useActionState(action, null);
  const [sent, setSent] = useState<string | null>(null);
  const json = JSON.stringify(payload);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setSent(json);
    startTransition(() => dispatch(payload));
  };
  const failed = !pending && state && !state.ok ? state : null;
  return {
    pending,
    onSubmit,
    saved: !pending && state?.ok === true && sent === json,
    okMessage: state?.ok ? state.message : "Đã lưu",
    message: failed?.message ?? null,
    err: (key: string) => failed?.errors?.[key],
  };
}
export type Save = ReturnType<typeof useSave>;

/** Nút lưu trên băng tiêu đề. */
export function SaveAct({ save, label = "Lưu" }: { save: Save; label?: string }) {
  return (
    <>
      {save.saved && (
        <span className="pill good" role="status">
          Đã lưu
        </span>
      )}
      <button className="btn primary" disabled={save.pending}>
        {save.pending ? "Đang lưu…" : label}
      </button>
    </>
  );
}

/** Thông báo lỗi chung của form (đặt đầu phần nội dung). */
export function SaveError({ save }: { save: Save }) {
  if (!save.message) return null;
  return (
    <div className="rounded-[14px] bg-badbg px-4 py-3 text-[13px] font-medium text-bad" role="alert">
      {save.message}
    </div>
  );
}

/** Hàng nút cuối form: trạng thái + nút lưu (và nút phụ nếu có). */
export function SaveBar({ save, label = "Lưu", children }: { save: Save; label?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {save.message && (
        <span className="err mr-auto" role="alert">
          {save.message}
        </span>
      )}
      {save.saved && (
        <span className="pill good" role="status">
          {save.okMessage}
        </span>
      )}
      {children}
      <button className="btn primary" disabled={save.pending}>
        {save.pending ? "Đang lưu…" : label}
      </button>
    </div>
  );
}

/** Sao chép chữ vào bộ nhớ tạm (dán sang Zalo). */
export function CopyButton({ text, label = "Sao chép", className = "btn ghost" }: { text: string | (() => string); label?: string; className?: string }) {
  const [done, setDone] = useState<"ok" | "loi" | null>(null);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
          setDone("ok");
        } catch {
          setDone("loi");
        }
        setTimeout(() => setDone(null), 2000);
      }}
    >
      {done === "ok" ? "Đã sao chép" : done === "loi" ? "Chưa sao chép được" : label}
    </button>
  );
}

/** Nút gửi form có hỏi lại trước khi làm việc không hoàn tác được (xoá, gỡ). */
export function ConfirmButton({ message, className = "btn sm danger", children }: { message: string; className?: string; children: React.ReactNode }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
