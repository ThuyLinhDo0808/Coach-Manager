// Bảng giá sân theo khung giờ: giá mỗi giờ mỗi sân, chia hai nhóm ngày.

export type DayGroup = "t2-t6" | "t7-cn";
export type PriceRule = { days: DayGroup; from: string; to: string; price: number };

export const DAY_GROUPS: { value: DayGroup; label: string }[] = [
  { value: "t2-t6", label: "Thứ 2 – Thứ 6" },
  { value: "t7-cn", label: "Thứ 7 – Chủ nhật" },
];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Sắp theo nhóm ngày rồi giờ bắt đầu. */
export const sortRules = (rules: PriceRule[]) =>
  [...rules].sort((a, b) => (a.days === b.days ? minutesOf(a.from) - minutesOf(b.from) : a.days === "t2-t6" ? -1 : 1));

/** Đọc giá trị lưu trong database (bỏ dòng hỏng). */
export function readRules(raw: unknown): PriceRule[] {
  if (!Array.isArray(raw)) return [];
  return sortRules(
    raw.filter(
      (r): r is PriceRule =>
        r && (r.days === "t2-t6" || r.days === "t7-cn") && TIME.test(r.from) && TIME.test(r.to) && Number.isInteger(r.price) && r.price >= 0,
    ),
  );
}

/** Lỗi của một dòng mới so với các dòng đã có (null nếu hợp lệ). */
export function ruleError(rule: PriceRule, existing: PriceRule[]): string | null {
  if (!TIME.test(rule.from) || !TIME.test(rule.to)) return "Chọn giờ bắt đầu và kết thúc.";
  if (minutesOf(rule.to) <= minutesOf(rule.from)) return "Giờ kết thúc phải sau giờ bắt đầu.";
  if (!Number.isInteger(rule.price) || rule.price <= 0) return "Nhập giá mỗi giờ.";
  const clash = existing.find((r) => r.days === rule.days && minutesOf(rule.from) < minutesOf(r.to) && minutesOf(r.from) < minutesOf(rule.to));
  if (clash) return `Trùng khung ${clash.from}–${clash.to}.`;
  return null;
}

/** Nhóm ngày của một ngày (YYYY-MM-DD). */
export function dayGroupOf(date: string): DayGroup {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6 ? "t7-cn" : "t2-t6";
}

/**
 * Tiền một sân cho một buổi (giờ Việt Nam, "HH:MM"), cộng theo từng khung giờ, làm tròn đến đồng.
 * Phút không nằm trong khung nào thì lấy giá của khung gần nhất trước đó (hoặc khung đầu tiên).
 */
export function courtCost(rules: PriceRule[], date: string, start: string, end: string): number | null {
  const list = sortRules(rules.filter((r) => r.days === dayGroupOf(date)));
  if (!list.length) return null;
  const a = minutesOf(start);
  const b = minutesOf(end);
  let total = 0;
  for (let m = a; m < b; m++) {
    const hit = list.find((r) => m >= minutesOf(r.from) && m < minutesOf(r.to)) ?? [...list].reverse().find((r) => minutesOf(r.from) <= m) ?? list[0];
    total += hit.price / 60;
  }
  return Math.round(total);
}

export function priceSummary(rules: PriceRule[]): string | null {
  if (!rules.length) return null;
  const prices = rules.map((r) => r.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  return lo === hi ? `${k(lo)} / giờ` : `${k(lo)}–${k(hi)} / giờ`;
}
