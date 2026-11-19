export type CourseKind = "co-ban" | "sua-loi" | "nang-cao" | "luyen-cu" | "kid" | "kem-1-1" | "nhom";

export const COURSE_KINDS: { value: CourseKind; label: string }[] = [
  { value: "co-ban", label: "Cơ bản" },
  { value: "sua-loi", label: "Sửa lỗi" },
  { value: "nang-cao", label: "Nâng cao" },
  { value: "luyen-cu", label: "Luyện cú" },
  { value: "kid", label: "Kid" },
  { value: "kem-1-1", label: "Kèm 1-1" },
  { value: "nhom", label: "Nhóm nhỏ" },
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
  stat_hours: string;
  stat_students: string;
  stat_courses: string;
  stat_rating: number | null;
  stat_years: string;
  teaching_style: string[];
  strengths: { title: string; text: string }[];
  experience: { year: string; title: string; detail?: string }[];
  contacts: Contacts;
  accepting_students: boolean;
  settings?: unknown;
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
  duration_text: string | null;
  course_id: string | null;
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

export type LeadOrigin = "form" | "facebook" | "zalo" | "tiktok" | "gioi-thieu" | "truc-tiep" | "khac";
export const LEAD_ORIGINS: { value: LeadOrigin; label: string }[] = [
  { value: "form", label: "Form trên web" },
  { value: "facebook", label: "Facebook" },
  { value: "zalo", label: "Zalo" },
  { value: "tiktok", label: "TikTok" },
  { value: "gioi-thieu", label: "Bạn giới thiệu" },
  { value: "truc-tiep", label: "Gặp trực tiếp" },
  { value: "khac", label: "Khác" },
];

export type Lead = {
  id: string;
  coach_id: string;
  status: LeadStatus;
  full_name: string;
  gender: "nam" | "nu" | "khac" | null;
  birth_year: number | null;
  phone: string;
  for_whom: string | null;
  played_sports: boolean | null;
  sports: string[];
  pickleball_duration: string | null;
  dupr: string | null;
  self_level: string | null;
  course_id: string | null;
  interests: string[];
  goal: string | null;
  formats: string[];
  styles: string[];
  area: string | null;
  availability: Record<string, string[]>;
  budget: string | null;
  source: string | null;
  note: string | null;
  assigned_to: string | null;
  lost_reason: string | null;
  contacted_at: string | null;
  origin: LeadOrigin;
  remind_on: string | null;
  /** Người chốt (sale nhận 10%); bắt buộc khi Đã chốt. */
  closer_id?: string | null;
  closed_at?: string | null;
  /** Quản lý đào tạo đã xác nhận / xếp lớp sau khi chốt. */
  ops_confirmed_by?: string | null;
  ops_confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadNoteKind = "ghi-chu" | "goi" | "nhan" | "hen" | "trang-thai" | "he-thong";
export type LeadNote = {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  kind: LeadNoteKind;
  created_at: string;
};

export type MemberRole = "owner" | "quan-ly" | "coach" | "sale" | "tro-giang" | "co-dong";
export const ROLE_LABEL: Record<MemberRole, string> = { owner: "Team Leader", "quan-ly": "Quản lý đào tạo", coach: "Coach", sale: "Sale", "tro-giang": "Trợ giảng", "co-dong": "Cổ đông" };
export type Member = { user_id: string; role: MemberRole; roles?: string[]; display_name: string | null; commission_pct?: number; wage_per_session?: number };

export type PostTopic = "luat" | "ky-thuat" | "chien-thuat" | "the-luc" | "dung-cu";
export const POST_TOPICS: { value: PostTopic; label: string }[] = [
  { value: "ky-thuat", label: "Kỹ thuật" },
  { value: "luat", label: "Luật" },
  { value: "chien-thuat", label: "Chiến thuật" },
  { value: "the-luc", label: "Thể lực" },
  { value: "dung-cu", label: "Dụng cụ" },
];

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  topic: PostTopic;
  cover_url: string | null;
  youtube_id: string | null;
  body: string;
  read_minutes: number;
  is_featured: boolean;
  published_at: string | null;
  course_id: string | null;
};

export type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  course_id: string | null;
  is_pinned: boolean;
  created_at: string;
};
