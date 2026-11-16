import "server-only";
import { cache } from "react";
import { DEFAULT_COACH_SLUG, hasSupabase } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";
import * as sample from "@/lib/sample-data";
import type { Coach, Course, OpenClass, Post, Review, Venue, Video, VideoGroup } from "@/lib/types";

/** Coach của trang đang xem. Sau này đổi theo tên miền; hiện dùng coach mặc định. */
export const getCoach = cache(async (): Promise<Coach | null> => {
  if (!hasSupabase) return sample.sampleCoach;
  const { data, error } = await publicClient()
    .from("coaches")
    .select("*")
    .eq("slug", DEFAULT_COACH_SLUG)
    .maybeSingle();
  if (error) {
    console.error("Không đọc được coach", error);
    return null;
  }
  return data as Coach | null;
});

// Trang công khai không được sập vì database: thiếu coach hay lỗi đọc thì coi như chưa có nội dung
// (layout sẽ trả 404 khi không có coach). Lỗi được ghi ra log để tìm nguyên nhân.
const NO_COACH = "00000000-0000-0000-0000-000000000000";
async function requireCoachId() {
  return (await getCoach())?.id ?? NO_COACH;
}

function optional(what: string, error: unknown): never[] {
  console.error(`Không đọc được ${what}`, error);
  return [];
}

export const getCourses = cache(async (): Promise<Course[]> => {
  if (!hasSupabase) return sample.sampleCourses;
  const { data, error } = await publicClient()
    .from("courses")
    .select("*")
    .eq("coach_id", await requireCoachId())
    .eq("is_public", true)
    .order("sort")
    .order("created_at");
  if (error) return optional("courses", error);
  return data as Course[];
});

export async function getCourse(slug: string): Promise<Course | null> {
  return (await getCourses()).find((c) => c.slug === slug) ?? null;
}

export const getVenues = cache(async (): Promise<Venue[]> => {
  if (!hasSupabase) return sample.sampleVenues;
  const { data, error } = await publicClient()
    .from("venues")
    .select("*")
    .eq("coach_id", await requireCoachId())
    .eq("is_public", true)
    .order("sort");
  if (error) return optional("venues", error);
  return data as Venue[];
});

/** Lớp đang tuyển; số chỗ còn lại tính từ đăng ký thật (hàm list_open_classes). */
export const getOpenClasses = cache(async (): Promise<OpenClass[]> => {
  if (!hasSupabase) return sample.sampleOpenClasses;
  const { data, error } = await publicClient().rpc("list_open_classes", { p_coach: await requireCoachId() });
  if (error) return optional("open_classes", error);
  return data as OpenClass[];
});

export const getVideoGroups = cache(async (): Promise<VideoGroup[]> => {
  if (!hasSupabase) return sample.sampleVideoGroups;
  const { data, error } = await publicClient()
    .from("video_groups")
    .select("id, slug, name")
    .eq("coach_id", await requireCoachId())
    .order("sort");
  if (error) return optional("video_groups", error);
  return data as VideoGroup[];
});

export const getVideos = cache(async (): Promise<Video[]> => {
  if (!hasSupabase) return sample.sampleVideos;
  const { data, error } = await publicClient()
    .from("videos")
    .select("id, group_id, title, youtube_id, description, level, published_on, duration_text, course_id")
    .eq("coach_id", await requireCoachId())
    .eq("visibility", "public")
    .order("sort")
    .order("created_at");
  if (error) return optional("videos", error);
  return data as Video[];
});

export const getPosts = cache(async (): Promise<Post[]> => {
  if (!hasSupabase) return sample.samplePosts;
  const { data, error } = await publicClient()
    .from("posts")
    .select("id, slug, title, excerpt, topic, cover_url, youtube_id, body, read_minutes, is_featured, published_at, course_id")
    .eq("coach_id", await requireCoachId())
    .eq("status", "da-dang")
    .order("published_at", { ascending: false });
  if (error) return optional("posts", error);
  return data as Post[];
});

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null;
}

export const getReviews = cache(async (): Promise<Review[]> => {
  if (!hasSupabase) return [];
  const { data, error } = await publicClient()
    .from("reviews")
    .select("id, author_name, rating, body, course_id, is_pinned, created_at")
    .eq("coach_id", await requireCoachId())
    .eq("is_public", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return optional("reviews", error);
  return data as Review[];
});

export function ratingSummary(reviews: Review[]): { average: number; count: number } | null {
  if (!reviews.length) return null;
  return { average: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length, count: reviews.length };
}

export type PublicFreeSlot = { id: string; weekday: number; start_time: string; end_time: string; venue_id: string | null };

/** Giờ rảnh lặp hằng tuần mà coach cho học viên thấy. */
export const getFreeSlots = cache(async (): Promise<PublicFreeSlot[]> => {
  if (!hasSupabase) return [];
  const { data, error } = await publicClient()
    .from("free_slots")
    .select("id, weekday, start_time, end_time, venue_id")
    .eq("coach_id", await requireCoachId())
    .eq("is_public", true)
    .order("weekday")
    .order("start_time");
  if (error) return optional("free_slots", error);
  return data as PublicFreeSlot[];
});

/** Khung giờ đã có buổi dạy trong khoảng ngày (không kèm tên lớp hay học viên). */
export async function getBusyTimes(fromIso: string, toIso: string): Promise<{ starts_at: string; ends_at: string }[]> {
  if (!hasSupabase) return [];
  const { data, error } = await publicClient().rpc("list_busy_times", { p_coach: await requireCoachId(), p_from: fromIso, p_to: toIso });
  if (error) return optional("busy_times", error);
  return data as { starts_at: string; ends_at: string }[];
}
