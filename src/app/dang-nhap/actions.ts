"use server";

import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { serverClient } from "@/lib/supabase/server";

export async function signIn(_prev: string | null, form: FormData): Promise<string | null> {
  if (!hasSupabase) return "Trang chưa nối cơ sở dữ liệu nên chưa đăng nhập được.";
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return "Bạn điền email và mật khẩu nhé.";

  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Email hoặc mật khẩu chưa đúng.";
  redirect("/quan-ly");
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/dang-nhap");
}
