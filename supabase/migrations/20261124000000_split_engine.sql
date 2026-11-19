-- Bộ máy chia tiền theo buổi đã dạy.
-- Mỗi (buổi × học viên bị trừ buổi) sinh các bút toán: sale (người chốt), coach đứng lớp, 3 quỹ, cổ đông.
-- Tỉ lệ + danh sách cổ đông lưu trong split_rules, có hiệu lực từ một ngày; chỉ coach chủ sửa.
-- Tiền tính bằng số nguyên đồng; phần lẻ do làm tròn vào quỹ vận hành.
-- Chạy lại nhiều lần cũng không sao.

-- ================================================================ phí buổi
-- Học viên trả theo buổi: khoản đem chia mỗi buổi là phí buổi. Không ghi thì lấy giá gói ÷ số buổi của gói.
alter table public.enrollments add column if not exists price_per_session int check (price_per_session >= 0);

-- ================================================================ tỉ lệ chia
create table if not exists public.split_rules (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  effective_from date not null,
  -- phần vạn: 1000 = 10%
  sale_bp int not null check (sale_bp between 0 and 10000),
  coach_bp int not null check (coach_bp between 0 and 10000),
  reserve_bp int not null check (reserve_bp between 0 and 10000),
  ops_bp int not null check (ops_bp between 0 and 10000),
  dev_bp int not null check (dev_bp between 0 and 10000),
  -- [{ "user_id": "...", "name": "Trung", "bp": 1000 }]
  shareholders jsonb not null default '[]',
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (coach_id, effective_from)
);

create or replace function public.check_split_rule()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sh int;
begin
  if jsonb_typeof(new.shareholders) <> 'array' then
    raise exception 'shareholders_must_be_array';
  end if;
  select coalesce(sum((x ->> 'bp')::int), 0) into v_sh from jsonb_array_elements(new.shareholders) x;
  if exists (select 1 from jsonb_array_elements(new.shareholders) x where (x ->> 'bp')::int < 0 or coalesce(x ->> 'name', '') = '') then
    raise exception 'shareholder_invalid';
  end if;
  if new.sale_bp + new.coach_bp + new.reserve_bp + new.ops_bp + new.dev_bp + v_sh <> 10000 then
    raise exception 'split_total_must_be_100' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists split_rules_check on public.split_rules;
create trigger split_rules_check before insert or update on public.split_rules
  for each row execute function public.check_split_rule();

-- Tỉ lệ mặc định đã chốt: sale 10, coach 50, dự phòng 5, vận hành 10, phát triển 5, cổ đông 20 (Trung 10, Linh 10).
insert into public.split_rules (coach_id, effective_from, sale_bp, coach_bp, reserve_bp, ops_bp, dev_bp, shareholders, note)
select c.id, date '2026-01-01', 1000, 5000, 500, 1000, 500,
  jsonb_build_array(
    jsonb_build_object('user_id', (select m.user_id from public.coach_members m where m.coach_id = c.id and m.role = 'owner' order by m.created_at limit 1), 'name', 'Trung', 'bp', 1000),
    jsonb_build_object('user_id', null, 'name', 'Linh', 'bp', 1000)
  ),
  'Tỉ lệ ban đầu'
from public.coaches c
on conflict (coach_id, effective_from) do nothing;

