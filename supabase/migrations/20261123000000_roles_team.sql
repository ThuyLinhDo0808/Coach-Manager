-- Đội ngũ, nhiều vai trò, người dạy thực tế, người chốt, quản lý xác nhận xếp lớp.
-- Quyền trong database siết theo vai trò (API không chỉ dựa vào việc ẩn trên giao diện).
-- Chạy lại nhiều lần cũng không sao.

-- ================================================================ vai trò
-- chu: coach chủ (toàn quyền) · quan-ly: quản lý đào tạo / vận hành · co-dong: cổ đông
-- coach: coach đứng lớp (coach hợp tác; coach chủ cũng có vai trò này nếu đi dạy)
-- sale · tro-giang. Một người có thể có nhiều vai trò.
alter table public.coach_members add column if not exists roles text[] not null default '{}';
alter table public.coach_members drop constraint if exists coach_members_roles_check;
alter table public.coach_members add constraint coach_members_roles_check
  check (roles <@ array['chu', 'quan-ly', 'co-dong', 'coach', 'sale', 'tro-giang']::text[]);

-- Cột role cũ giữ làm "vai trò chính" (các hàm cũ như is_coach_owner vẫn dùng role = 'owner').
alter table public.coach_members drop constraint if exists coach_members_role_check;
alter table public.coach_members add constraint coach_members_role_check
  check (role in ('owner', 'quan-ly', 'coach', 'sale', 'tro-giang', 'co-dong'));

update public.coach_members set roles = case role
    when 'owner' then array['chu', 'coach']
    when 'sale' then array['sale']
    when 'tro-giang' then array['tro-giang']
    else array[role] end
  where roles = '{}';

-- Giữ role khớp với roles: thêm thành viên chỉ với role thì suy ra roles, và ngược lại.
create or replace function public.sync_member_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(array_length(new.roles, 1), 0) = 0 then
    new.roles := case new.role when 'owner' then array['chu', 'coach'] else array[new.role] end;
  end if;
  new.role := case
    when 'chu' = any (new.roles) then 'owner'
    when 'quan-ly' = any (new.roles) then 'quan-ly'
    when 'coach' = any (new.roles) then 'coach'
    when 'sale' = any (new.roles) then 'sale'
    when 'tro-giang' = any (new.roles) then 'tro-giang'
    else 'co-dong' end;
  return new;
end;
$$;
drop trigger if exists coach_members_sync_role on public.coach_members;
create trigger coach_members_sync_role before insert or update on public.coach_members
  for each row execute function public.sync_member_role();

grant update (roles) on public.coach_members to authenticated;

-- Người đang đăng nhập có ít nhất một trong các vai trò này ở coach cid không.
create or replace function public.has_any_role(cid uuid, wanted text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coach_members m
    where m.coach_id = cid and m.user_id = (select auth.uid()) and m.roles && wanted
  );
$$;
revoke all on function public.has_any_role(uuid, text[]) from public;
grant execute on function public.has_any_role(uuid, text[]) to authenticated;

-- Lời mời: chọn nhiều vai trò (không mời được coach chủ).
alter table public.member_invites add column if not exists roles text[] not null default '{}';
alter table public.member_invites drop constraint if exists member_invites_role_check;
alter table public.member_invites add constraint member_invites_role_check
  check (role in ('quan-ly', 'coach', 'sale', 'tro-giang', 'co-dong'));
alter table public.member_invites drop constraint if exists member_invites_roles_check;
alter table public.member_invites add constraint member_invites_roles_check
  check (roles <@ array['quan-ly', 'co-dong', 'coach', 'sale', 'tro-giang']::text[]);

create or replace function public.accept_invite()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_count int := 0;
  r record;
