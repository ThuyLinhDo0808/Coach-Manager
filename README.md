# Coach Manager

Nền tảng web cho huấn luyện viên pickleball: mỗi coach có trang giới thiệu, khoá học, kho video, lịch & sân, form nhu cầu học và khu quản lý (học viên, lớp, buổi dạy, thu chi). Nhiều coach dùng chung một bản (mọi bảng có `coach_id`), mỗi coach một tên miền riêng. Coach đầu tiên: **Coach Trung Muối** (mã `trung-muoi`).

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
9. `supabase/migrations/20261122000000_stats_as_text.sql` — số liệu nổi bật của coach là chữ tự do
10. `supabase/migrations/20261123000000_roles_team.sql` — nhiều vai trò, người dạy / dạy thay, người chốt, quản lý xác nhận xếp lớp, quyền theo vai trò
11. `supabase/migrations/20261124000000_split_engine.sql` — bộ máy chia tiền: tỉ lệ & cổ đông, bút toán chia theo buổi × học viên (tự ghi khi điểm danh / hoàn tất buổi)
12. `supabase/migrations/20261125000000_month_close_funds.sql` — chốt tháng, bảng phải trả, nhật ký sửa, điều chỉnh tháng sau, các quỹ, trợ giảng, kho ảnh chứng từ riêng tư `chung-tu`
13. `supabase/migrations/20261126000000_reports.sql` — số tổng cho Báo cáo lãi / lỗ (quản lý, cổ đông xem được) và Hiệu suất coach
14. `supabase/migrations/20261127000000_venue_prices.sql` — bảng giá sân theo khung giờ (Thứ 2 – Thứ 6, Thứ 7 – Chủ nhật), chuyển giá thuê / giờ cũ sang
15. `supabase/migrations/20261128000000_profile_media.sql` — tải ảnh hồ sơ lên kho công khai `anh-cong-khai`; ảnh nền trang và bộ ảnh giới thiệu
16. `supabase/seed.sql` — nội dung mẫu (chạy lại nhiều lần cũng không sao). Sinh lại bằng `npm run seed:gen`.

### Dữ liệu demo (tuỳ chọn)

- `supabase/demo/goi-hoc-l2t.sql` — 4 gói học theo bảng giá L2T Academy (1:1, 1:2, 1:3, 1:4), thay 3 khoá mẫu cũ. Đây là dữ liệu thật của coach, nên giữ lại.
- `supabase/demo/du-lieu-demo.sql` — dữ liệu GIẢ cho khu quản lý: 9 học viên, 4 lớp, ~40 buổi học (có điểm danh, nhận xét), 8 nhu cầu ở mọi trạng thái, 1 offer chờ xác nhận, sổ thu chi vài tháng. Ngày tháng tính theo hôm nay.
- `supabase/demo/xoa-du-lieu-demo.sql` — xoá sạch dữ liệu demo (mọi dòng có id bắt đầu bằng `dddddddd`), không đụng dữ liệu thật. Chạy trước khi dùng thật.

### Cấu hình Supabase Auth

- **Authentication → Sign In / Providers → Email**: giữ bật **Confirm email**. Lời mời vào đội chỉ được nhận khi email đã xác nhận.
- **Authentication → URL Configuration → Site URL**: đặt bằng địa chỉ web thật (ví dụ `https://coach-manager.vercel.app`) và thêm `https://coach-manager.vercel.app/**` vào Redirect URLs (cùng tên miền riêng của từng coach nếu có), để link trong thư xác nhận mở đúng trang.

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

## Định hướng

1. **Giai đoạn 1 — hiện tại.** Xây thương hiệu Coach Trung Muối, đại diện của NexusZone Academy. Các coach khác là coach hợp tác (dạy thuê) trong đội của Trung. Web vừa là kênh tuyển sinh, vừa là bằng chứng hiệu quả (số liệu tuyển sinh, học tiếp, DUPR, doanh thu) để sau này giới thiệu dịch vụ cho coach khác.
2. **Giai đoạn 2 — khi lượng khoá học vượt sức Trung và đội trợ giảng.** Hợp tác và xây thương hiệu cho các coach khác: mỗi coach có trang công khai, đội và dữ liệu riêng. NexusZone tập trung vào dịch vụ thiết kế, xây thương hiệu cho coach; đào tạo và cộng đồng là mảng phụ.

