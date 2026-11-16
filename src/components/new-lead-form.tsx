"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createLead } from "@/app/quan-ly/nhu-cau/actions";
import { GENDERS } from "@/lib/labels";
import { LEAD_ORIGINS } from "@/lib/types";

export function NewLeadForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(createLead, null);
  const err = (k: string) => (state?.errors?.[k] ? <div className="err" role="alert">{state.errors[k]}</div> : null);
  return (
    <form action={action} className="card mb-4 grid gap-3.5" aria-label="Thêm nhu cầu">
      <h2 className="h2 mb-0">Thêm nhu cầu</h2>
      <div className="grid gap-3.5 md:grid-cols-3">
        <div className="field">
          <label htmlFor="n_name">Họ tên *</label>
          <input id="n_name" name="full_name" className="input" required />
          {err("full_name")}
        </div>
        <div className="field">
          <label htmlFor="n_phone">Số điện thoại *</label>
          <input id="n_phone" name="phone" type="tel" inputMode="tel" className="input" required />
          {err("phone")}
        </div>
        <div className="field">
          <label htmlFor="n_origin">Nguồn</label>
          <select id="n_origin" name="origin" className="input" defaultValue="facebook">
            {LEAD_ORIGINS.filter((o) => o.value !== "form").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="n_gender">Giới tính</label>
          <select id="n_gender" name="gender" className="input" defaultValue="">
            <option value="">Chưa rõ</option>
            {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="n_year">Năm sinh</label>
          <input id="n_year" name="birth_year" inputMode="numeric" maxLength={4} className="input" />
          {err("birth_year")}
        </div>
        <div className="field">
          <label htmlFor="n_course">Khoá quan tâm</label>
          <select id="n_course" name="course_id" className="input" defaultValue="">
            <option value="">Chưa rõ</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="n_area">Khu vực</label>
          <input id="n_area" name="area" className="input" />
        </div>
        <div className="field md:col-span-2">
          <label htmlFor="n_note">Ghi chú</label>
          <input id="n_note" name="note" className="input" maxLength={1000} />
        </div>
      </div>
      {state?.message && <div className="err" role="alert">{state.message}</div>}
      <div className="flex justify-end gap-2">
        <Link href="/quan-ly/nhu-cau" className="btn ghost">Huỷ</Link>
        <button className="btn primary" disabled={pending}>{pending ? "Đang lưu…" : "Lưu nhu cầu"}</button>
      </div>
    </form>
  );
}
