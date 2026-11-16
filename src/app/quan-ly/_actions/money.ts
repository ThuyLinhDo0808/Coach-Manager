"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { LEDGER_CATEGORIES, memoCode, offerAmounts } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { serverClient } from "@/lib/supabase/server";
import { addDays, isDate, vnDate } from "@/lib/time";

export type FormState = { ok?: boolean; message: string } | null;

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const int = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d]/g, "");
  return v ? Number(v) : null;
};

/** Gửi offer cho một nhu cầu: tạo link thanh toán, chuyển nhu cầu sang Chờ đóng tiền. */
export async function createOffer(_p: FormState, f: FormData): Promise<FormState> {
  const session = await requireSession();
  const db = await serverClient();
  const leadId = str(f, "lead_id");
  const classId = str(f, "class_id") || null;
  const listPrice = int(f, "list_price");
  const discount = Math.min(int(f, "discount_pct") ?? 0, 100);
  if (!listPrice) return { message: "Bạn điền học phí nhé." };

  let title = str(f, "title", 120);
  let courseId: string | null = null;
  if (classId) {
    const { data: cls } = await db.from("classes").select("title, course_id").eq("id", classId).eq("coach_id", session.coach.id).maybeSingle();
    if (!cls) return { message: "Không tìm thấy lớp." };
    title = cls.title;
    courseId = cls.course_id;
  }
  if (!title) return { message: "Chọn lớp hoặc ghi tên khoá." };

  const payout = getSettings(session.coach.settings).payout;
  const { amount, payNow } = offerAmounts(listPrice, discount, payout.deposit_pct);
  const expires = str(f, "expires_on");
  const { error } = await db.from("offers").insert({
    coach_id: session.coach.id,
    lead_id: leadId,
    class_id: classId,
    course_id: courseId,
    title,
    list_price: listPrice,
    discount_pct: discount,
    amount,
    pay_now: payNow,
    memo: memoCode("CTM"),
    expires_on: isDate(expires) ? expires : addDays(vnDate(), payout.offer_days || 3),
    created_by: session.userId,
  });
  if (error) {
    console.error("createOffer", error);
    return { message: "Chưa tạo được offer." };
  }
  await db.from("leads").update({ status: "cho-dong-tien", contacted_at: new Date().toISOString() }).eq("id", leadId).eq("coach_id", session.coach.id).neq("status", "da-chot");
  await db.from("lead_notes").insert({
    coach_id: session.coach.id, lead_id: leadId, author_id: session.userId, kind: "trang-thai",
    body: `Gửi offer ${title}: ${amount.toLocaleString("vi-VN")} đ${discount ? ` (giảm ${discount}%)` : ""}`,
  });
  revalidatePath("/quan-ly", "layout");
  redirect(`/quan-ly/nhu-cau?id=${leadId}#chi-tiet`);
}

export async function cancelOffer(f: FormData) {
  const session = await requireSession();
  const db = await serverClient();
  const { error } = await db.from("offers").update({ status: "huy" }).eq("id", str(f, "id")).eq("coach_id", session.coach.id).in("status", ["cho", "da-bao"]);
  if (error) throw error;
  revalidatePath("/quan-ly", "layout");
}

/** Coach xác nhận đã nhận tiền: ghi sổ thu, tạo học viên, ghi danh lớp. */
export async function confirmOffer(f: FormData) {
  const session = await requireSession();
  if (session.role !== "owner") return;
  const db = await serverClient();
  const { error } = await db.rpc("confirm_offer", { p_offer: str(f, "id") });
  if (error) throw error;
  revalidatePath("/quan-ly", "layout");
  revalidatePath("/lich-san");
}

export async function addLedgerEntry(_p: FormState, f: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.role !== "owner") return { message: "Chỉ coach được ghi sổ thu chi." };
  const category = LEDGER_CATEGORIES.find((c) => c.value === str(f, "category"));
  const amount = int(f, "amount");
  const description = str(f, "description", 200);
  const date = str(f, "entry_date");
  const kind = str(f, "kind");
  if (!category) return { message: "Chọn loại khoản." };
  if (!amount) return { message: "Số tiền phải lớn hơn 0." };
  if (!description) return { message: "Ghi nội dung khoản này." };
  const db = await serverClient();
  const { error } = await db.from("ledger").insert({
    coach_id: session.coach.id,
    entry_date: isDate(date) ? date : vnDate(),
    // "Khác" có thể là thu hoặc chi; các loại còn lại theo bản chất của loại.
    kind: category.value === "khac" && kind === "thu" ? "thu" : category.kind,
    category: category.value,
    amount,
    description,
    class_id: str(f, "class_id") || null,
    student_id: str(f, "student_id") || null,
    recorded_by: session.userId,
  });
  if (error) {
    console.error("addLedgerEntry", error);
    return { message: "Chưa lưu được khoản này." };
  }
  revalidatePath("/quan-ly", "layout");
  return { ok: true, message: "Đã ghi sổ" };
}

export async function deleteLedgerEntry(f: FormData) {
  const session = await requireSession();
  const db = await serverClient();
  // Khoản sinh ra từ offer đã xác nhận thì không xoá tay, để sổ khớp với học phí đã nhận.
  const { error } = await db.from("ledger").delete().eq("id", str(f, "id")).eq("coach_id", session.coach.id).is("offer_id", null);
  if (error) throw error;
  revalidatePath("/quan-ly", "layout");
}
