"use client";

import { useState } from "react";
import { deleteCourse, saveCourse } from "@/app/quan-ly/cai-dat/actions";
import { ConfirmButton, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { Field, LinesEditor, moveItem, RowTools, SegPick, Switch, UnitInput } from "@/components/ui-kit";
import type { CourseAdmin } from "@/lib/settings-types";
import { slugify } from "@/lib/slug";
import { COURSE_KINDS } from "@/lib/types";

type Tab = "thong-tin" | "giao-an" | "cam-ket" | "ket-qua";
const INFO_FIELDS = ["title", "kind", "cover_url", "summary", "audience", "goal", "session_count", "minutes_per_session", "max_students", "schedule_text", "venue_id", "price_full", "price_single", "price_note", "sort"];
const str = (n: number | null | undefined) => (n == null ? "" : String(n));

/** Các buổi tên "Buổi 3" tự đánh số lại theo vị trí sau khi thêm / xoá / đổi chỗ; tên tự đặt thì giữ nguyên. */
const renumber = (list: { title: string; content: string }[]) => list.map((s, i) => (/^(Buổi \d+)?$/.test(s.title.trim()) ? { ...s, title: `Buổi ${i + 1}` } : s));

export function CourseForm({ course, venues, nextSort }: { course: CourseAdmin | null; venues: { id: string; name: string }[]; nextSort: number }) {
  const [tab, setTab] = useState<Tab>("thong-tin");
  const [v, setV] = useState({
    id: course?.id ?? "",
    title: course?.title ?? "",
    kind: course?.kind ?? "co-ban",
    cover_url: course?.cover_url ?? "",
    summary: course?.summary ?? "",
    audience: course?.audience ?? "",
    goal: course?.goal ?? "",
    session_count: str(course?.session_count),
    minutes_per_session: str(course?.minutes_per_session),
    max_students: str(course?.max_students),
    schedule_text: course?.schedule_text ?? "",
    venue_id: course?.venue_id ?? "",
    price_full: str(course?.price_full),
    price_single: str(course?.price_single),
    price_note: course?.price_note ?? "",
    curriculum: (course?.curriculum ?? []).map((s) => ({ title: s.title ?? "", content: s.content ?? "" })),
    commitments: [...(course?.commitments ?? [])],
    outcomes: [...(course?.outcomes ?? [])],
    is_public: course?.is_public ?? false,
    sort: String(course?.sort ?? nextSort),
  });
  const save = useSave(saveCourse, v);
  type V = typeof v;
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  type TextKey = { [K in keyof V]: V[K] extends string ? K : never }[keyof V];
  const txt = (k: TextKey) => ({
    value: v[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as V[typeof k]),
  });
  const setLesson = (i: number, patch: Partial<V["curriculum"][number]>) => set("curriculum", v.curriculum.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const infoError = INFO_FIELDS.some((k) => save.err(k));
  const tabs: { value: Tab; label: string }[] = [
    { value: "thong-tin", label: "Thông tin" },
    { value: "giao-an", label: `Giáo án ${v.curriculum.length} buổi` },
    { value: "cam-ket", label: "Cam kết" },
    { value: "ket-qua", label: "Kết quả" },
  ];

  return (
    <div className="card min-w-0">
      <form onSubmit={save.onSubmit} noValidate>
        <h2 className="h2">
          <span className="min-w-0 truncate">{v.title || "Mẫu khoá mới"}</span>
          <span className="flex flex-none items-center gap-2">
            <Switch checked={v.is_public} onChange={(b) => set("is_public", b)} label="Công khai" />
            <span className="text-[13px] font-medium">{v.is_public ? "Công khai" : "Nháp"}</span>
          </span>
        </h2>
        <div className="mb-3.5">
          <SegPick label="Phần của mẫu khoá" options={tabs} value={tab} onChange={setTab} />
        </div>
        <div className="grid gap-3">
          <SaveError save={save} />
          {infoError && tab !== "thong-tin" && <div className="err">Phần Thông tin còn ô chưa đúng.</div>}
        </div>

        {tab === "thong-tin" && (
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Tên khoá" className="md:col-span-2" error={save.err("title")} hint={`/khoa-hoc/${course?.slug ?? (slugify(v.title) || "…")}`}>
              <input className="input" maxLength={120} placeholder="Ví dụ: Khoá Cơ bản cho người mới" {...txt("title")} />
            </Field>
            <Field label="Loại khoá" error={save.err("kind")}>
              <select className="input" {...txt("kind")}>
                {COURSE_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sân dạy" error={save.err("venue_id")}>
              <select className="input" {...txt("venue_id")}>
                <option value="">Chưa chọn sân</option>
                {venues.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mô tả ngắn" className="md:col-span-2" error={save.err("summary")}>
              <textarea className="input" maxLength={300} style={{ minHeight: 64 }} {...txt("summary")} />
            </Field>
            <Field label="Dành cho ai" error={save.err("audience")}>
              <input className="input" maxLength={300} placeholder="Ví dụ: Chưa từng cầm vợt" {...txt("audience")} />
            </Field>
            <Field label="Mục tiêu" error={save.err("goal")}>
              <input className="input" maxLength={300} placeholder="Ví dụ: Chơi được trận đôi" {...txt("goal")} />
            </Field>
            <div className="grid grid-cols-3 gap-3 md:col-span-2">
              <Field label="Số buổi" error={save.err("session_count")}>
                <UnitInput unit="buổi" inputMode="numeric" maxLength={3} {...txt("session_count")} />
              </Field>
              <Field label="Mỗi buổi" error={save.err("minutes_per_session")}>
                <UnitInput unit="phút" inputMode="numeric" maxLength={3} {...txt("minutes_per_session")} />
              </Field>
              <Field label="Sĩ số" error={save.err("max_students")}>
                <UnitInput unit="người" inputMode="numeric" maxLength={3} {...txt("max_students")} />
              </Field>
            </div>
            <Field label="Học phí trọn khoá" error={save.err("price_full")}>
              <UnitInput unit="đ" inputMode="numeric" maxLength={13} {...txt("price_full")} />
            </Field>
            <Field label="Giá mỗi buổi" error={save.err("price_single")}>
              <UnitInput unit="đ" inputMode="numeric" maxLength={13} {...txt("price_single")} />
            </Field>
            <Field label="Ghi chú học phí" error={save.err("price_note")}>
              <input className="input" maxLength={200} placeholder="Ví dụ: Nhóm 2 người giảm 10%" {...txt("price_note")} />
            </Field>
            <Field label="Lịch học thường mở" error={save.err("schedule_text")}>
              <input className="input" maxLength={120} placeholder="Ví dụ: T3, T5 18:00" {...txt("schedule_text")} />
            </Field>
            <Field label="Link ảnh bìa" error={save.err("cover_url")}>
              <input className="input" inputMode="url" placeholder="https://…" {...txt("cover_url")} />
            </Field>
            <Field label="Thứ tự hiện" error={save.err("sort")}>
              <input className="input num" inputMode="numeric" maxLength={4} {...txt("sort")} />
            </Field>
          </div>
        )}

        {tab === "giao-an" && (
          <div>
            {v.curriculum.length === 0 && <div className="pb-2 text-[13px] text-faint">Chưa có buổi nào trong giáo án.</div>}
            {v.curriculum.map((s, i) => (
              <div key={i} className="divide-row flex items-start gap-1 py-2.5">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[92px_minmax(0,1fr)]">
                  <input className="input font-bold" style={{ height: 40, paddingInline: 10 }} value={s.title} maxLength={60} aria-label={`Tên buổi ${i + 1}`} onChange={(e) => setLesson(i, { title: e.target.value })} />
                  <input className="input" style={{ height: 40 }} value={s.content} maxLength={500} placeholder="Nội dung buổi học" aria-label={`Nội dung buổi ${i + 1}`} onChange={(e) => setLesson(i, { content: e.target.value })} />
                </div>
                <RowTools index={i} count={v.curriculum.length} onMove={(a, d) => set("curriculum", renumber(moveItem(v.curriculum, a, d)))} onRemove={() => set("curriculum", renumber(v.curriculum.filter((_, j) => j !== i)))} />
              </div>
            ))}
            {v.curriculum.length < 60 && (
              <button type="button" className="divide-row block w-full py-2.5 text-left text-[13px] font-semibold" onClick={() => set("curriculum", [...v.curriculum, { title: `Buổi ${v.curriculum.length + 1}`, content: "" }])}>
                + Thêm buổi
              </button>
            )}
            {save.err("curriculum") && <div className="err">{save.err("curriculum")}</div>}
            <div className="soft mt-1.5 text-[13px] text-muted">Giáo án hiện ở trang khoá học công khai. Sửa mẫu không đổi các lớp đã mở trước đó.</div>
          </div>
        )}

        {tab === "cam-ket" && (
          <div className="field">
            <span className="label">Cam kết với học viên</span>
            <LinesEditor label="Cam kết" items={v.commitments} onChange={(a) => set("commitments", a)} addLabel="Thêm cam kết" max={20} placeholder="Ví dụ: Học bù nếu báo nghỉ trước 12 giờ" />
            {save.err("commitments") && <span className="err">{save.err("commitments")}</span>}
          </div>
        )}

        {tab === "ket-qua" && (
          <div className="field">
            <span className="label">Kết quả sau khoá</span>
            <LinesEditor label="Kết quả" items={v.outcomes} onChange={(a) => set("outcomes", a)} addLabel="Thêm kết quả" max={20} placeholder="Ví dụ: Chơi trọn một trận đôi đúng luật" />
            {save.err("outcomes") && <span className="err">{save.err("outcomes")}</span>}
          </div>
        )}

        <div className="mt-4">
          <SaveBar save={save} label={course ? "Lưu mẫu khoá" : "Tạo mẫu khoá"} />
        </div>
      </form>
      {course && (
        <form action={deleteCourse} className="divide-row mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-3.5">
          <input type="hidden" name="id" value={course.id} />
          <span className="min-w-0 text-[13px] text-faint">Xoá mẫu: lớp, nhu cầu, video đang gắn khoá này sẽ để trống phần khoá.</span>
          <ConfirmButton message={`Xoá mẫu "${course.title}"? Việc này không hoàn tác được.`}>Xoá mẫu</ConfirmButton>
        </form>
      )}
    </div>
  );
}
