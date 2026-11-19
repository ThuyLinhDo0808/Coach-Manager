import type { IconName } from "@/components/icon";
import type { Perm } from "@/lib/permissions";

// Khung menu khu quản lý: 3 nhóm nhãn, mỗi mục có mục con.
// Mục con không có `href` là chưa có trang: menu hiện "Sắp có", không có link.

export type MenuChild = {
  label: string;
  href?: string;
  perm: Perm;
  /** Đường dẫn khác cũng tính là đang ở mục con này (ví dụ trang chi tiết). */
  also?: RegExp;
};

export type MenuGroup = {
  key: string;
  label: string;
  short?: string;
  icon: IconName;
  color: string;
  section: "hang-ngay" | "kinh-doanh" | "trung-tam";
  children: MenuChild[];
};

export const SECTIONS = [
  { key: "hang-ngay", label: "Hằng ngày" },
  { key: "kinh-doanh", label: "Kinh doanh" },
  { key: "trung-tam", label: "Trung tâm" },
] as const;

const Q = "/quan-ly";
const UUID = "[0-9a-f-]{36}";

export const MENU: MenuGroup[] = [
  {
    key: "tong-quan", label: "Tổng quan", icon: "home", color: "blue", section: "hang-ngay",
    children: [
      { label: "Hôm nay", href: Q, perm: "tong-quan" },
      { label: "Cần xử lý", href: `${Q}/can-xu-ly`, perm: "can-xu-ly" },
    ],
  },
  {
    key: "lich", label: "Lịch", icon: "cal", color: "cyan", section: "hang-ngay",
    children: [
      { label: "Lịch của tôi", href: `${Q}/lich-day/cua-toi`, perm: "lich-cua-toi" },
      { label: "Lịch trung tâm", href: `${Q}/lich-day`, perm: "lich-trung-tam" },
      { label: "Lịch rảnh 1-1", href: `${Q}/lich-day/gio-ranh`, perm: "lich-trung-tam" },
      { label: "Điểm danh", href: `${Q}/lich-day/diem-danh`, perm: "diem-danh", also: new RegExp(`^${Q}/lich-day/${UUID}`) },
    ],
  },
  {
    key: "hoc-vien", label: "Học viên", icon: "users", color: "violet", section: "hang-ngay",
    children: [
      { label: "Danh sách", href: `${Q}/hoc-vien`, perm: "hoc-vien", also: new RegExp(`^${Q}/hoc-vien/${UUID}`) },
      { label: "Gói đã mua", href: `${Q}/hoc-vien/goi`, perm: "hoc-vien" },
      { label: "Tiến độ kỹ năng", perm: "hoc-vien" },
      { label: "Đánh giá", href: `${Q}/hoc-vien/danh-gia`, perm: "danh-gia" },
    ],
  },
  {
    key: "lop", label: "Lớp & khoá học", short: "Lớp", icon: "book", color: "indigo", section: "hang-ngay",
    children: [
      { label: "Lớp", href: `${Q}/khoa-hoc`, perm: "lop", also: new RegExp(`^${Q}/khoa-hoc/${UUID}`) },
      { label: "Gói buổi", href: `${Q}/cai-dat/mau-khoa`, perm: "goi-buoi" },
      { label: "Giáo án", href: `${Q}/noi-dung`, perm: "giao-an" },
    ],
  },
  {
    key: "tuyen-sinh", label: "Tuyển sinh", icon: "inbox", color: "pink", section: "kinh-doanh",
    children: [
      { label: "Nhu cầu", href: `${Q}/nhu-cau`, perm: "tuyen-sinh" },
      { label: "Học thử", href: `${Q}/nhu-cau/hoc-thu`, perm: "tuyen-sinh" },
      { label: "Danh sách chờ", href: `${Q}/nhu-cau/cho`, perm: "tuyen-sinh" },
      { label: "Form & trang công khai", href: `${Q}/nhu-cau/form`, perm: "tuyen-sinh" },
    ],
  },
  {
    key: "tai-chinh", label: "Tài chính", icon: "wallet", color: "emerald", section: "kinh-doanh",
    children: [
      { label: "Sổ thu chi", href: `${Q}/thu-chi`, perm: "tai-chinh" },
      { label: "Công nợ học viên", href: `${Q}/thu-chi/cong-no`, perm: "tai-chinh" },
      { label: "Chia tiền tháng", perm: "tai-chinh" },
      { label: "Chi trả", perm: "tai-chinh" },
      { label: "Trợ giảng", perm: "tro-giang-bang" },
      { label: "Các quỹ", perm: "quy-xem" },
      { label: "Báo cáo lãi / lỗ", perm: "bao-cao" },
    ],
  },
  {
    key: "thong-ke", label: "Thống kê", icon: "chart", color: "amber", section: "kinh-doanh",
    children: [
      { label: "Doanh thu", href: `${Q}/thong-ke`, perm: "thong-ke" },
      { label: "Tuyển sinh", perm: "thong-ke" },
      { label: "Học viên", perm: "thong-ke" },
      { label: "Hiệu suất coach", perm: "thong-ke" },
    ],
  },
  {
    key: "doi-ngu", label: "Đội ngũ", icon: "team", color: "teal", section: "trung-tam",
    children: [
      { label: "Coach", href: `${Q}/doi-ngu`, perm: "doi-ngu" },
      { label: "Sale", href: `${Q}/doi-ngu/sale`, perm: "doi-ngu" },
      { label: "Trợ giảng", href: `${Q}/doi-ngu/tro-giang`, perm: "doi-ngu" },
      { label: "Phân công lớp", href: `${Q}/doi-ngu/phan-cong`, perm: "phan-cong" },
      { label: "Bảng công", href: `${Q}/doi-ngu/bang-cong`, perm: "bang-cong" },
    ],
  },
  {
    key: "cai-dat", label: "Cài đặt", icon: "gear", color: "slate", section: "trung-tam",
    children: [
      { label: "Hồ sơ trung tâm", href: `${Q}/cai-dat/ho-so`, perm: "cai-dat", also: new RegExp(`^${Q}/cai-dat/?$`) },
      { label: "Quy định lớp", href: `${Q}/cai-dat/quy-dinh`, perm: "cai-dat" },
      { label: "Tỉ lệ chia & cổ đông", perm: "ti-le" },
      { label: "Thanh toán", href: `${Q}/cai-dat/nhan-tien`, perm: "cai-dat" },
      { label: "Phân quyền", href: `${Q}/cai-dat/thanh-vien`, perm: "cai-dat" },
      { label: "Sân dạy", href: `${Q}/cai-dat/san`, perm: "cai-dat" },
      { label: "Mẫu tin nhắn", href: `${Q}/cai-dat/mau-tin`, perm: "cai-dat" },
      { label: "Thông báo", href: `${Q}/cai-dat/thong-bao`, perm: "cai-dat" },
      { label: "Tên miền riêng", href: `${Q}/cai-dat/ten-mien`, perm: "cai-dat" },
    ],
  },
];

