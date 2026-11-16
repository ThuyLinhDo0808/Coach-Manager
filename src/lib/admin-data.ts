import "server-only";
import { serverClient } from "@/lib/supabase/server";
import type { Lead, LeadNote, Member } from "@/lib/types";

export async function getLeads(coachId: string): Promise<Lead[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data as Lead[];
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, lead_id, author_id, body, kind, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as LeadNote[];
}

export async function getMembers(coachId: string): Promise<Member[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("coach_members").select("*").eq("coach_id", coachId);
  if (error) throw error;
  return data as Member[];
}

export async function getAdminCourses(coachId: string): Promise<{ id: string; title: string }[]> {
  const supabase = await serverClient();
  const { data, error } = await supabase.from("courses").select("id, title").eq("coach_id", coachId).order("sort");
  if (error) throw error;
  return data;
}
