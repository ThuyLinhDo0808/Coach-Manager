import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { CalendarLegend, sessionEvent, WeekCalendar, type CalEvent } from "@/components/week-calendar";
import { requirePerm } from "@/lib/auth";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, dmy, isDate, vnDate, vnIso, weekdayOf, weekStart } from "@/lib/time";

export const metadata = { title: "Lịch của tôi" };

// Buổi mình dạy (kể cả dạy thay) hoặc được phân làm trợ giảng.
export default async function LichCuaToiPage({ searchParams }: { searchParams: Promise<{ tuan?: string; ngay?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("lich-cua-toi");
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const ws = weekStart(isDate(sp.tuan) ? sp.tuan : today);
  const [sessions, venues, classes] = await Promise.all([
    t.sessionsOfPerson(session.userId, vnIso(ws, "00:00"), vnIso(addDays(ws, 7), "00:00")),
    t.venues(),
    t.classes(),
  ]);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name ?? null;
  const events: CalEvent[] = sessions.map((s) => {
    const cls = classes.find((c) => c.id === s.class_id);
    const role = s.teacher_id === session.userId ? "" : " · trợ giảng";
    return {
      ...sessionEvent(s, ws),
      title: s.kind === "hoc-thu" ? `Học thử${s.title ? ` · ${s.title}` : ""}` : `${cls?.title ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}` : ""}${role}`,
      place: venueName(s.venue_id),
      kind: s.status === "huy" ? "x" : s.kind === "hoc-thu" ? "t" : "c",
      href: `/quan-ly/lich-day/${s.id}`,
    };
  });
  const live = sessions.filter((s) => s.status !== "huy");
  const hours = live.reduce((n, s) => n + (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3_600_000, 0);
  const selectedDay = sp.ngay != null && /^[0-6]$/.test(sp.ngay) ? Number(sp.ngay) : ws === weekStart(today) ? weekdayOf(today) - 1 : 0;
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ tuan: ws, ngay: sp.ngay, ...patch })) if (v) q.set(k, v);
    return `/quan-ly/lich-day/cua-toi?${q}`;
  };

  return (
    <>
      <PageHead icon="cal" color="cyan" title="Lịch của tôi" sub={`Tuần ${dmy(ws)} – ${dmy(addDays(ws, 6), true)} · ${live.length} buổi · ${String(Math.round(hours * 10) / 10).replace(".", ",")} giờ`} />
      <div className="mb-3.5 flex gap-2">
        <Link href={href({ tuan: addDays(ws, -7), ngay: undefined })} className="btn sm ghost bg-white" aria-label="Tuần trước">‹</Link>
        <Link href={href({ tuan: weekStart(today), ngay: undefined })} className="btn sm ghost bg-white">Hôm nay</Link>
        <Link href={href({ tuan: addDays(ws, 7), ngay: undefined })} className="btn sm ghost bg-white" aria-label="Tuần sau">›</Link>
      </div>
      <WeekCalendar weekStartDate={ws} events={events} today={today} selectedDay={selectedDay} dayHref={(d) => href({ ngay: String(d) })} />
      <CalendarLegend items={["c", "t", "x"]} />
    </>
  );
}
