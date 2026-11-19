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

// ---------------------------------------------------------------- chốt tháng, chi trả
const CHI_TRA = "/quan-ly/tai-chinh/chi-tra";
const QUY = "/quan-ly/tai-chinh/quy";
const TRO_GIANG = "/quan-ly/tai-chinh/tro-giang";
const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const money = (f: FormData, k: string) => {
  const raw = String(f.get(k) ?? "").trim();
  const neg = raw.startsWith("-") || raw.startsWith("−");
  const v = raw.replace(/[^\d]/g, "");
  return v ? (neg ? -Number(v) : Number(v)) : null;
};
const back = (path: string, msg: string) => redirect(`${path}${path.includes("?") ? "&" : "?"}loi=${encodeURIComponent(msg)}`);

/** Tải ảnh chứng từ vào kho riêng tư "chung-tu" (đường dẫn bắt đầu bằng coach_id). Không có tệp thì trả null. */
async function uploadProof(db: Awaited<ReturnType<typeof serverClient>>, coachId: string, kind: string, f: FormData): Promise<string | null> {
  const file = f.get("proof");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5 MB.");
  if (!PROOF_TYPES.includes(file.type)) throw new Error("Chỉ nhận ảnh JPG, PNG, WEBP, HEIC hoặc PDF.");
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${coachId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("chung-tu").upload(path, file, { contentType: file.type });
  if (error) {
    console.error("uploadProof", error);
    throw new Error("Chưa tải được ảnh lên, bạn thử lại nhé.");
  }
  return path;
}

export async function closeMonth(form: FormData) {
  const session = await requireOwner();
  const month = String(form.get("month"));
  const db = await serverClient();
  const { error } = await db.rpc("close_split_month", { p_coach: session.coach.id, p_month: month });
  if (error) {
    console.error("closeMonth", error);
    back(`${CHIA}?thang=${month}`, error.message.includes("month_already_closed") ? "Tháng này đã chốt rồi." : error.message.includes("month_invalid") ? "Chưa chốt được tháng chưa tới." : "Chưa chốt được tháng, bạn thử lại nhé.");
  }
  revalidatePath("/quan-ly", "layout");
  redirect(`${CHI_TRA}?thang=${month}`);
}

export async function adjustPayout(form: FormData) {
  await requireOwner();
  const month = String(form.get("month"));
  const amount = money(form, "amount");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (amount == null) back(`${CHI_TRA}?thang=${month}`, "Nhập số tiền mới.");
  if (reason.length < 3) back(`${CHI_TRA}?thang=${month}`, "Sửa số sau khi chốt cần ghi lý do.");
  const db = await serverClient();
  const { data, error } = await db.rpc("adjust_payout", { p_payout: String(form.get("id")), p_amount: amount, p_reason: reason });
  if (error) {
    console.error("adjustPayout", error);
    back(`${CHI_TRA}?thang=${month}`, "Chưa sửa được, bạn thử lại nhé.");
  }
  revalidatePath(CHI_TRA);
  redirect(`${CHI_TRA}?thang=${month}&ok=${data === "dieu-chinh-thang-sau" ? "dieu-chinh" : "sua"}`);
}

export async function markPayout(form: FormData) {
  const session = await requireOwner();
  const month = String(form.get("month"));
  const paid = form.get("paid") === "1";
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  if (!paid && note.length < 3) back(`${CHI_TRA}?thang=${month}`, "Bỏ đánh dấu đã trả cần ghi lý do.");
  const db = await serverClient();
  let proof: string | null = null;
  try {
    proof = paid ? await uploadProof(db, session.coach.id, "chi-tra", form) : null;
  } catch (e) {
    back(`${CHI_TRA}?thang=${month}`, (e as Error).message);
  }
  const { error } = await db.rpc("mark_payout", { p_payout: String(form.get("id")), p_paid: paid, p_proof: proof ?? "", p_note: note });
  if (error) {
    console.error("markPayout", error);
    back(`${CHI_TRA}?thang=${month}`, "Chưa lưu được, bạn thử lại nhé.");
  }
  revalidatePath("/quan-ly", "layout");
  redirect(`${CHI_TRA}?thang=${month}`);
}

// ---------------------------------------------------------------- các quỹ
export async function addFundExpense(form: FormData) {
  const session = await requireOwner();
  const fund = String(form.get("fund"));
  const category = String(form.get("category"));
  const amount = money(form, "amount");
  const spentOn = String(form.get("spent_on") ?? "");
  if (!["quy-du-phong", "quy-van-hanh", "quy-phat-trien"].includes(fund)) back(QUY, "Chọn quỹ.");
  if (!["quang-cao", "san-bong", "phan-mem", "van-hanh", "khac"].includes(category)) back(QUY, "Chọn loại chi.");
  if (category === "quang-cao" && fund !== "quy-du-phong") back(QUY, "Chi quảng cáo lấy từ quỹ dự phòng.");
  if (category === "san-bong" && fund !== "quy-van-hanh") back(QUY, "Tiền sân / bóng lớp đặc thù lấy từ quỹ vận hành.");
  if (!amount || amount <= 0) back(QUY, "Nhập số tiền chi.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) back(QUY, "Chọn ngày chi.");
  const db = await serverClient();
  let proof: string | null = null;
  try {
    proof = await uploadProof(db, session.coach.id, "quy", form);
  } catch (e) {
    back(QUY, (e as Error).message);
  }
  const { error } = await db.from("fund_expenses").insert({
    coach_id: session.coach.id, fund, category, amount, spent_on: spentOn, proof_path: proof, created_by: session.userId,
    note: String(form.get("note") ?? "").trim().slice(0, 300) || null,
    class_id: String(form.get("class_id") ?? "") || null,
  });
  if (error) {
    console.error("addFundExpense", error);
    back(QUY, "Chưa lưu được khoản chi, bạn thử lại nhé.");
  }
  revalidatePath(QUY);
  redirect(`${QUY}?ok=1`);
}

export async function deleteFundExpense(form: FormData) {
  const session = await requireOwner();
  const db = await serverClient();
  const { error } = await db.from("fund_expenses").delete().eq("coach_id", session.coach.id).eq("id", String(form.get("id")));
  if (error) throw error;
  revalidatePath(QUY);
  redirect(QUY);
}

// ---------------------------------------------------------------- trợ giảng
export async function saveAssistantRate(form: FormData) {
  const session = await requireOwner();
  const db = await serverClient();
  const classId = String(form.get("class_id") ?? "");
  const assistantId = String(form.get("assistant_id") ?? "");
  if (!classId || !assistantId) back(TRO_GIANG, "Chọn lớp và trợ giảng.");
  const { error } = await db.from("assistant_rates").upsert(
    {
      coach_id: session.coach.id, class_id: classId, assistant_id: assistantId,
      per_session: Math.max(money(form, "per_session") ?? 0, 0), per_month: Math.max(money(form, "per_month") ?? 0, 0),
      note: String(form.get("note") ?? "").trim().slice(0, 200) || null,
    },
    { onConflict: "class_id,assistant_id" },
  );
  if (error) {
    console.error("saveAssistantRate", error);
    back(TRO_GIANG, "Chưa lưu được cơ chế trợ giảng.");
  }
  revalidatePath(TRO_GIANG);
  redirect(`${TRO_GIANG}?thang=${String(form.get("month") ?? "")}`);
}

export async function deleteAssistantRate(form: FormData) {
  const session = await requireOwner();
  const db = await serverClient();
  const { error } = await db.from("assistant_rates").delete().eq("coach_id", session.coach.id).eq("id", String(form.get("id")));
  if (error) throw error;
  revalidatePath(TRO_GIANG);
  redirect(TRO_GIANG);
}

export async function saveAssistantPayment(form: FormData) {
  const session = await requireOwner();
  const month = String(form.get("month"));
  const db = await serverClient();
  let proof: string | null = null;
  try {
    proof = await uploadProof(db, session.coach.id, "tro-giang", form);
  } catch (e) {
    back(`${TRO_GIANG}?thang=${month}`, (e as Error).message);
  }
  const paid = Math.max(money(form, "paid_amount") ?? 0, 0);
  const row: Record<string, unknown> = {
    coach_id: session.coach.id, month, class_id: String(form.get("class_id")), assistant_id: String(form.get("assistant_id")),
    student_paid: Math.max(money(form, "student_paid") ?? 0, 0), paid_amount: paid,
    paid_at: paid > 0 ? new Date().toISOString() : null, note: String(form.get("note") ?? "").trim().slice(0, 200) || null, updated_at: new Date().toISOString(),
  };
  if (proof) row.proof_path = proof;
  const { error } = await db.from("assistant_payments").upsert(row, { onConflict: "coach_id,month,class_id,assistant_id" });
  if (error) {
    console.error("saveAssistantPayment", error);
    back(`${TRO_GIANG}?thang=${month}`, "Chưa lưu được.");
  }
  revalidatePath(TRO_GIANG);
  redirect(`${TRO_GIANG}?thang=${month}`);
}
