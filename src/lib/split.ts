import type { DeductMode } from "./settings";

// Quy tắc chia tiền theo buổi đã dạy (thuần, dùng chung cho xem trước và kiểm thử).
// Database làm đúng phép chia này trong public.regen_session_split (20261124000000_split_engine.sql) để tự ghi bút toán.

/** Tỉ lệ tính bằng phần vạn (basis point): 1000 = 10%. Tổng mọi phần phải bằng 10000. */
export type SplitRule = {
  sale_bp: number;
  coach_bp: number;
  reserve_bp: number; // quỹ dự phòng
  ops_bp: number; // quỹ vận hành (nhận cả phần lẻ do làm tròn)
  dev_bp: number; // quỹ phát triển phần mềm, phí nền tảng
  shareholders: { user_id: string | null; name: string; bp: number }[];
};

export type PartyKind = "sale" | "coach" | "quy-du-phong" | "quy-van-hanh" | "quy-phat-trien" | "co-dong";

export const PARTY_LABEL: Record<PartyKind, string> = {
  sale: "Sale (người chốt)",
  coach: "Coach đứng lớp",
  "quy-du-phong": "Quỹ dự phòng",
  "quy-van-hanh": "Quỹ vận hành",
  "quy-phat-trien": "Quỹ phát triển",
  "co-dong": "Cổ đông",
};

export type SplitPart = { kind: PartyKind; user_id: string | null; name: string | null; amount: number };

export const DEFAULT_RULE: SplitRule = {
  sale_bp: 1000,
  coach_bp: 5000,
  reserve_bp: 500,
  ops_bp: 1000,
  dev_bp: 500,
  shareholders: [
    { user_id: null, name: "Trung", bp: 1000 },
    { user_id: null, name: "Linh", bp: 1000 },
  ],
};

export function ruleTotal(r: SplitRule): number {
  return r.sale_bp + r.coach_bp + r.reserve_bp + r.ops_bp + r.dev_bp + r.shareholders.reduce((n, s) => n + s.bp, 0);
}

/**
 * Chia một khoản (đồng, số nguyên) theo tỉ lệ. Mỗi phần làm tròn xuống;
 * phần lẻ còn lại cộng vào quỹ vận hành để tổng các phần luôn bằng đúng khoản đem chia.
 */
export function splitAmount(base: number, rule: SplitRule, who: { saleId: string | null; saleName?: string | null; coachId: string | null; coachName?: string | null }): SplitPart[] {
  if (!Number.isInteger(base) || base < 0) throw new Error("Số tiền đem chia phải là số nguyên đồng, không âm");
  if (ruleTotal(rule) !== 10000) throw new Error("Tổng tỉ lệ phải bằng 100%");
  const part = (bp: number) => Math.floor((base * bp) / 10000);
  const parts: SplitPart[] = [
    { kind: "sale", user_id: who.saleId, name: who.saleName ?? null, amount: part(rule.sale_bp) },
    { kind: "coach", user_id: who.coachId, name: who.coachName ?? null, amount: part(rule.coach_bp) },
    { kind: "quy-du-phong", user_id: null, name: null, amount: part(rule.reserve_bp) },
    { kind: "quy-van-hanh", user_id: null, name: null, amount: part(rule.ops_bp) },
    { kind: "quy-phat-trien", user_id: null, name: null, amount: part(rule.dev_bp) },
    ...rule.shareholders.map((s) => ({ kind: "co-dong" as const, user_id: s.user_id, name: s.name, amount: part(s.bp) })),
  ];
  const rest = base - parts.reduce((n, p) => n + p.amount, 0);
  parts.find((p) => p.kind === "quy-van-hanh")!.amount += rest;
  return parts;
}

