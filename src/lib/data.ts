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
  if (error) throw error;
  return data as Coach | null;
});

async function requireCoachId() {
  const coach = await getCoach();
  if (!coach) throw new Error(`Chưa có coach "${DEFAULT_COACH_SLUG}" trong database`);
  return coach.id;
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
  if (error) throw error;
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
  if (error) throw error;
  return data as Venue[];
});

export const getOpenClasses = cache(async (): Promise<OpenClass[]> => {
  if (!hasSupabase) return sample.sampleOpenClasses;
  const { data, error } = await publicClient()
    .from("open_classes")
    .select("*")
    .eq("coach_id", await requireCoachId())
    .eq("is_public", true)
    .order("sort")
    .order("start_date");
  if (error) throw error;
  return data as OpenClass[];
});

export const getVideoGroups = cache(async (): Promise<VideoGroup[]> => {
  if (!hasSupabase) return sample.sampleVideoGroups;
  const { data, error } = await publicClient()
    .from("video_groups")
    .select("id, slug, name")
    .eq("coach_id", await requireCoachId())
    .order("sort");
  if (error) throw error;
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
  if (error) throw error;
  return data as Video[];
});

/** Nội dung phụ (bài viết, đánh giá): lỗi đọc thì coi như chưa có, không làm hỏng cả trang. */
function optional(what: string, error: unknown): never[] {
  console.error(`Không đọc được ${what}`, error);
  return [];
}

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
