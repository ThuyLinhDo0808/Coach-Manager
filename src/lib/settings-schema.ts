import { z } from "zod";
import { parseYoutubeId } from "@/lib/content";
import { DEFAULT_TEMPLATES } from "@/lib/message-templates";
import { NOTIFY_EVENTS, PERMISSIONS } from "@/lib/settings";
import { BANKS } from "@/lib/settings-types";

// Kiểm tra dữ liệu các form Cài đặt và Nội dung. Form gửi chữ (ô nhập), schema đổi sang đúng kiểu.

const blank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
/** "3.200.000 đ" → 3200000 */
const intLike = (v: unknown) => (typeof v === "number" ? v : Number(String(v).replace(/[\s.,đ₫]/g, "")));
/** "4,5" → 4.5 */
const decLike = (v: unknown) => (typeof v === "number" ? v : Number(String(v).trim().replace(",", ".")));

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);
const reqText = (min: number, max: number, msg: string) => z.string({ error: msg }).trim().min(min, msg).max(max, `Tối đa ${max} ký tự`);
const nullText = (max: number) => text(max).transform((v) => v || null);
const url = text(500)
  .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Link cần bắt đầu bằng http:// hoặc https://")
  .transform((v) => v || null);
const num = (min: number, max: number, msg: string) => z.number({ error: msg }).min(min, msg).max(max, msg);
const int = (min: number, max: number, msg: string) => z.preprocess((v) => (blank(v) ? undefined : intLike(v)), num(min, max, msg).int(msg));
const optInt = (min: number, max: number, msg: string) => z.preprocess((v) => (blank(v) ? null : intLike(v)), num(min, max, msg).int(msg).nullable());
const optDec = (min: number, max: number, msg: string) => z.preprocess((v) => (blank(v) ? null : decLike(v)), num(min, max, msg).nullable());
const optId = z.preprocess((v) => (blank(v) ? null : v), z.guid("Lựa chọn chưa đúng").nullable());
const id = z.guid("Thiếu mã dòng cần sửa");
const lines = (maxItems: number, maxLen: number) =>
  z
    .array(text(maxLen))
    .max(maxItems * 2)
    .transform((a) => a.filter(Boolean).slice(0, maxItems));
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ cần dạng 22:00");

/** Viết hoa không dấu, như tên in trên thẻ ngân hàng. */
export function bankAccountName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "https://Hoc.TrungMuoi.vn/abc" → "hoc.trungmuoi.vn" */
export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
}

// ---------------------------------------------------------------- Cài đặt
export const profileSchema = z.object({
  display_name: reqText(2, 60, "Bạn điền tên hiển thị nhé"),
  tagline: nullText(120),
  bio: nullText(3000),
  avatar_url: url,
  cover_url: url,
  birth_year: optInt(1940, 2020, "Năm sinh chưa đúng"),
  show_age: z.boolean(),
  gender: z.preprocess((v) => (blank(v) ? null : v), z.enum(["nam", "nu", "khac"]).nullable()),
  area: nullText(80),
  dupr: optDec(1, 8, "DUPR nằm trong khoảng 1.0 – 8.0"),
  stat_hours: int(0, 1_000_000, "Số giờ dạy chưa đúng"),
  stat_students: int(0, 1_000_000, "Số học viên chưa đúng"),
  stat_courses: int(0, 100_000, "Số khoá chưa đúng"),
  stat_years: int(0, 80, "Số năm kinh nghiệm chưa đúng"),
  teaching_style: lines(12, 160),
  strengths: z
    .array(z.object({ title: text(40), text: text(200) }))
    .max(40)
    .transform((a) => a.filter((s) => s.title).slice(0, 12)),
  experience: z
    .array(z.object({ year: text(20), title: text(160), detail: text(300).optional().default("") }))
    .max(60)
    .transform((a) => a.filter((e) => e.title).slice(0, 20)),
  contacts: z.object({
    zalo: text(200),
    facebook: url.transform((v) => v ?? ""),
    tiktok: url.transform((v) => v ?? ""),
    youtube: url.transform((v) => v ?? ""),
    phone: text(20),
    show_phone: z.boolean(),
  }),
  accepting_students: z.boolean(),
});

export const venueSchema = z.object({
  id: optId,
  name: reqText(2, 80, "Bạn điền tên sân nhé"),
  district: nullText(60),
  address: nullText(200),
  maps_url: url,
  image_url: url,
  hours_text: nullText(120),
  court_count: optInt(1, 99, "Số sân từ 1 đến 99"),
  rent_per_hour: optInt(0, 100_000_000, "Giá thuê chưa đúng"),
  is_public: z.boolean(),
  sort: int(0, 9999, "Thứ tự là số từ 0 trở lên"),
});

