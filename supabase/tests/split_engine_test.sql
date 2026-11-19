-- Kiểm tra bộ máy chia tiền với ví dụ đã chốt.
-- Chạy trên Postgres thử (không chạy trên dữ liệu thật): psql -v ON_ERROR_STOP=1 -f supabase/tests/split_engine_test.sql
-- Cần đã chạy các migration. Mọi thứ nằm trong một giao dịch và được huỷ ở cuối.
begin;

-- Coach thử + 2 người: owner (dạy chính, chốt 2 học viên), sale (chốt 2 học viên), coach phụ (dạy thay).
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'chu@test.local'),
  ('a0000000-0000-0000-0000-000000000002', 'sale@test.local'),
  ('a0000000-0000-0000-0000-000000000003', 'coach2@test.local');
insert into public.coaches (id, slug, display_name) values ('c0000000-0000-0000-0000-000000000001', 'thu-chia-tien', 'Thử chia tiền');
insert into public.coach_members (coach_id, user_id, role, roles, display_name) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner', '{chu,coach}', 'Trung'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'sale', '{sale}', 'Sale A'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'coach', '{coach}', 'Coach B');
-- Tỉ lệ mặc định (migration chỉ tạo cho coach đã có lúc chạy).
insert into public.split_rules (coach_id, effective_from, sale_bp, coach_bp, reserve_bp, ops_bp, dev_bp, shareholders)
values ('c0000000-0000-0000-0000-000000000001', '2026-01-01', 1000, 5000, 500, 1000, 500,
  '[{"user_id":"a0000000-0000-0000-0000-000000000001","name":"Trung","bp":1000},{"user_id":null,"name":"Linh","bp":1000}]');

insert into public.classes (id, coach_id, title, main_coach_id) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Lớp thử', 'a0000000-0000-0000-0000-000000000001');
insert into public.students (id, coach_id, full_name)
select ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 'c0000000-0000-0000-0000-000000000001', 'Học viên ' || i
from generate_series(1, 4) i;
-- Gói 10 buổi 3.000.000 → 300.000 / buổi / học viên. HV1, HV2 do Trung chốt; HV3, HV4 do Sale A chốt.
insert into public.enrollments (coach_id, class_id, student_id, sessions_total, price, closer_id)
select 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 10, 3000000,
  case when i <= 2 then 'a0000000-0000-0000-0000-000000000001' else 'a0000000-0000-0000-0000-000000000002' end::uuid
from generate_series(1, 4) i;

-- Một buổi đã qua trong tháng 10/2026.
insert into public.class_sessions (id, coach_id, class_id, kind, seq, starts_at, ends_at)
values ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'day', 1,
  '2026-10-05 18:00+07', '2026-10-05 19:30+07');

create temp view tong as
  select party_kind, coalesce(party_name, '') as party_name, sum(amount)::int as amount
  from public.split_entries where session_id = 'f0000000-0000-0000-0000-000000000001'
  group by 1, 2;

-- 1) Chưa điểm danh: chưa có bút toán.
do $$ begin
  assert (select count(*) from public.split_entries where session_id = 'f0000000-0000-0000-0000-000000000001') = 0, 'chưa điểm danh thì chưa chia';
end $$;

-- 2) Điểm danh 4 học viên có mặt → 1.200.000 chia đúng ví dụ.
insert into public.attendance (coach_id, session_id, student_id, status)
select 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 'co-mat'
from generate_series(1, 4) i;

do $$ begin
  assert (select sum(amount) from tong) = 1200000, 'tổng phải 1.200.000';
  assert (select amount from tong where party_kind = 'coach' and party_name = 'Trung') = 600000, 'coach 600.000';
  assert (select amount from tong where party_kind = 'quy-du-phong') = 60000, 'dự phòng 60.000';
  assert (select amount from tong where party_kind = 'quy-van-hanh') = 120000, 'vận hành 120.000';
  assert (select amount from tong where party_kind = 'quy-phat-trien') = 60000, 'phát triển 60.000';
  assert (select amount from tong where party_kind = 'co-dong' and party_name = 'Trung') = 120000, 'Trung 120.000';
  assert (select amount from tong where party_kind = 'co-dong' and party_name = 'Linh') = 120000, 'Linh 120.000';
  assert (select sum(amount) from tong where party_kind = 'sale') = 120000, 'sale 120.000';
  -- 30.000 / học viên cho người chốt: Trung 2 × 30.000, Sale A 2 × 30.000.
  assert (select amount from tong where party_kind = 'sale' and party_name = 'Trung') = 60000, 'sale Trung 60.000';
  assert (select amount from tong where party_kind = 'sale' and party_name = 'Sale A') = 60000, 'sale Sale A 60.000';
