import type { Role } from "./permissions";
import type { PriceRule } from "./venue-price";
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
  roles: Role[];
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
  roles: Role[];
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
  is_public: boolean;
  sort: number;
  /** Bảng giá theo khung giờ, giá mỗi giờ mỗi sân. */
  price_rules: PriceRule[];
};

export type CourseAdmin = Course & { is_public: boolean; sort: number };

export const SETTINGS_MENU = [
  { slug: "ho-so", label: "Hồ sơ trung tâm", icon: "star", color: "blue", desc: "Tên, ảnh, giới thiệu và liên hệ hiện trên trang công khai" },
  { slug: "san", label: "Sân dạy", icon: "map", color: "teal", desc: "Nơi dạy, địa chỉ và bảng giá thuê theo khung giờ" },
  { slug: "mau-khoa", label: "Gói buổi", icon: "book", color: "indigo", desc: "Các gói học viên chọn khi đăng ký: số buổi, học phí, giáo trình" },
  { slug: "quy-dinh", label: "Quy định lớp học", icon: "file", color: "amber", desc: "Báo nghỉ, trừ buổi, học bù, hoàn phí và học thử — áp dụng cho mọi lớp" },
  { slug: "ti-le", label: "Tỉ lệ chia & cổ đông", icon: "chart", color: "emerald", desc: "Cách chia học phí mỗi buổi đã dạy; chỉ Team Leader sửa" },
  { slug: "nhan-tien", label: "Thanh toán", icon: "wallet", color: "emerald", desc: "Tài khoản nhận học phí, cách thu tiền và đặt cọc" },
  { slug: "thanh-vien", label: "Phân quyền", icon: "team", color: "violet", desc: "Thành viên trong đội, vai trò và quyền của từng người" },
  { slug: "mau-tin", label: "Mẫu tin nhắn", icon: "chat", color: "cyan", desc: "Tin nhắn soạn sẵn để gửi học viên qua Zalo" },
  { slug: "thong-bao", label: "Thông báo", icon: "bell", color: "pink", desc: "Báo cho bạn khi nào và qua kênh nào" },
] as const;
export type SettingsSlug = (typeof SETTINGS_MENU)[number]["slug"];
