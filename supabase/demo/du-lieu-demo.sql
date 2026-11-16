-- DỮ LIỆU DEMO cho khu quản lý: học viên, lớp, buổi học, điểm danh, nhận xét, nhu cầu, offer, thu chi.
-- Tên người, số điện thoại, số tiền đều là GIẢ. Mọi dòng demo có id bắt đầu bằng "dddddddd"
-- để xoá sạch bằng supabase/demo/xoa-du-lieu-demo.sql. Ngày tháng tính theo hôm nay nên lúc nào chạy cũng hợp lý.
-- Chạy sau goi-hoc-l2t.sql. Chạy lại: xoá demo trước rồi chạy lại file này.

create or replace function pg_temp.did(k text) returns uuid language sql immutable as
$$ select ('dddddddd' || substr(md5(k), 1, 24))::uuid $$;

do $$
declare
  c uuid := (select id from public.coaches where slug = 'trung-muoi');
  owner uuid := (select user_id from public.coach_members where coach_id = (select id from public.coaches where slug = 'trung-muoi') and role = 'owner' limit 1);
  d0 date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_a uuid := (select id from public.venues where coach_id = (select id from public.coaches where slug = 'trung-muoi') order by sort limit 1);
  v_b uuid := (select id from public.venues where coach_id = (select id from public.coaches where slug = 'trung-muoi') order by sort offset 1 limit 1);
  r record;
  i int;
