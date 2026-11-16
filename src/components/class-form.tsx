"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createClass } from "@/app/quan-ly/_actions/teaching";
import { CLASS_KINDS, generateSessions } from "@/lib/teaching";
import { dmy, vnDate, WEEKDAY_SHORT } from "@/lib/time";

type Course = { id: string; title: string; session_count: number | null; minutes_per_session: number | null; max_students: number | null; price_full: number | null };

/** Tạo lịch học: chọn mẫu khoá, sân, thứ + giờ, xem trước "Sẽ tạo N buổi". */
export function ClassForm({ courses, venues }: { courses: Course[]; venues: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createClass, null);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("lop");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(vnDate());
  const [time, setTime] = useState("18:00");
  const [minutes, setMinutes] = useState("90");
  const [count, setCount] = useState("8");
  const [max, setMax] = useState("4");
  const [price, setPrice] = useState("");

  const pickCourse = (id: string) => {
    setCourseId(id);
    const c = courses.find((x) => x.id === id);
    if (!c) return;
    if (!title) setTitle(c.title);
    if (c.session_count) setCount(String(c.session_count));
    if (c.minutes_per_session) setMinutes(String(c.minutes_per_session));
    if (c.max_students) setMax(String(c.max_students));
    if (c.price_full) setPrice(String(c.price_full));
  };
  const preview = useMemo(
    () => generateSessions({ startDate, weekdays, time, minutes: Number(minutes) || 90, count: kind === "buoi-le" ? 1 : Number(count) || 0 }),
    [startDate, weekdays, time, minutes, count, kind],
  );
  const scheduleText = weekdays.length ? `${[...weekdays].sort().map((d) => WEEKDAY_SHORT[d - 1]).join(", ")} ${time}` : "";

  return (
    <form action={action} className="card mb-4 grid gap-3.5" aria-label="Tạo lịch học">
      <h2 className="h2 mb-0">Tạo lịch học</h2>
      <div className="seg w-fit">
        {CLASS_KINDS.map((k) => (
          <button key={k.value} type="button" className={kind === k.value ? "on" : ""} onClick={() => setKind(k.value)}>
            {k.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="schedule_text" value={scheduleText} />
      <div className="grid gap-3.5 md:grid-cols-3">
        <div className="field">
          <label htmlFor="c_course">Mẫu khoá</label>
          <select id="c_course" name="course_id" className="input" value={courseId} onChange={(e) => pickCourse(e.target.value)}>
            <option value="">Không theo mẫu</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="c_title">Tên lớp *</label>
          <input id="c_title" name="title" className="input" required placeholder="Ví dụ Cơ bản K13" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="c_venue">Sân</label>
          <select id="c_venue" name="venue_id" className="input" defaultValue="">
            <option value="">Chưa chọn</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <span className="label">Học vào thứ</span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_SHORT.map((l, i) => {
            const d = i + 1;
            const on = weekdays.includes(d);
            return (
              <label key={d} className={`chip ${on ? "on" : ""}`}>
                <input type="checkbox" name="weekdays" value={d} checked={on} className="sr-only" onChange={() => setWeekdays(on ? weekdays.filter((x) => x !== d) : [...weekdays, d])} />
                {l}
              </label>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-6">
        <div className="field">
          <label htmlFor="c_start">Từ ngày</label>
          <input id="c_start" name="start_date" type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="c_time">Giờ bắt đầu</label>
          <input id="c_time" name="time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="c_min">Phút / buổi</label>
          <input id="c_min" name="minutes" inputMode="numeric" className="input" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="field">
          <label htmlFor="c_count">Số buổi</label>
          <input id="c_count" name="count" inputMode="numeric" className="input" value={kind === "buoi-le" ? "1" : count} readOnly={kind === "buoi-le"} onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="field">
          <label htmlFor="c_max">Sĩ số tối đa</label>
          <input id="c_max" name="max_students" inputMode="numeric" className="input" value={kind === "kem-1-1" ? "1" : max} readOnly={kind === "kem-1-1"} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="field">
          <label htmlFor="c_price">Học phí (đ)</label>
          <input id="c_price" name="price" inputMode="numeric" className="input" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13px] font-semibold">
        <input type="checkbox" name="is_recruiting" defaultChecked className="size-4 accent-[#16284d]" />
        Hiện ở “Lớp đang tuyển” trên trang công khai
      </label>
      <div className="soft text-[13px]" aria-live="polite">
        {preview.length ? (
          <>
            <b>Sẽ tạo {preview.length} buổi</b>
            <span className="text-muted">
              {" "}· từ {dmy(vnDate(preview[0].starts_at))} đến {dmy(vnDate(preview[preview.length - 1].starts_at))}
              {courseId ? " · nội dung từng buổi lấy từ giáo án của mẫu khoá" : ""}
            </span>
          </>
        ) : (
          <span className="text-muted">Chọn thứ trong tuần để xem trước lịch. Bỏ trống thì tạo lớp chưa có buổi nào.</span>
        )}
      </div>
      {state?.message && <div className="err" role="alert">{state.message}</div>}
      <div className="flex justify-end gap-2">
        <Link href="/quan-ly/khoa-hoc" className="btn ghost">Huỷ</Link>
        <button className="btn primary" disabled={pending}>{pending ? "Đang tạo…" : "Tạo lớp"}</button>
      </div>
    </form>
  );
}
