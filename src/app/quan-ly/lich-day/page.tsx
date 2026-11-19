import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { CalendarLegend, sessionEvent, WeekCalendar, type CalEvent } from "@/components/week-calendar";
import { requirePerm } from "@/lib/auth";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import { addDays, dmy, isDate, vnDate, vnIso, weekdayOf, weekStart } from "@/lib/time";

export const metadata = { title: "Lịch trung tâm" };

const hourOf = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;

export default async function LichDayPage({ searchParams }: { searchParams: Promise<{ tuan?: string; san?: string; ngay?: string; coach?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("lich-trung-tam");
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const ws = weekStart(isDate(sp.tuan) ? sp.tuan : today);
  const we = addDays(ws, 7);
  const [sessionsAll, slotsAll, venues, classes, members] = await Promise.all([
    t.sessionsBetween(vnIso(ws, "00:00"), vnIso(we, "00:00")), t.freeSlots(), t.venues(), t.classes(), t.members(),
  ]);
  const coaches = withRole(peopleOf(members), "coach", "chu");
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name ?? null;
  const sessions = sessionsAll.filter((s) => (!sp.san || s.venue_id === sp.san) && (!sp.coach || s.teacher_id === sp.coach));
  const slots = sp.san ? slotsAll.filter((s) => s.venue_id === sp.san) : slotsAll;

  const events: CalEvent[] = [
    ...slots.map((s): CalEvent => ({
      id: s.id, day: s.weekday - 1, start: hourOf(s.start_time), end: hourOf(s.end_time),
      startText: s.start_time.slice(0, 5), endText: s.end_time.slice(0, 5), title: "Giờ rảnh", place: venueName(s.venue_id), kind: "f",
    })),
    ...sessions.map((s): CalEvent => {
      const cls = classes.find((c) => c.id === s.class_id);
      return {
        ...sessionEvent(s, ws),
        title: s.kind === "hoc-thu" ? `Học thử${s.title ? ` · ${s.title}` : ""}` : `${cls?.title ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}` : ""}`,
        place: venueName(s.venue_id),
        kind: s.status === "huy" ? "x" : s.kind === "hoc-thu" ? "t" : "c",
        href: `/quan-ly/lich-day/${s.id}`,
      };
    }),
  ];
  const live = sessions.filter((s) => s.status !== "huy");
  const teachHours = live.reduce((n, s) => n + (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3_600_000, 0);
  const freeHours = slots.reduce((n, s) => n + hourOf(s.end_time) - hourOf(s.start_time), 0);
  const fmtH = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
  const selectedDay = sp.ngay != null && /^[0-6]$/.test(sp.ngay) ? Number(sp.ngay) : ws === weekStart(today) ? weekdayOf(today) - 1 : 0;
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ tuan: ws, san: sp.san, ngay: sp.ngay, coach: sp.coach, ...patch })) if (v) q.set(k, v);
    return `/quan-ly/lich-day?${q}`;
  };

  return (
    <>
      <PageHead
        icon="cal"
        color="cyan"
        title="Lịch trung tâm"
        sub={`Tuần ${dmy(ws)} – ${dmy(addDays(ws, 6), true)} · ${live.length} buổi · ${fmtH(teachHours)} giờ dạy · ${fmtH(freeHours)} giờ rảnh`}
      >
        <Link href="/quan-ly/khoa-hoc?them=1" className="btn primary">
          <Icon name="plus" /> Tạo lịch học
        </Link>
      </PageHead>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex gap-2">
          <Link href={href({ tuan: addDays(ws, -7), ngay: undefined })} className="btn sm ghost bg-white" aria-label="Tuần trước">‹</Link>
          <Link href={href({ tuan: weekStart(today), ngay: undefined })} className="btn sm ghost bg-white">Hôm nay</Link>
          <Link href={href({ tuan: addDays(ws, 7), ngay: undefined })} className="btn sm ghost bg-white" aria-label="Tuần sau">›</Link>
        </div>
        {coaches.length > 1 && (
          <div className="flex max-w-full gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <Link href={href({ coach: undefined })} className={`chip ${!sp.coach ? "on" : ""}`}>Mọi coach</Link>
            {coaches.map((c) => (
              <Link key={c.id} href={href({ coach: c.id })} className={`chip ${sp.coach === c.id ? "on" : ""}`}>{c.name}</Link>
            ))}
          </div>
        )}
        <div className="flex max-w-full gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <Link href={href({ san: undefined })} className={`chip ${!sp.san ? "on" : ""}`}>Mọi sân</Link>
          {venues.map((v) => (
            <Link key={v.id} href={href({ san: v.id })} className={`chip ${sp.san === v.id ? "on" : ""}`}>{v.name}</Link>
          ))}
        </div>
      </div>

      <WeekCalendar weekStartDate={ws} events={events} today={today} selectedDay={selectedDay} dayHref={(d) => href({ ngay: String(d) })} />
      <CalendarLegend items={["c", "t", "f", "x"]} />
      <p className="mt-2 text-xs text-faint">
        Giờ rảnh hằng tuần (học viên thấy ở trang Lịch &amp; sân) khai ở mục <Link href="/quan-ly/lich-day/gio-ranh" className="font-semibold text-navy">Lịch rảnh 1-1</Link>.
      </p>

    </>
  );
}
