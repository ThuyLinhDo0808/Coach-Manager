import Link from "next/link";
import { STAT_RANGES } from "@/lib/stats";

/** Chọn 3 / 6 / 12 tháng trên băng tiêu đề (giữ nguyên trang đang xem). */
export function RangeSeg({ path, n }: { path: string; n: number }) {
  return (
    <span className="seg" style={{ background: "rgba(255,255,255,.12)" }}>
      {STAT_RANGES.map((r) => (
        <Link key={r} href={`${path}?thang=${r}`} className={r === n ? "on" : ""} style={r === n ? { background: "#fff", color: "var(--color-navy)" } : { color: "#b9c5da" }}>
          {r} tháng
        </Link>
      ))}
    </span>
  );
}

/** Cột ngang đơn giản cho bảng số (0–100%). */
export function Bar({ value, max, color = "var(--color-navy)" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-page">
      <div className="h-full rounded-full" style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%`, background: color }} />
    </div>
  );
}
