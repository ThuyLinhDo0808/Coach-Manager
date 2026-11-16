// Mọi giờ hiển thị theo giờ Việt Nam (UTC+7, không đổi giờ mùa).
const OFFSET_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;
export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const WEEKDAY_LONG = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const pad = (n: number) => String(n).padStart(2, "0");
const shifted = (d: Date | string | number) => new Date(new Date(d).getTime() + OFFSET_MS);

/** "2026-11-17" theo giờ VN. */
export function vnDate(d: Date | string | number = Date.now()): string {
  return shifted(d).toISOString().slice(0, 10);
}
/** "19:00" theo giờ VN. */
export function vnTime(d: Date | string | number): string {
  return shifted(d).toISOString().slice(11, 16);
}
/** Giờ dạng số thập phân theo giờ VN: 19:30 → 19.5 */
export function vnHour(d: Date | string | number): number {
  const s = shifted(d);
  return s.getUTCHours() + s.getUTCMinutes() / 60;
}
/** 1 = Thứ 2 … 7 = Chủ nhật, từ chuỗi ngày "YYYY-MM-DD". */
export function weekdayOf(date: string): number {
  const wd = new Date(`${date}T00:00:00Z`).getUTCDay();
  return wd === 0 ? 7 : wd;
}
export function addDays(date: string, n: number): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}
/** Thứ 2 của tuần chứa ngày này. */
export function weekStart(date: string): string {
  return addDays(date, 1 - weekdayOf(date));
}
/** Ngày + giờ VN → ISO có múi giờ, để lưu timestamptz. */
export function vnIso(date: string, time: string): string {
  return `${date}T${time.slice(0, 5)}:00+07:00`;
}
/** "2026-11-17" → "17/11" hoặc "17/11/2026". */
export function dmy(date: string, withYear = false): string {
  const [y, m, d] = date.slice(0, 10).split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}
/** "Thứ 3, 17/11" */
export function dayLabel(date: string): string {
  return `${WEEKDAY_LONG[weekdayOf(date) - 1]}, ${dmy(date)}`;
}
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isTime = (s: unknown): s is string => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d/.test(s);

/** Số ngày từ hôm nay tới sinh nhật kế tiếp (0 = hôm nay). */
export function daysToBirthday(birthDate: string, today: string): number {
  const [ty] = today.split("-").map(Number);
  const md = birthDate.slice(5);
  let next = `${ty}-${md}`;
  if (md === "02-29" && new Date(`${next}T00:00:00Z`).getUTCMonth() !== 1) next = `${ty}-02-28`;
  if (next < today) next = `${ty + 1}-${md === "02-29" ? "02-28" : md}`;
  return Math.round((new Date(`${next}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / DAY_MS);
}

/** Thời điểm hiện tại (ms). Tách ra hàm để component server gọi được. */
export const nowMs = (): number => Date.now();