end $$;

-- 3) Sửa điểm danh: HV4 báo nghỉ (quy định mặc định không trừ buổi) → còn 3 × 300.000.
update public.attendance set status = 'bao-nghi'
where session_id = 'f0000000-0000-0000-0000-000000000001' and student_id = 'e0000000-0000-0000-0000-000000000004';
do $$ begin
  assert (select sum(amount) from tong) = 900000, 'báo nghỉ không tính';
  assert (select amount from tong where party_kind = 'sale' and party_name = 'Sale A') = 30000, 'sale A còn 1 học viên';
end $$;

-- Vắng không báo vẫn bị trừ buổi → vẫn chia.
update public.attendance set status = 'vang'
where session_id = 'f0000000-0000-0000-0000-000000000001' and student_id = 'e0000000-0000-0000-0000-000000000004';
do $$ begin
  assert (select sum(amount) from tong) = 1200000, 'vắng không báo vẫn tính';
end $$;

-- 4) Dạy thay: đổi người dạy buổi → phần coach chuyển sang Coach B.
update public.class_sessions set teacher_id = 'a0000000-0000-0000-0000-000000000003' where id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select amount from tong where party_kind = 'coach' and party_name = 'Coach B') = 600000, 'dạy thay nhận 600.000';
  assert not exists (select 1 from tong where party_kind = 'coach' and party_name = 'Trung'), 'người dạy chính không nhận buổi dạy thay';
end $$;

-- 5) Huỷ buổi → không chia; mở lại → chia lại.
update public.class_sessions set status = 'huy' where id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin assert (select count(*) from tong) = 0, 'buổi huỷ không chia'; end $$;
update public.class_sessions set status = 'da-day' where id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin assert (select sum(amount) from tong) = 1200000, 'mở lại thì chia lại'; end $$;

-- 6) Phần lẻ do làm tròn vào quỹ vận hành: gói 1.000.000 / 3 buổi → 333.333 / buổi.
update public.enrollments set price = 1000000, sessions_total = 3
where student_id = 'e0000000-0000-0000-0000-000000000001';
do $$
declare v int;
begin
  select sum(amount) into v from public.split_entries
  where session_id = 'f0000000-0000-0000-0000-000000000001' and student_id = 'e0000000-0000-0000-0000-000000000001';
  assert v = 333333, 'tổng bằng đúng khoản đem chia';
  assert (select amount from public.split_entries where session_id = 'f0000000-0000-0000-0000-000000000001'
    and student_id = 'e0000000-0000-0000-0000-000000000001' and party_kind = 'quy-van-hanh') = 33336, 'vận hành nhận phần lẻ (33.333 + 3)';
end $$;

-- 7) Tháng đã chốt: sửa điểm danh không đổi bút toán.
insert into public.split_months (coach_id, month) values ('c0000000-0000-0000-0000-000000000001', '2026-10');
update public.attendance set status = 'bao-nghi' where session_id = 'f0000000-0000-0000-0000-000000000001';
do $$ begin assert (select count(*) from tong) > 0 and (select sum(amount) from tong) = 333333 + 900000, 'tháng đã chốt giữ nguyên'; end $$;

-- 8) Tổng tỉ lệ phải đúng 100%.
do $$ begin
  begin
    insert into public.split_rules (coach_id, effective_from, sale_bp, coach_bp, reserve_bp, ops_bp, dev_bp)
    values ('c0000000-0000-0000-0000-000000000001', '2026-12-01', 1000, 5000, 500, 1000, 500);
    assert false, 'phải chặn tỉ lệ không đủ 100%';
  exception when raise_exception then null;
  end;
end $$;

\echo 'split_engine_test: tất cả đều đúng'
rollback;
