"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { fieldErrors, leadSchema } from "@/lib/lead-schema";
import { serverClient } from "@/lib/supabase/server";
import { LEAD_ORIGINS, LEAD_STATUSES, type LeadNoteKind, type LeadStatus } from "@/lib/types";

const PATH = "/quan-ly/nhu-cau";
const statusLabel = (s: string) => LEAD_STATUSES.find((x) => x.value === s)?.label ?? s;

async function addNote(leadId: string, body: string, kind: LeadNoteKind) {
  const session = await requirePerm("tuyen-sinh");
  const supabase = await serverClient();
  const { error } = await supabase
    .from("lead_notes")
    .insert({ coach_id: session.coach.id, lead_id: leadId, author_id: session.userId, body, kind });
  if (error) throw error;
}

export async function changeStatus(form: FormData) {
  const session = await requirePerm("tuyen-sinh");
  const id = String(form.get("id"));
  const status = String(form.get("status")) as LeadStatus;
  const lostReason = String(form.get("lost_reason") ?? "").trim();
  if (!LEAD_STATUSES.some((s) => s.value === status)) return;
  // Đã chốt chỉ qua nút Chốt (bắt buộc chọn người chốt); database cũng chặn.
  if (status === "da-chot") return;
  if (status === "khong-thanh" && !lostReason) return;

  const supabase = await serverClient();
  const patch: Record<string, unknown> = { status, lost_reason: status === "khong-thanh" ? lostReason : null };
  if (status !== "moi") patch.contacted_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("leads")
    .update(patch)
    .eq("id", id)
    .eq("coach_id", session.coach.id)
    .neq("status", status)
    .select("id");
  if (error) throw error;
  if (data.length) {
    await addNote(id, `Chuyển sang "${statusLabel(status)}"${lostReason ? ` · lý do: ${lostReason}` : ""}`, "trang-thai");
  }
  revalidatePath("/quan-ly", "layout");
}

export async function addLeadNote(form: FormData) {
  const session = await requirePerm("tuyen-sinh");
  const id = String(form.get("id"));
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  const kind = String(form.get("kind") ?? "ghi-chu") as LeadNoteKind;
  const remindOn = String(form.get("remind_on") ?? "");
  if (!["ghi-chu", "goi", "nhan", "hen"].includes(kind)) return;
  if (!body && !remindOn) return;

  const supabase = await serverClient();
  if (/^\d{4}-\d{2}-\d{2}$/.test(remindOn) || form.has("remind_on")) {
    const { error } = await supabase
      .from("leads")
      .update({ remind_on: remindOn || null })
      .eq("id", id)
      .eq("coach_id", session.coach.id);
    if (error) throw error;
  }
  const remindText = remindOn ? `Nhắc lại ngày ${remindOn.split("-").reverse().join("/")}` : "";
  await addNote(id, [body, remindText].filter(Boolean).join(" · "), kind);
  revalidatePath(PATH);
}

export async function assignLead(form: FormData) {
  const session = await requirePerm("tuyen-sinh");
  const id = String(form.get("id"));
  const userId = String(form.get("assigned_to") ?? "") || null;
  const supabase = await serverClient();
  const { error } = await supabase.from("leads").update({ assigned_to: userId }).eq("id", id).eq("coach_id", session.coach.id);
  if (error) throw error;
  revalidatePath(PATH);
}

export type CreateState = { message: string; errors?: Record<string, string> } | null;

/** Sale nhập tay nhu cầu từ Facebook / Zalo / gặp trực tiếp. */
export async function createLead(_prev: CreateState, form: FormData): Promise<CreateState> {
  const session = await requirePerm("tuyen-sinh");
  const origin = String(form.get("origin") ?? "khac");
  const parsed = leadSchema
    .partial({ gender: true, birth_year: true })
    .safeParse({
      full_name: form.get("full_name"),
      phone: form.get("phone"),
      gender: form.get("gender") || undefined,
      birth_year: form.get("birth_year") || undefined,
      course_id: form.get("course_id") || null,
      area: form.get("area") ?? "",
      note: form.get("note") ?? "",
    });
  if (!parsed.success) return { message: "Một vài ô chưa đúng.", errors: fieldErrors(parsed.error) };
  if (!LEAD_ORIGINS.some((o) => o.value === origin)) return { message: "Nguồn chưa đúng." };

  const d = parsed.data;
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      coach_id: session.coach.id,
      full_name: d.full_name,
      phone: d.phone,
      gender: d.gender ?? null,
      birth_year: d.birth_year ?? null,
      course_id: d.course_id,
      area: d.area || null,
      note: d.note || null,
      origin,
      assigned_to: session.roles.includes("sale") && !session.roles.includes("chu") ? session.userId : null,
    })
    .select("id")
    .single();
  if (error) {
    console.error("createLead", error);
    return { message: "Chưa lưu được, bạn thử lại nhé." };
  }
  revalidatePath("/quan-ly", "layout");
  redirect(`${PATH}?id=${data.id}`);
}

/** Quản lý đào tạo xác nhận đã nhận báo chốt / đã xếp lớp. */
export async function confirmPlacement(form: FormData) {
  await requirePerm("xac-nhan-xep-lop");
  const supabase = await serverClient();
  const leadId = String(form.get("id"));
  const classId = String(form.get("class_id") ?? "") || null;
  const { error } = await supabase.rpc("confirm_lead_placement", { p_lead: leadId, p_class: classId });
  if (error) throw error;
  revalidatePath("/quan-ly", "layout");
}