export const COURSE_KIND_VALUES = ["co-ban", "sua-loi", "nang-cao", "luyen-cu", "kid", "kem-1-1"] as const;

export const courseSchema = z.object({
  id: optId,
  title: reqText(2, 120, "Bạn điền tên khoá nhé"),
  kind: z.enum(COURSE_KIND_VALUES, { error: "Bạn chọn loại khoá nhé" }),
  cover_url: url,
  summary: nullText(300),
  audience: nullText(300),
  goal: nullText(300),
  session_count: optInt(1, 200, "Số buổi chưa đúng"),
  minutes_per_session: optInt(15, 600, "Số phút mỗi buổi từ 15 đến 600"),
  max_students: optInt(1, 200, "Sĩ số chưa đúng"),
  schedule_text: nullText(120),
  venue_id: optId,
  price_full: optInt(0, 1_000_000_000, "Học phí chưa đúng"),
  price_single: optInt(0, 1_000_000_000, "Giá mỗi buổi chưa đúng"),
  price_note: nullText(200),
  curriculum: z
    .array(z.object({ title: text(60), content: text(500) }))
    .max(120)
    .transform((a) =>
      a
        .filter((s) => s.title || s.content)
        .slice(0, 60)
        .map((s, i) => ({ title: s.title || `Buổi ${i + 1}`, content: s.content })),
    ),
  commitments: lines(20, 200),
  outcomes: lines(20, 200),
  is_public: z.boolean(),
  sort: int(0, 9999, "Thứ tự là số từ 0 trở lên"),
});

export const rulesSchema = z.object({
  notice_hours: int(1, 168, "Hạn báo nghỉ chưa đúng"),
  deduct_mode: z.enum(["co-mat-hoac-khong-bao", "chi-co-mat", "moi-buoi"]),
  makeup_max: int(0, 20, "Số buổi bù từ 0 đến 20"),
  makeup_days: int(1, 365, "Hạn học bù từ 1 đến 365 ngày"),
  refund_after_sessions: int(0, 20, "Số buổi từ 0 đến 20"),
  refund_pct: int(0, 100, "Phần trăm từ 0 đến 100"),
  rain_makeup: z.boolean(),
  trial_mode: z.enum(["co-phi", "mien-phi", "khong-nhan"]),
  trial_fee: int(0, 10_000_000, "Phí học thử chưa đúng"),
  trial_deduct: z.boolean(),
  signup_cutoff_hours: int(0, 168, "Số giờ từ 0 đến 168"),
});

const BANK_BINS = BANKS.map((b) => b.bin) as string[];

export const payoutSchema = z
  .object({
    bank_bin: z.string().refine((v) => v === "" || BANK_BINS.includes(v), "Bạn chọn ngân hàng trong danh sách nhé"),
    account_no: z
      .string()
      .transform((v) => v.replace(/[\s.-]/g, ""))
      .refine((v) => v === "" || /^[0-9A-Za-z]{6,19}$/.test(v), "Số tài khoản gồm 6–19 chữ số"),
    account_name: z
      .string()
      .transform(bankAccountName)
      .refine((v) => v.length <= 60 && /^[A-Z0-9 ]*$/.test(v), "Tên chủ tài khoản viết hoa không dấu, tối đa 60 ký tự"),
    deposit_pct: int(0, 100, "Đặt cọc từ 0 đến 100%"),
    offer_days: int(1, 30, "Hạn offer từ 1 đến 30 ngày"),
    accept_cash: z.boolean(),
    require_proof: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const filled = [v.bank_bin, v.account_no, v.account_name].filter(Boolean).length;
    if (filled === 0 || filled === 3) return;
    if (!v.bank_bin) ctx.addIssue({ code: "custom", path: ["bank_bin"], message: "Bạn chọn ngân hàng nhé" });
    if (!v.account_no) ctx.addIssue({ code: "custom", path: ["account_no"], message: "Bạn điền số tài khoản nhé" });
    if (!v.account_name) ctx.addIssue({ code: "custom", path: ["account_name"], message: "Bạn điền tên chủ tài khoản nhé" });
  });

const email = z
  .string({ error: "Bạn điền email nhé" })
  .trim()
  .toLowerCase()
  .max(200, "Email quá dài")
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "Email chưa đúng");

export const memberSchema = z.object({
  user_id: id,
  display_name: nullText(60),
  role: z.enum(["owner", "sale", "tro-giang"], { error: "Vai trò chưa đúng" }),
  commission_pct: z.preprocess((v) => (blank(v) ? 0 : decLike(v)), num(0, 100, "Hoa hồng từ 0 đến 100%")),
  wage_per_session: z.preprocess((v) => (blank(v) ? 0 : intLike(v)), num(0, 100_000_000, "Lương mỗi buổi chưa đúng").int("Lương mỗi buổi chưa đúng")),
});

