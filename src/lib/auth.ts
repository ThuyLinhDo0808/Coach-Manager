import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabase } from "@/lib/env";
import { serverClient } from "@/lib/supabase/server";
import { permsFor, type Perm, type Role } from "@/lib/permissions";
import type { Coach, MemberRole } from "@/lib/types";

export type Session = {
  userId: string;
  email: string;
  /** Vai trò chính (cột cũ, "owner" = coach chủ). */
  role: MemberRole;
  /** Mọi vai trò của người này. */
  roles: Role[];
  perms: Perm[];
  memberName: string | null;
  coach: Coach;
};

/** Người đang đăng nhập + coach họ thuộc về. Chưa đăng nhập thì chuyển về /dang-nhap. */
export const requireSession = cache(async (): Promise<Session> => {
  if (!hasSupabase) redirect("/dang-nhap");
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/dang-nhap");

  const readMember = () =>
    supabase.from("coach_members").select("role, roles, display_name, coaches(*)").eq("user_id", auth.user.id).limit(1).maybeSingle();
  let { data: member } = await readMember();
  if (!member?.coaches) {
    // Chưa ở đội nào: có thể vừa được mời. Nhận lời mời theo email (hàm accept_invite) rồi đọc lại một lần.
    const { data: accepted } = await supabase.rpc("accept_invite");
    if (accepted) ({ data: member } = await readMember());
  }
  if (!member?.coaches) redirect("/dang-nhap?loi=chua-co-quyen");

  return {
    userId: auth.user.id,
    email: auth.user.email ?? "",
    role: member.role as MemberRole,
    roles: rolesOf(member),
    perms: permsFor(rolesOf(member)),
    memberName: member.display_name,
    coach: member.coaches as unknown as Coach,
  };
});

/** Vai trò từ dòng coach_members; database chưa chạy migration vai trò thì suy ra từ cột role cũ. */
function rolesOf(m: { role: string; roles?: string[] | null }): Role[] {
  if (m.roles?.length) return m.roles as Role[];
  return m.role === "owner" ? ["chu", "coach"] : [m.role as Role];
}

export const can = (session: Session, perm: Perm) => session.perms.includes(perm);

/** Bắt buộc có quyền: không có thì về Tổng quan. Dùng ở đầu mọi trang và server action. */
export async function requirePerm(...anyOf: Perm[]): Promise<Session> {
  const session = await requireSession();
  if (!anyOf.some((p) => session.perms.includes(p))) redirect("/quan-ly?khong-du-quyen=1");
  return session;
}
