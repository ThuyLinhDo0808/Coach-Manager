"use client";

import { useState } from "react";
import { LOST_REASONS } from "@/lib/leads";

/** "Không thành" bắt buộc chọn lý do. */
export function LostReasonForm({ leadId, active, action }: { leadId: string; active: boolean; action: (form: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={`chip mt-1.5 ${active ? "on" : ""}`} style={{ height: 34 }} onClick={() => setOpen(true)}>
        Không thành{active ? "" : "…"}
      </button>
    );
  }
  return (
    <form action={action} className="soft mt-2 grid gap-2" onSubmit={() => setOpen(false)}>
      <input type="hidden" name="id" value={leadId} />
      <input type="hidden" name="status" value="khong-thanh" />
      <label className="text-[13px] font-semibold" htmlFor="lost_reason">Lý do không thành</label>
      <select id="lost_reason" name="lost_reason" required className="input" style={{ height: 40 }} defaultValue="">
        <option value="" disabled>Chọn lý do…</option>
        {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn sm ghost" onClick={() => setOpen(false)}>Huỷ</button>
        <button className="btn sm danger">Xác nhận</button>
      </div>
    </form>
  );
}
