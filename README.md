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

Chạy theo thứ tự, mỗi file một lần:

1. `supabase/migrations/20261116000000_init.sql` — bảng, RLS, hàm `submit_lead`
2. `supabase/migrations/20261116000100_grants.sql` — quyền cho API
3. `supabase/migrations/20261117000000_public_content_and_crm.sql` — bài viết, đánh giá, nhật ký nhu cầu
4. `supabase/seed.sql` — nội dung mẫu (chạy lại nhiều lần cũng không sao). Sinh lại bằng `npm run seed:gen`.

### Tạo tài khoản đăng nhập khu quản lý

1. Supabase → Authentication → Users → Add user → Create new user: nhập email, mật khẩu, bật Auto Confirm User.
2. SQL Editor, thay email rồi chạy (đổi `'owner'` thành `'sale'` cho tài khoản sale):

```sql
insert into public.coach_members (coach_id, user_id, role, display_name)
select c.id, u.id, 'owner', 'Coach Trung Muối'
from public.coaches c, auth.users u
where c.slug = 'trung-muoi' and u.email = 'EMAIL_CUA_BAN';
```

Đăng nhập tại `/dang-nhap`.

## Lộ trình

Giao diện bám bộ mẫu 20 màn (đặc tả mục 4 và 5).

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Trang công khai (Giới thiệu, Khoá học, Video, Lịch & sân, Bài viết, Đánh giá), form nhu cầu 3 bước, đăng nhập, Tổng quan, Nhu cầu & chốt khoá | Xong |
| 2 | Khoá học & lớp, Lịch dạy, buổi học (điểm danh, nhận xét), Học viên | Chưa làm |
| 3 | Thu chi, offer + VietQR, Thống kê | Chưa làm |
| 4 | Cài đặt (9 mục), quản lý Nội dung, thông báo | Chưa làm |
