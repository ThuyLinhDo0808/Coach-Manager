"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";
import { serverClient } from "@/lib/supabase/server";
import { generateSessions, SKILLS, type AttendanceStatus } from "@/lib/teaching";
import { addMinutes, isDate, isTime, vnIso } from "@/lib/time";

export type FormState = { ok?: boolean; message: string } | null;

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const opt = (f: FormData, k: string, max = 300) => str(f, k, max) || null;
const int = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d]/g, "");
  return v ? Number(v) : null;
};
const dec = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(",", ".").trim();
  return /^\d(\.\d{1,2})?$/.test(v) ? Number(v) : null;
};

async function ctx() {
  const session = await requireSession();
  return { session, coachId: session.coach.id, db: await serverClient() };
}
const refresh = () => {
  revalidatePath("/quan-ly", "layout");
  revalidatePath("/lich-san");
  revalidatePath("/khoa-hoc", "layout");
};

// ---------------------------------------------------------------- lớp
export async function createClass(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const title = str(f, "title", 120);
  if (title.length < 2) return { message: "Bạn đặt tên lớp nhé." };
  const kind = str(f, "kind");
  const startDate = str(f, "start_date");
  const time = str(f, "time");
  const minutes = int(f, "minutes") ?? 90;
  const count = int(f, "count") ?? 0;
  const weekdays = f.getAll("weekdays").map(Number);
  const wantsSchedule = count > 0 && weekdays.length > 0;
  if (wantsSchedule && (!isDate(startDate) || !isTime(time))) return { message: "Chọn ngày bắt đầu và giờ học để tạo lịch." };

  const courseId = opt(f, "course_id");
  const { data: cls, error } = await db
    .from("classes")
    .insert({
      coach_id: coachId,
      title,
      kind: ["lop", "kem-1-1", "buoi-le"].includes(kind) ? kind : "lop",
      course_id: courseId,
      venue_id: opt(f, "venue_id"),
      schedule_text: opt(f, "schedule_text", 120),
      start_date: isDate(startDate) ? startDate : null,
      max_students: int(f, "max_students"),
      price: int(f, "price"),
      is_recruiting: f.get("is_recruiting") === "on",
    })
    .select("id")
    .single();
  if (error) {
    console.error("createClass", error);
    return { message: "Chưa tạo được lớp, bạn thử lại nhé." };
  }

  if (wantsSchedule) {
    let curriculum: { title: string; content: string }[] = [];
    if (courseId) {
      const { data: course } = await db.from("courses").select("curriculum").eq("id", courseId).maybeSingle();
      curriculum = (course?.curriculum as typeof curriculum) ?? [];
    }
    const rows = generateSessions({ startDate, weekdays, time, minutes, count }).map((s, i) => ({
      ...s,
      coach_id: coachId,
      class_id: cls.id,
      venue_id: opt(f, "venue_id"),
      topic: curriculum[i]?.content ?? null,
    }));
    const { error: e2 } = await db.from("class_sessions").insert(rows);
    if (e2) console.error("createClass sessions", e2);
  }
  refresh();
  redirect(`/quan-ly/khoa-hoc/${cls.id}`);
}

export async function updateClass(f: FormData) {
  const { coachId, db } = await ctx();
  const id = str(f, "id");
  const patch: Record<string, unknown> = {};
  if (f.has("title")) patch.title = str(f, "title", 120);
  if (f.has("status")) patch.status = str(f, "status");
  if (f.has("venue_id")) patch.venue_id = opt(f, "venue_id");
  if (f.has("schedule_text")) patch.schedule_text = opt(f, "schedule_text", 120);
  if (f.has("max_students")) patch.max_students = int(f, "max_students");
  if (f.has("price")) patch.price = int(f, "price");
  if (f.has("recruiting_flag")) patch.is_recruiting = f.get("is_recruiting") === "on";
  const { error } = await db.from("classes").update(patch).eq("id", id).eq("coach_id", coachId);
  if (error) throw error;
  refresh();
}

