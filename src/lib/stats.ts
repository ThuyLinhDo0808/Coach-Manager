import type { LedgerRow } from "@/lib/money";
import { shiftMonth } from "@/lib/money";
import type { Lead, LeadStatus } from "@/lib/types";

// Thứ tự các bước trong phễu: nhu cầu ở bước sau được coi là đã đi qua bước trước.
const RANK: Record<LeadStatus, number> = {
  moi: 0, "danh-sach-cho": 1, "khong-thanh": 1, "da-lien-he": 1, "hen-hoc-thu": 2, "cho-dong-tien": 2, "da-chot": 3,
};

/** Phễu chốt sale. `trialLeadIds`: các nhu cầu đã có buổi học thử (kể cả khi sau đó không thành). */
export function funnel(leads: Pick<Lead, "id" | "status" | "contacted_at">[], trialLeadIds: Set<string>) {
  const total = leads.length;
  const contacted = leads.filter((l) => RANK[l.status] >= 1 || l.contacted_at).length;
  const trial = leads.filter((l) => RANK[l.status] >= 2 || trialLeadIds.has(l.id)).length;
  const closed = leads.filter((l) => l.status === "da-chot").length;
  return [
    { label: "Nhu cầu mới", value: total },
    { label: "Đã liên hệ", value: contacted },
    { label: "Học thử / nhận offer", value: Math.min(trial, contacted) },
    { label: "Đã chốt", value: closed },
  ];
}

/** Tỷ lệ phần trăm, null khi mẫu số bằng 0. */
export const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null);

/** Danh sách tháng "YYYY-MM" kết thúc ở `last`, dài `n` tháng, cũ → mới. */
export function lastMonths(last: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => shiftMonth(last, i - n + 1));
}

export function monthlyTotals(rows: Pick<LedgerRow, "entry_date" | "kind" | "amount">[], months: string[]) {
  return months.map((m) => {
    const mine = rows.filter((r) => r.entry_date.startsWith(m));
    return {
      month: m,
      thu: mine.filter((r) => r.kind === "thu").reduce((s, r) => s + r.amount, 0),
      chi: mine.filter((r) => r.kind === "chi").reduce((s, r) => s + r.amount, 0),
    };
  });
}

/** Đếm theo nhóm, nhiều → ít. */
export function countBy<T>(items: T[], key: (x: T) => string | null | undefined): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

/** Học tiếp: trong số học viên đã có ít nhất một khoá, bao nhiêu người có từ hai khoá trở lên. */
export function retention(enrollments: { student_id: string; status: string }[]): { again: number; base: number } {
  const per = new Map<string, number>();
  for (const e of enrollments) if (e.status !== "nghi") per.set(e.student_id, (per.get(e.student_id) ?? 0) + 1);
  const counts = [...per.values()];
  return { again: counts.filter((n) => n >= 2).length, base: counts.length };
}

/** DUPR tăng trung bình sau một khoá (các khoá đã tốt nghiệp có DUPR cuối và học viên có DUPR đầu vào). */
export function avgDuprGain(grads: { final_dupr: number | null; start: number | null }[]): number | null {
  const gains = grads.filter((g) => g.final_dupr != null && g.start != null).map((g) => Number(g.final_dupr) - Number(g.start));
  return gains.length ? Math.round((gains.reduce((s, g) => s + g, 0) / gains.length) * 10) / 10 : null;
}