/** Khoản đem chia cho một học viên ở một buổi: phí buổi nếu trả theo buổi, không thì giá gói ÷ số buổi (làm tròn xuống). */
export function perSessionBase(e: { price: number | null; sessions_total: number | null; price_per_session?: number | null }): number | null {
  if (e.price_per_session != null && e.price_per_session > 0) return e.price_per_session;
  if (e.price == null || !e.sessions_total) return null;
  return Math.floor(e.price / e.sessions_total);
}

/** Trạng thái điểm danh bị trừ buổi theo quy định lớp. */
export function deducted(mode: DeductMode): ("co-mat" | "vang" | "bao-nghi")[] {
  if (mode === "chi-co-mat") return ["co-mat"];
  if (mode === "moi-buoi") return ["co-mat", "vang", "bao-nghi"];
  return ["co-mat", "vang"];
}

/** Cộng các phần theo bên nhận (người / quỹ). */
export function totalsByParty(parts: SplitPart[]): Map<string, { kind: PartyKind; user_id: string | null; name: string | null; amount: number }> {
  const out = new Map<string, { kind: PartyKind; user_id: string | null; name: string | null; amount: number }>();
  for (const p of parts) {
    const key = `${p.kind}:${p.user_id ?? p.name ?? ""}`;
    const cur = out.get(key) ?? { kind: p.kind, user_id: p.user_id, name: p.name, amount: 0 };
    cur.amount += p.amount;
    out.set(key, cur);
  }
  return out;
}

/** Phần trăm hiển thị từ phần vạn: 1000 → "10", 250 → "2,5". */
export const pct = (bp: number) => (bp / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** "10" / "2,5" / "2.5" → phần vạn. Trả null nếu không phải số hợp lệ trong 0–100. */
export function parsePct(s: string): number | null {
  const t = s.trim().replace(",", ".").replace(/%$/, "");
  if (t === "" || !/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const bp = Math.round(Number(t) * 100);
  return bp <= 10000 ? bp : null;
}

export type RuleInput = SplitRule & { effective_from: string; note: string | null };

/** Đọc form "Tỉ lệ chia & cổ đông". Cổ đông là các dòng sh_name_i / sh_user_i / sh_pct_i (bỏ dòng trống tên). */
export function parseRuleForm(get: (k: string) => string | null): { ok: true; rule: RuleInput } | { ok: false; error: string } {
  const date = (get("effective_from") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Chọn ngày bắt đầu áp dụng." };
  const fields = [["sale_bp", "Sale"], ["coach_bp", "Coach đứng lớp"], ["reserve_bp", "Quỹ dự phòng"], ["ops_bp", "Quỹ vận hành"], ["dev_bp", "Quỹ phát triển"]] as const;
  const bp: Record<string, number> = {};
  for (const [k, label] of fields) {
    const v = parsePct(get(k) ?? "");
    if (v == null) return { ok: false, error: `Tỉ lệ ${label} chưa đúng (0–100%).` };
    bp[k] = v;
  }
  const shareholders: SplitRule["shareholders"] = [];
  for (let i = 0; i < 20; i++) {
    const name = (get(`sh_name_${i}`) ?? "").trim();
    if (!name) continue;
    const v = parsePct(get(`sh_pct_${i}`) ?? "");
    if (v == null) return { ok: false, error: `Tỉ lệ của cổ đông ${name} chưa đúng.` };
    const user = (get(`sh_user_${i}`) ?? "").trim();
    shareholders.push({ name: name.slice(0, 60), user_id: user || null, bp: v });
  }
  const rule: RuleInput = {
    sale_bp: bp.sale_bp, coach_bp: bp.coach_bp, reserve_bp: bp.reserve_bp, ops_bp: bp.ops_bp, dev_bp: bp.dev_bp,
    shareholders, effective_from: date, note: (get("note") ?? "").trim().slice(0, 300) || null,
  };
  const total = ruleTotal(rule);
  if (total !== 10000) return { ok: false, error: `Tổng các phần đang là ${pct(total)}%, phải đúng 100%.` };
  return { ok: true, rule };
}
