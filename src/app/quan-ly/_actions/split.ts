"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { requireOwner } from "@/lib/owner";
import { parseRuleForm } from "@/lib/split";
import { serverClient } from "@/lib/supabase/server";

const TI_LE = "/quan-ly/cai-dat/ti-le";
const CHIA = "/quan-ly/tai-chinh/chia-tien";

/** Thêm (hoặc thay) tỉ lệ có hiệu lực từ một ngày. Chỉ coach chủ; database kiểm tra lại tổng 100% và quyền. */
export async function saveSplitRule(form: FormData) {
  const session = await requireOwner();
  const parsed = parseRuleForm((k) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  });
  if (!parsed.ok) redirect(`${TI_LE}?loi=${encodeURIComponent(parsed.error)}#moi`);
  const db = await serverClient();
  const { error } = await db
    .from("split_rules")
    .upsert({ ...parsed.rule, coach_id: session.coach.id, created_by: session.userId }, { onConflict: "coach_id,effective_from" });
  if (error) {
    console.error("saveSplitRule", error);
    redirect(`${TI_LE}?loi=${encodeURIComponent("Chưa lưu được tỉ lệ, bạn thử lại nhé.")}#moi`);
  }
  revalidatePath("/quan-ly", "layout");
  redirect(`${TI_LE}?da-luu=1`);
}

export async function deleteSplitRule(form: FormData) {
  const session = await requireOwner();
  const db = await serverClient();
  const rules = await db.from("split_rules").select("id").eq("coach_id", session.coach.id);
  // Luôn giữ ít nhất một tỉ lệ.
  if ((rules.data?.length ?? 0) > 1) {
    const { error } = await db.from("split_rules").delete().eq("coach_id", session.coach.id).eq("id", String(form.get("id")));
    if (error) throw error;
  }
  revalidatePath("/quan-ly", "layout");
  redirect(TI_LE);
}

/** Tính lại toàn bộ bút toán của một tháng chưa chốt (database chỉ cho coach chủ). */
export async function regenMonth(form: FormData) {
  const session = await requirePerm("tai-chinh");
  const month = String(form.get("month"));
  if (!/^\d{4}-\d{2}$/.test(month)) redirect(CHIA);
  const db = await serverClient();
  const { error } = await db.rpc("regen_month_split", { p_coach: session.coach.id, p_month: month });
  if (error) throw error;
  revalidatePath(CHIA);
  redirect(`${CHIA}?thang=${month}&tinh-lai=1`);
}
