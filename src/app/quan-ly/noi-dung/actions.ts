"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { estimateReadMinutes } from "@/lib/content";
import { MAX_PINNED_REVIEWS } from "@/lib/content-types";
import { fieldErrors } from "@/lib/lead-schema";
import { requireOwner } from "@/lib/owner";
import { postSchema, reviewSchema, videoGroupSchema, videoSchema } from "@/lib/settings-schema";
import type { FormState } from "@/lib/settings-types";
import { uniqueSlug } from "@/lib/slug";
import { serverClient } from "@/lib/supabase/server";

const BASE = "/quan-ly/noi-dung";
const SAVED: FormState = { ok: true, message: "Đã lưu" };
const invalid = (error: z.ZodError): FormState => ({ ok: false, message: "Một vài ô chưa đúng, bạn xem lại nhé.", errors: fieldErrors(error) });
function failed(what: string, error: unknown): FormState {
  console.error(what, error);
  return { ok: false, message: "Chưa lưu được, bạn thử lại nhé." };
}
/** Nội dung công khai đổi: làm mới trang công khai và khu quản lý. */
const refresh = () => revalidatePath("/", "layout");

type Client = Awaited<ReturnType<typeof serverClient>>;

/** Ghi cột sort = vị trí trong danh sách (chỉ những dòng đang lệch), để thứ tự luôn rõ ràng kể cả khi trước đó trùng số. */
async function writeOrder(supabase: Client, table: "video_groups" | "videos", coachId: string, ids: string[]) {
  for (const [sort, rowId] of ids.entries()) {
    const { error } = await supabase.from(table).update({ sort }).eq("id", rowId).eq("coach_id", coachId).neq("sort", sort);
    if (error) throw error;
  }
}

async function ownsCourse(supabase: Client, coachId: string, courseId: string | null) {
  if (!courseId) return true;
  const { data } = await supabase.from("courses").select("id").eq("id", courseId).eq("coach_id", coachId).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------- nhóm video
export async function saveVideoGroup(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = videoGroupSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { id, name } = parsed.data;

  const supabase = await serverClient();
  if (id) {
    const { data, error } = await supabase.from("video_groups").update({ name }).eq("id", id).eq("coach_id", session.coach.id).select("id");
    if (error || !data.length) return failed("saveVideoGroup", error);
  } else {
    const { data: groups, error: readError } = await supabase.from("video_groups").select("slug, sort").eq("coach_id", session.coach.id);
    if (readError) return failed("saveVideoGroup: đọc", readError);
    const slug = uniqueSlug(name, groups.map((g) => g.slug), 40, "nhom");
    const sort = groups.reduce((m, g) => Math.max(m, g.sort), -1) + 1;
    const { error } = await supabase.from("video_groups").insert({ coach_id: session.coach.id, name, slug, sort });
    if (error) return failed("saveVideoGroup", error);
  }
  refresh();
  return id ? SAVED : { ok: true, message: "Đã thêm nhóm" };
}

export async function moveVideoGroup(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { data, error } = await supabase.from("video_groups").select("id").eq("coach_id", session.coach.id).order("sort").order("name");
  if (error) throw error;
  const ids = data.map((g) => g.id);
  const i = ids.indexOf(String(form.get("id")));
  const j = i + (Number(form.get("dir")) < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await writeOrder(supabase, "video_groups", session.coach.id, ids);
  refresh();
}

export async function deleteVideoGroup(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  // Video trong nhóm không bị xoá, chỉ chuyển về "Chưa xếp nhóm" (group_id tự về null).
  const { error } = await supabase.from("video_groups").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
}

// ---------------------------------------------------------------- video
export async function saveVideo(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = videoSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { id, youtube, ...rest } = parsed.data;
  const video = { ...rest, youtube_id: youtube };

  const supabase = await serverClient();
  if (video.group_id) {
    const { data: group } = await supabase.from("video_groups").select("id").eq("id", video.group_id).eq("coach_id", session.coach.id).maybeSingle();
    if (!group) return { ok: false, message: "Nhóm đã chọn không còn nữa.", errors: { group_id: "Bạn chọn lại nhóm nhé" } };
  }
  if (!(await ownsCourse(supabase, session.coach.id, video.course_id))) {
    return { ok: false, message: "Khoá đã chọn không còn nữa.", errors: { course_id: "Bạn chọn lại khoá nhé" } };
  }

  if (id) {
    const { data, error } = await supabase.from("videos").update(video).eq("id", id).eq("coach_id", session.coach.id).select("id");
    if (error || !data.length) return failed("saveVideo", error);
    refresh();
    return SAVED;
  }
  const { data: last } = await supabase.from("videos").select("sort").eq("coach_id", session.coach.id).order("sort", { ascending: false }).limit(1);
  const { error } = await supabase.from("videos").insert({
    ...video,
    coach_id: session.coach.id,
    sort: (last?.[0]?.sort ?? -1) + 1,
    published_on: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }),
  });
  if (error) return failed("saveVideo", error);
  refresh();
  redirect(BASE);
}

