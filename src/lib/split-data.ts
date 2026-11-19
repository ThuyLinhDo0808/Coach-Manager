import "server-only";
import type { PartyKind, SplitRule } from "@/lib/split";
import { serverClient } from "@/lib/supabase/server";

export type RuleRow = SplitRule & { id: string; effective_from: string; note: string | null; created_at: string };
export type SplitEntry = {
  id: string;
  session_id: string | null;
  student_id: string | null;
  enrollment_id: string | null;
  entry_date: string;
  month: string;
  base_amount: number;
  party_kind: PartyKind;
  party_user_id: string | null;
  party_name: string | null;
  amount: number;
};

// Bảng chia tiền có từ migration 20261124000000_split_engine.sql; chưa chạy thì trả rỗng để web vẫn dựng được.
async function optional<T>(q: PromiseLike<{ data: unknown; error: unknown }>, empty: T): Promise<T> {
  const r = await q;
  if (r.error) {
    console.error("split-data", r.error);
    return empty;
  }
  return (r.data as T | null) ?? empty;
}

export async function splitDb(coachId: string) {
  const db = await serverClient();
  return {
    rules: () => optional(db.from("split_rules").select("*").eq("coach_id", coachId).order("effective_from", { ascending: false }), [] as RuleRow[]),
    /** Bút toán của tháng; RLS tự lọc: coach chủ thấy hết, người khác chỉ thấy phần của mình. */
    entriesOfMonth: (month: string) =>
      optional(db.from("split_entries").select("*").eq("coach_id", coachId).eq("month", month).order("entry_date").limit(20000), [] as SplitEntry[]),
    closedMonths: async () => (await optional(db.from("split_months").select("month").eq("coach_id", coachId), [] as { month: string }[])).map((m) => m.month),
  };
}

export type FundKey = "quy-du-phong" | "quy-van-hanh" | "quy-phat-trien";
export const FUND_LABEL: Record<FundKey, string> = { "quy-du-phong": "Quỹ dự phòng", "quy-van-hanh": "Quỹ vận hành", "quy-phat-trien": "Quỹ phát triển" };
export const FUND_HINT: Record<FundKey, string> = {
  "quy-du-phong": "chi quảng cáo, việc bất ngờ",
  "quy-van-hanh": "chi phí chung, tiền sân lớp đặc thù",
  "quy-phat-trien": "phần mềm, phí nền tảng",
};
export type ExpenseCategory = "quang-cao" | "san-bong" | "phan-mem" | "van-hanh" | "khac";
export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  "quang-cao": "Quảng cáo",
  "san-bong": "Sân / bóng lớp đặc thù",
  "phan-mem": "Phần mềm, nền tảng",
  "van-hanh": "Vận hành chung",
  khac: "Khác",
};
/** Loại chi bắt buộc đi với quỹ nào (database cũng chặn). */
export const EXPENSE_FUND: Partial<Record<ExpenseCategory, FundKey>> = { "quang-cao": "quy-du-phong", "san-bong": "quy-van-hanh" };

export type Payout = {
  id: string;
  month: string;
  party_key: string;
  party_kind: "nguoi" | "quy";
  party_user_id: string | null;
  party_name: string;
  breakdown: Record<string, number>;
  amount: number;
  paid_at: string | null;
  proof_path: string | null;
  paid_note: string | null;
};
export type AuditRow = { id: string; month: string; party_name: string | null; action: string; old_amount: number | null; new_amount: number | null; reason: string | null; actor_name: string | null; at: string };
export type Adjustment = { id: string; from_month: string; to_month: string; party_name: string; amount: number; reason: string; applied_payout_id: string | null };
export type FundBalance = { fund: FundKey; vao: number; vao_da_chot: number; chi: number; so_du: number };
export type FundExpense = { id: string; fund: FundKey; category: ExpenseCategory; amount: number; spent_on: string; note: string | null; proof_path: string | null; class_id: string | null };
export type AssistantRate = { id: string; class_id: string; assistant_id: string; per_session: number; per_month: number; note: string | null };
export type AssistantPayment = { id: string; month: string; class_id: string; assistant_id: string; student_paid: number; paid_amount: number; paid_at: string | null; proof_path: string | null; note: string | null };
export type AssistantDue = { class_id: string; assistant_id: string; sessions: number; per_session: number; per_month: number; amount: number; class_title: string };

