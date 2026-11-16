"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { fieldErrors } from "@/lib/lead-schema";
import { requireOwner, saveSettings } from "@/lib/owner";
import {
  courseSchema,
  domainSchema,
  inviteSchema,
  memberSchema,
  notifySchema,
  payoutSchema,
  permissionsSchema,
  profileSchema,
  rulesSchema,
  templateSchema,
  venueSchema,
} from "@/lib/settings-schema";
import { bankName, type FormState } from "@/lib/settings-types";
import { uniqueSlug } from "@/lib/slug";
import { serverClient } from "@/lib/supabase/server";

const BASE = "/quan-ly/cai-dat";
const SAVED: FormState = { ok: true, message: "Đã lưu" };
const invalid = (error: z.ZodError): FormState => ({ ok: false, message: "Một vài ô chưa đúng, bạn xem lại nhé.", errors: fieldErrors(error) });
function failed(what: string, error: unknown, message = "Chưa lưu được, bạn thử lại nhé."): FormState {
  console.error(what, error);
  return { ok: false, message };
}
/** Nội dung công khai đổi: làm mới cả trang công khai lẫn khu quản lý. */
const refresh = () => revalidatePath("/", "layout");

// ---------------------------------------------------------------- hồ sơ coach
export async function saveProfile(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await serverClient();
  const { data, error } = await supabase.from("coaches").update(parsed.data).eq("id", session.coach.id).select("id");
  if (error || !data.length) return failed("saveProfile", error);
  refresh();
  return SAVED;
}

// ---------------------------------------------------------------- sân dạy
export async function saveVenue(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = venueSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...venue } = parsed.data;

  const supabase = await serverClient();
  if (id) {
    const { data, error } = await supabase.from("venues").update(venue).eq("id", id).eq("coach_id", session.coach.id).select("id");
    if (error || !data.length) return failed("saveVenue", error);
  } else {
    const { error } = await supabase.from("venues").insert({ ...venue, coach_id: session.coach.id });
    if (error) return failed("saveVenue", error);
  }
  refresh();
  return id ? SAVED : { ok: true, message: "Đã thêm sân" };
}

export async function deleteVenue(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("venues").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
  redirect(`${BASE}/san`);
}

// ---------------------------------------------------------------- mẫu khoá học
export async function saveCourse(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = courseSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...course } = parsed.data;

  const supabase = await serverClient();
  if (course.venue_id) {
    const { data: venue } = await supabase.from("venues").select("id").eq("id", course.venue_id).eq("coach_id", session.coach.id).maybeSingle();
    if (!venue) return { ok: false, message: "Sân đã chọn không còn nữa.", errors: { venue_id: "Bạn chọn lại sân nhé" } };
  }
  if (id) {
    // Giữ nguyên slug để link công khai cũ không hỏng.
    const { data, error } = await supabase.from("courses").update(course).eq("id", id).eq("coach_id", session.coach.id).select("id");
    if (error || !data.length) return failed("saveCourse", error);
    refresh();
    return SAVED;
  }

  const { data: taken, error: slugError } = await supabase.from("courses").select("slug").eq("coach_id", session.coach.id);
  if (slugError) return failed("saveCourse: slug", slugError);
  const slug = uniqueSlug(course.title, taken.map((c) => c.slug), 80, "khoa-hoc");
  const { data, error } = await supabase.from("courses").insert({ ...course, slug, coach_id: session.coach.id }).select("id").single();
  if (error) return failed("saveCourse", error);
  refresh();
  redirect(`${BASE}/mau-khoa?id=${data.id}`);
}

export async function deleteCourse(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("courses").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
  redirect(`${BASE}/mau-khoa`);
}

// ---------------------------------------------------------------- các nhóm trong coaches.settings
export async function saveRules(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = rulesSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await saveSettings(session.coach.id, { rules: parsed.data }))) return failed("saveRules", null);
  revalidatePath(BASE, "layout");
  return SAVED;
}

