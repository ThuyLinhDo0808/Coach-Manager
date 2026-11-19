import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { getLeads } from "@/lib/admin-data";
import { requirePerm } from "@/lib/auth";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, dayLabel, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Học thử" };

// Buổi học thử: đặt từ chi tiết nhu cầu (Hẹn học thử). Sau buổi, mở nhu cầu để chốt hoặc ghi chú.
export default async function HocThuPage() {
  const session = await requirePerm("tuyen-sinh");
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const [sessions, leads, venues] = await Promise.all([
    t.sessionsBetween(vnIso(addDays(today, -30), "00:00"), vnIso(addDays(today, 60), "00:00")),
    getLeads(session.coach.id),
    t.venues(),
  ]);
  const trials = sessions.filter((s) => s.kind === "hoc-thu" && s.status !== "huy");
  const upcoming = trials.filter((s) => vnDate(s.starts_at) >= today);
  const past = trials.filter((s) => vnDate(s.starts_at) < today).reverse();
  const lead = (id: string | null) => leads.find((l) => l.id === id);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;

  const list = (title: string, items: typeof trials, empty: string) => (
    <section className="card">
      <h2 className="h2">{title} <span className="pill n">{items.length}</span></h2>
      {items.length === 0 && <div className="text-muted">{empty}</div>}
      {items.map((s) => {
        const l = lead(s.lead_id);
        const closed = l?.status === "da-chot";
        return (
          <div key={s.id} className="divide-row flex flex-wrap items-center gap-3 py-2.5 first:border-t-0">
            <div className="num w-[100px] flex-none">
              <b>{vnTime(s.starts_at)}</b>
              <div className="text-xs text-faint">{dayLabel(vnDate(s.starts_at))}</div>
            </div>
            <div className="min-w-[140px] flex-1">
              <b>{l?.full_name ?? s.title ?? "Học thử"}</b>
              <div className="text-[13px] text-faint">{[venueName(s.venue_id), l?.interests.join(", ")].filter(Boolean).join(" · ")}</div>
            </div>
            {l && <span className={`pill ${closed ? "good" : "n"}`}>{closed ? "Đã chốt" : "Chưa chốt"}</span>}
            {l && <Link href={`/quan-ly/nhu-cau?id=${l.id}#chi-tiet`} className="btn sm ghost">Mở nhu cầu</Link>}
          </div>
        );
      })}
    </section>
  );

  return (
    <>
      <PageHead icon="inbox" color="pink" title="Học thử" sub={`${upcoming.length} buổi sắp tới · ${past.filter((s) => lead(s.lead_id)?.status !== "da-chot").length} buổi đã học chưa chốt`} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        {list("Sắp tới", upcoming, "Chưa hẹn buổi học thử nào. Hẹn ở chi tiết nhu cầu.")}
        {list("Đã học (30 ngày qua)", past, "Chưa có.")}
      </div>
    </>
  );
}