begin
  if c is null then raise exception 'Chưa có coach trung-muoi'; end if;
  if exists (select 1 from public.students where id::text like 'dddddddd%') then
    raise exception 'Đã có dữ liệu demo. Chạy xoa-du-lieu-demo.sql trước nếu muốn tạo lại.';
  end if;

  -- ------------------------------------------------------------ học viên
  insert into public.students (id, coach_id, full_name, phone, gender, birth_date, birth_year, status, dupr_start, dupr_current, created_at)
  select pg_temp.did('st' || n), c, name, phone, g, bd, extract(year from bd)::int, st, ds, dc, now() - (ago || ' days')::interval
  from (values
    (1, 'Nguyễn Minh Tuấn', '0900000001', 'nam', d0 - interval '34 years' + interval '3 days', 'dang-hoc', 2.8, 3.1, 20),
    (2, 'Trần Thu Hà', '0900000002', 'nu', make_date(1996, 5, 12), 'dang-hoc', 2.5, 2.9, 18),
    (3, 'Lê Thảo Vy', '0900000003', 'nu', make_date(1998, 8, 2), 'dang-hoc', 2.6, 2.9, 18),
    (4, 'Phạm Quốc Huy', '0900000004', 'nam', make_date(1990, 1, 20), 'dang-hoc', null, null, 6),
    (5, 'Đỗ Khánh Linh', '0900000005', 'nu', d0 - interval '29 years' + interval '6 days', 'dang-hoc', null, null, 6),
    (6, 'Vũ Đức Anh', '0900000006', 'nam', make_date(1987, 11, 30), 'da-hoc', 2.7, 3.3, 70),
    (7, 'Hoàng Mai Phương', '0900000007', 'nu', make_date(1993, 3, 8), 'da-hoc', 2.4, 3.0, 70),
    (8, 'Bùi Gia Hưng', '0900000008', 'nam', make_date(1985, 7, 15), 'dang-hoc', 2.9, 3.4, 70),
    (9, 'Ngô Thanh Tâm', '0900000009', 'nu', make_date(2000, 2, 25), 'da-nghi', null, null, 50)
  ) as t(n, name, phone, g, bd, st, ds, dc, ago);

  -- ------------------------------------------------------------ lớp
  insert into public.classes (id, coach_id, course_id, title, kind, venue_id, schedule_text, start_date, max_students, price, is_recruiting, status, created_at)
  values
    (pg_temp.did('cl1'), c, '00000000-0000-0000-0000-0000000000c1', 'Kèm 1-1 · Minh Tuấn', 'kem-1-1', v_a, 'T2, T4 06:00–08:00', d0 - 18, 1, 6000000, false, 'dang-dien-ra', now() - interval '20 days'),
    (pg_temp.did('cl2'), c, '00000000-0000-0000-0000-0000000000c2', 'Nhóm 1:2 · Hà & Vy', 'lop', v_b, 'T3, T6 18:00–20:00', d0 - 17, 2, 7000000, false, 'dang-dien-ra', now() - interval '18 days'),
    (pg_temp.did('cl3'), c, '00000000-0000-0000-0000-0000000000c4', 'Nhóm 1:4 · tối T3, T5', 'lop', v_a, 'T3, T5 19:00–21:00', d0 + 1, 4, 10000000, true, 'sap-dien-ra', now() - interval '7 days'),
    (pg_temp.did('cl4'), c, '00000000-0000-0000-0000-0000000000c3', 'Nhóm 1:3 · tháng trước', 'lop', v_a, 'T7, CN 07:00–09:00', d0 - 70, 3, 8000000, false, 'da-ket-thuc', now() - interval '72 days');

  -- Học phí trong đăng ký là phần của từng học viên (học phí lớp chia đều).
  insert into public.enrollments (id, coach_id, class_id, student_id, status, sessions_total, price, final_dupr, final_note, graduated_at, created_at)
  values
    (pg_temp.did('en1'), c, pg_temp.did('cl1'), pg_temp.did('st1'), 'dang-hoc', 10, 6000000, null, null, null, now() - interval '20 days'),
    (pg_temp.did('en2'), c, pg_temp.did('cl2'), pg_temp.did('st2'), 'dang-hoc', 10, 3500000, null, null, null, now() - interval '18 days'),
    (pg_temp.did('en3'), c, pg_temp.did('cl2'), pg_temp.did('st3'), 'dang-hoc', 10, 3500000, null, null, null, now() - interval '18 days'),
    (pg_temp.did('en4'), c, pg_temp.did('cl3'), pg_temp.did('st4'), 'dang-hoc', 10, 2500000, null, null, null, now() - interval '6 days'),
    (pg_temp.did('en5'), c, pg_temp.did('cl3'), pg_temp.did('st5'), 'dang-hoc', 10, 2500000, null, null, null, now() - interval '6 days'),
    (pg_temp.did('en6'), c, pg_temp.did('cl4'), pg_temp.did('st6'), 'tot-nghiep', 10, 2670000, 3.3, 'Footwork tiến bộ rõ, third shot drop ổn định.', now() - interval '40 days', now() - interval '70 days'),
    (pg_temp.did('en7'), c, pg_temp.did('cl4'), pg_temp.did('st7'), 'tot-nghiep', 10, 2670000, 3.0, 'Dink chắc tay, cần luyện thêm volley.', now() - interval '40 days', now() - interval '70 days'),
    (pg_temp.did('en8'), c, pg_temp.did('cl4'), pg_temp.did('st8'), 'tot-nghiep', 10, 2660000, 3.4, 'Lên lưới tốt, nên học tiếp nâng cao.', now() - interval '40 days', now() - interval '70 days');

  -- ------------------------------------------------------------ buổi học (10 buổi mỗi lớp, theo thứ trong tuần)
  for r in
    select * from (values
      ('cl1', d0 - 18, array[1, 3], time '06:00', v_a),
      ('cl2', d0 - 17, array[2, 5], time '18:00', v_b),
      ('cl3', d0 + 1, array[2, 4], time '19:00', v_a),
      ('cl4', d0 - 70, array[6, 7], time '07:00', v_a)
    ) as x(k, start_d, wd, t, venue)
  loop
    insert into public.class_sessions (id, coach_id, class_id, kind, seq, starts_at, ends_at, venue_id, topic, status, completed_at)
    select pg_temp.did(r.k || '-s' || seq), c, pg_temp.did(r.k), 'day', seq,
      (day + r.t) at time zone 'Asia/Ho_Chi_Minh', (day + r.t + interval '2 hours') at time zone 'Asia/Ho_Chi_Minh', r.venue,
      (select cur ->> 'content' from public.courses co, jsonb_array_elements(co.curriculum) with ordinality e(cur, o)
        where co.id = (select course_id from public.classes where id = pg_temp.did(r.k)) and o = seq),
      case when day < d0 then 'da-day' else 'du-kien' end,
      case when day < d0 then (day + r.t + interval '2 hours') at time zone 'Asia/Ho_Chi_Minh' end
    from (
      select day::date as day, row_number() over (order by day) as seq
      from generate_series(r.start_d, r.start_d + 60, interval '1 day') as day
      where extract(isodow from day)::int = any (r.wd)
    ) s
    where seq <= 10;
  end loop;

  -- Buổi gần nhất của lớp 1:2 đã qua nhưng chưa điểm danh (để thấy ở "Cần làm").
  update public.class_sessions set status = 'du-kien', completed_at = null
  where id = (select id from public.class_sessions where class_id = pg_temp.did('cl2') and starts_at < now() order by starts_at desc limit 1);

  -- ------------------------------------------------------------ điểm danh + nhận xét cho buổi đã dạy
  insert into public.attendance (session_id, student_id, coach_id, status, marked_by)
  select s.id, e.student_id, c,
    case when (abs(hashtext(s.id::text || e.student_id::text)) % 10) = 0 then 'bao-nghi'
         when (abs(hashtext(s.id::text || e.student_id::text)) % 10) = 1 then 'vang' else 'co-mat' end,
    owner
  from public.class_sessions s join public.enrollments e on e.class_id = s.class_id
  where s.id::text like 'dddddddd%' and s.status = 'da-day';

  insert into public.session_feedback (session_id, student_id, coach_id, scores, comment, shared, author_id)
  select a.session_id, a.student_id, c,
    jsonb_build_object(
      'giao_bong', least(5, 2 + s.seq / 4 + (abs(hashtext(a.student_id::text)) % 2)),
      'dink', least(5, 2 + s.seq / 3),
      'volley', least(5, 1 + s.seq / 3),
      'footwork', least(5, 2 + s.seq / 4)),
    (array['Tiến bộ rõ, giữ vợt cao hơn ở lưới.', 'Dink chắc hơn buổi trước. Cần luyện thêm trái tay.',
           'Bước chân còn chậm khi lên lưới, về nhà tập split step 10 phút.', 'Giao bóng ổn định, sâu hơn.'])[1 + abs(hashtext(a.session_id::text || a.student_id::text)) % 4],
    true, owner
  from public.attendance a join public.class_sessions s on s.id = a.session_id
  where a.session_id::text like 'dddddddd%' and a.status = 'co-mat';

  -- ------------------------------------------------------------ giờ rảnh hằng tuần
  insert into public.free_slots (id, coach_id, weekday, start_time, end_time, venue_id, is_public)
  values
    (pg_temp.did('fs1'), c, 1, '18:00', '21:00', v_a, true),
    (pg_temp.did('fs2'), c, 3, '18:00', '20:00', v_b, true),
    (pg_temp.did('fs3'), c, 6, '15:00', '18:00', v_a, true),
    (pg_temp.did('fs4'), c, 7, '15:00', '17:00', v_b, true);

  -- ------------------------------------------------------------ nhu cầu học
  insert into public.leads (id, coach_id, status, full_name, gender, birth_year, phone, for_whom, played_sports, sports,
    pickleball_duration, self_level, course_id, interests, goal, formats, styles, area, availability, budget, source,
    origin, assigned_to, lost_reason, contacted_at, remind_on, created_at)
  values
    (pg_temp.did('ld1'), c, 'moi', 'Lê Quốc Bảo', 'nam', 1992, '0900000101', 'ban-than', true, array['Tennis'], 'Dưới 3 tháng', 'Mới cầm vợt',
      '00000000-0000-0000-0000-0000000000c1', array['Lớp 1:1'], 'Chơi được trận đôi với bạn bè', array['Kèm 1-1'], array['Nghiêm khắc'], 'Cầu Giấy',
      '{"t3":["toi"],"t5":["toi"]}', '4–8 triệu', 'Facebook', 'form', null, null, null, null, now() - interval '30 hours'),
    (pg_temp.did('ld2'), c, 'moi', 'Phạm Ngọc Mai', 'nu', 1997, '0900000102', 'nhom', true, array['Cầu lông'], 'Chưa chơi', 'Mới cầm vợt',
      '00000000-0000-0000-0000-0000000000c3', array['Lớp 1:3'], 'Học cùng 2 bạn đồng nghiệp', array['Nhóm nhỏ 2–4 người'], array['Vui vẻ, thoải mái'], 'Đống Đa',
      '{"t7":["sang"],"cn":["sang"]}', '2–4 triệu', 'TikTok', 'form', null, null, null, null, now() - interval '5 hours'),
    (pg_temp.did('ld3'), c, 'da-lien-he', 'Võ Thành Đạt', 'nam', 1985, '0900000103', 'ban-than', true, array['Tennis', 'Chạy bộ'], '3–12 tháng', 'Chơi được',
      '00000000-0000-0000-0000-0000000000c1', array['Lớp 1:1'], 'Sửa giao bóng, lên DUPR 3.5', array['Kèm 1-1'], array['Nghiêm khắc'], 'Tây Hồ',
      '{"t2":["sang"],"t4":["sang"]}', 'Trên 8 triệu', 'Bạn giới thiệu', 'form', owner, null, now() - interval '2 days', d0 + 1, now() - interval '3 days'),
    (pg_temp.did('ld4'), c, 'hen-hoc-thu', 'Trịnh Minh Khoa', 'nam', 1995, '0900000104', 'ban-than', false, '{}', 'Chưa chơi', 'Mới cầm vợt',
      '00000000-0000-0000-0000-0000000000c4', array['Lớp 1:4'], 'Vận động sau giờ làm', array['Nhóm nhỏ 2–4 người'], '{}', 'Cầu Giấy',
      '{"t3":["toi"],"t5":["toi"]}', '2–4 triệu', 'Facebook', 'form', owner, null, now() - interval '1 day', null, now() - interval '2 days'),
    (pg_temp.did('ld5'), c, 'cho-dong-tien', 'Hồ Bảo Ngọc', 'nu', 1999, '0900000105', 'ban-than', true, array['Bóng bàn'], 'Dưới 3 tháng', 'Chơi được',
      '00000000-0000-0000-0000-0000000000c4', array['Lớp 1:4'], 'Chơi chắc hơn ở lưới', array['Nhóm nhỏ 2–4 người'], '{}', 'Cầu Giấy',
      '{"t3":["toi"],"t5":["toi"]}', '2–4 triệu', 'TikTok', 'form', owner, null, now() - interval '3 days', null, now() - interval '4 days'),
    (pg_temp.did('ld6'), c, 'da-chot', 'Nguyễn Minh Tuấn', 'nam', 1992, '0900000001', 'ban-than', true, array['Tennis'], '3–12 tháng', 'Chơi được',
      '00000000-0000-0000-0000-0000000000c1', array['Lớp 1:1'], 'Lên DUPR 3.5', array['Kèm 1-1'], '{}', 'Ba Đình',
      '{"t2":["sang"],"t4":["sang"]}', '4–8 triệu', 'Facebook', 'form', owner, null, now() - interval '21 days', null, now() - interval '22 days'),
    (pg_temp.did('ld7'), c, 'khong-thanh', 'Đặng Hữu Phúc', 'nam', 1988, '0900000107', 'ban-than', true, array['Cầu lông'], 'Chưa chơi', 'Mới cầm vợt',
      '00000000-0000-0000-0000-0000000000c1', array['Lớp 1:1'], null, array['Kèm 1-1'], '{}', 'Long Biên',
      '{"cn":["chieu"]}', 'Dưới 2 triệu', 'Facebook', 'form', owner, 'Giá', now() - interval '9 days', null, now() - interval '10 days'),
    (pg_temp.did('ld8'), c, 'danh-sach-cho', 'Lý Thu Trang', 'nu', 2001, '0900000108', 'nhom', false, '{}', 'Chưa chơi', 'Mới cầm vợt',
      '00000000-0000-0000-0000-0000000000c2', array['Lớp 1:2'], 'Học cùng em gái', array['Nhóm nhỏ 2–4 người'], '{}', 'Hai Bà Trưng',
      '{"t7":["chieu"]}', '2–4 triệu', 'Bạn giới thiệu', 'zalo', owner, null, now() - interval '5 days', d0 + 7, now() - interval '6 days');

  update public.students set lead_id = pg_temp.did('ld6') where id = pg_temp.did('st1');

  insert into public.lead_notes (id, coach_id, lead_id, author_id, body, kind, created_at)
  values
    (pg_temp.did('n1'), c, pg_temp.did('ld3'), owner, 'Gọi lần 1, hẹn gọi lại sau khi xem lịch.', 'goi', now() - interval '2 days'),
    (pg_temp.did('n2'), c, pg_temp.did('ld4'), null, 'Gợi ý: Nhóm 1:4 · tối T3, T5, còn 2 chỗ', 'he-thong', now() - interval '2 days'),
    (pg_temp.did('n3'), c, pg_temp.did('ld4'), owner, 'Đã hẹn học thử, nhắn Zalo địa chỉ sân.', 'hen', now() - interval '1 day'),
    (pg_temp.did('n4'), c, pg_temp.did('ld5'), owner, 'Gửi offer Lớp 1:4: 2.500.000 đ', 'trang-thai', now() - interval '1 day'),
    (pg_temp.did('n5'), c, pg_temp.did('ld5'), null, 'Học viên báo đã chuyển khoản 2500000 đ (CTM DEMO01). Chờ xác nhận tiền.', 'he-thong', now() - interval '3 hours'),
    (pg_temp.did('n6'), c, pg_temp.did('ld7'), owner, 'Chuyển sang "Không thành" · lý do: Giá', 'trang-thai', now() - interval '9 days');

  -- Buổi học thử của nhu cầu ld4 (ngày mai, 18:00).
  insert into public.class_sessions (id, coach_id, class_id, lead_id, kind, title, starts_at, ends_at, venue_id, status)
  values (pg_temp.did('trial1'), c, null, pg_temp.did('ld4'), 'hoc-thu', 'Trịnh Minh Khoa',
    ((d0 + 1) + time '18:00') at time zone 'Asia/Ho_Chi_Minh', ((d0 + 1) + time '19:00') at time zone 'Asia/Ho_Chi_Minh', v_a, 'du-kien');

  -- Offer đang chờ xác nhận tiền cho nhu cầu ld5.
  insert into public.offers (id, coach_id, lead_id, class_id, course_id, title, list_price, discount_pct, amount, pay_now, memo, expires_on, status, created_by, reported_at, created_at)
  values (pg_temp.did('of1'), c, pg_temp.did('ld5'), pg_temp.did('cl3'), '00000000-0000-0000-0000-0000000000c4', 'Nhóm 1:4 · tối T3, T5',
    2500000, 0, 2500000, 2500000, 'CTM DEMO01', d0 + 2, 'da-bao', owner, now() - interval '3 hours', now() - interval '1 day');

  -- ------------------------------------------------------------ thu chi
  -- Thu: học phí của từng đăng ký, ghi vào ngày bắt đầu học (lớp 1:2 mới đóng một nửa → còn nợ).
  insert into public.ledger (id, coach_id, entry_date, kind, category, amount, description, student_id, class_id, recorded_by)
  select pg_temp.did('lg-' || e.id), c, (e.created_at at time zone 'Asia/Ho_Chi_Minh')::date, 'thu', 'tien-goi',
    case when e.id = pg_temp.did('en3') then e.price / 2 else e.price end,
    left(cl.title || ' · ' || st.full_name, 200), e.student_id, e.class_id, owner
  from public.enrollments e join public.classes cl on cl.id = e.class_id join public.students st on st.id = e.student_id
  where e.id::text like 'dddddddd%' and e.status <> 'nghi';

  -- Chi: thuê sân cho mỗi buổi đã dạy (200.000 đ/giờ × 2 giờ).
  insert into public.ledger (id, coach_id, entry_date, kind, category, amount, description, class_id, recorded_by)
  select pg_temp.did('rent-' || s.id), c, (s.starts_at at time zone 'Asia/Ho_Chi_Minh')::date, 'chi', 'thue-san', 400000,
    left('Thuê sân · ' || cl.title || ' · buổi ' || s.seq, 200), s.class_id, owner
  from public.class_sessions s join public.classes cl on cl.id = s.class_id
  where s.id::text like 'dddddddd%' and s.status = 'da-day';

  insert into public.ledger (id, coach_id, entry_date, kind, category, amount, description, recorded_by)
  values
    (pg_temp.did('lg-ball'), c, d0 - 12, 'chi', 'dung-cu', 560000, 'Bóng tập · 2 hộp', owner),
    (pg_temp.did('lg-ball2'), c, d0 - 55, 'chi', 'dung-cu', 840000, 'Bóng tập · 3 hộp', owner),
    (pg_temp.did('lg-old1'), c, d0 - 100, 'thu', 'tien-goi', 6000000, 'Lớp 1:1 · học viên cũ', owner),
    (pg_temp.did('lg-old2'), c, d0 - 130, 'thu', 'tien-goi', 7000000, 'Lớp 1:2 · học viên cũ', owner),
    (pg_temp.did('lg-old3'), c, d0 - 130, 'chi', 'thue-san', 3200000, 'Thuê sân tháng trước', owner);
end $$;
