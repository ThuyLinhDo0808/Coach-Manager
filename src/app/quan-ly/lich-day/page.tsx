import Link from "next/link";
import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { CalendarLegend, sessionEvent, WeekCalendar, type CalEvent } from "@/components/week-calendar";
import { addFreeSlot, deleteFreeSlot } from "@/app/quan-ly/_actions/teaching";
import { requireSession } from "@/lib/auth";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, dmy, isDate, vnDate, vnIso, weekdayOf, weekStart, WEEKDAY_LONG } from "@/lib/time";

export const metadata = { title: "Lịch dạy" };

const hourOf = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;

export default async function LichDayPage({ searchParams }: { searchParams: Promise<{ tuan?: string; san?: string; ngay?: string }> }) {
  const sp = await searchParams;
  const session = await requireSession();
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const ws = weekStart(isDate(sp.tuan) ? sp.tuan : today);
  const we = addDays(ws, 7);
  const [sessionsAll, slotsAll, venues, classes] = await Promise.all([
    t.sessionsBetween(vnIso(ws, "00:00"), vnIso(we, "00:00")), t.freeSlots(), t.venues(), t.classes(),
  ]);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name ?? null;
  const sessions = sp.san ? sessionsAll.filter((s) => s.venue_id === sp.san) : sessionsAll;
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
    for (const [k, v] of Object.entries({ tuan: ws, san: sp.san, ngay: sp.ngay, ...patch })) if (v) q.set(k, v);
    return `/quan-ly/lich-day?${q}`;
  };

  return (
    <>
      <PageHead
        icon="cal"
        color="cyan"
        title="Lịch dạy"
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
        <div className="flex max-w-full gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <Link href={href({ san: undefined })} className={`chip ${!sp.san ? "on" : ""}`}>Mọi sân</Link>
          {venues.map((v) => (
            <Link key={v.id} href={href({ san: v.id })} className={`chip ${sp.san === v.id ? "on" : ""}`}>{v.name}</Link>
          ))}
        </div>
      </div>

      <WeekCalendar weekStartDate={ws} events={events} today={today} selectedDay={selectedDay} dayHref={(d) => href({ ngay: String(d) })} />
      <CalendarLegend items={["c", "t", "f", "x"]} />

      <section className="card mt-4">
        <h2 className="h2">
          Giờ rảnh hằng tuần <span className="text-[13px] font-medium text-faint">học viên thấy ở trang Lịch &amp; sân</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {slotsAll.length === 0 && <span className="text-muted">Chưa khai giờ rảnh nào.</span>}
          {slotsAll.map((s) => (
            <form key={s.id} action={deleteFreeSlot} className="chip" style={{ cursor: "default", paddingRight: 6 }}>
              <input type="hidden" name="id" value={s.id} />
              {WEEKDAY_LONG[s.weekday - 1]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
              {venueName(s.venue_id) ? ` · ${venueName(s.venue_id)}` : ""}
              <button className="grid size-6 place-items-center rounded-full hover:bg-page" aria-label="Xoá giờ rảnh này">
                <Icon name="x" size={14} />
              </button>
            </form>
          ))}
        </div>
        <ActionForm action={addFreeSlot} resetOnOk className="divide-row mt-3 grid grid-cols-2 items-end gap-3 pt-3 md:grid-cols-5">
          <div className="field">
            <label htmlFor="fs_day">Thứ</label>
            <select id="fs_day" name="weekday" className="input" defaultValue="1">
              {WEEKDAY_LONG.map((l, i) => <option key={l} value={i + 1}>{l}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="fs_s">Từ</label><input id="fs_s" name="start_time" type="time" required className="input" defaultValue="18:00" /></div>
          <div className="field"><label htmlFor="fs_e">Đến</label><input id="fs_e" name="end_time" type="time" required className="input" defaultValue="20:00" /></div>
          <div className="field">
            <label htmlFor="fs_v">Sân</label>
            <select id="fs_v" name="venue_id" className="input" defaultValue="">
              <option value="">Sân nào cũng được</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <Submit className="btn navy">Thêm giờ rảnh</Submit>
        </ActionForm>
      </section>
    </>
  );
}
