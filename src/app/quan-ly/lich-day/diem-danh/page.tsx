import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, dayLabel, nowMs, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Điểm danh" };

// Các buổi cần điểm danh: hôm nay, 7 ngày tới và các buổi 14 ngày qua chưa hoàn tất.
export default async function DiemDanhPage() {
  const session = await requirePerm("diem-danh");
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const [sessions, classes, venues, enrollments] = await Promise.all([
    t.sessionsBetween(vnIso(addDays(today, -14), "00:00"), vnIso(addDays(today, 8), "00:00")),
    t.classes(),
    t.venues(),
    t.enrollments(),
  ]);
  const now = nowMs();
  const live = sessions.filter((s) => s.status !== "huy");
  const overdue = live.filter((s) => s.status !== "da-day" && new Date(s.ends_at).getTime() < now && s.kind === "day");
  const todays = live.filter((s) => vnDate(s.starts_at) === today);
  const upcoming = live.filter((s) => vnDate(s.starts_at) > today);
  const done = live.filter((s) => s.status === "da-day" && vnDate(s.starts_at) < today).reverse().slice(0, 10);
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title;
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;
  const count = (classId: string | null) => enrollments.filter((e) => e.class_id === classId && e.status === "dang-hoc").length;

  const block = (title: string, list: typeof live, empty: string, tone?: "bad") => (
    <section className="card">
      <h2 className="h2">
        {title} <span className={`pill ${tone === "bad" && list.length ? "bad" : "n"}`}>{list.length}</span>
      </h2>
      {list.length === 0 && <div className="text-muted">{empty}</div>}
      {list.map((s) => (
        <Link key={s.id} href={`/quan-ly/lich-day/${s.id}`} className="divide-row flex items-center gap-3 py-2.5 first:border-t-0">
          <div className="num w-[96px] flex-none">
            <b>{vnTime(s.starts_at)}</b>
            <div className="text-xs text-faint">{dayLabel(vnDate(s.starts_at))}</div>
          </div>
          <div className="min-w-0 flex-1">
            <b className="block truncate">{s.kind === "hoc-thu" ? `Học thử · ${s.title ?? ""}` : `${className(s.class_id) ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}` : ""}`}</b>
            <div className="truncate text-[13px] text-faint">{[venueName(s.venue_id), s.class_id ? `${count(s.class_id)} học viên` : null].filter(Boolean).join(" · ")}</div>
          </div>
          <span className={`btn sm ${s.status === "da-day" ? "ghost" : "navy"}`}>{s.status === "da-day" ? "Xem" : "Điểm danh"}</span>
        </Link>
      ))}
    </section>
  );

  return (
    <>
      <PageHead icon="check" color="cyan" title="Điểm danh" sub={`${todays.length} buổi hôm nay · ${overdue.length} buổi đã qua chưa điểm danh`} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          {block("Đã qua, chưa điểm danh", overdue, "Không có buổi nào tồn.", "bad")}
          {block("Hôm nay", todays, "Hôm nay không có buổi nào.")}
        </div>
        <div className="grid gap-4">
          {block("7 ngày tới", upcoming, "Chưa có buổi nào.")}
          {block("Đã hoàn tất gần đây", done, "Chưa có buổi nào hoàn tất.")}
        </div>
      </div>
    </>
  );
}
