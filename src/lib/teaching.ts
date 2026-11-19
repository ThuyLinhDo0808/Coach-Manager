import { addDays, addMinutes, vnIso, weekdayOf } from "@/lib/time";

export type ClassStatus = "sap-dien-ra" | "dang-dien-ra" | "da-ket-thuc" | "huy";
export const CLASS_STATUSES: { value: ClassStatus; label: string }[] = [
  { value: "dang-dien-ra", label: "Đang diễn ra" },
  { value: "sap-dien-ra", label: "Sắp diễn ra" },
  { value: "da-ket-thuc", label: "Đã kết thúc" },
  { value: "huy", label: "Đã huỷ" },
];
export const CLASS_KINDS = [
  { value: "lop", label: "Lớp cố định" },
  { value: "kem-1-1", label: "Kèm 1-1" },
  { value: "buoi-le", label: "Buổi lẻ" },
] as const;

export type ClassRow = {
  id: string;
  course_id: string | null;
  title: string;
  kind: "lop" | "kem-1-1" | "buoi-le";
  venue_id: string | null;
  schedule_text: string | null;
  start_date: string | null;
  max_students: number | null;
  price: number | null;
  is_recruiting: boolean;
  status: ClassStatus;
  created_at: string;
  main_coach_id: string | null;
  assistant_id: string | null;
  /** Lớp đặc thù: trung tâm chịu tiền sân / bóng. */
  center_pays_court: boolean;
};

export type SessionRow = {
  id: string;
  class_id: string | null;
  lead_id: string | null;
  kind: "day" | "hoc-thu";
  seq: number | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
  topic: string | null;
  plan: string | null;
  status: "du-kien" | "da-day" | "huy";
  completed_at: string | null;
  /** Người dạy thực tế (dạy thay khi khác coach dạy chính của lớp). */
  teacher_id: string | null;
  assistant_id: string | null;
};

export type StudentStatus = "dang-hoc" | "da-hoc" | "da-nghi";
export const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: "dang-hoc", label: "Đang học" },
  { value: "da-hoc", label: "Đã học" },
  { value: "da-nghi", label: "Đã nghỉ" },
];

export type Student = {
  id: string;
  lead_id: string | null;
  full_name: string;
  phone: string | null;
  gender: "nam" | "nu" | "khac" | null;
  birth_date: string | null;
  birth_year: number | null;
  status: StudentStatus;
  dupr_start: number | null;
  dupr_current: number | null;
  note: string | null;
  birthday_gift_year: number | null;
  created_at: string;
};

export type Enrollment = {
  id: string;
  class_id: string;
  student_id: string;
  status: "dang-hoc" | "tot-nghiep" | "nghi";
  sessions_total: number | null;
  price: number | null;
  final_dupr: number | null;
  final_note: string | null;
  final_video_url: string | null;
  graduated_at: string | null;
  /** Người chốt (sale nhận 10% khi chia tiền buổi). */
  closer_id: string | null;
};

export type AttendanceStatus = "co-mat" | "vang" | "bao-nghi";
export type Attendance = { session_id: string; student_id: string; status: AttendanceStatus };

export const SKILLS = [
  ["giao_bong", "Giao bóng"],
  ["dink", "Dink"],
  ["volley", "Volley"],
  ["footwork", "Footwork"],
] as const;
export type Scores = Partial<Record<(typeof SKILLS)[number][0], number>>;

export type Feedback = {
  session_id: string;
  student_id: string;
  scores: Scores;
  comment: string | null;
  video_url: string | null;
  homework_video_id: string | null;
  shared: boolean;
  updated_at: string;
};

export type FreeSlot = { id: string; weekday: number; start_time: string; end_time: string; venue_id: string | null; is_public: boolean };

export const FEEDBACK_CHIPS = ["Tiến bộ rõ", "Cần luyện thêm dink", "Bước chân chậm", "Giao bóng ổn định", "Giữ vợt cao hơn ở lưới"];

/**
 * Tạo lịch các buổi của một lớp cố định: chọn thứ trong tuần, giờ bắt đầu, thời lượng,
 * ngày bắt đầu và số buổi. Trả về tối đa 60 buổi.
 */
export function generateSessions(opts: { startDate: string; weekdays: number[]; time: string; minutes: number; count: number }): { starts_at: string; ends_at: string; seq: number }[] {
  const days = [...new Set(opts.weekdays)].filter((d) => d >= 1 && d <= 7);
  const count = Math.min(Math.max(opts.count, 0), 60);
  const out: { starts_at: string; ends_at: string; seq: number }[] = [];
  if (!days.length || !count) return out;
  let date = opts.startDate;
  for (let guard = 0; out.length < count && guard < 800; guard++, date = addDays(date, 1)) {
    if (!days.includes(weekdayOf(date))) continue;
    out.push({ starts_at: vnIso(date, opts.time), ends_at: vnIso(date, addMinutes(opts.time, opts.minutes)), seq: out.length + 1 });
  }
  return out;
}

/** Hai khoảng giờ có chồng nhau không. */
export function overlaps(a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }): boolean {
  return new Date(a.starts_at) < new Date(b.ends_at) && new Date(b.starts_at) < new Date(a.ends_at);
}

/** Điểm kỹ năng buổi đầu và buổi gần nhất (theo thứ tự thời gian tăng dần). */
export function skillProgress(feedbackOldestFirst: { scores: Scores }[]): { key: string; label: string; first: number; last: number }[] {
  return SKILLS.flatMap(([key, label]) => {
    const vals = feedbackOldestFirst.map((f) => f.scores?.[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? [{ key, label, first: vals[0], last: vals[vals.length - 1] }] : [];
  });
}

/** Số buổi còn lại trong gói = tổng buổi − số buổi đã bị trừ (có mặt hoặc vắng không báo). */
export function sessionsLeft(total: number | null, attendance: { status: AttendanceStatus }[]): number | null {
  if (total == null) return null;
  const used = attendance.filter((a) => a.status === "co-mat" || a.status === "vang").length;
  return Math.max(total - used, 0);
}
