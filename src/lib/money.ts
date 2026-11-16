export type LedgerKind = "thu" | "chi";
export const LEDGER_CATEGORIES: { value: string; label: string; kind: LedgerKind }[] = [
  { value: "tien-goi", label: "Tiền gói", kind: "thu" },
  { value: "phi-buoi", label: "Phí buổi", kind: "thu" },
  { value: "tien-coc", label: "Tiền cọc", kind: "thu" },
  { value: "thue-san", label: "Thuê sân", kind: "chi" },
  { value: "dung-cu", label: "Dụng cụ", kind: "chi" },
  { value: "hoa-hong", label: "Hoa hồng", kind: "chi" },
  { value: "luong", label: "Lương", kind: "chi" },
  { value: "hoan-tien", label: "Hoàn tiền", kind: "chi" },
  { value: "khac", label: "Khác", kind: "chi" },
];
export const categoryLabel = (v: string) => LEDGER_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export type LedgerRow = {
  id: string;
  entry_date: string;
  kind: LedgerKind;
  category: string;
  amount: number;
  description: string;
  student_id: string | null;
  class_id: string | null;
  offer_id: string | null;
  recorded_by: string | null;
};

export type Offer = {
  id: string;
  lead_id: string;
  class_id: string | null;
  course_id: string | null;
  title: string;
  list_price: number;
  discount_pct: number;
  amount: number;
  pay_now: number;
  memo: string;
  expires_on: string | null;
  status: "cho" | "da-bao" | "da-xac-nhan" | "huy";
  token: string;
  created_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

const vn = new Intl.NumberFormat("vi-VN");
/** 3200000 → "3.200.000 đ" */
export const dong = (n: number) => `${vn.format(n)} đ`;
/** 38400000 → "38,4 tr" */
export const trieu = (n: number) => `${vn.format(Math.round(n / 100_000) / 10)} tr`;

export function totals(rows: Pick<LedgerRow, "kind" | "amount">[]) {
  const thu = rows.filter((r) => r.kind === "thu").reduce((s, r) => s + r.amount, 0);
  const chi = rows.filter((r) => r.kind === "chi").reduce((s, r) => s + r.amount, 0);
  return { thu, chi, net: thu - chi };
}

/** "2026-11" → { from: "2026-11-01", to: "2026-12-01" } */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}
export function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}
export const isMonth = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** Học phí sau ưu đãi và số cần chuyển lần này (cọc theo %). Làm tròn tới nghìn đồng. */
export function offerAmounts(listPrice: number, discountPct: number, depositPct: number) {
  const round = (n: number) => Math.round(n / 1000) * 1000;
  const amount = round(listPrice * (1 - Math.min(Math.max(discountPct, 0), 100) / 100));
  const payNow = depositPct > 0 && depositPct < 100 ? round((amount * depositPct) / 100) : amount;
  return { amount, payNow };
}

/** Mã ngắn dễ đọc cho nội dung chuyển khoản, ví dụ "CTM 7K2QX9". */
export function memoCode(prefix: string, random: () => number = Math.random): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `${prefix} ${code}`;
}

/** Lãi theo lớp: thu − chi của các khoản gắn với lớp. */
export function profitByClass(rows: Pick<LedgerRow, "kind" | "amount" | "class_id">[]): { class_id: string; thu: number; chi: number; net: number }[] {
  const map = new Map<string, { thu: number; chi: number }>();
  for (const r of rows) {
    if (!r.class_id) continue;
    const cur = map.get(r.class_id) ?? { thu: 0, chi: 0 };
    cur[r.kind] += r.amount;
    map.set(r.class_id, cur);
  }
  return [...map].map(([class_id, v]) => ({ class_id, ...v, net: v.thu - v.chi })).sort((a, b) => b.net - a.net);
}