export async function addSession(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const classId = opt(f, "class_id");
  const date = str(f, "date");
  const time = str(f, "time");
  const minutes = int(f, "minutes") ?? 90;
  if (!isDate(date) || !isTime(time)) return { message: "Chọn ngày và giờ của buổi." };
  const leadId = opt(f, "lead_id");
  let seq: number | null = null;
  if (classId) {
    const { count } = await db.from("class_sessions").select("id", { count: "exact", head: true }).eq("class_id", classId).neq("status", "huy");
    seq = (count ?? 0) + 1;
  }
  const { error } = await db
    .from("class_sessions")
    .insert({
      coach_id: coachId,
      class_id: classId,
      lead_id: leadId,
      kind: classId ? "day" : "hoc-thu",
      seq,
      title: opt(f, "title", 120),
      starts_at: vnIso(date, time),
      ends_at: vnIso(date, addMinutes(time, minutes)),
      venue_id: opt(f, "venue_id"),
      topic: opt(f, "topic", 200),
    });
  if (error) {
    console.error("addSession", error);
    return { message: "Chưa tạo được buổi, bạn thử lại nhé." };
  }
  if (leadId) {
    await db.from("leads").update({ status: "hen-hoc-thu", contacted_at: new Date().toISOString() }).eq("id", leadId).eq("coach_id", coachId).in("status", ["moi", "da-lien-he"]);
    const session = await requireSession();
    await db.from("lead_notes").insert({
      coach_id: coachId, lead_id: leadId, author_id: session.userId, kind: "hen",
      body: `Hẹn học thử ${time} ngày ${date.split("-").reverse().join("/")}`,
    });
  }
  refresh();
  if (leadId) redirect(`/quan-ly/nhu-cau?id=${leadId}#chi-tiet`);
  return { ok: true, message: "Đã thêm buổi" };
}

export async function updateSession(f: FormData) {
  const { coachId, db } = await ctx();
  const id = str(f, "id");
  const patch: Record<string, unknown> = {};
  if (f.has("topic")) patch.topic = opt(f, "topic", 200);
  if (f.has("plan")) patch.plan = opt(f, "plan", 2000);
  if (f.has("venue_id")) patch.venue_id = opt(f, "venue_id");
  const date = str(f, "date");
  const time = str(f, "time");
  if (isDate(date) && isTime(time)) {
    const minutes = int(f, "minutes") ?? 90;
    patch.starts_at = vnIso(date, time);
    patch.ends_at = vnIso(date, addMinutes(time, minutes));
  }
  const status = str(f, "status");
  if (["du-kien", "da-day", "huy"].includes(status)) {
    patch.status = status;
    patch.completed_at = status === "da-day" ? new Date().toISOString() : null;
  }
  const { error } = await db.from("class_sessions").update(patch).eq("id", id).eq("coach_id", coachId);
  if (error) throw error;
  refresh();
}

// ---------------------------------------------------------------- điểm danh + nhận xét
export async function markAttendance(f: FormData) {
  const { session, coachId, db } = await ctx();
  const sessionId = str(f, "session_id");
  const studentId = str(f, "student_id");
  const status = str(f, "status") as AttendanceStatus | "";
  if (!status) {
    const { error } = await db.from("attendance").delete().eq("session_id", sessionId).eq("student_id", studentId).eq("coach_id", coachId);
    if (error) throw error;
  } else if (["co-mat", "vang", "bao-nghi"].includes(status)) {
    const { error } = await db
      .from("attendance")
      .upsert({ session_id: sessionId, student_id: studentId, coach_id: coachId, status, marked_by: session.userId, marked_at: new Date().toISOString() });
    if (error) throw error;
  }
  revalidatePath(`/quan-ly/lich-day/${sessionId}`);
}

