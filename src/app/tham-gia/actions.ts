"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { fieldErrors } from "@/lib/lead-schema";
import { joinSchema } from "@/lib/settings-schema";
import type { FormState } from "@/lib/settings-types";
import { serverClient } from "@/lib/supabase/server";

/** Người được mời tạo tài khoản bằng email đã được coach ghi lời mời, rồi nhận lời mời ngay. */
export async function joinTeam(_prev: FormState, payload: unknown): Promise<FormState> {
  if (!hasSupabase) return { ok: false, message: "Trang chưa nối cơ sở dữ liệu nên chưa tạo tài khoản được." };
  const parsed = joinSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: "Một vài ô chưa đúng.", errors: fieldErrors(parsed.error) };

  const supabase = await serverClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: origin ? { emailRedirectTo: `${origin}/dang-nhap` } : undefined,
  });
  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return { ok: false, message: "Email này đã có tài khoản. Bạn đăng nhập bằng mật khẩu đang dùng; lời mời sẽ tự được nhận." };
    }
    if (error.code === "weak_password") return { ok: false, message: "Mật khẩu còn yếu.", errors: { password: "Bạn chọn mật khẩu dài và khó đoán hơn nhé" } };
    if (error.code === "signup_disabled") return { ok: false, message: "Trang đang tắt việc tạo tài khoản mới. Bạn báo coach giúp nhé." };
    console.error("joinTeam", error);
    return { ok: false, message: "Chưa tạo được tài khoản, bạn thử lại sau ít phút nhé." };
  }

  if (!data.session) {
    // Supabase đang bật xác nhận email: chưa có phiên đăng nhập cho tới khi bấm link trong thư.
    return {
      ok: true,
      message: "Đã tạo tài khoản. Bạn mở hộp thư, bấm link xác nhận rồi quay lại đăng nhập. Nếu email này đã có tài khoản từ trước thì đăng nhập bằng mật khẩu cũ.",
    };
  }

  const { data: accepted, error: inviteError } = await supabase.rpc("accept_invite");
  if (inviteError) console.error("joinTeam: accept_invite", inviteError);
  if (!accepted) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "Tài khoản đã tạo, nhưng email này chưa được coach mời vào đội. Nhờ coach ghi lời mời đúng email này, rồi bạn chỉ cần đăng nhập.",
    };
  }
  redirect("/quan-ly");
}
