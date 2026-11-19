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
