import "server-only";
import { redirect } from "next/navigation";
import { requireSession, type Session } from "@/lib/auth";
import type { CoachSettings } from "@/lib/settings";
import { serverClient } from "@/lib/supabase/server";

/** Chỉ coach (owner) được vào Cài đặt và Nội dung. Sale / trợ giảng về Tổng quan. RLS vẫn chặn ở database. */
export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/quan-ly");
  return session;
}

/**
 * Ghi một hay vài nhóm vào coaches.settings mà không đụng nhóm khác:
 * đọc bản mới nhất trong database rồi gộp (đợt khác có thể đã thêm nhóm riêng).
 */
export async function saveSettings(coachId: string, patch: Partial<CoachSettings>): Promise<boolean> {
  const supabase = await serverClient();
  const { data, error: readError } = await supabase.from("coaches").select("settings").eq("id", coachId).single();
  if (readError) {
    console.error("saveSettings: đọc", readError);
    return false;
  }
  const current = data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) ? data.settings : {};
  const { data: rows, error } = await supabase
    .from("coaches")
    .update({ settings: { ...current, ...patch } })
    .eq("id", coachId)
    .select("id");
  if (error || !rows?.length) {
    console.error("saveSettings: ghi", error ?? "không dòng nào được sửa");
    return false;
  }
  return true;
}