begin
  if v_uid is null then
    return 0;
  end if;
  -- Chỉ tin email đã được xác nhận (email_confirmed_at).
  select lower(u.email) into v_email from auth.users u where u.id = v_uid and u.email_confirmed_at is not null;
  if v_email is null or v_email = '' then
    return 0;
  end if;
  for r in
    select i.id, i.coach_id, i.role, i.roles, i.display_name
    from public.member_invites i
    where lower(i.email) = v_email and i.accepted_at is null
    order by i.created_at
    for update
  loop
    insert into public.coach_members (coach_id, user_id, role, roles, display_name, email)
    values (r.coach_id, v_uid, r.role, case when coalesce(array_length(r.roles, 1), 0) = 0 then array[r.role] else r.roles end, r.display_name, v_email)
    on conflict (coach_id, user_id) do nothing;
    update public.member_invites set accepted_at = now() where id = r.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.accept_invite() from public, anon;
grant execute on function public.accept_invite() to authenticated;

-- ================================================================ người dạy
-- Lớp: coach dạy chính, trợ giảng phân công, cờ trung tâm chịu tiền sân / bóng (lớp đặc thù).
alter table public.classes add column if not exists main_coach_id uuid references auth.users (id) on delete set null;
alter table public.classes add column if not exists assistant_id uuid references auth.users (id) on delete set null;
alter table public.classes add column if not exists center_pays_court boolean not null default false;

-- Buổi: người dạy thực tế (dạy thay khi khác coach dạy chính của lớp) và trợ giảng của buổi.
alter table public.class_sessions add column if not exists teacher_id uuid references auth.users (id) on delete set null;
alter table public.class_sessions add column if not exists assistant_id uuid references auth.users (id) on delete set null;
create index if not exists class_sessions_teacher on public.class_sessions (coach_id, teacher_id, starts_at);
create index if not exists class_sessions_assistant on public.class_sessions (assistant_id, starts_at);

-- Dữ liệu cũ: coach chủ dạy chính mọi lớp và dạy mọi buổi đã có.
update public.classes c set main_coach_id = (
  select m.user_id from public.coach_members m where m.coach_id = c.coach_id and m.role = 'owner' order by m.created_at limit 1)
where c.main_coach_id is null;
update public.class_sessions s set teacher_id = coalesce(
  (select c.main_coach_id from public.classes c where c.id = s.class_id),
  (select m.user_id from public.coach_members m where m.coach_id = s.coach_id and m.role = 'owner' order by m.created_at limit 1))
where s.teacher_id is null;

-- Buổi mới không ghi người dạy thì lấy coach dạy chính / trợ giảng của lớp.
create or replace function public.default_session_staff()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.class_id is not null then
    if new.teacher_id is null then
      select c.main_coach_id into new.teacher_id from public.classes c where c.id = new.class_id;
    end if;
    if new.assistant_id is null and tg_op = 'INSERT' then
      select c.assistant_id into new.assistant_id from public.classes c where c.id = new.class_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists class_sessions_default_staff on public.class_sessions;
create trigger class_sessions_default_staff before insert on public.class_sessions
  for each row execute function public.default_session_staff();

-- ================================================================ người chốt, quản lý xác nhận
-- Người chốt (sale nhận 10%) lưu theo từng đăng ký học viên × lớp / gói.
alter table public.enrollments add column if not exists closer_id uuid references auth.users (id) on delete set null;
alter table public.enrollments add column if not exists lead_id uuid references public.leads (id) on delete set null;

alter table public.leads add column if not exists closer_id uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists closed_at timestamptz;
alter table public.leads add column if not exists ops_confirmed_by uuid references auth.users (id) on delete set null;
alter table public.leads add column if not exists ops_confirmed_at timestamptz;
create index if not exists leads_waiting_ops on public.leads (coach_id) where status = 'da-chot' and ops_confirmed_at is null;

alter table public.offers add column if not exists closer_id uuid references auth.users (id) on delete set null;

-- Dữ liệu cũ: nhu cầu đã chốt / đăng ký đã có → người chốt là người phụ trách, nếu không thì coach chủ;
-- coi như đã xác nhận để không dồn việc cũ vào "Cần xử lý".
update public.leads l set
  closer_id = coalesce(l.assigned_to, (select m.user_id from public.coach_members m where m.coach_id = l.coach_id and m.role = 'owner' order by m.created_at limit 1)),
  closed_at = coalesce(l.closed_at, l.updated_at),
  ops_confirmed_at = coalesce(l.ops_confirmed_at, l.updated_at)
