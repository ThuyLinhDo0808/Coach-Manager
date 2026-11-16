-- 4 gói học theo bảng giá L2T Academy (1:1, 1:2, 1:3, 1:4).
-- Thay 3 khoá mẫu cũ bằng 4 gói này. Chạy lại nhiều lần được (ghi đè nội dung 4 gói).
-- Cần chạy migration 20261121000000_course_kind_nhom.sql trước.

with coach as (select id from public.coaches where slug = 'trung-muoi'),
note as (
  select 'Đã bao gồm: bóng tập' as gom, 'Chưa bao gồm: thuê sân tập, nhặt bóng' as chua
),
cur as (
  select jsonb_agg(jsonb_build_object('title', 'Buổi ' || i, 'content', c) order by i) as j
  from unnest(array[
    'Cầm vợt, tư thế, luật cơ bản', 'Giao bóng và trả giao bóng', 'Dink thuận tay, luật vùng bếp',
    'Dink trái tay, di chuyển ở vạch bếp', 'Volley và punch volley', 'Third shot drop',
    'Third shot drive, reset bóng', 'Vị trí và phối hợp đánh đôi', 'Chiến thuật lên lưới',
    'Đấu tập, quay video tổng kết'
  ]) with ordinality as t(c, i)
)
insert into public.courses (
  id, coach_id, slug, title, kind, summary, audience, session_count, minutes_per_session, max_students,
  schedule_text, price_full, price_note, curriculum, commitments, outcomes, is_public, sort
)
select v.id::uuid, coach.id, v.slug, v.title, v.kind, v.summary, v.audience, 10, 120, v.n,
  'Theo lịch hẹn', v.price, v.per_hour || '/giờ · đã gồm bóng tập' || v.extra || ' · chưa gồm thuê sân, nhặt bóng',
  cur.j, array[note.gom || v.extra, note.chua], v.outcomes, true, v.n
from coach, note, cur, (values
  ('00000000-0000-0000-0000-0000000000c1', 'lop-1-1', 'Lớp 1:1', 'kem-1-1', 1, 6000000, '300.000đ', '',
   'Kèm riêng 1 coach 1 học viên, giáo án theo mục tiêu của bạn.', 'Mọi trình độ, muốn tiến bộ nhanh và sửa kỹ từng lỗi',
   array['Cá nhân hoá giáo án theo mục tiêu', 'Sửa chi tiết từng lỗi kỹ thuật', 'Theo sát tiến bộ từng buổi']),
  ('00000000-0000-0000-0000-0000000000c2', 'lop-1-2', 'Lớp 1:2', 'nhom', 2, 7000000, '350.000đ', '',
   'Nhóm 2 học viên, 1 coach. Giáo án theo trình độ của nhóm.', 'Nhóm 2 người cùng trình độ (bạn bè, gia đình, đồng nghiệp)',
   array['Giáo án phù hợp trình độ', 'Sửa lỗi thường gặp', 'Tăng thời gian thực hành']),
  ('00000000-0000-0000-0000-0000000000c3', 'lop-1-3', 'Lớp 1:3', 'nhom', 3, 8000000, '400.000đ', '',
   'Nhóm 3 học viên, 1 coach. Giáo án theo trình độ của nhóm.', 'Nhóm 3 người cùng trình độ (bạn bè, gia đình, đồng nghiệp)',
   array['Giáo án phù hợp dành cho học nhóm', 'Sửa lỗi trong quá trình tập', 'Tập luyện với các bài tập nhóm 3 người']),
  ('00000000-0000-0000-0000-0000000000c4', 'lop-1-4', 'Lớp 1:4', 'nhom', 4, 10000000, '500.000đ', ', trợ giảng',
   'Nhóm 4 học viên, 1 coach và trợ giảng. Giáo án theo trình độ của nhóm.', 'Nhóm 4 người cùng trình độ (bạn bè, gia đình, đồng nghiệp)',
   array['Giáo án phù hợp dành cho học nhóm', 'Sửa lỗi trong quá trình tập', 'Tập luyện với các bài tập nhóm 4 người'])
) as v(id, slug, title, kind, n, price, per_hour, extra, summary, audience, outcomes)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, kind = excluded.kind, summary = excluded.summary,
  audience = excluded.audience, goal = null, session_count = 10, minutes_per_session = 120,
  max_students = excluded.max_students, schedule_text = excluded.schedule_text, price_full = excluded.price_full,
  price_single = null, price_note = excluded.price_note, curriculum = excluded.curriculum,
  commitments = excluded.commitments, outcomes = excluded.outcomes, is_public = true, sort = excluded.sort;

-- Liên kết TikTok của coach (theo bảng giá).
update public.coaches
set contacts = jsonb_set(coalesce(contacts, '{}'), '{tiktok}', '"https://www.tiktok.com/@trungmuoipickleball"')
where slug = 'trung-muoi' and coalesce(contacts ->> 'tiktok', '') = '';

-- Lớp đang tuyển mẫu cũ ("Cơ bản K12") đổi sang gói Nhóm 1:4.
update public.classes
set course_id = '00000000-0000-0000-0000-0000000000c4', title = 'Nhóm 1:4 — sáng T7, CN',
    schedule_text = 'T7, CN 08:00–10:00', max_students = 4, price = 10000000
where id = '00000000-0000-0000-0000-0000000000d1' and title = 'Cơ bản K12 — tối T3, T5';
