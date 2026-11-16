# Coach Trung Muối — quy ước dự án

@AGENTS.md

Web riêng của Coach Trung Muối: trang công khai cho học viên và khu quản lý nhu cầu học cho coach/sale.
**Sản phẩm độc lập**: không dùng chung code, backend hay dữ liệu với NexusZone (repo `pickleball-manager`).

## Công nghệ
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4. Không bật `cacheComponents`; trang công khai dùng `export const revalidate`.
- Supabase (project riêng, tổ chức "ThuyLinhDo0808's Org"). Lược đồ trong `supabase/migrations/`.
- Deploy: Vercel. CI: GitHub Actions chỉ chạy khi push lên main hoặc có PR (lint, typecheck, test, build) — **không thêm workflow chạy theo lịch**.

## Dữ liệu
- Mọi bảng có `coach_id` để sau này nhiều coach dùng chung. Quyền do RLS quyết định:
  khách chỉ đọc nội dung công khai và gửi nhu cầu qua hàm `submit_lead`; thành viên (`coach_members`, vai trò owner/sale) đọc ghi dữ liệu coach của mình.
- Web chỉ dùng URL + khoá công khai (publishable key), đọc ở phía server trong `src/lib/env.ts` (nhận cả tên biến do tích hợp Vercel ↔ Supabase tự thêm). Code không bao giờ đọc service role / secret key.
- Chưa cấu hình Supabase thì web tự dùng nội dung mẫu trong `src/lib/sample-data.ts`.

## Giao diện
- Tiếng Việt cho mọi chữ trên giao diện và câu trả lời.
- Giao diện bám bộ mẫu 20 màn (16/11/2026): nền xám `#f5f5f7`, thẻ trắng bo 20px (`card`), băng navy, nút chính xanh chanh `#B6F03B` (`btn primary`). Các lớp dùng chung (`card`, `btn`, `pill`, `chip`, `seg`, `tile`, `input`, `phead`, `kpis`…) nằm trong `src/app/globals.css`; ưu tiên dùng lại, không tự chế kiểu mới.
- Điện thoại là dưới 768px: dùng `hide-m` / `only-m`. Lớp `display` của Tailwind thắng lớp trong `@layer components`, nên khi cần ẩn theo màn hình hãy dùng `hide-m` / `only-m`.
- Phải đẹp ở 1440px và 390px. Điện thoại: hồ sơ thu gọn trên đầu, tab cuộn ngang, nút "Đăng ký học thử" dính đáy.
- Tên hiển thị là "Coach Trung Muối" (hình trong đặc tả dùng tên giả).

## Quy trình
- Từ sau lần đẩy khung đầu tiên: làm trên nhánh riêng + PR vào `main`.
- Trước khi đẩy: `npm run lint && npm run typecheck && npm test && npm run build`.

## Cấu trúc
- `src/app/(public)/(tabs)/` — các tab trang công khai (dùng chung `PublicShell`); `src/app/(public)/dang-ky/` — form nhu cầu.
- `src/app/quan-ly/` — khu quản lý (cần đăng nhập; `src/proxy.ts` chặn sớm, RLS quyết định quyền). Mục chưa có route riêng rơi vào `[...muc]`. Server action dùng chung trong `src/app/quan-ly/_actions/`.
- Cài đặt / Nội dung chỉ dành cho owner (`requireOwner()` trong `src/lib/owner.ts`); Thu chi / Thống kê kiểm tra `session.role === "owner"`.
- Dữ liệu theo phiên: `src/lib/teaching-data.ts` (lớp, buổi, học viên), `src/lib/money-data.ts` (sổ, offer), `src/lib/settings-data.ts`. Giờ luôn theo giờ Việt Nam qua `src/lib/time.ts`.
- `src/lib/data.ts` đọc nội dung công khai; `src/lib/admin-data.ts` đọc theo phiên đăng nhập; `src/lib/lead-schema.ts` kiểm tra dữ liệu form.
- Lộ trình các đợt: xem README.
- Không chạy được Supabase cục bộ trong phiên cloud; kiểm tra SQL bằng Postgres có sẵn (giả lập schema `auth`), giao diện quản lý bằng trang tạm với dữ liệu giả (không commit).
