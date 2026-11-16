import "server-only";
import type { LedgerRow, Offer } from "@/lib/money";
import { serverClient } from "@/lib/supabase/server";

const must = <T,>(r: { data: T | null; error: unknown }): T => {
  if (r.error) throw r.error;
  return r.data as T;
};

export async function moneyDb(coachId: string) {
  const db = await serverClient();
  return {
    ledgerBetween: async (from: string, to: string) =>
      must(await db.from("ledger").select("*").eq("coach_id", coachId).gte("entry_date", from).lt("entry_date", to).order("entry_date", { ascending: false }).order("created_at", { ascending: false })) as LedgerRow[],
    ledgerAllThu: async () => must(await db.from("ledger").select("student_id, amount, kind, category").eq("coach_id", coachId)) as Pick<LedgerRow, "student_id" | "amount" | "kind" | "category">[],
    offersOpen: async () => must(await db.from("offers").select("*").eq("coach_id", coachId).in("status", ["cho", "da-bao"]).order("created_at", { ascending: false })) as Offer[],
    offersOfLead: async (leadId: string) => must(await db.from("offers").select("*").eq("coach_id", coachId).eq("lead_id", leadId).order("created_at", { ascending: false })) as Offer[],
    offersConfirmedBetween: async (fromIso: string, toIso: string) =>
      must(await db.from("offers").select("*").eq("coach_id", coachId).eq("status", "da-xac-nhan").gte("confirmed_at", fromIso).lt("confirmed_at", toIso)) as Offer[],
  };
}