export async function savePayout(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = payoutSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { accept_cash, require_proof, ...bank } = parsed.data;
  const ok = await saveSettings(session.coach.id, {
    payout: { ...bank, bank_name: bankName(bank.bank_bin) },
    collect: { accept_cash, require_proof },
  });
  if (!ok) return failed("savePayout", null);
  revalidatePath("/quan-ly", "layout");
  return SAVED;
}

export async function savePermissions(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = permissionsSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await saveSettings(session.coach.id, parsed.data))) return failed("savePermissions", null);
  revalidatePath("/quan-ly", "layout");
  return SAVED;
}

export async function saveNotify(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = notifySchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await saveSettings(session.coach.id, { notify: parsed.data }))) return failed("saveNotify", null);
  revalidatePath(BASE, "layout");
  return SAVED;
}

export async function saveDomain(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = domainSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await saveSettings(session.coach.id, parsed.data))) return failed("saveDomain", null);
  revalidatePath(BASE, "layout");
  return SAVED;
}

// ---------------------------------------------------------------- thành viên & lời mời
export async function saveMember(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = memberSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { user_id, ...member } = parsed.data;
  if (user_id === session.userId && member.role !== "owner") {
    return { ok: false, message: "Bạn không tự đổi vai trò của chính mình được.", errors: { role: "Nhờ một coach khác đổi giúp" } };
  }

  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("coach_members")
    .update(member)
    .eq("coach_id", session.coach.id)
    .eq("user_id", user_id)
    .select("user_id");
  if (error?.message.includes("last_owner")) return { ok: false, message: "Đội cần ít nhất một coach (owner)." };
  if (error || !data.length) return failed("saveMember", error);
  revalidatePath("/quan-ly", "layout");
  return SAVED;
}

export async function removeMember(form: FormData) {
  const session = await requireOwner();
  const userId = String(form.get("user_id"));
  if (userId === session.userId) return; // không tự gỡ mình; database cũng chặn
  const supabase = await serverClient();
  const { error } = await supabase.from("coach_members").delete().eq("coach_id", session.coach.id).eq("user_id", userId);
  if (error && !error.message.includes("last_owner")) throw error;
  revalidatePath("/quan-ly", "layout");
  redirect(`${BASE}/thanh-vien`);
}

export async function inviteMember(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await serverClient();
  const { data: existing } = await supabase
    .from("coach_members")
    .select("user_id")
    .eq("coach_id", session.coach.id)
    .eq("email", parsed.data.email)
    .limit(1);
  if (existing?.length || parsed.data.email === session.email.toLowerCase()) {
    return { ok: false, message: "Email này đã ở trong đội rồi.", errors: { email: "Đã là thành viên" } };
  }
  const { error } = await supabase.from("member_invites").insert({ ...parsed.data, coach_id: session.coach.id, created_by: session.userId });
  if (error?.code === "23505") return { ok: false, message: "Email này đã được mời, đang chờ nhận.", errors: { email: "Đã mời rồi" } };
  if (error) return failed("inviteMember", error);
  revalidatePath(`${BASE}/thanh-vien`);
  return { ok: true, message: `Đã ghi lời mời cho ${parsed.data.email}. Bạn gửi link tạo mật khẩu cho họ nhé.` };
}

export async function revokeInvite(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("member_invites").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id).is("accepted_at", null);
  if (error) throw error;
  revalidatePath(`${BASE}/thanh-vien`);
}

// ---------------------------------------------------------------- mẫu tin nhắn
export async function saveTemplate(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = templateSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await serverClient();
  const { error } = await supabase
    .from("message_templates")
    .upsert({ ...parsed.data, coach_id: session.coach.id }, { onConflict: "coach_id,key" });
  if (error) return failed("saveTemplate", error);
  revalidatePath(`${BASE}/mau-tin`);
  return SAVED;
}
