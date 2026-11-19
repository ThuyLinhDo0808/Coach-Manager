import type { MemberRole } from "@/lib/types";

// Quyền trong khu quản lý. Menu chỉ hiện mục người đó được phép; mọi trang và server action
// cũng tự kiểm tra lại (xem requirePerm trong src/lib/auth-perm.ts). RLS trong database là lớp chặn cuối.
export type Perm =
  | "tong-quan"
  | "lich"
  | "lich-trung-tam"
  | "hoc-vien"
  | "lop"
  | "noi-dung"
  | "tuyen-sinh"
  | "tai-chinh"
  | "thong-ke"
  | "doi-ngu"
  | "cai-dat";

// Đợt 1: vẫn dựa trên một vai trò như cũ (owner thấy hết; sale / trợ giảng không thấy mục của chủ).
const LEGACY: Record<MemberRole, Perm[] | "all"> = {
  owner: "all",
  sale: ["tong-quan", "lich", "lich-trung-tam", "hoc-vien", "lop", "tuyen-sinh"],
  "tro-giang": ["tong-quan", "lich", "lich-trung-tam", "hoc-vien", "lop", "tuyen-sinh"],
};

export const ALL_PERMS: Perm[] = [
  "tong-quan", "lich", "lich-trung-tam", "hoc-vien", "lop", "noi-dung", "tuyen-sinh", "tai-chinh", "thong-ke", "doi-ngu", "cai-dat",
];

/** Danh sách quyền (truyền được sang component phía trình duyệt). */
export function allowedPerms(role: MemberRole): Perm[] {
  return ALL_PERMS.filter(permsOf(role));
}

export function permsOf(role: MemberRole): (p: Perm) => boolean {
  const list = LEGACY[role] ?? [];
  return (p) => list === "all" || list.includes(p);
}
