import "server-only";
import { cache } from "react";
import { DEFAULT_COACH_SLUG, hasSupabase } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";
import * as sample from "@/lib/sample-data";
import type { Coach, Course, OpenClass, Venue, Video, VideoGroup } from "@/lib/types";

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
    .select("id, group_id, title, youtube_id, description, level, published_on")
    .eq("coach_id", await requireCoachId())
    .eq("visibility", "public")
    .order("sort")
    .order("created_at");
  if (error) throw error;
  return data as Video[];
});