export async function saveFeedback(_p: FormState, f: FormData): Promise<FormState> {
  const { session, coachId, db } = await ctx();
  const sessionId = str(f, "session_id");
  const studentId = str(f, "student_id");
  const scores: Record<string, number> = {};
  for (const [key] of SKILLS) {
    const v = Number(f.get(`score_${key}`));
    if (v >= 1 && v <= 5) scores[key] = v;
  }
  const comment = opt(f, "comment", 2000);
  if (!comment && !Object.keys(scores).length) return { message: "Chấm ít nhất một kỹ năng hoặc viết vài dòng nhận xét." };
  const videoUrl = opt(f, "video_url", 300);
  if (videoUrl && !/^https:\/\//.test(videoUrl)) return { message: "Link video cần bắt đầu bằng https://" };
  const { error } = await db.from("session_feedback").upsert({
    session_id: sessionId,
    student_id: studentId,
    coach_id: coachId,
    scores,
    comment,
    video_url: videoUrl,
    homework_video_id: opt(f, "homework_video_id"),
    shared: f.get("shared") === "on",
    author_id: session.userId,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("saveFeedback", error);
    return { message: "Chưa lưu được nhận xét." };
  }
  revalidatePath(`/quan-ly/lich-day/${sessionId}`);
  const next = opt(f, "next_student");
  redirect(`/quan-ly/lich-day/${sessionId}${next ? `?hv=${next}` : "?xong=1"}#nhan-xet`);
}

// ---------------------------------------------------------------- học viên
export async function createStudent(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const name = str(f, "full_name", 80);
  if (name.length < 2) return { message: "Bạn điền họ tên học viên nhé." };
  const rawPhone = str(f, "phone");
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return { message: "Số điện thoại cần 10 chữ số." };
  const birth = str(f, "birth_date");
  const { data, error } = await db
    .from("students")
    .insert({
      coach_id: coachId,
      full_name: name,
      phone,
      gender: opt(f, "gender"),
      birth_date: isDate(birth) ? birth : null,
      birth_year: isDate(birth) ? Number(birth.slice(0, 4)) : int(f, "birth_year"),
      dupr_start: dec(f, "dupr"),
      dupr_current: dec(f, "dupr"),
      note: opt(f, "note", 1000),
    })
    .select("id")
    .single();
  if (error) {
    console.error("createStudent", error);
    return { message: "Chưa lưu được học viên." };
  }
  const classId = opt(f, "class_id");
  if (classId) await enrollInternal(db, coachId, classId, data.id);
  refresh();
  redirect(classId ? `/quan-ly/khoa-hoc/${classId}` : `/quan-ly/hoc-vien/${data.id}`);
}

type Db = Awaited<ReturnType<typeof serverClient>>;
async function enrollInternal(db: Db, coachId: string, classId: string, studentId: string) {
  const { data: cls } = await db.from("classes").select("price, course_id").eq("id", classId).eq("coach_id", coachId).maybeSingle();
  if (!cls) return;
  let total: number | null = null;
  if (cls.course_id) {
    const { data: course } = await db.from("courses").select("session_count").eq("id", cls.course_id).maybeSingle();
    total = course?.session_count ?? null;
  }
  if (total == null) {
    const { count } = await db.from("class_sessions").select("id", { count: "exact", head: true }).eq("class_id", classId).neq("status", "huy");
    total = count || null;
  }
  const { error } = await db
    .from("enrollments")
    .upsert({ coach_id: coachId, class_id: classId, student_id: studentId, status: "dang-hoc", sessions_total: total, price: cls.price }, { onConflict: "class_id,student_id" });
  if (error) throw error;
  await db.from("students").update({ status: "dang-hoc" }).eq("id", studentId).eq("coach_id", coachId);
}

export async function enrollStudent(f: FormData) {
  const { coachId, db } = await ctx();
  const classId = str(f, "class_id");
  const studentId = str(f, "student_id");
  if (!classId || !studentId) return;
  await enrollInternal(db, coachId, classId, studentId);
  refresh();
}

export async function unenroll(f: FormData) {
  const { coachId, db } = await ctx();
  const { error } = await db.from("enrollments").update({ status: "nghi" }).eq("id", str(f, "id")).eq("coach_id", coachId);
  if (error) throw error;
  refresh();
}

export async function updateStudent(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const id = str(f, "id");
  const name = str(f, "full_name", 80);
  if (name.length < 2) return { message: "Họ tên chưa đúng." };
  const rawPhone = str(f, "phone");
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return { message: "Số điện thoại cần 10 chữ số." };
  const birth = str(f, "birth_date");
  const status = str(f, "status");
  const { error } = await db
    .from("students")
    .update({
      full_name: name,
      phone,
      gender: opt(f, "gender"),
      birth_date: isDate(birth) ? birth : null,
      ...(isDate(birth) ? { birth_year: Number(birth.slice(0, 4)) } : {}),
      dupr_start: dec(f, "dupr_start"),
      dupr_current: dec(f, "dupr_current"),
      note: opt(f, "note", 1000),
      ...(["dang-hoc", "da-hoc", "da-nghi"].includes(status) ? { status } : {}),
    })
    .eq("id", id)
    .eq("coach_id", coachId);
  if (error) {
    console.error("updateStudent", error);
    return { message: "Chưa lưu được." };
  }
  refresh();
  return { ok: true, message: "Đã lưu" };
}

/** Tốt nghiệp khoá: DUPR cuối, nhận xét tổng kết, video tổng kết. */
export async function graduate(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const enrollmentId = str(f, "enrollment_id");
  const studentId = str(f, "student_id");
  const dupr = dec(f, "final_dupr");
  const video = opt(f, "final_video_url", 300);
  if (video && !/^https:\/\//.test(video)) return { message: "Link video cần bắt đầu bằng https://" };
  const { error } = await db
    .from("enrollments")
    .update({ status: "tot-nghiep", final_dupr: dupr, final_note: opt(f, "final_note", 1000), final_video_url: video, graduated_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .eq("coach_id", coachId);
  if (error) {
    console.error("graduate", error);
    return { message: "Chưa lưu được." };
  }
  const { count } = await db.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("status", "dang-hoc");
  await db
    .from("students")
    .update({ ...(dupr != null ? { dupr_current: dupr } : {}), ...(count ? {} : { status: "da-hoc" }) })
    .eq("id", studentId)
    .eq("coach_id", coachId);
  refresh();
  redirect(`/quan-ly/hoc-vien/${studentId}?chung_nhan=${enrollmentId}#chung-nhan`);
}

export async function markBirthdayGift(f: FormData) {
  const { coachId, db } = await ctx();
  const year = Number(str(f, "year"));
  const { error } = await db.from("students").update({ birthday_gift_year: f.get("undo") ? null : year }).eq("id", str(f, "id")).eq("coach_id", coachId);
  if (error) throw error;
  revalidatePath("/quan-ly");
}

// ---------------------------------------------------------------- giờ rảnh
export async function addFreeSlot(_p: FormState, f: FormData): Promise<FormState> {
  const { coachId, db } = await ctx();
  const weekday = Number(str(f, "weekday"));
  const start = str(f, "start_time");
  const end = str(f, "end_time");
  if (!(weekday >= 1 && weekday <= 7) || !isTime(start) || !isTime(end) || end <= start) return { message: "Giờ kết thúc phải sau giờ bắt đầu." };
  const { error } = await db.from("free_slots").insert({ coach_id: coachId, weekday, start_time: start, end_time: end, venue_id: opt(f, "venue_id"), is_public: true });
  if (error) {
    console.error("addFreeSlot", error);
    return { message: "Chưa lưu được giờ rảnh." };
  }
  refresh();
  return { ok: true, message: "Đã thêm giờ rảnh" };
}

export async function deleteFreeSlot(f: FormData) {
  const { coachId, db } = await ctx();
  const { error } = await db.from("free_slots").delete().eq("id", str(f, "id")).eq("coach_id", coachId);
  if (error) throw error;
  refresh();
}

/** Chốt nhu cầu: tạo học viên + ghi danh lớp (nếu chọn). */
export async function closeLead(f: FormData) {
  const { db } = await ctx();
  const leadId = str(f, "id");
  const { data, error } = await db.rpc("close_lead", { p_lead: leadId, p_class: opt(f, "class_id"), p_price: int(f, "price") });
  if (error) throw error;
  refresh();
  redirect(`/quan-ly/hoc-vien/${data}`);
}
