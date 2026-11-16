"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type State = { ok?: boolean; message: string } | null;

/** Form gọi server action, hiện thông báo lỗi / "Đã lưu" bên dưới. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
  /** React tự xoá các ô không điều khiển sau khi action xong; giữ tên này cho dễ đọc ở nơi gọi. */
  resetOnOk?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.message && (
        <div className={state.ok ? "text-[13px] font-semibold text-good" : "err"} role={state.ok ? "status" : "alert"}>
          {state.message}
        </div>
      )}
    </form>
  );
}

export function Submit({ children, className = "btn primary", pendingText = "Đang lưu…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
