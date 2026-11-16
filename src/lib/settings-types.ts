import type { Course, MemberRole } from "./types";

/** Kết quả của server action lưu form: thông báo + lỗi theo tên trường. */
export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

/** Ngân hàng lớn ở Việt Nam kèm mã BIN NAPAS (dùng cho VietQR). */
export const BANKS = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970422", name: "MB" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970441", name: "VIB" },
  { bin: "970437", name: "HDBank" },
  { bin: "970443", name: "SHB" },
  { bin: "970426", name: "MSB" },
  { bin: "970448", name: "OCB" },
] as const;

export const bankName = (bin: string) => BANKS.find((b) => b.bin === bin)?.name ?? "";

export type MemberRow = {
  user_id: string;
  role: MemberRole;
  display_name: string | null;
  email: string | null;
  commission_pct: number;
  wage_per_session: number;
  created_at: string;
};

export type InviteRole = Exclude<MemberRole, "owner">;
export type InviteRow = {
  id: string;
  email: string;
  role: InviteRole;
  display_name: string | null;
  created_at: string;
};

export type VenueAdmin = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  image_url: string | null;
  maps_url: string | null;
  hours_text: string | null;
  is_public: boolean;
  sort: number;
  court_count: number | null;
  rent_per_hour: number | null;
};

export type CourseAdmin = Course & { is_public: boolean; sort: number };

export const SETTINGS_MENU = [
  { slug: "ho-so", label: "Hồ sơ coach" },
  { slug: "san", label: "Sân dạy" },
  { slug: "mau-khoa", label: "Mẫu khoá học" },
  { slug: "quy-dinh", label: "Quy định lớp" },
  { slug: "nhan-tien", label: "Nhận tiền" },
  { slug: "thanh-vien", label: "Thành viên & quyền" },
  { slug: "mau-tin", label: "Mẫu tin nhắn" },
  { slug: "thong-bao", label: "Thông báo" },
  { slug: "ten-mien", label: "Tên miền riêng" },
] as const;
export type SettingsSlug = (typeof SETTINGS_MENU)[number]["slug"];
