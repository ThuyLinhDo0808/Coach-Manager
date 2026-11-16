-- Dữ liệu khởi tạo (nội dung MẪU) cho Coach Trung Muối. Chạy được nhiều lần, không ghi đè dòng đã có.
-- File sinh tự động bởi scripts/gen-seed.mts — sửa src/lib/sample-data.ts rồi chạy npm run seed:gen.

insert into public.coaches (id, slug, display_name, tagline, bio, avatar_url, cover_url, birth_year, show_age, gender, area, dupr, stat_hours, stat_students, stat_courses, stat_rating, stat_years, teaching_style, strengths, experience, contacts, accepting_students) values
  ('00000000-0000-0000-0000-000000000001', 'trung-muoi', 'Coach Trung Muối', 'Dạy pickleball cho người mới và người muốn nâng trình', 'Nội dung mẫu: đoạn giới thiệu 300–800 chữ về Coach Trung Muối — bắt đầu chơi từ khi nào, vì sao đi dạy, đã dạy bao nhiêu học viên và điều Trung muốn mỗi học viên mang về sau khoá học.

Đoạn thứ hai nói về cách dạy: chia nhỏ từng động tác, quay video để học viên tự xem lại, và luôn có bài tập về nhà ngắn.', null, null, 1995, true, 'nam', 'Hà Nội', 4.5, 1200, 180, 45, null, 3, array['Sửa từng động tác qua video quay tại sân', 'Mỗi buổi một mục tiêu rõ ràng, có bài tập về nhà', 'Nhóm nhỏ tối đa 4 người để ai cũng được chạm bóng nhiều', 'Vui vẻ nhưng nghiêm túc với kỹ thuật nền']::text[], '[{"title":"Kỹ thuật nền","text":"Cầm vợt, tư thế, dink chắc tay từ buổi đầu"},{"title":"Sửa lỗi","text":"Nhìn ra lỗi và đưa bài tập sửa cụ thể"},{"title":"Footwork","text":"Di chuyển ở vạch bếp, split step đúng nhịp"},{"title":"Chiến thuật đôi","text":"Phối hợp, stacking, chọn cú theo tình huống"}]'::jsonb, '[{"year":"2026","title":"Mở lớp nhóm nhỏ tại Hà Nội","detail":"Nội dung mẫu"},{"year":"2025","title":"Chứng chỉ huấn luyện viên pickleball","detail":"Nội dung mẫu"},{"year":"2024","title":"Bắt đầu dạy kèm 1-1","detail":"Nội dung mẫu"}]'::jsonb, '{"zalo":"","facebook":"","tiktok":"","youtube":"","phone":"","show_phone":false}'::jsonb, true)
on conflict (id) do nothing;

insert into public.venues (id, name, address, district, image_url, maps_url, hours_text, coach_id, sort) values
  ('00000000-0000-0000-0000-0000000000a1', 'Sân mẫu A', 'Địa chỉ sân sẽ cập nhật', 'Cầu Giấy', null, null, 'T3, T5 18:00–21:00', '00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-0000000000a2', 'Sân mẫu B', 'Địa chỉ sân sẽ cập nhật', 'Đống Đa', null, null, 'T7, CN 7:00–10:00', '00000000-0000-0000-0000-000000000001', 1)
on conflict (id) do nothing;

insert into public.courses (id, slug, title, kind, cover_url, summary, audience, goal, session_count, minutes_per_session, max_students, schedule_text, venue_id, price_full, price_single, price_note, curriculum, commitments, outcomes, coach_id, sort, is_public) values
  ('00000000-0000-0000-0000-0000000000c1', 'co-ban-cho-nguoi-moi', 'Khoá Cơ bản cho người mới', 'co-ban', null, 'Từ chưa cầm vợt đến chơi được trận đôi và nắm luật.', 'Chưa từng cầm vợt hoặc DUPR dưới 3.0', 'Chơi được trận đôi, nắm luật, có kỹ thuật nền đúng', 8, 90, 4, 'T3, T5 18:00', '00000000-0000-0000-0000-0000000000a1', 2400000, 350000, 'Đăng ký nhóm 2 người giảm 10%', '[{"title":"Buổi 1","content":"Cầm vợt, tư thế chuẩn bị, luật cơ bản"},{"title":"Buổi 2","content":"Giao bóng và trả giao bóng"},{"title":"Buổi 3","content":"Dink thuận tay, luật vùng bếp"},{"title":"Buổi 4","content":"Dink trái tay, di chuyển ở vạch bếp"},{"title":"Buổi 5","content":"Volley và punch volley"},{"title":"Buổi 6","content":"Third shot drop"},{"title":"Buổi 7","content":"Vị trí và phối hợp đánh đôi"},{"title":"Buổi 8","content":"Đấu tập, quay video tổng kết"}]'::jsonb, array['Học bù nếu báo nghỉ trước 12 giờ', 'Nội dung mẫu: chính sách hoàn phí']::text[], array['Chơi trọn một trận đôi đúng luật', 'Video tổng kết kỹ thuật cá nhân', 'DUPR dự kiến 3.0']::text[], '00000000-0000-0000-0000-000000000001', 0, true),
  ('00000000-0000-0000-0000-0000000000c2', 'sua-loi-ky-thuat', 'Khoá Sửa lỗi kỹ thuật', 'sua-loi', null, 'Quay video, chỉ ra lỗi và sửa từng cú trong 4 buổi.', 'Đã chơi 3 tháng trở lên, muốn chơi chắc hơn', 'Sửa 2–3 lỗi lớn nhất đang làm mất điểm', 4, 90, 3, 'Theo lịch hẹn', null, 1600000, null, null, '[{"title":"Buổi 1","content":"Quay video, đánh giá lỗi"},{"title":"Buổi 2","content":"Sửa lỗi số 1"},{"title":"Buổi 3","content":"Sửa lỗi số 2–3"},{"title":"Buổi 4","content":"Đấu tập, quay lại so sánh"}]'::jsonb, array['Học bù nếu báo nghỉ trước 12 giờ']::text[], array['Video trước và sau khoá']::text[], '00000000-0000-0000-0000-000000000001', 1, true),
  ('00000000-0000-0000-0000-0000000000c3', 'kem-1-1', 'Kèm 1-1 theo mục tiêu', 'kem-1-1', null, 'Lộ trình riêng theo mục tiêu của bạn, giờ linh hoạt.', 'Mọi trình độ', 'Theo mục tiêu riêng: lên DUPR, thi đấu, sửa cú', null, 60, 1, 'Theo lịch hẹn', null, null, 500000, 'Gói 10 buổi có giá riêng', '[]'::jsonb, array['Đổi lịch nếu báo trước 12 giờ']::text[], array['Lộ trình riêng và nhận xét sau mỗi buổi']::text[], '00000000-0000-0000-0000-000000000001', 2, true)
on conflict (id) do nothing;

insert into public.classes (id, course_id, title, schedule_text, venue_id, start_date, coach_id, max_students, is_recruiting) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c1', 'Cơ bản K12 — tối T3, T5', 'T3, T5 18:00–19:30', '00000000-0000-0000-0000-0000000000a1', '2026-12-01', '00000000-0000-0000-0000-000000000001', 4, true)
on conflict (id) do nothing;

insert into public.video_groups (id, slug, name, coach_id, sort) values
  ('00000000-0000-0000-0000-0000000000e1', 'nhap-mon', 'Nhập môn', '00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-0000000000e2', 'ky-thuat-nen', 'Kỹ thuật nền', '00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-0000000000e3', 'chien-thuat-doi', 'Chiến thuật đôi', '00000000-0000-0000-0000-000000000001', 2),
  ('00000000-0000-0000-0000-0000000000e4', 'kien-thuc-chung', 'Kiến thức chung', '00000000-0000-0000-0000-000000000001', 3)
on conflict (id) do nothing;

insert into public.videos (id, group_id, title, youtube_id, description, level, published_on, duration_text, course_id, coach_id, sort) values
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-0000000000e1', 'Cách cầm vợt', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 0),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000e1', 'Tư thế chuẩn bị', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000e1', 'Luật vùng bếp (kitchen)', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 2),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-0000000000e1', 'Cách tính điểm đánh đôi', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 3),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-0000000000e1', 'Giao bóng đúng luật', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 4),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-0000000000e1', 'Trả giao bóng sâu', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 5),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-0000000000e1', 'Luật nảy hai lần', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 6),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-0000000000e1', 'Bước đệm (split step) và di chuyển cơ bản', null, null, 'Người mới', null, null, null, '00000000-0000-0000-0000-000000000001', 7),
  ('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-0000000000e2', 'Dink thuận tay', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 8),
  ('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-0000000000e2', 'Dink trái tay', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 9),
  ('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-0000000000e2', 'Third shot drop', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 10),
  ('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-0000000000e2', 'Third shot drive', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 11),
  ('00000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-0000000000e2', 'Volley và punch volley', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 12),
  ('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-0000000000e2', 'Reset bóng khi bị ép', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 13),
  ('00000000-0000-0000-0000-000000000126', '00000000-0000-0000-0000-0000000000e2', 'Lob và cách xử lý lob', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 14),
  ('00000000-0000-0000-0000-000000000127', '00000000-0000-0000-0000-0000000000e2', 'Đập bóng trên cao (overhead)', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 15),
  ('00000000-0000-0000-0000-000000000128', '00000000-0000-0000-0000-0000000000e2', 'Di chuyển ở vạch bếp', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 16),
  ('00000000-0000-0000-0000-000000000129', '00000000-0000-0000-0000-0000000000e2', 'Speed-up và phản xạ tay nhanh', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 17),
  ('00000000-0000-0000-0000-000000000140', '00000000-0000-0000-0000-0000000000e3', 'Vị trí và phối hợp hai người', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 18),
  ('00000000-0000-0000-0000-000000000141', '00000000-0000-0000-0000-0000000000e3', 'Lên lưới sau khi giao/trả giao', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 19),
  ('00000000-0000-0000-0000-000000000142', '00000000-0000-0000-0000-0000000000e3', 'Đánh vào giữa hai đối thủ', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 20),
  ('00000000-0000-0000-0000-000000000143', '00000000-0000-0000-0000-0000000000e3', 'Stacking', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 21),
  ('00000000-0000-0000-0000-000000000144', '00000000-0000-0000-0000-0000000000e3', 'Erne', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 22),
  ('00000000-0000-0000-0000-000000000145', '00000000-0000-0000-0000-0000000000e3', 'ATP (đánh vòng ngoài cột lưới)', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 23),
  ('00000000-0000-0000-0000-000000000146', '00000000-0000-0000-0000-0000000000e3', 'Poaching (cắt bóng của đồng đội)', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 24),
  ('00000000-0000-0000-0000-000000000147', '00000000-0000-0000-0000-0000000000e3', 'Đánh đôi nam nữ', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 25),
  ('00000000-0000-0000-0000-000000000160', '00000000-0000-0000-0000-0000000000e4', '5 lỗi người mới hay mắc', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 26),
  ('00000000-0000-0000-0000-000000000161', '00000000-0000-0000-0000-0000000000e4', 'Chọn vợt và bóng cho người mới', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 27),
  ('00000000-0000-0000-0000-000000000162', '00000000-0000-0000-0000-0000000000e4', 'Khởi động và tránh chấn thương', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 28),
  ('00000000-0000-0000-0000-000000000163', '00000000-0000-0000-0000-0000000000e4', 'DUPR là gì, cách lên điểm', null, null, null, null, null, null, '00000000-0000-0000-0000-000000000001', 29)
