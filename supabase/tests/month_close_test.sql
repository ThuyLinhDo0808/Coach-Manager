-- Kiểm tra chốt tháng, chi trả, điều chỉnh tháng sau, các quỹ, trợ giảng.
-- Chạy trên Postgres thử: psql -v ON_ERROR_STOP=1 -f supabase/tests/month_close_test.sql (trong giao dịch, huỷ ở cuối).
begin;

insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-000000000001', 'chu@test.local'),
  ('a0000000-0000-0000-0000-000000000002', 'sale@test.local'),
  ('a0000000-0000-0000-0000-000000000004', 'tg@test.local'),
  ('a0000000-0000-0000-0000-000000000005', 'linh@test.local');
insert into public.coaches (id, slug, display_name) values ('c0000000-0000-0000-0000-000000000001', 'thu-chot-thang', 'Thử chốt tháng');
insert into public.coach_members (coach_id, user_id, role, roles, display_name) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'owner', '{chu,coach}', 'Trung'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'sale', '{sale}', 'Sale A'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'tro-giang', '{tro-giang}', 'TG Nam'),
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'quan-ly', '{quan-ly,co-dong}', 'Linh');
insert into public.split_rules (coach_id, effective_from, sale_bp, coach_bp, reserve_bp, ops_bp, dev_bp, shareholders)
values ('c0000000-0000-0000-0000-000000000001', '2026-01-01', 1000, 5000, 500, 1000, 500,
  '[{"user_id":"a0000000-0000-0000-0000-000000000001","name":"Trung","bp":1000},{"user_id":"a0000000-0000-0000-0000-000000000005","name":"Linh","bp":1000}]');
insert into public.classes (id, coach_id, title, main_coach_id, assistant_id) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Lớp thử', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004');
insert into public.students (id, coach_id, full_name)
select ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 'c0000000-0000-0000-0000-000000000001', 'Học viên ' || i from generate_series(1, 4) i;
insert into public.enrollments (coach_id, class_id, student_id, sessions_total, price, closer_id)
select 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 10, 3000000,
  case when i <= 2 then 'a0000000-0000-0000-0000-000000000001' else 'a0000000-0000-0000-0000-000000000002' end::uuid
from generate_series(1, 4) i;
insert into public.class_sessions (id, coach_id, class_id, kind, seq, starts_at, ends_at, status) values
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'day', 1, '2026-10-05 18:00+07', '2026-10-05 19:30+07', 'da-day');
insert into public.attendance (coach_id, session_id, student_id, status)
select 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', ('e0000000-0000-0000-0000-00000000000' || i)::uuid, 'co-mat' from generate_series(1, 4) i;
-- Trợ giảng: 100.000 / buổi.
insert into public.assistant_rates (coach_id, class_id, assistant_id, per_session)
values ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 100000);

-- 1) Sale không chốt được tháng.
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000002';
do $$ begin
  begin
    perform public.close_split_month('c0000000-0000-0000-0000-000000000001', '2026-10');
    assert false, 'sale không được chốt tháng';
  exception when insufficient_privilege then null;
  end;
end $$;

-- 2) Coach chủ chốt tháng 10.
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000001';
select public.close_split_month('c0000000-0000-0000-0000-000000000001', '2026-10');
do $$
declare v jsonb;
begin
  -- Trung: coach 600.000 + sale 60.000 + cổ đông 120.000 = 780.000
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000001') = 780000, 'Trung 780.000';
  select breakdown into v from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000001';
  assert (v ->> 'coach')::int = 600000 and (v ->> 'sale')::int = 60000 and (v ->> 'co-dong')::int = 120000, 'chi tiết của Trung';
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002') = 60000, 'Sale A 60.000';
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000005') = 120000, 'Linh 120.000';
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000004') = 100000, 'trợ giảng 100.000 (ngoài 6 phần)';
  assert (select amount from public.split_payouts where party_key = 'quy-van-hanh') = 120000, 'quỹ vận hành 120.000';
  assert (select sum(amount) from public.split_payouts where month = '2026-10' and party_key <> 'u:a0000000-0000-0000-0000-000000000004') = 1200000, 'tổng 6 phần = 1.200.000';
  begin
    perform public.close_split_month('c0000000-0000-0000-0000-000000000001', '2026-10');
    assert false, 'không chốt lại tháng đã chốt';
  exception when raise_exception then null;
  end;