where l.status = 'da-chot' and l.closer_id is null;
update public.enrollments e set closer_id = coalesce(
  (select l.closer_id from public.students s join public.leads l on l.id = s.lead_id where s.id = e.student_id),
  (select m.user_id from public.coach_members m where m.coach_id = e.coach_id and m.role = 'owner' order by m.created_at limit 1))
where e.closer_id is null;

-- Không chuyển sang Đã chốt nếu chưa có người chốt (kể cả gọi thẳng API).
create or replace function public.require_lead_closer()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'da-chot' and (tg_op = 'INSERT' or old.status is distinct from 'da-chot') then
    if new.closer_id is null then
      raise exception 'closer_required' using errcode = 'P0001';
    end if;
    new.closed_at := coalesce(new.closed_at, now());
    if tg_op = 'UPDATE' then
      -- Vừa chuyển sang Đã chốt: chờ quản lý xác nhận lại.
      new.ops_confirmed_by := null;
      new.ops_confirmed_at := null;
    end if;
  end if;
  if new.status <> 'da-chot' and tg_op = 'UPDATE' and old.status = 'da-chot' then
    new.closed_at := null;
    new.ops_confirmed_by := null;
    new.ops_confirmed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists leads_require_closer on public.leads;
create trigger leads_require_closer before insert or update on public.leads
  for each row execute function public.require_lead_closer();

-- Chốt nhu cầu: tạo / dùng học viên, ghi danh lớp với người chốt, chuyển Đã chốt.
-- Người gọi phải là coach chủ, quản lý hoặc sale. Người chốt phải là thành viên có vai trò sale / coach chủ / quản lý.
drop function if exists public.close_lead(uuid, uuid, int);
create or replace function public.close_lead(p_lead uuid, p_class uuid default null, p_price int default null, p_closer uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads;
  v_student uuid;
  v_sessions int;
  v_closer uuid := coalesce(p_closer, (select auth.uid()));
begin
  select * into v_lead from public.leads where id = p_lead for update;
  if v_lead.id is null then
    raise exception 'lead_not_found';
  end if;
  if (select auth.uid()) is not null and not public.has_any_role(v_lead.coach_id, array['chu', 'quan-ly', 'sale']) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.coach_members m
    where m.coach_id = v_lead.coach_id and m.user_id = v_closer and m.roles && array['chu', 'quan-ly', 'sale']
  ) then
    raise exception 'closer_required' using errcode = 'P0001';
  end if;

  select id into v_student from public.students where lead_id = p_lead;
  if v_student is null then
    insert into public.students (coach_id, lead_id, full_name, phone, gender, birth_year, dupr_start, dupr_current)
    values (
      v_lead.coach_id, p_lead, v_lead.full_name, v_lead.phone, v_lead.gender, v_lead.birth_year,
      case when v_lead.dupr ~ '^[0-9](\.[0-9]{1,2})?$' then v_lead.dupr::numeric end,
      case when v_lead.dupr ~ '^[0-9](\.[0-9]{1,2})?$' then v_lead.dupr::numeric end
    )
    returning id into v_student;
  end if;

  if p_class is not null then
    select co.session_count into v_sessions
      from public.classes c left join public.courses co on co.id = c.course_id
      where c.id = p_class and c.coach_id = v_lead.coach_id;
    if not found then
      raise exception 'class_not_found';
    end if;
    insert into public.enrollments (coach_id, class_id, student_id, sessions_total, price, closer_id, lead_id)
    values (v_lead.coach_id, p_class, v_student, v_sessions, p_price, v_closer, p_lead)
    on conflict (class_id, student_id) do update set closer_id = excluded.closer_id, lead_id = excluded.lead_id,
      price = coalesce(excluded.price, public.enrollments.price), status = 'dang-hoc';
  end if;

  update public.leads set status = 'da-chot', closer_id = v_closer, lost_reason = null,
    contacted_at = coalesce(contacted_at, now())
    where id = p_lead;
  insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
  values (v_lead.coach_id, p_lead, (select auth.uid()),
    'Chốt' || coalesce(' vào lớp ' || (select title from public.classes where id = p_class), '')
      || ' · người chốt: ' || coalesce((select display_name from public.coach_members where coach_id = v_lead.coach_id and user_id = v_closer), 'thành viên')
      || ' · chờ quản lý xác nhận xếp lớp', 'trang-thai');
  return v_student;
