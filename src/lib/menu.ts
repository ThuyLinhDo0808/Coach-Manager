import type { IconName } from "@/components/icon";
import type { Perm } from "@/lib/permissions";

// Khung menu khu quản lý: 3 nhóm nhãn, mỗi mục có mục con.
// Mục con không có `href` là chưa có trang: menu hiện "Sắp có", không có link.

export type MenuChild = {
  label: string;
  href?: string;
  perm?: Perm;
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
  perm: Perm;
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
    key: "tong-quan", label: "Tổng quan", icon: "home", color: "blue", section: "hang-ngay", perm: "tong-quan",
    children: [
      { label: "Hôm nay", href: Q },
      { label: "Cần xử lý" },
    ],
  },
  {
    key: "lich", label: "Lịch", icon: "cal", color: "cyan", section: "hang-ngay", perm: "lich",
    children: [
      { label: "Lịch của tôi" },
      { label: "Lịch trung tâm", href: `${Q}/lich-day`, perm: "lich-trung-tam" },
      { label: "Lịch rảnh 1-1", href: `${Q}/lich-day/gio-ranh`, perm: "lich-trung-tam" },
      { label: "Điểm danh", href: `${Q}/lich-day/diem-danh`, also: new RegExp(`^${Q}/lich-day/${UUID}`) },
    ],
  },
  {
    key: "hoc-vien", label: "Học viên", icon: "users", color: "violet", section: "hang-ngay", perm: "hoc-vien",
    children: [
      { label: "Danh sách", href: `${Q}/hoc-vien`, also: new RegExp(`^${Q}/hoc-vien/${UUID}`) },
      { label: "Gói đã mua" },
      { label: "Tiến độ kỹ năng" },
      { label: "Đánh giá", href: `${Q}/hoc-vien/danh-gia`, perm: "noi-dung" },
    ],
  },
  {
    key: "lop", label: "Lớp & khoá học", short: "Lớp", icon: "book", color: "indigo", section: "hang-ngay", perm: "lop",
    children: [
      { label: "Lớp", href: `${Q}/khoa-hoc`, also: new RegExp(`^${Q}/khoa-hoc/${UUID}`) },
      { label: "Gói buổi", href: `${Q}/cai-dat/mau-khoa`, perm: "cai-dat" },
      { label: "Giáo án", href: `${Q}/noi-dung`, perm: "noi-dung" },
    ],
  },
  {
    key: "tuyen-sinh", label: "Tuyển sinh", icon: "inbox", color: "pink", section: "kinh-doanh", perm: "tuyen-sinh",
    children: [
      { label: "Nhu cầu", href: `${Q}/nhu-cau` },
      { label: "Học thử" },
      { label: "Danh sách chờ" },
      { label: "Form & trang công khai", href: `${Q}/nhu-cau/form` },
    ],
  },
  {
    key: "tai-chinh", label: "Tài chính", icon: "wallet", color: "emerald", section: "kinh-doanh", perm: "tai-chinh",
    children: [
      { label: "Sổ thu chi", href: `${Q}/thu-chi` },
      { label: "Công nợ học viên", href: `${Q}/thu-chi/cong-no` },
      { label: "Chia tiền tháng" },
      { label: "Chi trả" },
      { label: "Trợ giảng" },
      { label: "Các quỹ" },
      { label: "Báo cáo lãi / lỗ" },
    ],
  },
  {
    key: "thong-ke", label: "Thống kê", icon: "chart", color: "amber", section: "kinh-doanh", perm: "thong-ke",
    children: [
      { label: "Doanh thu", href: `${Q}/thong-ke` },
      { label: "Tuyển sinh" },
      { label: "Học viên" },
      { label: "Hiệu suất coach" },
    ],
  },
  {
    key: "doi-ngu", label: "Đội ngũ", icon: "team", color: "teal", section: "trung-tam", perm: "doi-ngu",
    children: [
      { label: "Coach" },
      { label: "Sale" },
      { label: "Trợ giảng" },
      { label: "Phân công lớp" },
      { label: "Bảng công" },
    ],
  },
  {
    key: "cai-dat", label: "Cài đặt", icon: "gear", color: "slate", section: "trung-tam", perm: "cai-dat",
    children: [
      { label: "Hồ sơ trung tâm", href: `${Q}/cai-dat/ho-so`, also: new RegExp(`^${Q}/cai-dat/?$`) },
      { label: "Quy định lớp", href: `${Q}/cai-dat/quy-dinh` },
      { label: "Tỉ lệ chia & cổ đông" },
      { label: "Thanh toán", href: `${Q}/cai-dat/nhan-tien` },
      { label: "Phân quyền", href: `${Q}/cai-dat/thanh-vien` },
      { label: "Sân dạy", href: `${Q}/cai-dat/san` },
      { label: "Mẫu tin nhắn", href: `${Q}/cai-dat/mau-tin` },
      { label: "Thông báo", href: `${Q}/cai-dat/thong-bao` },
      { label: "Tên miền riêng", href: `${Q}/cai-dat/ten-mien` },
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
    .filter((g) => can(g.perm))
    .map((g) => ({ ...g, children: g.children.filter((c) => !c.perm || can(c.perm)) }))
    .filter((g) => g.children.some((c) => c.href));
}

/** Trang mặc định của nhóm: mục con đầu tiên có trang. */
export const groupHref = (g: MenuGroup) => g.children.find((c) => c.href)?.href ?? Q;