-- ================================================================ tháng đã chốt
create table if not exists public.split_months (
  coach_id uuid not null references public.coaches (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  closed_at timestamptz not null default now(),
  closed_by uuid references auth.users (id) on delete set null,
  primary key (coach_id, month)
);

create or replace function public.month_closed(cid uuid, m text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.split_months where coach_id = cid and month = m);
$$;

-- ================================================================ bút toán chia
create table if not exists public.split_entries (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  session_id uuid references public.class_sessions (id) on delete cascade,
  student_id uuid references public.students (id) on delete set null,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  entry_date date not null,
  month text not null,
  rule_id uuid references public.split_rules (id) on delete set null,
  base_amount int not null,
  party_kind text not null check (party_kind in ('sale', 'coach', 'quy-du-phong', 'quy-van-hanh', 'quy-phat-trien', 'co-dong')),
  party_user_id uuid references auth.users (id) on delete set null,
  party_name text,
  amount int not null,
  created_at timestamptz not null default now()
);
create index if not exists split_entries_month on public.split_entries (coach_id, month);
create index if not exists split_entries_session on public.split_entries (session_id);
create index if not exists split_entries_party on public.split_entries (party_user_id, month);

-- Trạng thái điểm danh bị trừ buổi theo Quy định lớp (coaches.settings.rules.deduct_mode).
create or replace function public.deducted_statuses(cid uuid)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select case coalesce((select c.settings -> 'rules' ->> 'deduct_mode' from public.coaches c where c.id = cid), 'co-mat-hoac-khong-bao')
    when 'chi-co-mat' then array['co-mat']
    when 'moi-buoi' then array['co-mat', 'vang', 'bao-nghi']
    else array['co-mat', 'vang'] end;
$$;

-- Ghi lại bút toán của một buổi. Không làm gì nếu tháng của buổi đã chốt.
-- Chia khi điểm danh (học viên bị trừ buổi) hoặc hoàn tất buổi; buổi huỷ và buổi học thử không chia.
create or replace function public.regen_session_split(p_session uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.class_sessions;
  v_day date;
  v_month text;
  v_rule public.split_rules;
  v_teacher_name text;
  v_count int := 0;
  r record;
  v_base int;
  v_parts jsonb;
  v_sum int;
  sh jsonb;
  v_amt int;
begin
  select * into s from public.class_sessions where id = p_session;
  if s.id is null then
    return 0;
  end if;
  v_day := (s.starts_at at time zone 'Asia/Ho_Chi_Minh')::date;
  v_month := to_char(v_day, 'YYYY-MM');
  if public.month_closed(s.coach_id, v_month) then
    return 0;
  end if;
  delete from public.split_entries where session_id = p_session;
  if s.status = 'huy' or s.class_id is null or s.kind <> 'day' then
    return 0;
  end if;

  select * into v_rule from public.split_rules
    where coach_id = s.coach_id and effective_from <= v_day
    order by effective_from desc limit 1;
  if v_rule.id is null then
    return 0;
  end if;
  select display_name into v_teacher_name from public.coach_members where coach_id = s.coach_id and user_id = s.teacher_id;

  for r in
    select a.student_id, e.id as enrollment_id, e.closer_id, e.price, e.sessions_total, e.price_per_session,
      (select display_name from public.coach_members m where m.coach_id = s.coach_id and m.user_id = e.closer_id) as closer_name
    from public.attendance a
    join public.enrollments e on e.class_id = s.class_id and e.student_id = a.student_id
    where a.session_id = p_session and a.status = any (public.deducted_statuses(s.coach_id))
  loop
    v_base := coalesce(nullif(r.price_per_session, 0), case when r.sessions_total > 0 then r.price / r.sessions_total end);
    if v_base is null or v_base <= 0 then
      continue;
    end if;
    v_sum := 0;
    -- sale, coach, dự phòng, phát triển, cổ đông: làm tròn xuống; vận hành nhận phần còn lại.
    insert into public.split_entries (coach_id, session_id, student_id, enrollment_id, entry_date, month, rule_id, base_amount, party_kind, party_user_id, party_name, amount)
    values
      (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'sale', r.closer_id, coalesce(r.closer_name, case when r.closer_id is null then 'Chưa có người chốt' end), v_base::bigint * v_rule.sale_bp / 10000),
      (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'coach', s.teacher_id, coalesce(v_teacher_name, case when s.teacher_id is null then 'Chưa có người dạy' end), v_base::bigint * v_rule.coach_bp / 10000),
      (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'quy-du-phong', null, null, v_base::bigint * v_rule.reserve_bp / 10000),
      (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'quy-phat-trien', null, null, v_base::bigint * v_rule.dev_bp / 10000);
    v_sum := v_base::bigint * v_rule.sale_bp / 10000 + v_base::bigint * v_rule.coach_bp / 10000 + v_base::bigint * v_rule.reserve_bp / 10000 + v_base::bigint * v_rule.dev_bp / 10000;
    for sh in select * from jsonb_array_elements(v_rule.shareholders)
    loop
      v_amt := v_base::bigint * (sh ->> 'bp')::int / 10000;
      v_sum := v_sum + v_amt;
      insert into public.split_entries (coach_id, session_id, student_id, enrollment_id, entry_date, month, rule_id, base_amount, party_kind, party_user_id, party_name, amount)
      values (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'co-dong', nullif(sh ->> 'user_id', '')::uuid, sh ->> 'name', v_amt);
    end loop;
    insert into public.split_entries (coach_id, session_id, student_id, enrollment_id, entry_date, month, rule_id, base_amount, party_kind, party_user_id, party_name, amount)
    values (s.coach_id, p_session, r.student_id, r.enrollment_id, v_day, v_month, v_rule.id, v_base, 'quy-van-hanh', null, null, v_base - v_sum);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.regen_session_split(uuid) from public, anon, authenticated;

-- Tính lại mọi buổi của một tháng chưa chốt (dùng trước khi chốt tháng, sau khi đổi tỉ lệ).
create or replace function public.regen_month_split(p_coach uuid, p_month text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v int := 0;
  r record;
begin
  if (select auth.uid()) is not null and not public.has_any_role(p_coach, array['chu']) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  for r in
    select id from public.class_sessions
    where coach_id = p_coach and to_char((starts_at at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM') = p_month
  loop
    v := v + public.regen_session_split(r.id);
  end loop;
  return v;
end;
$$;
revoke all on function public.regen_month_split(uuid, text) from public, anon;
grant execute on function public.regen_month_split(uuid, text) to authenticated;

-- ---------------------------------------------------------------- tự sinh lại khi dữ liệu đổi
create or replace function public.split_on_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.regen_session_split(coalesce(new.session_id, old.session_id));
  if tg_op = 'UPDATE' and new.session_id <> old.session_id then
    perform public.regen_session_split(old.session_id);
  end if;
  return null;
end;
$$;
drop trigger if exists attendance_split on public.attendance;
create trigger attendance_split after insert or update or delete on public.attendance
  for each row execute function public.split_on_attendance();

create or replace function public.split_on_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status or new.teacher_id is distinct from old.teacher_id
     or new.starts_at <> old.starts_at or new.ends_at <> old.ends_at or new.class_id is distinct from old.class_id then
    perform public.regen_session_split(new.id);
  end if;
  return null;
end;
$$;
drop trigger if exists class_sessions_split on public.class_sessions;
create trigger class_sessions_split after update on public.class_sessions
  for each row execute function public.split_on_session();

-- Đổi học phí / số buổi / người chốt của một đăng ký: tính lại các buổi học viên đó đã học (tháng chưa chốt).
create or replace function public.split_on_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  if new.price is distinct from old.price or new.sessions_total is distinct from old.sessions_total
     or new.price_per_session is distinct from old.price_per_session or new.closer_id is distinct from old.closer_id then
    for r in
      select distinct a.session_id from public.attendance a join public.class_sessions s on s.id = a.session_id
      where s.class_id = new.class_id and a.student_id = new.student_id
    loop
      perform public.regen_session_split(r.session_id);
    end loop;
  end if;
  return null;
end;
$$;
drop trigger if exists enrollments_split on public.enrollments;
create trigger enrollments_split after update on public.enrollments
  for each row execute function public.split_on_enrollment();

-- Đổi tỉ lệ: tính lại các buổi từ ngày hiệu lực trong các tháng chưa chốt.
create or replace function public.split_on_rule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_from date := least(coalesce(new.effective_from, old.effective_from), coalesce(old.effective_from, new.effective_from));
  v_coach uuid := coalesce(new.coach_id, old.coach_id);
begin
  for r in
    select id from public.class_sessions
    where coach_id = v_coach and (starts_at at time zone 'Asia/Ho_Chi_Minh')::date >= v_from
  loop
    perform public.regen_session_split(r.id);
  end loop;
  return null;
end;
$$;
drop trigger if exists split_rules_regen on public.split_rules;
create trigger split_rules_regen after insert or update or delete on public.split_rules
  for each row execute function public.split_on_rule();

-- ================================================================ quyền
alter table public.split_rules enable row level security;
alter table public.split_months enable row level security;
alter table public.split_entries enable row level security;

drop policy if exists "Coach chủ quản lý tỉ lệ" on public.split_rules;
drop policy if exists "Xem tỉ lệ" on public.split_rules;
create policy "Xem tỉ lệ" on public.split_rules for select to authenticated
  using (public.is_coach_member(coach_id));
create policy "Coach chủ quản lý tỉ lệ" on public.split_rules for all to authenticated
  using (public.has_any_role(coach_id, array['chu'])) with check (public.has_any_role(coach_id, array['chu']));

drop policy if exists "Xem tháng đã chốt" on public.split_months;
create policy "Xem tháng đã chốt" on public.split_months for select to authenticated
  using (public.is_coach_member(coach_id));

-- Bút toán: coach chủ thấy hết; người nhận thấy phần của mình. Quỹ / báo cáo cho quản lý, cổ đông đọc qua hàm tổng hợp.
drop policy if exists "Xem bút toán chia" on public.split_entries;
create policy "Xem bút toán chia" on public.split_entries for select to authenticated
  using (public.has_any_role(coach_id, array['chu']) or party_user_id = (select auth.uid()));

revoke all on public.split_rules, public.split_months, public.split_entries from anon;
grant select, insert, update, delete on public.split_rules to authenticated;
grant select on public.split_months, public.split_entries to authenticated;
-- Bút toán chỉ do database tự ghi (regen_session_split); không ai ghi tay qua API.
revoke insert, update, delete on public.split_entries from authenticated;
revoke insert, update, delete on public.split_months from authenticated;

-- Ghi bút toán cho các buổi đã có (tháng chưa chốt).
do $$
declare r record;
begin
  for r in select id from public.class_sessions loop
    perform public.regen_session_split(r.id);
  end loop;
end $$;
