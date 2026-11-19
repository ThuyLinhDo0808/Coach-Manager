import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Thumb } from "@/components/thumb";
import { CalendarLegend, sessionEvent, WeekCalendar, type CalEvent } from "@/components/week-calendar";
import { getBusyTimes, getCourses, getFreeSlots, getOpenClasses, getVenues } from "@/lib/data";
import { addDays, dmy, isDate, vnDate, vnIso, weekdayOf, weekStart } from "@/lib/time";

export const metadata: Metadata = { title: "Lịch & sân" };
export const revalidate = 60;

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

const hourOf = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;

export default async function LichSanPage({ searchParams }: { searchParams: Promise<{ tuan?: string; ngay?: string }> }) {
  const sp = await searchParams;
  const today = vnDate();
  const thisWeek = weekStart(today);
  // Chỉ cho xem tuần này và 3 tuần tới.
  const asked = isDate(sp.tuan) ? weekStart(sp.tuan) : thisWeek;
  const ws = asked < thisWeek || asked > addDays(thisWeek, 21) ? thisWeek : asked;
  const [classes, venues, courses, slots, busy] = await Promise.all([
    getOpenClasses(), getVenues(), getCourses(), getFreeSlots(), getBusyTimes(vnIso(ws, "00:00"), vnIso(addDays(ws, 7), "00:00")),
  ]);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;
  const events: CalEvent[] = [
    ...slots
      .filter((s) => addDays(ws, s.weekday - 1) >= today)
      .map((s): CalEvent => ({
        id: s.id, day: s.weekday - 1, start: hourOf(s.start_time), end: hourOf(s.end_time),
        startText: s.start_time.slice(0, 5), endText: s.end_time.slice(0, 5),
        title: "Còn trống", place: venueName(s.venue_id) ?? "Bấm để đăng ký", kind: "f", href: "/dang-ky",
      })),
    ...busy.map((b, i): CalEvent => ({ ...sessionEvent({ id: String(i), ...b }, ws), title: "Đã kín", kind: "b" })),
  ];
  const selectedDay = sp.ngay != null && /^[0-6]$/.test(sp.ngay) ? Number(sp.ngay) : ws === thisWeek ? weekdayOf(today) - 1 : 0;
  const weekHref = (w: string, day?: number) => `/lich-san?tuan=${w}${day != null ? `&ngay=${day}` : ""}`;

  return (
    <div className="grid gap-4">
      {(slots.length > 0 || busy.length > 0) && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="h2 mb-0">Lịch tuần {dmy(ws)} – {dmy(addDays(ws, 6))}</h2>
            <div className="flex gap-2">
              {ws > thisWeek && <Link href={weekHref(addDays(ws, -7))} scroll={false} className="btn sm ghost bg-white">‹ Tuần trước</Link>}
              {ws < addDays(thisWeek, 21) && <Link href={weekHref(addDays(ws, 7))} scroll={false} className="btn sm ghost bg-white">Tuần sau ›</Link>}
            </div>
          </div>
          <WeekCalendar weekStartDate={ws} events={events} today={today} selectedDay={selectedDay} dayHref={(d) => weekHref(ws, d)} />
          <CalendarLegend items={["f", "b"]} />
        </section>
      )}

      <section className="card">
        <h2 className="h2">Lớp đang tuyển</h2>
        {classes.length === 0 ? (
          <p className="text-muted">
            Hiện chưa có lớp mở sẵn. Bạn để lại nhu cầu, coach sẽ xếp lớp theo giờ rảnh của bạn.
          </p>
        ) : (
          classes.map((c, i) => {
            const course = courses.find((x) => x.id === c.course_id);
            const full = c.seats_left === 0;
            return (
              <div key={c.id} className={`flex flex-wrap items-center gap-3 py-3 ${i ? "divide-row" : "pt-0"}`}>
                <div className="min-w-[180px] flex-1">
                  <b>{c.title}</b>
                  <div className="text-[13px] text-faint">
                    {[c.schedule_text, venueName(c.venue_id), c.start_date ? `khai giảng ${fmtDate(c.start_date)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {c.seats_left != null && (
                  <span className={`pill ${full ? "n" : "good"}`}>
                    {full ? "Đã đủ" : `Còn ${c.seats_left}${c.seats_total ? `/${c.seats_total}` : ""} chỗ`}
                  </span>
                )}
                <Link href={course ? `/dang-ky?khoa=${course.slug}` : "/dang-ky"} className={`btn sm ${full ? "ghost" : "navy"}`}>
                  {full ? "Vào danh sách chờ" : "Đăng ký"}
                </Link>
              </div>
            );
          })
        )}
      </section>

      <section>
        <h2 className="h2 px-1">Sân coach đang dạy</h2>
        {venues.length === 0 ? (
          <div className="card text-muted">Danh sách sân sẽ được cập nhật.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map((v) => (
              <div key={v.id} className="card" style={{ padding: 10 }}>
                <Thumb src={v.image_url} alt={v.name} style={{ aspectRatio: "auto", height: 130 }} />
                <div className="px-1.5 pt-3 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-base">{v.name}</b>
                    {v.district && <span className="pill n">{v.district}</span>}
                  </div>
                  {v.address && (
                    <div className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
                      <Icon name="map" size={15} className="mt-0.5" />
                      {v.address}
                    </div>
                  )}
                  {v.maps_url && (
                    <a href={v.maps_url} target="_blank" rel="noopener noreferrer" className="btn sm ghost mt-3">
                      <Icon name="map" size={15} /> Mở Google Maps
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 text-white" style={{ background: "var(--grad-navy)" }}>
        <div>
          <b className="text-base">Chưa thấy giờ phù hợp?</b>
          <div className="text-[13px] text-[#b9c5da]">Điền giờ rảnh của bạn, coach sẽ xếp lớp hoặc kèm riêng.</div>
        </div>
        <Link href="/dang-ky" className="btn primary hide-m">
          Gửi nhu cầu học
        </Link>
      </section>
    </div>
  );
}
