import "server-only";
import type { CourseOption, PostAdmin, ReviewAdmin, VideoAdmin, VideoGroupAdmin } from "@/lib/content-types";
import { mergeTemplates, type MessageTemplate } from "@/lib/message-templates";
import type { CourseAdmin, InviteRow, MemberRow, VenueAdmin } from "@/lib/settings-types";
import { serverClient } from "@/lib/supabase/server";
import { readRules } from "@/lib/venue-price";

// Đọc dữ liệu cho Cài đặt và Nội dung theo phiên đăng nhập (RLS quyết định quyền).

export async function getAdminVenues(coachId: string): Promise<VenueAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("coach_id", coachId)
    .order("sort")
    .order("created_at");
  if (error) throw error;
  // price_rules có từ migration 20261127000000_venue_prices.sql; chưa chạy thì coi như chưa có bảng giá.
  return (data as (VenueAdmin & { price_rules?: unknown })[]).map((v) => ({ ...v, price_rules: readRules(v.price_rules) }));
}

export async function getCourseTemplates(coachId: string): Promise<CourseAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("courses").select("*").eq("coach_id", coachId).order("sort").order("created_at");
  if (error) throw error;
  return data as CourseAdmin[];
}

/** Số lớp đã mở (trừ lớp huỷ) theo từng mẫu khoá. */
export async function getClassCounts(coachId: string): Promise<Record<string, number>> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("classes").select("course_id").eq("coach_id", coachId).neq("status", "huy");
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const row of data) if (row.course_id) out[row.course_id] = (out[row.course_id] ?? 0) + 1;
  return out;
}

export async function getCourseOptions(coachId: string): Promise<CourseOption[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("courses").select("id, title").eq("coach_id", coachId).order("sort").order("created_at");
  if (error) throw error;
  return data;
}

export async function getMemberRows(coachId: string): Promise<MemberRow[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("coach_members")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at");
  if (error) throw error;
  return data.map((m) => ({
    ...m,
    commission_pct: Number(m.commission_pct),
    roles: m.roles?.length ? m.roles : m.role === "owner" ? ["chu", "coach"] : [m.role],
  })) as MemberRow[];
}

/** Lời mời chưa được nhận. */
export async function getPendingInvites(coachId: string): Promise<InviteRow[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("member_invites")
    .select("*")
    .eq("coach_id", coachId)
    .is("accepted_at", null)
    .order("created_at");
  if (error) throw error;
  return data.map((i) => ({ ...i, roles: i.roles?.length ? i.roles : [i.role] })) as InviteRow[];
}

export async function getMessageTemplates(coachId: string): Promise<MessageTemplate[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("message_templates").select("key, title, body, enabled").eq("coach_id", coachId);
  if (error) throw error;
  return mergeTemplates(data);
}

export async function getAdminVideoGroups(coachId: string): Promise<VideoGroupAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("video_groups").select("id, slug, name, sort").eq("coach_id", coachId).order("sort").order("name");
  if (error) throw error;
  return data;
}

export async function getAdminVideos(coachId: string): Promise<VideoAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id, group_id, title, youtube_id, description, level, published_on, duration_text, course_id, visibility, sort")
    .eq("coach_id", coachId)
    .order("sort")
    .order("created_at");
  if (error) throw error;
  return data as VideoAdmin[];
}

export async function getAdminPosts(coachId: string): Promise<PostAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, excerpt, topic, cover_url, youtube_id, body, read_minutes, is_featured, status, published_at, course_id, updated_at")
    .eq("coach_id", coachId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as PostAdmin[];
}

export async function getAdminReviews(coachId: string): Promise<ReviewAdmin[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, author_name, rating, body, course_id, is_pinned, is_public, created_at")
    .eq("coach_id", coachId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ReviewAdmin[];
}