Database đã sẵn cho giai đoạn 2 (mọi bảng có `coach_id`, RLS theo coach). Phần cần làm thêm khi tới lúc: đăng ký coach mới, trang công khai theo từng coach (địa chỉ hoặc tên miền), chọn đội khi một người thuộc nhiều đội, trang quản trị chung của NexusZone.

## Lộ trình

Giao diện bám bộ mẫu 20 màn (đặc tả mục 4 và 5).

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Trang công khai (Giới thiệu, Khoá học, Video, Lịch & sân, Bài viết, Đánh giá), form nhu cầu 3 bước, đăng nhập, Tổng quan, Nhu cầu & chốt khoá | Xong |
| 2 | Khoá học & lớp, Lịch dạy, buổi học (điểm danh, nhận xét), Học viên | Xong |
| 3 | Thu chi, offer + VietQR, Thống kê | Xong |
| 4 | Cài đặt, quản lý Nội dung, mời thành viên | Xong |
| 5 | Menu có mục con, Đội ngũ, nhiều vai trò, chia tiền theo buổi, chốt tháng, chi trả, các quỹ, trợ giảng, báo cáo lãi / lỗ | Xong |
| 6 | Bảng giá sân theo khung giờ, Thanh toán mới, hồ sơ có ảnh tải lên và giới thiệu có định dạng | Xong |
| — | Giai đoạn 2: nhiều coach (xem Định hướng) | Chưa làm |

### Chưa làm (cần thêm dịch vụ hoặc tài khoản học viên)

- Gửi email / Zalo tự động (nhắc lịch, chúc sinh nhật, báo nhu cầu mới): Cài đặt › Thông báo và Mẫu tin nhắn mới lưu lựa chọn; mẫu tin có nút sao chép để dán sang Zalo.
- Học viên đăng nhập xem lịch, nhận xét, video riêng; quét QR điểm danh.
- Đối soát chuyển khoản tự động với ngân hàng.
- Chia nhu cầu xoay vòng cho sale mới được ghi nhận, chưa chia tự động.

## Menu khu quản lý

Menu trái chia 3 nhóm: **Hằng ngày** (Tổng quan, Lịch, Học viên, Lớp & khoá học), **Kinh doanh** (Tuyển sinh, Tài chính, Thống kê), **Trung tâm** (Đội ngũ, Cài đặt). Bấm một mục để mở các mục con; trên điện thoại, mục con là dải tab ngang đầu trang. Khai báo menu ở `src/lib/menu.ts`; mục con chưa có trang hiện "Sắp có".

## Vai trò và quyền

Một người có thể có nhiều vai trò (Cài đặt › Phân quyền): **Team Leader**, **Quản lý đào tạo**, **Cổ đông**, **Coach**, **Sale**, **Trợ giảng**. Quyền của từng vai trò khai báo ở `src/lib/permissions.ts`; menu, từng trang và từng server action kiểm tra bằng `requirePerm()`, còn database chặn bằng RLS (`has_any_role`, `works_in_session`…). Trợ giảng không đọc trực tiếp bảng học viên / lớp; danh sách học viên của buổi lấy qua hàm `session_roster()` (không có số điện thoại, học phí, ghi chú).

Tuyển sinh: chỉ chuyển sang **Đã chốt** qua nút Chốt / xác nhận tiền offer, bắt buộc chọn **người chốt** (database cũng chặn). Người chốt được lưu theo từng đăng ký học viên × lớp. Sau khi chốt, nhu cầu nằm ở Cần xử lý của quản lý đào tạo cho tới khi bấm "Xác nhận đã xếp lớp".

## Chia tiền theo buổi

