# Coach Trung Muối

Web của Coach Trung Muối: giới thiệu, khoá học, kho video, lịch & sân, form nhu cầu học và trang quản lý nhu cầu.

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # điền URL + publishable key của Supabase; để trống thì dùng nội dung mẫu
npm run dev
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy thử ở http://localhost:3000 |
| `npm run lint` / `npm run typecheck` / `npm test` | Kiểm tra |
| `npm run build` | Build bản production |

## Database

Migration nằm trong `supabase/migrations/`. Biến môi trường trên Vercel: xem `.env.example`.

Quy ước dự án: [CLAUDE.md](CLAUDE.md).

### Chạy migration bằng tay (SQL Editor của Supabase)

Chạy theo thứ tự, mỗi file một lần. Nếu Supabase hiện cảnh báo "destructive" hoặc "without RLS", chọn **Run and enable RLS**.

1. `supabase/migrations/20261116000000_init.sql` — bảng, RLS, hàm `submit_lead`
2. `supabase/migrations/20261116000100_grants.sql` — quyền cho API
3. `supabase/migrations/20261117000000_public_content_and_crm.sql` — bài viết, đánh giá, nhật ký nhu cầu
4. `supabase/migrations/20261118000000_settings_and_roles.sql` — cài đặt, vai trò trợ giảng
5. `supabase/migrations/20261118000100_classes_sessions_students.sql` — lớp, buổi học, học viên, điểm danh (xoá bảng `open_classes` sau khi chép sang `classes`)
6. `supabase/migrations/20261119000000_money_offers.sql` — sổ thu chi, offer, thanh toán
7. `supabase/migrations/20261120000000_settings_content.sql` — mời thành viên, mẫu tin nhắn, cột sân
8. `supabase/migrations/20261121000000_course_kind_nhom.sql` — thêm loại khoá "Nhóm nhỏ"
9. `supabase/seed.sql` — nội dung mẫu (chạy lại nhiều lần cũng không sao). Sinh lại bằng `npm run seed:gen`.

### Dữ liệu demo (tuỳ chọn)

- `supabase/demo/goi-hoc-l2t.sql` — 4 gói học theo bảng giá L2T Academy (1:1, 1:2, 1:3, 1:4), thay 3 khoá mẫu cũ. Đây là dữ liệu thật của coach, nên giữ lại.
- `supabase/demo/du-lieu-demo.sql` — dữ liệu GIẢ cho khu quản lý: 9 học viên, 4 lớp, ~40 buổi học (có điểm danh, nhận xét), 8 nhu cầu ở mọi trạng thái, 1 offer chờ xác nhận, sổ thu chi vài tháng. Ngày tháng tính theo hôm nay.
- `supabase/demo/xoa-du-lieu-demo.sql` — xoá sạch dữ liệu demo (mọi dòng có id bắt đầu bằng `dddddddd`), không đụng dữ liệu thật. Chạy trước khi dùng thật.

### Cấu hình Supabase Auth

- **Authentication → Sign In / Providers → Email**: giữ bật **Confirm email**. Lời mời vào đội chỉ được nhận khi email đã xác nhận.
- **Authentication → URL Configuration → Site URL**: đặt bằng địa chỉ web thật (ví dụ `https://coach-trung-muoi.vercel.app`) và thêm `https://coach-trung-muoi.vercel.app/**` vào Redirect URLs, để link trong thư xác nhận mở đúng trang.

### Tạo tài khoản đăng nhập khu quản lý

1. Supabase → Authentication → Users → Add user → Create new user: nhập email, mật khẩu, bật Auto Confirm User.
2. SQL Editor, thay email rồi chạy (đổi `'owner'` thành `'sale'` cho tài khoản sale):

```sql
insert into public.coach_members (coach_id, user_id, role, display_name)
select c.id, u.id, 'owner', 'Coach Trung Muối'
from public.coaches c, auth.users u
where c.slug = 'trung-muoi' and u.email = 'EMAIL_CUA_BAN';
```

Đăng nhập tại `/dang-nhap`. Từ tài khoản thứ hai trở đi, coach mời ở **Cài đặt › Thành viên & quyền** rồi gửi link `/tham-gia` cho người được mời.

## Lộ trình

Giao diện bám bộ mẫu 20 màn (đặc tả mục 4 và 5).

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Trang công khai (Giới thiệu, Khoá học, Video, Lịch & sân, Bài viết, Đánh giá), form nhu cầu 3 bước, đăng nhập, Tổng quan, Nhu cầu & chốt khoá | Xong |
| 2 | Khoá học & lớp, Lịch dạy, buổi học (điểm danh, nhận xét), Học viên | Xong |
| 3 | Thu chi, offer + VietQR, Thống kê | Xong |
| 4 | Cài đặt (9 mục), quản lý Nội dung, mời thành viên | Xong |

### Chưa làm (cần thêm dịch vụ hoặc tài khoản học viên)

- Gửi email / Zalo tự động (nhắc lịch, chúc sinh nhật, báo nhu cầu mới): Cài đặt › Thông báo và Mẫu tin nhắn mới lưu lựa chọn; mẫu tin có nút sao chép để dán sang Zalo.
- Học viên đăng nhập xem lịch, nhận xét, video riêng; quét QR điểm danh.
- Đối soát chuyển khoản tự động với ngân hàng; tên miền riêng (làm tay trong Vercel theo hướng dẫn ở Cài đặt).
- Quyền theo vai trò và chia nhu cầu xoay vòng mới được ghi nhận, chưa chặn / chia tự động.
