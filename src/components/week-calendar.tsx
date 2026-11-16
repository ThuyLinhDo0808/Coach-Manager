import Link from "next/link";
import { addDays, dmy, vnDate, vnHour, vnTime, WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/time";

export type CalEvent = {
  id: string;
  day: number; // 0 = Thứ 2 … 6 = Chủ nhật
  start: number; // giờ thập phân
  end: number;
  startText: string;
  endText: string;
  title: string;
  place?: string | null;
  kind: "c" | "t" | "f" | "x" | "b"; // buổi dạy · học thử · giờ rảnh · đã huỷ · đã kín (công khai)
  href?: string;
};

const STYLE: Record<CalEvent["kind"], React.CSSProperties> = {
  c: { background: "#e8edf7", color: "var(--color-ink)" },
  t: { background: "#ecfccb", border: "1.5px solid var(--color-lime2)", color: "var(--color-ink)" },
  f: { background: "#f2fbe6", border: "1.5px dashed #84cc16", color: "#3f6212" },
  x: { background: "#f0f0f3", color: "var(--color-faint)", textDecoration: "line-through" },
  b: { background: "#ececf0", color: "var(--color-faint)" },
};
const H0 = 6;
const H1 = 22;
const RH = 46;

export function sessionEvent(s: { id: string; starts_at: string; ends_at: string }, weekStartDate: string) {
  const date = vnDate(s.starts_at);
  const day = Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${weekStartDate}T00:00:00Z`).getTime()) / 86_400_000);
  return { id: s.id, day, start: vnHour(s.starts_at), end: vnHour(s.ends_at), startText: vnTime(s.starts_at), endText: vnTime(s.ends_at) };
}

function Block({ e }: { e: CalEvent }) {
  const top = (Math.max(e.start, H0) - H0) * RH + 2;
  const height = Math.max((Math.min(e.end, H1) - Math.max(e.start, H0)) * RH - 4, 20);
  const body = (
    <>
      <b className="block truncate">{e.title}</b>
      <div className="truncate opacity-80">
        {e.startText}–{e.endText}
        {e.end - e.start > 1.2 && e.place ? ` · ${e.place}` : ""}
      </div>
    </>
  );
  const style: React.CSSProperties = { position: "absolute", left: 4, right: 4, top, height, borderRadius: 10, padding: "5px 8px", fontSize: 12, lineHeight: 1.3, overflow: "hidden", ...STYLE[e.kind] };
  return e.href ? <Link href={e.href} style={style}>{body}</Link> : <div style={style}>{body}</div>;
}

/** Lưới tuần 7 ngày × giờ (máy tính) + dải ngày và danh sách (điện thoại). */
export function WeekCalendar({ weekStartDate, events, today, selectedDay, dayHref }: { weekStartDate: string; events: CalEvent[]; today: string; selectedDay: number; dayHref: (day: number) => string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const dayEvents = events.filter((e) => e.day === selectedDay).sort((a, b) => a.start - b.start);
  return (
    <>
      <div className="card hide-m overflow-hidden" style={{ padding: 0 }}>
        <div className="grid border-b border-line" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div />
          {days.map((d, i) => (
            <div key={d} className={`px-2 py-3 text-center font-bold ${d === today ? "text-navy" : ""}`}>
              {WEEKDAY_SHORT[i]}{" "}
              <span className={d === today ? "rounded-full bg-navy px-2 py-0.5 text-white" : "text-faint"}>{d.slice(8)}</span>
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
          <div>
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <div key={i} className="num pt-0.5 pr-2 text-right text-[11px] text-faint" style={{ height: RH }}>
                {String(H0 + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((d, i) => (
            <div
              key={d}
              className="relative border-l border-[#f0f0f3]"
              style={{ background: `repeating-linear-gradient(to bottom, transparent 0, transparent ${RH - 1}px, #f3f3f6 ${RH - 1}px, #f3f3f6 ${RH}px)` }}
            >
              {events.filter((e) => e.day === i && e.end > H0 && e.start < H1).map((e) => <Block key={e.kind + e.id} e={e} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="only-m">
        <div className="mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {days.map((d, i) => {
            const on = i === selectedDay;
            return (
              <Link key={d} href={dayHref(i)} scroll={false} className={`min-w-11 flex-1 rounded-[14px] py-2 text-center ${on ? "bg-navy text-white" : "bg-white"}`}>
                <div className={`text-xs font-semibold ${on ? "" : "text-faint"}`}>{WEEKDAY_SHORT[i]}</div>
                <div className="text-[17px] font-extrabold">{d.slice(8)}</div>
                <div className="mt-[3px] flex h-[5px] justify-center gap-[3px]">
                  {events.filter((e) => e.day === i && (e.kind === "c" || e.kind === "t")).slice(0, 5).map((e) => (
                    <i key={e.id} className="size-[5px] rounded-full" style={{ background: on ? "var(--color-lime)" : "var(--color-navy)" }} />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="card">
          <h2 className="h2">
            {WEEKDAY_LONG[selectedDay]}, {dmy(days[selectedDay])}
            <span className="text-[13px] font-medium text-faint">
              {dayEvents.filter((e) => e.kind === "c" || e.kind === "t").length} buổi · {dayEvents.filter((e) => e.kind === "f").length} giờ rảnh
            </span>
          </h2>
          {dayEvents.length === 0 && <div className="text-muted">Không có buổi nào.</div>}
          {dayEvents.map((e) => {
            const inner = (
              <>
                <div className="num w-12 flex-none font-extrabold">
                  {e.startText}
                  <div className="text-xs font-medium text-faint">{e.endText}</div>
                </div>
                <div className="flex-1 rounded-xl px-3 py-2.5" style={STYLE[e.kind]}>
                  <b>{e.title}</b>
                  {e.place && <div className="text-[13px] opacity-80">{e.place}</div>}
                </div>
              </>
            );
            return e.href ? (
              <Link key={e.kind + e.id} href={e.href} className="divide-row flex items-stretch gap-3 py-2.5">{inner}</Link>
            ) : (
              <div key={e.kind + e.id} className="divide-row flex items-stretch gap-3 py-2.5">{inner}</div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function CalendarLegend({ items }: { items: CalEvent["kind"][] }) {
  const label: Record<CalEvent["kind"], string> = { c: "Buổi dạy", t: "Học thử", f: "Giờ rảnh", x: "Đã huỷ", b: "Đã kín" };
  return (
    <div className="mt-3 flex flex-wrap gap-3.5 text-xs">
      {items.map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <i className="h-3 w-4 rounded" style={{ ...STYLE[k], textDecoration: undefined }} />
          <span className="text-muted">{label[k]}</span>
        </span>
      ))}
    </div>
  );
}