end;
$$;
revoke all on function public.close_lead(uuid, uuid, int, uuid) from public, anon;
grant execute on function public.close_lead(uuid, uuid, int, uuid) to authenticated;

-- Quản lý đào tạo (hoặc coach chủ) xác nhận đã nhận báo chốt / đã xếp lớp.
create or replace function public.confirm_lead_placement(p_lead uuid, p_class uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads;
  v_student uuid;
begin
  select * into v_lead from public.leads where id = p_lead for update;
  if v_lead.id is null or v_lead.status <> 'da-chot' then
    raise exception 'lead_not_closed';
  end if;
  if not public.has_any_role(v_lead.coach_id, array['chu', 'quan-ly']) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_class is not null then
    select id into v_student from public.students where lead_id = p_lead;
    if v_student is null or not exists (select 1 from public.classes where id = p_class and coach_id = v_lead.coach_id) then
      raise exception 'class_not_found';
    end if;
    insert into public.enrollments (coach_id, class_id, student_id, sessions_total, closer_id, lead_id)
    values (v_lead.coach_id, p_class, v_student,
      (select co.session_count from public.classes c left join public.courses co on co.id = c.course_id where c.id = p_class),
      v_lead.closer_id, p_lead)
    on conflict (class_id, student_id) do nothing;
  end if;
  update public.leads set ops_confirmed_by = (select auth.uid()), ops_confirmed_at = now() where id = p_lead;
  insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
  values (v_lead.coach_id, p_lead, (select auth.uid()),
    'Quản lý đã xác nhận' || coalesce(', xếp vào lớp ' || (select title from public.classes where id = p_class), ''), 'trang-thai');
end;
$$;
revoke all on function public.confirm_lead_placement(uuid, uuid) from public, anon;
grant execute on function public.confirm_lead_placement(uuid, uuid) to authenticated;

-- Xác nhận tiền offer: người chốt là người tạo offer (hoặc người được ghi khi tạo).
create or replace function public.confirm_offer(p_offer uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.offers;
  v_student uuid;
begin
  select * into v from public.offers where id = p_offer for update;
  if v.id is null or v.status not in ('cho', 'da-bao') then
    raise exception 'offer_not_open';
  end if;
  if not public.is_coach_owner(v.coach_id) then
    raise exception 'owner_only';
  end if;
  v_student := public.close_lead(v.lead_id, v.class_id, v.amount, coalesce(v.closer_id, v.created_by));
  update public.offers set status = 'da-xac-nhan', confirmed_at = now() where id = p_offer;
  if v.pay_now > 0 then
    insert into public.ledger (coach_id, kind, category, amount, description, student_id, class_id, offer_id, recorded_by)
    values (
      v.coach_id, 'thu', case when v.pay_now < v.amount then 'tien-coc' else 'tien-goi' end, v.pay_now,
      left(v.title || ' · ' || (select full_name from public.leads where id = v.lead_id), 200),
      v_student, v.class_id, v.id, (select auth.uid())
    );
  end if;
  return v_student;
end;
$$;

-- ================================================================ quyền theo vai trò (RLS)
-- Ai thấy gì:
--   nhu cầu, ghi chú nhu cầu, offer: coach chủ, quản lý, sale
--   lớp, đăng ký, học viên: coach chủ, quản lý; coach đứng lớp chỉ thấy lớp / học viên của mình
--   buổi học, điểm danh, nhận xét: coach chủ, quản lý; coach và trợ giảng chỉ buổi mình dạy / được phân
--   trợ giảng không đọc trực tiếp bảng học viên / lớp / đăng ký (không thấy học phí, số điện thoại, ghi chú):
--   danh sách học viên của buổi lấy qua hàm session_roster().

-- Coach / trợ giảng có dạy (hoặc được phân) ở lớp này không.
create or replace function public.works_in_class(p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.classes c where c.id = p_class and (select auth.uid()) in (c.main_coach_id, c.assistant_id))
      or exists (select 1 from public.class_sessions s where s.class_id = p_class and (select auth.uid()) in (s.teacher_id, s.assistant_id));
$$;
create or replace function public.works_in_session(p_session uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_sessions s left join public.classes c on c.id = s.class_id
    where s.id = p_session and (select auth.uid()) in (s.teacher_id, s.assistant_id, c.main_coach_id, c.assistant_id)
  );
$$;
create or replace function public.teaches_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments e join public.classes c on c.id = e.class_id
    where e.student_id = p_student
      and ((select auth.uid()) = c.main_coach_id
        or exists (select 1 from public.class_sessions s where s.class_id = c.id and s.teacher_id = (select auth.uid())))
  );
$$;
revoke all on function public.works_in_class(uuid), public.works_in_session(uuid), public.teaches_student(uuid) from public;
grant execute on function public.works_in_class(uuid), public.works_in_session(uuid), public.teaches_student(uuid) to authenticated;

-- nhu cầu
drop policy if exists "Thành viên xem nhu cầu" on public.leads;
drop policy if exists "Thành viên cập nhật nhu cầu" on public.leads;
drop policy if exists "Thành viên thêm nhu cầu tay" on public.leads;
drop policy if exists "Tuyển sinh đọc ghi nhu cầu" on public.leads;
create policy "Tuyển sinh đọc ghi nhu cầu" on public.leads for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']));

drop policy if exists "Thành viên xem ghi chú" on public.lead_notes;
drop policy if exists "Thành viên viết ghi chú" on public.lead_notes;
drop policy if exists "Tuyển sinh xem ghi chú" on public.lead_notes;
drop policy if exists "Tuyển sinh viết ghi chú" on public.lead_notes;
create policy "Tuyển sinh xem ghi chú" on public.lead_notes for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']));
create policy "Tuyển sinh viết ghi chú" on public.lead_notes for insert to authenticated
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']) and author_id = (select auth.uid()));

drop policy if exists "Thành viên đọc ghi offer" on public.offers;
drop policy if exists "Tuyển sinh đọc ghi offer" on public.offers;
create policy "Tuyển sinh đọc ghi offer" on public.offers for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale']));

-- lớp
drop policy if exists "Thành viên đọc ghi" on public.classes;
drop policy if exists "Đọc lớp" on public.classes;
drop policy if exists "Quản lý ghi lớp" on public.classes;
create policy "Đọc lớp" on public.classes for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale'])
    or (public.has_any_role(coach_id, array['coach']) and public.works_in_class(id)));
