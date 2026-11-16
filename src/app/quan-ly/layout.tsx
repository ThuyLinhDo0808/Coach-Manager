import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { requireSession } from "@/lib/auth";
import { serverClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Quản lý", template: "%s · Quản lý" }, robots: { index: false } };

export default async function QuanLyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const supabase = await serverClient();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", session.coach.id)
    .eq("status", "moi");
  return (
    <AdminShell session={session} newLeads={count ?? 0}>
      {children}
    </AdminShell>
  );
}
