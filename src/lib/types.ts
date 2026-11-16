export type CourseKind = "co-ban" | "sua-loi" | "nang-cao" | "luyen-cu" | "kid" | "kem-1-1";

export const COURSE_KINDS: { value: CourseKind; label: string }[] = [
  { value: "co-ban", label: "Cơ bản" },
  { value: "sua-loi", label: "Sửa lỗi" },
  { value: "nang-cao", label: "Nâng cao" },
  { value: "luyen-cu", label: "Luyện cú" },
  { value: "kid", label: "Kid" },
  { value: "kem-1-1", label: "Kèm 1-1" },
];

export type Contacts = {
  zalo?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  phone?: string;
  show_phone?: boolean;
};

export type Coach = {
  id: string;
  slug: string;
  display_name: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  birth_year: number | null;
  show_age: boolean;
  gender: "nam" | "nu" | "khac" | null;
  area: string | null;
  dupr: number | null;
  stat_hours: number;
  stat_students: number;
  stat_courses: number;
  stat_rating: number | null;
  teaching_style: string[];
  strengths: { title: string; text: string }[];
  experience: { year: string; title: string; detail?: string }[];
  contacts: Contacts;
  accepting_students: boolean;
};

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  image_url: string | null;
  maps_url: string | null;
  hours_text: string | null;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  kind: CourseKind;
  cover_url: string | null;
  summary: string | null;
  audience: string | null;
  goal: string | null;
  session_count: number | null;
  minutes_per_session: number | null;
  max_students: number | null;
  schedule_text: string | null;
  venue_id: string | null;
  price_full: number | null;
  price_single: number | null;
  price_note: string | null;
  curriculum: { title: string; content: string }[];
  commitments: string[];
  outcomes: string[];
};

export type OpenClass = {
  id: string;
  course_id: string | null;
  title: string;
  schedule_text: string | null;
  venue_id: string | null;
  start_date: string | null;
  seats_total: number | null;
  seats_left: number | null;
};

export type VideoGroup = { id: string; slug: string; name: string };

export type Video = {
  id: string;
  group_id: string | null;
  title: string;
  youtube_id: string | null;
  description: string | null;
  level: string | null;
  published_on: string | null;
};

export type LeadStatus =
  | "moi"
  | "da-lien-he"
  | "hen-hoc-thu"
  | "cho-dong-tien"
  | "da-chot"
  | "danh-sach-cho"
  | "khong-thanh";

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "moi", label: "Mới" },
  { value: "da-lien-he", label: "Đã liên hệ" },
  { value: "hen-hoc-thu", label: "Hẹn học thử" },
  { value: "cho-dong-tien", label: "Chờ đóng tiền" },
  { value: "da-chot", label: "Đã chốt" },
  { value: "danh-sach-cho", label: "Danh sách chờ" },
  { value: "khong-thanh", label: "Không thành" },
];