create policy "Quản lý ghi lớp" on public.classes for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']));

-- học viên
drop policy if exists "Thành viên đọc ghi" on public.students;
drop policy if exists "Đọc học viên" on public.students;
drop policy if exists "Quản lý ghi học viên" on public.students;
create policy "Đọc học viên" on public.students for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly'])
    or (public.has_any_role(coach_id, array['coach']) and public.teaches_student(id)));
create policy "Quản lý ghi học viên" on public.students for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']));

-- đăng ký
drop policy if exists "Thành viên đọc ghi" on public.enrollments;
drop policy if exists "Đọc đăng ký" on public.enrollments;
drop policy if exists "Quản lý ghi đăng ký" on public.enrollments;
create policy "Đọc đăng ký" on public.enrollments for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly'])
    or (public.has_any_role(coach_id, array['coach']) and public.works_in_class(class_id))
    or closer_id = (select auth.uid()));
create policy "Quản lý ghi đăng ký" on public.enrollments for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']));

-- buổi học
drop policy if exists "Thành viên đọc ghi" on public.class_sessions;
drop policy if exists "Đọc buổi học" on public.class_sessions;
drop policy if exists "Quản lý ghi buổi học" on public.class_sessions;
drop policy if exists "Người dạy cập nhật buổi" on public.class_sessions;
create policy "Đọc buổi học" on public.class_sessions for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'sale'])
    or (select auth.uid()) in (teacher_id, assistant_id)
    or (class_id is not null and public.works_in_class(class_id)));
