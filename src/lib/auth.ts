import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabase } from "@/lib/env";
import { serverClient } from "@/lib/supabase/server";
import type { Coach } from "@/lib/types";

export type Session = {
  userId: string;
  email: string;
  role: "owner" | "sale";
  memberName: string | null;
  coach: Coach;
};

/** Người đang đăng nhập + coach họ thuộc về. Chưa đăng nhập thì chuyển về /dang-nhap. */
export const requireSession = cache(async (): Promise<Session> => {
  if (!hasSupabase) redirect("/dang-nhap");
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dang-nhap");

  const { data: member } = await supabase
    .from("coach_members")
    .select("role, display_name, coaches(*)")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  if (!member?.coaches) redirect("/dang-nhap?loi=chua-co-quyen");

  return {
    userId: auth.user.id,
    email: auth.user.email ?? "",
    role: member.role as "owner" | "sale",
    memberName: member.display_name,
    coach: member.coaches as unknown as Coach,
  };
});