end $$;

-- 3) Sửa số khi chưa trả: bắt buộc lý do, ghi nhật ký.
do $$ begin
  begin
    perform public.adjust_payout((select id from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002'), 90000, '');
    assert false, 'phải có lý do';
  exception when raise_exception then null;
  end;
end $$;
select public.adjust_payout((select id from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002'), 90000, 'Thưởng chốt nhanh');
do $$ begin
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002') = 90000, 'đã sửa thành 90.000';
  assert exists (select 1 from public.split_audit where action = 'sua-so' and old_amount = 60000 and new_amount = 90000 and reason = 'Thưởng chốt nhanh' and actor_name = 'Trung'), 'nhật ký sửa';
end $$;

-- 4) Đã trả rồi mới sửa: chênh lệch thành điều chỉnh tháng sau.
select public.mark_payout((select id from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002'), true, 'c0000000-0000-0000-0000-000000000001/chi-tra/anh.jpg', 'CK Vietcombank');
select public.adjust_payout((select id from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002'), 70000, 'Trả dư, trừ tháng sau');
do $$ begin
  assert (select amount from public.split_payouts where party_key = 'u:a0000000-0000-0000-0000-000000000002') = 90000, 'đã trả thì giữ số cũ';
  assert (select amount from public.split_adjustments where to_month = '2026-11' and party_key = 'u:a0000000-0000-0000-0000-000000000002') = -20000, 'điều chỉnh −20.000 vào tháng 11';
end $$;

-- 5) Chốt tháng 11: điều chỉnh được cộng vào (không có buổi nào → chỉ còn dòng điều chỉnh).
select public.close_split_month('c0000000-0000-0000-0000-000000000001', '2026-11');
do $$ begin
  assert (select amount from public.split_payouts where month = '2026-11' and party_key = 'u:a0000000-0000-0000-0000-000000000002') = -20000, 'tháng 11 trừ 20.000';
  assert not exists (select 1 from public.split_adjustments where applied_payout_id is null), 'điều chỉnh đã áp dụng';
end $$;

-- 6) Quỹ: chi quảng cáo phải từ quỹ dự phòng; số dư = vào − chi.
do $$ begin
  begin
    insert into public.fund_expenses (coach_id, fund, category, amount, spent_on) values ('c0000000-0000-0000-0000-000000000001', 'quy-van-hanh', 'quang-cao', 10000, '2026-10-10');
    assert false, 'quảng cáo phải từ quỹ dự phòng';
  exception when check_violation then null;
  end;
end $$;
insert into public.fund_expenses (coach_id, fund, category, amount, spent_on, note) values ('c0000000-0000-0000-0000-000000000001', 'quy-du-phong', 'quang-cao', 25000, '2026-10-10', 'Quảng cáo Facebook');
do $$ begin
  assert (select so_du from public.fund_balances('c0000000-0000-0000-0000-000000000001') where fund = 'quy-du-phong') = 35000, 'dự phòng 60.000 − 25.000';
end $$;

-- 7) Sale không xem được số dư quỹ, không thấy dòng của người khác; trợ giảng thấy tiền của mình.
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000002';
do $$ begin
  assert (select count(*) from public.fund_balances('c0000000-0000-0000-0000-000000000001')) = 0, 'sale không xem quỹ';
  assert (select count(*) from public.split_payouts where party_user_id <> 'a0000000-0000-0000-0000-000000000002') = 0, 'sale chỉ thấy dòng của mình';
end $$;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000004';
do $$ begin
  assert (select amount from public.assistant_due('c0000000-0000-0000-0000-000000000001', '2026-10')) = 100000, 'trợ giảng thấy 100.000';
end $$;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-000000000005';
do $$ begin
  assert (select count(*) from public.fund_balances('c0000000-0000-0000-0000-000000000001')) = 3, 'quản lý / cổ đông xem quỹ';
  assert (select count(*) from public.split_audit) = 0, 'nhật ký chỉ coach chủ xem';
end $$;

\echo 'month_close_test: tất cả đều đúng'
rollback;