on conflict (id) do nothing;

insert into public.posts (id, slug, title, excerpt, topic, cover_url, youtube_id, body, read_minutes, is_featured, published_at, course_id, coach_id, status) values
  ('00000000-0000-0000-0000-0000000000f1', 'luat-vung-bep-cho-nguoi-moi', 'Luật vùng bếp (kitchen) cho người mới', 'Khi nào được bước vào vùng bếp, volley thế nào là phạm luật. Bài mẫu, nội dung sẽ được cập nhật.', 'luat', null, null, '## Vùng bếp là gì?

Vùng bếp là khu vực 2,13 m tính từ lưới về mỗi bên sân. Đây là bài viết mẫu để xem bố cục trang.

## Ba điều cần nhớ

- Không volley khi đang đứng trong vùng bếp hoặc chạm vạch bếp.
- Được bước vào vùng bếp để đánh bóng đã nảy.
- Sau khi volley, đà người không được đưa bạn vào vùng bếp.

Nội dung chi tiết sẽ do Coach Trung Muối viết.', 4, true, '2026-11-16T03:00:00Z', '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'da-dang'),
  ('00000000-0000-0000-0000-0000000000f2', 'chon-vot-dau-tien', 'Chọn vợt đầu tiên cho người mới', 'Độ nặng, bề mặt, cán vợt: nên để ý gì khi mua cây vợt đầu tiên. Bài mẫu.', 'dung-cu', null, null, 'Bài viết mẫu để xem bố cục. Nội dung chi tiết sẽ do Coach Trung Muối viết.', 3, false, '2026-11-15T03:00:00Z', null, '00000000-0000-0000-0000-000000000001', 'da-dang')
on conflict (id) do nothing;
