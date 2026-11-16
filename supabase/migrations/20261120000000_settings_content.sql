-- Đợt 4: Cài đặt (sân, thành viên & lời mời, mẫu tin nhắn) và quản lý nội dung.
-- Chạy lại nhiều lần cũng không sao.

-- ---------------------------------------------------------------- sân dạy
-- Số sân và giá thuê / giờ (đồng). Giá thuê dùng để tính chi phí sân ở phần Thu chi.
alter table public.venues add column if not exists court_count int check (court_count between 1 and 99);
alter table public.venues add column if not exists rent_per_hour int check (rent_per_hour >= 0);

-- ---------------------------------------------------------------- thành viên
-- Email lúc nhận lời mời, để coach biết ai là ai (bảng auth.users không đọc được từ web).
alter table public.coach_members add column if not exists email text;

drop policy if exists "Owner thêm thành viên" on public.coach_members;
create policy "Owner thêm thành viên" on public.coach_members
  for insert to authenticated with check (public.is_coach_owner(coach_id));

drop policy if exists "Owner sửa thành viên" on public.coach_members;
create policy "Owner sửa thành viên" on public.coach_members
  for update to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

-- Không ai tự gỡ chính mình qua API.
drop policy if exists "Owner gỡ thành viên" on public.coach_members;
create policy "Owner gỡ thành viên" on public.coach_members
  for delete to authenticated
  using (public.is_coach_owner(coach_id) and user_id <> (select auth.uid()));

-- Supabase có thể đã tự cấp mọi quyền cho bảng mới: thu lại rồi cấp đúng phần cần.
revoke insert, update, delete on public.coach_members from anon, authenticated;
grant insert, delete on public.coach_members to authenticated;
-- Chỉ sửa được các cột này; coach_id / user_id / email không đổi qua API.
grant update (role, display_name, commission_pct, wage_per_session) on public.coach_members to authenticated;

-- Chặn ở tầng database: không tự đổi vai trò của mình, không gỡ / hạ vai trò owner cuối cùng.
-- Thao tác từ SQL Editor (không có auth.uid()) thì không chặn.
create or replace function public.guard_coach_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.coach_id <> old.coach_id or new.user_id <> old.user_id then
      raise exception 'member_key_locked' using errcode = 'P0001';
    end if;
    if new.role = old.role then
      return new;
    end if;
  end if;
  if old.user_id = v_uid then
    raise exception 'cannot_change_self' using errcode = 'P0001';
  end if;
  if old.role = 'owner'
     and exists (select 1 from public.coaches c where c.id = old.coach_id)
     and not exists (
       select 1 from public.coach_members m
       where m.coach_id = old.coach_id and m.role = 'owner' and m.user_id <> old.user_id
     ) then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_coach_members() from public, anon, authenticated;

drop trigger if exists coach_members_guard on public.coach_members;
create trigger coach_members_guard before update or delete on public.coach_members
  for each row execute function public.guard_coach_members();

-- ---------------------------------------------------------------- lời mời thành viên
-- Owner nhập email + vai trò. Người được mời tạo tài khoản ở /tham-gia rồi gọi accept_invite().
-- Không mời được vai trò owner.
create table if not exists public.member_invites (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  email text not null check (
    email = lower(email) and char_length(email) <= 200 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  role text not null check (role in ('sale', 'tro-giang')),
  display_name text check (char_length(display_name) <= 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index if not exists member_invites_pending
  on public.member_invites (coach_id, email) where accepted_at is null;
create index if not exists member_invites_email on public.member_invites (email);

alter table public.member_invites enable row level security;

drop policy if exists "Owner quản lý lời mời" on public.member_invites;
create policy "Owner quản lý lời mời" on public.member_invites
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

revoke all on public.member_invites from public, anon, authenticated;
-- Không cấp update: lời mời chỉ được đánh dấu đã nhận qua hàm accept_invite().
grant select, insert, delete on public.member_invites to authenticated;

-- Người vừa đăng nhập nhận các lời mời gửi tới email của mình. Trả về số lời mời đã nhận.
-- Lưu ý: hàm tin email trong auth.users. Nên bật "Confirm email" trong Supabase Auth để
-- chỉ chủ hộp thư mới nhận được lời mời.
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
  -- Chỉ tin email đã được xác nhận (email_confirmed_at). Nếu chưa xác nhận thì không nhận lời mời.
  select lower(u.email) into v_email from auth.users u where u.id = v_uid and u.email_confirmed_at is not null;
  if v_email is null or v_email = '' then
    return 0;
  end if;

  for r in
    select i.id, i.coach_id, i.role, i.display_name
    from public.member_invites i
    where lower(i.email) = v_email and i.accepted_at is null
    order by i.created_at
    for update
  loop
    insert into public.coach_members (coach_id, user_id, role, display_name, email)
    values (r.coach_id, v_uid, r.role, r.display_name, v_email)
    on conflict (coach_id, user_id) do nothing;
    update public.member_invites set accepted_at = now() where id = r.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.accept_invite() from public, anon;
grant execute on function public.accept_invite() to authenticated;

-- ---------------------------------------------------------------- mẫu tin nhắn
-- Web chưa tự gửi tin: coach sao chép nội dung rồi dán sang Zalo.
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9-]{2,40}$'),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 2000),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (coach_id, key)
);

drop trigger if exists message_templates_touch on public.message_templates;
create trigger message_templates_touch before update on public.message_templates
  for each row execute function public.touch_updated_at();

alter table public.message_templates enable row level security;

drop policy if exists "Thành viên xem mẫu tin" on public.message_templates;
create policy "Thành viên xem mẫu tin" on public.message_templates
  for select to authenticated using (public.is_coach_member(coach_id));

drop policy if exists "Owner quản lý mẫu tin" on public.message_templates;
create policy "Owner quản lý mẫu tin" on public.message_templates
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

revoke all on public.message_templates from public, anon, authenticated;
grant select, insert, update, delete on public.message_templates to authenticated;