export async function payoutDb(coachId: string) {
  const db = await serverClient();
  return {
    payouts: (month: string) => optional(db.from("split_payouts").select("*").eq("coach_id", coachId).eq("month", month).order("party_kind").order("amount", { ascending: false }), [] as Payout[]),
    unpaid: () => optional(db.from("split_payouts").select("*").eq("coach_id", coachId).is("paid_at", null).neq("amount", 0).order("month"), [] as Payout[]),
    audit: (month: string) => optional(db.from("split_audit").select("*").eq("coach_id", coachId).eq("month", month).order("at", { ascending: false }).limit(200), [] as AuditRow[]),
    adjustmentsTo: (month: string) => optional(db.from("split_adjustments").select("*").eq("coach_id", coachId).eq("to_month", month).order("created_at"), [] as Adjustment[]),
    fundBalances: async () =>
      ((await optional(db.rpc("fund_balances", { p_coach: coachId }), [] as FundBalance[])) ?? []).map((f) => ({
        ...f, vao: Number(f.vao), vao_da_chot: Number(f.vao_da_chot), chi: Number(f.chi), so_du: Number(f.so_du),
      })),
    fundExpenses: () => optional(db.from("fund_expenses").select("*").eq("coach_id", coachId).order("spent_on", { ascending: false }).limit(500), [] as FundExpense[]),
    assistantRates: () => optional(db.from("assistant_rates").select("*").eq("coach_id", coachId), [] as AssistantRate[]),
    assistantPayments: (month: string) => optional(db.from("assistant_payments").select("*").eq("coach_id", coachId).eq("month", month), [] as AssistantPayment[]),
    assistantDue: (month: string) => optional(db.rpc("assistant_due", { p_coach: coachId, p_month: month }), [] as AssistantDue[]),
    /** Đường dẫn xem ảnh chứng từ (hết hạn sau 1 giờ). */
    proofUrls: async (paths: (string | null)[]) => {
      const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
      if (!list.length) return new Map<string, string>();
      const { data, error } = await db.storage.from("chung-tu").createSignedUrls(list, 3600);
      if (error || !data) return new Map<string, string>();
      return new Map<string, string>(data.filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl as string]));
    },
  };
}

export type PerfRow = { month: string; teacher_id: string; sessions: number; substitute: number; student_turns: number; revenue: number; coach_amount: number };

export async function reportDb(coachId: string) {
  const db = await serverClient();
  return {
    /** Số tổng theo tháng (coach chủ, quản lý, cổ đông). */
    summary: async (from: string, to: string) =>
      (await optional(db.rpc("split_summary", { p_coach: coachId, p_from: from, p_to: to }), [] as { month: string; kind: string; amount: number }[])).map((r) => ({ ...r, amount: Number(r.amount) })),
    performance: async (from: string, to: string) =>
      (await optional(db.rpc("coach_performance", { p_coach: coachId, p_from: from, p_to: to }), [] as PerfRow[])).map((r) => ({ ...r, revenue: Number(r.revenue), coach_amount: Number(r.coach_amount) })),
    /** Bút toán của chính người đang đăng nhập (RLS chỉ trả dòng của họ, trừ coach chủ nên lọc thêm). */
    myEntries: (userId: string, from: string, to: string) =>
      optional(db.from("split_entries").select("*").eq("coach_id", coachId).eq("party_user_id", userId).gte("month", from).lte("month", to).order("entry_date").limit(20000), [] as SplitEntry[]),
    entriesOfKind: (kind: PartyKind, from: string, to: string) =>
      optional(db.from("split_entries").select("*").eq("coach_id", coachId).eq("party_kind", kind).gte("month", from).lte("month", to).limit(50000), [] as SplitEntry[]),
    myPayouts: (userId: string) =>
      optional(db.from("split_payouts").select("*").eq("coach_id", coachId).eq("party_user_id", userId).order("month", { ascending: false }).limit(36), [] as Payout[]),
  };
}