export const inviteSchema = z.object({
  email,
  role: z.enum(["sale", "tro-giang"], { error: "Bạn chọn vai trò nhé" }),
  display_name: nullText(60),
});

export const joinSchema = z.object({
  email,
  password: z.string({ error: "Bạn đặt mật khẩu nhé" }).min(8, "Mật khẩu cần ít nhất 8 ký tự").max(72, "Mật khẩu tối đa 72 ký tự"),
});

const flags = <K extends string>(keys: readonly K[]) => z.object(Object.fromEntries(keys.map((k) => [k, z.boolean()])) as Record<K, z.ZodBoolean>);
const each = <K extends string, S extends z.ZodType>(keys: readonly K[], shape: S) => z.object(Object.fromEntries(keys.map((k) => [k, shape])) as Record<K, S>);

export const permissionsSchema = z.object({
  permissions: each(PERMISSIONS.map((p) => p.key), flags(["sale", "tro-giang"] as const)),
  lead_assign: z.object({ mode: z.enum(["xoay-vong", "coach-giao"]), alert_24h: z.boolean() }),
});

export const templateSchema = z.object({
  key: z.enum(DEFAULT_TEMPLATES.map((t) => t.key) as [string, ...string[]], { error: "Không tìm thấy mẫu này" }),
  title: reqText(2, 80, "Bạn điền tên mẫu nhé"),
  body: reqText(1, 2000, "Nội dung mẫu đang trống"),
  enabled: z.boolean(),
});

export const notifySchema = z.object({
  events: each(NOTIFY_EVENTS.map((e) => e.key), flags(["bell", "email", "zalo"] as const)),
  quiet: z.object({ on: z.boolean(), from: hhmm, to: hhmm }),
  digest: z.object({ on: z.boolean(), at: hhmm }),
});

export const domainSchema = z.object({
  custom_domain: z
    .string()
    .transform(normalizeDomain)
    .refine((v) => v === "" || (v.length <= 253 && /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v)), "Tên miền chưa đúng, ví dụ: hoc.trungmuoi.vn"),
});

// ---------------------------------------------------------------- Nội dung
export const videoGroupSchema = z.object({ id: optId, name: reqText(2, 40, "Tên nhóm cần 2–40 ký tự") });

export const videoSchema = z.object({
  id: optId,
  title: reqText(2, 120, "Bạn điền tên video nhé"),
  youtube: z.string().transform((v, ctx) => {
    const yt = parseYoutubeId(v);
    if (!yt) {
      ctx.addIssue({ code: "custom", message: "Link YouTube chưa đúng. Dán link dạng youtube.com/watch?v=… hoặc youtu.be/…" });
      return z.NEVER;
    }
    return yt;
  }),
  description: nullText(1000),
  level: nullText(40),
  duration_text: text(12)
    .refine((v) => !v || /^\d{1,3}(:[0-5]\d){1,2}$/.test(v), "Thời lượng dạng 4:30")
    .transform((v) => v || null),
  group_id: optId,
  course_id: optId,
  visibility: z.enum(["public", "students", "private"]),
});

export const postSchema = z
  .object({
    id: optId,
    title: reqText(4, 160, "Tiêu đề cần ít nhất 4 ký tự"),
    excerpt: nullText(300),
    topic: z.enum(["luat", "ky-thuat", "chien-thuat", "the-luc", "dung-cu"], { error: "Bạn chọn chủ đề nhé" }),
    cover_url: url,
    youtube: z.string().transform((v, ctx) => {
      if (!v.trim()) return null;
      const yt = parseYoutubeId(v);
      if (!yt) {
        ctx.addIssue({ code: "custom", message: "Link YouTube chưa đúng" });
        return z.NEVER;
      }
      return yt;
    }),
    body: z.string().max(60_000, "Bài quá dài").transform((v) => v.replace(/\r/g, "").trim()),
    is_featured: z.boolean(),
    status: z.enum(["nhap", "da-dang", "an"]),
    course_id: optId,
  })
  .superRefine((v, ctx) => {
    if (v.status === "da-dang" && !v.body) ctx.addIssue({ code: "custom", path: ["body"], message: "Bài chưa có nội dung nên chưa đăng được" });
  });

export const reviewSchema = z.object({
  author_name: reqText(2, 60, "Bạn điền tên người đánh giá nhé"),
  rating: int(1, 5, "Chấm từ 1 đến 5 sao"),
  body: nullText(1000),
  course_id: optId,
});
