"use client";

import { useState } from "react";
import { addReview } from "@/app/quan-ly/noi-dung/actions";
import { SaveBar, useSave } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { Field } from "@/components/ui-kit";
import type { CourseOption } from "@/lib/content-types";

export function ReviewForm({ courses }: { courses: CourseOption[] }) {
  const [v, setV] = useState({ author_name: "", rating: 5, body: "", course_id: "" });
  const save = useSave(addReview, v);
  return (
    <form onSubmit={save.onSubmit} className="card grid gap-3" id="form-danh-gia" noValidate>
      <h2 className="h2 mb-0">Thêm đánh giá</h2>
      <Field label="Tên người đánh giá" error={save.err("author_name")}>
        <input className="input" maxLength={60} placeholder="Ví dụ: Chị Hà" value={v.author_name} onChange={(e) => setV({ ...v, author_name: e.target.value })} />
      </Field>
      <div className="field">
        <span className="label">Số sao</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Số sao">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={v.rating === n} aria-label={`${n} sao`} className={`rounded-full p-1.5 ${n <= v.rating ? "text-amber-500" : "text-[#d2d2d7]"}`} onClick={() => setV({ ...v, rating: n })}>
              <Icon name="star" size={26} filled />
            </button>
          ))}
        </div>
        {save.err("rating") && <span className="err">{save.err("rating")}</span>}
      </div>
      <Field label="Nội dung" error={save.err("body")}>
        <textarea className="input" maxLength={1000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
      </Field>
      <Field label="Đã học khoá" error={save.err("course_id")}>
        <select className="input" value={v.course_id} onChange={(e) => setV({ ...v, course_id: e.target.value })}>
          <option value="">Không ghi khoá</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>
      <SaveBar save={save} label="Thêm đánh giá" />
      <p className="text-xs text-faint">Chỉ nhập đánh giá thật của học viên (chép từ Zalo, Facebook…). Đánh giá hiện ngay trên trang công khai.</p>
    </form>
  );
}
