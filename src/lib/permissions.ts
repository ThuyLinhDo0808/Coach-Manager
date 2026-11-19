// Vai trò và quyền trong khu quản lý.
// Một người có thể có nhiều vai trò; quyền là hợp các vai trò. Menu chỉ hiện mục được phép, và mọi
// trang / server action đều tự kiểm tra lại bằng requirePerm (src/lib/auth.ts). RLS trong database là lớp chặn cuối.

export type Role = "chu" | "quan-ly" | "co-dong" | "coach" | "sale" | "tro-giang";

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "chu", label: "Team Leader", hint: "Toàn quyền; duy nhất sửa tỉ lệ chia, chốt tháng" },
  { value: "quan-ly", label: "Quản lý đào tạo", hint: "Tuyển sinh, xác nhận xếp lớp, lịch trung tâm, lớp, học viên, phân công" },
  { value: "co-dong", label: "Cổ đông", hint: "Xem báo cáo lãi / lỗ, các quỹ, phần của mình" },
  { value: "coach", label: "Coach", hint: "Lịch của mình, học viên lớp mình, điểm danh, thu nhập" },
  { value: "sale", label: "Sale", hint: "Tuyển sinh, thu nhập của mình" },
  { value: "tro-giang", label: "Trợ giảng", hint: "Lịch được phân, điểm danh, tiền của mình; không thấy học phí, số điện thoại" },
];
export const roleLabel = (r: Role) => ROLES.find((x) => x.value === r)?.label ?? r;

export type Perm =
  | "tong-quan"
  | "can-xu-ly"
  | "lich-cua-toi"
  | "lich-trung-tam"
  | "diem-danh"
  | "hoc-vien"
  | "hoc-vien-sua"
  | "danh-gia"
  | "lop"
  | "lop-sua"
  | "goi-buoi"
  | "giao-an"
  | "tuyen-sinh"
  | "xac-nhan-xep-lop"
  | "tai-chinh"
  | "tro-giang-bang"
  | "quy-xem"
  | "bao-cao"
  | "thu-nhap"
  | "phan-cua-toi"
  | "thong-ke"
  | "doi-ngu"
  | "phan-cong"
  | "bang-cong"
  | "cai-dat"
  | "ti-le";

export const ALL_PERMS: Perm[] = [
  "tong-quan", "can-xu-ly", "lich-cua-toi", "lich-trung-tam", "diem-danh", "hoc-vien", "hoc-vien-sua", "danh-gia",
  "lop", "lop-sua", "goi-buoi", "giao-an", "tuyen-sinh", "xac-nhan-xep-lop", "tai-chinh", "tro-giang-bang", "quy-xem",
  "bao-cao", "thu-nhap", "phan-cua-toi", "thong-ke", "doi-ngu", "phan-cong", "bang-cong", "cai-dat", "ti-le",
];

const BY_ROLE: Record<Role, Perm[]> = {
  chu: ALL_PERMS,
  "quan-ly": [
    "tong-quan", "can-xu-ly", "lich-trung-tam", "diem-danh", "hoc-vien", "hoc-vien-sua", "lop", "lop-sua",
    "tuyen-sinh", "xac-nhan-xep-lop", "quy-xem", "bao-cao", "phan-cong",
  ],
  "co-dong": ["tong-quan", "bao-cao", "quy-xem", "phan-cua-toi"],
  coach: ["tong-quan", "lich-cua-toi", "diem-danh", "hoc-vien", "lop", "thu-nhap", "tro-giang-bang"],
  sale: ["tong-quan", "tuyen-sinh", "thu-nhap"],
  "tro-giang": ["tong-quan", "lich-cua-toi", "diem-danh", "thu-nhap"],
};

/** Danh sách quyền của một người (truyền được sang component phía trình duyệt). */
export function permsFor(roles: Role[]): Perm[] {
  const set = new Set<Perm>();
  for (const r of roles) for (const p of BY_ROLE[r] ?? []) set.add(p);
  return ALL_PERMS.filter((p) => set.has(p));
}

export const hasRole = (roles: Role[], ...wanted: Role[]) => wanted.some((r) => roles.includes(r));

/** Chỉ thấy phần việc của mình (không phải Team Leader / quản lý): lịch, học viên, lớp lọc theo người dạy. */
export const seesOnlyOwnTeaching = (roles: Role[]) => !hasRole(roles, "chu", "quan-ly");