create policy "Quản lý ghi buổi học" on public.class_sessions for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']));
-- Sale đặt lịch học thử cho nhu cầu.
drop policy if exists "Sale đặt học thử" on public.class_sessions;
create policy "Sale đặt học thử" on public.class_sessions for insert to authenticated
  with check (kind = 'hoc-thu' and public.has_any_role(coach_id, array['sale']));
-- Người dạy / trợ giảng hoàn tất buổi của mình (không đổi lớp, giờ hay người dạy: xem trigger dưới).
create policy "Người dạy cập nhật buổi" on public.class_sessions for update to authenticated
  using (public.works_in_session(id)) with check (public.works_in_session(id));

create or replace function public.guard_session_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.has_any_role(old.coach_id, array['chu', 'quan-ly']) then
    return new;
  end if;
  -- Coach / trợ giảng chỉ đổi trạng thái, chủ đề, giáo án buổi.
  if new.class_id is distinct from old.class_id or new.starts_at <> old.starts_at or new.ends_at <> old.ends_at
     or new.teacher_id is distinct from old.teacher_id or new.assistant_id is distinct from old.assistant_id
     or new.venue_id is distinct from old.venue_id or new.coach_id <> old.coach_id then
    raise exception 'only_manager_can_reschedule' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists class_sessions_guard on public.class_sessions;
create trigger class_sessions_guard before update on public.class_sessions
  for each row execute function public.guard_session_update();

-- điểm danh, nhận xét
drop policy if exists "Thành viên đọc ghi" on public.attendance;
drop policy if exists "Điểm danh" on public.attendance;
create policy "Điểm danh" on public.attendance for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']) or public.works_in_session(session_id))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']) or public.works_in_session(session_id));

drop policy if exists "Thành viên đọc ghi" on public.session_feedback;
drop policy if exists "Nhận xét buổi" on public.session_feedback;
create policy "Nhận xét buổi" on public.session_feedback for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']) or public.works_in_session(session_id))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']) or public.works_in_session(session_id));

-- giờ rảnh
drop policy if exists "Thành viên đọc ghi" on public.free_slots;
drop policy if exists "Thành viên xem giờ rảnh" on public.free_slots;
drop policy if exists "Quản lý ghi giờ rảnh" on public.free_slots;
create policy "Thành viên xem giờ rảnh" on public.free_slots for select to authenticated
  using (public.is_coach_member(coach_id));
create policy "Quản lý ghi giờ rảnh" on public.free_slots for all to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']))
  with check (public.has_any_role(coach_id, array['chu', 'quan-ly']));

-- Danh sách học viên của một buổi, chỉ tên + số buổi còn lại + điểm danh. Không có SĐT, học phí, ghi chú.
-- Gọi được khi là coach chủ, quản lý, hoặc người dạy / trợ giảng của buổi.
create or replace function public.session_roster(p_session uuid)
returns table (student_id uuid, full_name text, sessions_total int, used int, attendance text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.class_sessions;
begin
  select * into v from public.class_sessions where id = p_session;
  if v.id is null then
    return;
  end if;
  if not (public.has_any_role(v.coach_id, array['chu', 'quan-ly']) or public.works_in_session(p_session)) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select st.id, st.full_name, e.sessions_total,
      (select count(*)::int from public.attendance a join public.class_sessions s2 on s2.id = a.session_id
        where a.student_id = st.id and s2.class_id = v.class_id and a.status in ('co-mat', 'vang')),
      (select a.status from public.attendance a where a.session_id = p_session and a.student_id = st.id)
    from public.enrollments e join public.students st on st.id = e.student_id
    where v.class_id is not null and e.class_id = v.class_id
      and (e.status = 'dang-hoc' or exists (select 1 from public.attendance a where a.session_id = p_session and a.student_id = st.id))
    order by st.full_name;
end;
$$;
revoke all on function public.session_roster(uuid) from public, anon;
grant execute on function public.session_roster(uuid) to authenticated;