Mỗi buổi học (không phải học thử, không bị huỷ) có học viên bị trừ buổi theo Quy định lớp học sinh **bút toán** cho từng học viên: khoản đem chia = phí buổi (trả theo buổi) hoặc giá gói ÷ số buổi (làm tròn xuống). Khoản này chia theo tỉ lệ ở Cài đặt › Tỉ lệ chia & cổ đông (mặc định sale 10%, coach đứng lớp 50%, quỹ dự phòng 5%, quỹ vận hành 10%, quỹ phát triển 5%, cổ đông 20%). Mỗi phần làm tròn xuống, phần lẻ vào quỹ vận hành. Sale = người chốt của đăng ký; coach = người dạy thực tế của buổi (kể cả dạy thay).

Database tự ghi lại bút toán (`regen_session_split`) khi đổi điểm danh, trạng thái / người dạy / giờ của buổi, học phí / số buổi / người chốt của đăng ký, hoặc tỉ lệ — trừ khi tháng đó đã chốt (`split_months`). Bút toán không ai ghi tay qua API; Team Leader thấy hết, người khác chỉ thấy phần của mình. Kiểm tra trên Postgres thử: `psql -v ON_ERROR_STOP=1 -f supabase/tests/split_engine_test.sql`.

### Chốt tháng, chi trả, quỹ, trợ giảng

- **Chốt tháng** (Tài chính › Chia tiền tháng, chỉ Team Leader): tính lại cả tháng, khoá số (`split_months`) và lập bảng phải trả (`split_payouts`) — mỗi người một dòng gộp phần dạy, chốt, cổ đông, trợ giảng, điều chỉnh tháng trước; mỗi quỹ một dòng.
- **Chi trả**: đánh dấu đã trả kèm ảnh chuyển khoản. Sau khi chốt chỉ Team Leader sửa số, bắt buộc lý do, ghi `split_audit` (ai, lúc nào, số cũ, số mới). Khoản đã trả mà sửa thì chênh lệch thành điều chỉnh tháng sau (`split_adjustments`).
- **Các quỹ**: số dư = phần vào từ bút toán chia − khoản chi (`fund_expenses`, có loại, ngày, ghi chú, ảnh chứng từ). Quảng cáo chi từ quỹ dự phòng; tiền sân / bóng lớp đặc thù chi từ quỹ vận hành (database chặn sai quỹ).
- **Trợ giảng** (ngoài 6 phần): cơ chế theo lớp (tiền / buổi, tiền / tháng), học viên đã trả, đã chuyển cho trợ giảng + ảnh.
- Ảnh lưu ở kho riêng tư `chung-tu` của Supabase Storage, xem qua đường dẫn ký tạm 1 giờ.
- Kiểm tra: `psql -v ON_ERROR_STOP=1 -f supabase/tests/month_close_test.sql`.

### Báo cáo và thống kê

- **Báo cáo lãi / lỗ** (Team Leader, quản lý, cổ đông): theo buổi đã dạy — doanh thu đã dạy − coach − sale = phần trung tâm giữ; lãi / lỗ = cổ đông nhận + quỹ tăng thêm (vào − chi quỹ) + (học viên trả trợ giảng − phải trả trợ giảng). Số lấy qua hàm `split_summary` nên quản lý / cổ đông không thấy học phí từng học viên.
- **Thống kê** (Team Leader): Doanh thu, Tuyển sinh (phễu, nguồn, theo người chốt), Học viên (mới, chuyên cần, học tiếp, DUPR), Hiệu suất coach (buổi, dạy thay, lượt học viên, doanh thu, phần coach).
- **Thu nhập của tôi** (coach, sale, trợ giảng): phần dạy, phần chốt, trợ giảng của tháng (tạm tính tới khi chốt) và lịch sử chi trả. **Phần của tôi** (cổ đông): phần cổ đông theo tháng; cần gắn tài khoản cho cổ đông ở Cài đặt › Tỉ lệ chia & cổ đông.
- Tab "Lương & hoa hồng" cũ trong Sổ thu chi đã bỏ: hoa hồng theo % offer được thay bằng 10% theo buổi cho người chốt.
