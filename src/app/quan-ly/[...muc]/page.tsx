import Link from "next/link";
import { PageHead } from "@/components/admin-shell";

// Đường dẫn không có trong khu quản lý (ví dụ link cũ đã đổi chỗ).
export default function KhongCoTrang() {
  return (
    <>
      <PageHead icon="info" color="slate" title="Không có trang này" sub="Có thể trang đã chuyển chỗ trong menu mới" />
      <div className="card">
        <p className="text-muted">Bạn chọn lại mục cần mở ở menu bên trái (trên điện thoại: nút Thêm ở thanh dưới).</p>
        <Link href="/quan-ly" className="btn navy mt-4">Về Tổng quan</Link>
      </div>
    </>
  );
}
