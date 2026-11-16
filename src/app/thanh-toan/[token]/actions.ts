"use server";

import { revalidatePath } from "next/cache";
import { hasSupabase } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";

export async function reportPaid(f: FormData) {
  const token = String(f.get("token") ?? "");
  if (!hasSupabase || !/^[0-9a-f-]{36}$/.test(token)) return;
  const { error } = await publicClient().rpc("report_offer_paid", { p_token: token });
  if (error) console.error("report_offer_paid", error);
  revalidatePath(`/thanh-toan/${token}`);
}
