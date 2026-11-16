import "server-only";
import { serverClient } from "@/lib/supabase/server";
import type { Attendance, ClassRow, Enrollment, Feedback, FreeSlot, SessionRow, Student } from "@/lib/teaching";
import type { Venue } from "@/lib/types";

type Db = Awaited<ReturnType<typeof serverClient>>;
const must = <T,>(r: { data: T | null; error: unknown }): T => {
  if (r.error) throw r.error;
  return r.data as T;
};

export async function teachingDb(coachId: string) {
  const db: Db = await serverClient();
  return {
    db,
    classes: async () => must(await db.from("classes").select("*").eq("coach_id", coachId).order("created_at", { ascending: false })) as ClassRow[],
    classById: async (id: string) => must(await db.from("classes").select("*").eq("coach_id", coachId).eq("id", id).maybeSingle()) as ClassRow | null,
    venues: async () => must(await db.from("venues").select("*").eq("coach_id", coachId).order("sort")) as Venue[],
    courses: async () =>
      must(await db.from("courses").select("id, title, session_count, minutes_per_session, max_students, price_full, curriculum").eq("coach_id", coachId).order("sort")) as {
        id: string; title: string; session_count: number | null; minutes_per_session: number | null; max_students: number | null; price_full: number | null;
        curriculum: { title: string; content: string }[];
      }[],
    sessionsBetween: async (from: string, to: string) =>
      must(await db.from("class_sessions").select("*").eq("coach_id", coachId).gte("starts_at", from).lt("starts_at", to).order("starts_at")) as SessionRow[],
    sessionsOfClass: async (classId: string) =>
      must(await db.from("class_sessions").select("*").eq("coach_id", coachId).eq("class_id", classId).order("starts_at")) as SessionRow[],
    sessionsOfClasses: async (classIds: string[]) =>
      classIds.length
        ? (must(await db.from("class_sessions").select("*").eq("coach_id", coachId).in("class_id", classIds).order("starts_at")) as SessionRow[])
        : [],
    sessionById: async (id: string) => must(await db.from("class_sessions").select("*").eq("coach_id", coachId).eq("id", id).maybeSingle()) as SessionRow | null,
    students: async () => must(await db.from("students").select("*").eq("coach_id", coachId).order("full_name")) as Student[],
    studentById: async (id: string) => must(await db.from("students").select("*").eq("coach_id", coachId).eq("id", id).maybeSingle()) as Student | null,
    studentsByIds: async (ids: string[]) =>
      ids.length ? (must(await db.from("students").select("*").eq("coach_id", coachId).in("id", ids).order("full_name")) as Student[]) : [],
    enrollments: async () => must(await db.from("enrollments").select("*").eq("coach_id", coachId)) as Enrollment[],
    enrollmentsOfClass: async (classId: string) => must(await db.from("enrollments").select("*").eq("coach_id", coachId).eq("class_id", classId)) as Enrollment[],
    enrollmentsOfStudent: async (studentId: string) => must(await db.from("enrollments").select("*").eq("coach_id", coachId).eq("student_id", studentId)) as Enrollment[],
    attendanceOfSession: async (sessionId: string) => must(await db.from("attendance").select("session_id, student_id, status").eq("session_id", sessionId)) as Attendance[],
    attendanceOfStudent: async (studentId: string) => must(await db.from("attendance").select("session_id, student_id, status").eq("coach_id", coachId).eq("student_id", studentId)) as Attendance[],
    attendanceAll: async () => must(await db.from("attendance").select("session_id, student_id, status").eq("coach_id", coachId)) as Attendance[],
    feedbackOfSession: async (sessionId: string) => must(await db.from("session_feedback").select("*").eq("session_id", sessionId)) as Feedback[],
    feedbackOfStudent: async (studentId: string) => must(await db.from("session_feedback").select("*").eq("coach_id", coachId).eq("student_id", studentId)) as Feedback[],
    feedbackOfSessions: async (sessionIds: string[]) =>
      sessionIds.length ? (must(await db.from("session_feedback").select("session_id, student_id").in("session_id", sessionIds)) as { session_id: string; student_id: string }[]) : [],
    freeSlots: async () => must(await db.from("free_slots").select("*").eq("coach_id", coachId).order("weekday").order("start_time")) as FreeSlot[],
    videos: async () => must(await db.from("videos").select("id, title").eq("coach_id", coachId).order("sort")) as { id: string; title: string }[],
  };
}
