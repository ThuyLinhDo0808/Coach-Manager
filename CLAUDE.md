# Coach Trung Muối — quy ước dự án

@AGENTS.md

Web riêng của Coach Trung Muối: trang công khai cho học viên và khu quản lý nhu cầu học cho coach/sale.
**Sản phẩm độc lập**: không dùng chung code, backend hay dữ liệu với NexusZone (repo `pickleball-manager`).

## Công nghệ
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4. Không bật `cacheComponents`; trang công khai dùng `export const revalidate`.
- Supabase (project riêng, tổ chức "ThuyLinhDo0808's Org"). Lược đồ trong `supabase/migrations/`.
- Deploy: Vercel. CI: GitHub Actions chỉ chạy khi push/PR (lint, typecheck, test, build) — **không thêm workflow chạy theo lịch**.

## Dữ liệu
- Mọi bảng có `coach_id` để sau này nhiều coach dùng chung. Quyền do RLS quyết định:
  khách chỉ đọc nội dung công khai và gửi nhu cầu qua hàm `submit_lead`; thành viên (`coach_members`, vai trò owner/sale) đọc ghi dữ liệu coach của mình.
- Web chỉ dùng URL + khoá công khai (publishable key). Không đưa service role key vào code hay Vercel.
- Chưa cấu hình Supabase thì web tự dùng nội dung mẫu trong `src/lib/sample-data.ts`.

## Giao diện
- Tiếng Việt cho mọi chữ trên giao diện và câu trả lời.
- Giao diện sáng: nền xám `#f5f5f7`, thẻ trắng bo lớn (`card`), băng navy đầu trang, nút chính xanh chanh `#B6F03B` (`btn-primary`). Token màu trong `src/app/globals.css`.
- Phải đẹp ở 1440px và 390px. Điện thoại: hồ sơ thu gọn trên đầu, tab cuộn ngang, nút "Đăng ký học thử" dính đáy.
- Tên hiển thị là "Coach Trung Muối" (hình trong đặc tả dùng tên giả).

## Quy trình
- Từ sau lần đẩy khung đầu tiên: làm trên nhánh riêng + PR vào `main`.
- Trước khi đẩy: `npm run lint && npm run typecheck && npm test && npm run build`.