/** Mục con đang mở: khớp `also`, nếu không thì tiền tố dài nhất. */
export function activeChild(pathname: string, menu: MenuGroup[] = MENU): { group: MenuGroup; child: MenuChild } | null {
  let best: { group: MenuGroup; child: MenuChild; score: number } | null = null;
  for (const group of menu) {
    for (const child of group.children) {
      if (!child.href) continue;
      let score = -1;
      if (child.also?.test(pathname)) score = 10_000;
      else if (pathname === child.href) score = 5_000 + child.href.length;
      else if (child.href !== Q && pathname.startsWith(child.href + "/")) score = child.href.length;
      if (score > (best?.score ?? -1)) best = { group, child, score };
    }
  }
  return best && { group: best.group, child: best.child };
}

/** Lọc menu theo quyền: bỏ mục con không được phép, bỏ nhóm không còn mục con nào có trang. */
export function menuFor(can: (p: Perm) => boolean, menu: MenuGroup[] = MENU): MenuGroup[] {
  return menu
    .map((g) => ({ ...g, children: g.children.filter((c) => can(c.perm)) }))
    .filter((g) => g.children.some((c) => c.href));
}

/** Trang mặc định của nhóm: mục con đầu tiên có trang. */
export const groupHref = (g: MenuGroup) => g.children.find((c) => c.href)?.href ?? Q;