/** Đưa video lên / xuống trong nhóm của nó. */
export async function moveVideo(form: FormData) {
  const session = await requireOwner();
  const id = String(form.get("id"));
  const supabase = await serverClient();
  const { data, error } = await supabase.from("videos").select("id, group_id").eq("coach_id", session.coach.id).order("sort").order("created_at");
  if (error) throw error;
  const groupId = data.find((v) => v.id === id)?.group_id ?? null;
  const all = data.map((v) => v.id);
  const inGroup = data.filter((v) => v.group_id === groupId).map((v) => v.id);
  const i = inGroup.indexOf(id);
  const neighbor = inGroup[i + (Number(form.get("dir")) < 0 ? -1 : 1)];
  if (i < 0 || !neighbor) return;
  // Đổi chỗ hai video trong danh sách chung rồi đánh số lại toàn bộ, để thứ tự luôn rõ ràng.
  const a = all.indexOf(id);
  const b = all.indexOf(neighbor);
  [all[a], all[b]] = [all[b]!, all[a]!];
  await writeOrder(supabase, "videos", session.coach.id, all);
  refresh();
}

export async function deleteVideo(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("videos").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
  redirect(BASE);
}

// ---------------------------------------------------------------- bài viết
export async function savePost(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = postSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);
  const { id, youtube, ...rest } = parsed.data;
  const post = { ...rest, youtube_id: youtube, read_minutes: estimateReadMinutes(rest.body) };

  const supabase = await serverClient();
  if (!(await ownsCourse(supabase, session.coach.id, post.course_id))) {
    return { ok: false, message: "Khoá đã chọn không còn nữa.", errors: { course_id: "Bạn chọn lại khoá nhé" } };
  }
  const now = new Date().toISOString();

  if (id) {
    const { data: current, error: readError } = await supabase.from("posts").select("published_at").eq("id", id).eq("coach_id", session.coach.id).maybeSingle();
    if (readError || !current) return failed("savePost: đọc", readError);
    // Ngày đăng chỉ đặt một lần, khi bài được đăng lần đầu.
    const published_at = current.published_at ?? (post.status === "da-dang" ? now : null);
    const { data, error } = await supabase.from("posts").update({ ...post, published_at }).eq("id", id).eq("coach_id", session.coach.id).select("id");
    if (error || !data.length) return failed("savePost", error);
    refresh();
    return SAVED;
  }

  const { data: taken, error: slugError } = await supabase.from("posts").select("slug").eq("coach_id", session.coach.id);
  if (slugError) return failed("savePost: slug", slugError);
  const slug = uniqueSlug(post.title, taken.map((p) => p.slug), 100, "bai-viet");
  const { data, error } = await supabase
    .from("posts")
    .insert({ ...post, slug, coach_id: session.coach.id, published_at: post.status === "da-dang" ? now : null })
    .select("id")
    .single();
  if (error) return failed("savePost", error);
  refresh();
  redirect(`${BASE}?tab=bai-viet&id=${data.id}`);
}

export async function deletePost(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("posts").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
  redirect(`${BASE}?tab=bai-viet`);
}

// ---------------------------------------------------------------- đánh giá
export async function addReview(_prev: FormState, payload: unknown): Promise<FormState> {
  const session = await requireOwner();
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await serverClient();
  if (!(await ownsCourse(supabase, session.coach.id, parsed.data.course_id))) {
    return { ok: false, message: "Khoá đã chọn không còn nữa.", errors: { course_id: "Bạn chọn lại khoá nhé" } };
  }
  const { error } = await supabase.from("reviews").insert({ ...parsed.data, coach_id: session.coach.id });
  if (error) return failed("addReview", error);
  refresh();
  return { ok: true, message: "Đã thêm đánh giá" };
}

/** Ghim / bỏ ghim. Tối đa 3 đánh giá được ghim; quá số đó thì không làm gì (nút trên giao diện đã khoá). */
export async function toggleReviewPin(form: FormData) {
  const session = await requireOwner();
  const id = String(form.get("id"));
  const pin = form.get("pin") === "1";
  const supabase = await serverClient();
  if (pin) {
    const { count, error } = await supabase.from("reviews").select("id", { count: "exact", head: true }).eq("coach_id", session.coach.id).eq("is_pinned", true);
    if (error) throw error;
    if ((count ?? 0) >= MAX_PINNED_REVIEWS) return;
  }
  const { error } = await supabase.from("reviews").update({ is_pinned: pin }).eq("id", id).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
}

export async function toggleReviewPublic(form: FormData) {
  const session = await requireOwner();
  const show = form.get("show") === "1";
  const supabase = await serverClient();
  // Ẩn thì bỏ ghim luôn, để chỗ ghim không bị chiếm bởi đánh giá khách không thấy.
  const { error } = await supabase
    .from("reviews")
    .update(show ? { is_public: true } : { is_public: false, is_pinned: false })
    .eq("id", String(form.get("id")))
    .eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
}

export async function deleteReview(form: FormData) {
  const session = await requireOwner();
  const supabase = await serverClient();
  const { error } = await supabase.from("reviews").delete().eq("id", String(form.get("id"))).eq("coach_id", session.coach.id);
  if (error) throw error;
  refresh();
}
