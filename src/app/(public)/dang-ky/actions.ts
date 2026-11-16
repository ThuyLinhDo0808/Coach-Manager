"use server";

import { redirect } from "next/navigation";
import { DEFAULT_COACH_SLUG, hasSupabase } from "@/lib/env";
import { fieldErrors, leadSchema, type LeadInput } from "@/lib/lead-schema";
import { publicClient } from "@/lib/supabase/public";

export type SubmitResult = { ok: false; message: string; errors?: Record<string, string> };

export async function submitLead(input: LeadInput, trap: string): Promise<SubmitResult> {
  // Ô bẫy bot: người thật không thấy nên luôn để trống.
  if (trap) redirect("/dang-ky/cam-on");

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Một vài ô chưa đúng, bạn xem lại giúp mình nhé.", errors: fieldErrors(parsed.error) };
  }
  if (!hasSupabase) {
    return { ok: false, message: "Trang đang chạy thử, chưa nối cơ sở dữ liệu nên chưa nhận đăng ký." };
  }

  const { error } = await publicClient().rpc("submit_lead", { p_coach_slug: DEFAULT_COACH_SLUG, p: parsed.data });
  if (error) {
    if (error.message.includes("rate_limited")) {
      return { ok: false, message: "Bạn đã gửi vài lần rồi. Coach sẽ liên hệ sớm, hoặc bạn nhắn Zalo để được trả lời ngay." };
    }
    console.error("submit_lead", error);
    return { ok: false, message: "Chưa gửi được, bạn thử lại sau ít phút hoặc nhắn Zalo cho coach nhé." };
  }
  redirect("/dang-ky/cam-on");
}
