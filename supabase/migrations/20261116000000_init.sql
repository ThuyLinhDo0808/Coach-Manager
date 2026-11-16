-- Coach Trung Muối — lược đồ ban đầu.
-- Mọi bảng dữ liệu đều có coach_id để sau này nhiều coach dùng chung.
-- Quyền: khách (anon) chỉ đọc nội dung công khai và gửi nhu cầu qua hàm submit_lead;
-- thành viên của coach (owner / sale) đọc ghi dữ liệu của coach đó.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- coach
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  display_name text not null,
  tagline text,
  bio text,
  avatar_url text,
  cover_url text,
  birth_year int check (birth_year between 1940 and 2020),
  show_age boolean not null default true,
  gender text check (gender in ('nam', 'nu', 'khac')),
  area text,
  dupr numeric(4, 3),
  -- Số liệu nổi bật nhập tay (phần tự tính làm sau khi có lịch dạy).
  stat_hours int not null default 0,
  stat_students int not null default 0,
  stat_courses int not null default 0,
  stat_rating numeric(2, 1),
  teaching_style text[] not null default '{}',
  -- [{ "title": "Footwork", "text": "..." }]
  strengths jsonb not null default '[]',
  -- [{ "year": "2024", "title": "...", "detail": "..." }]
  experience jsonb not null default '[]',
  -- { "zalo": "...", "facebook": "...", "tiktok": "...", "youtube": "...", "phone": "...", "show_phone": false }
  contacts jsonb not null default '{}',
  accepting_students boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_members (
  coach_id uuid not null references public.coaches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'sale')),
  display_name text,
  created_at timestamptz not null default now(),
  primary key (coach_id, user_id)
);
create index on public.coach_members (user_id);

-- Người đang đăng nhập có thuộc coach này không (security definer để tránh vòng lặp RLS).
create function public.is_coach_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coach_members m
    where m.coach_id = cid and m.user_id = (select auth.uid())
  );
$$;

create function public.is_coach_owner(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.coach_members m
    where m.coach_id = cid and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------- sân
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  name text not null,
  address text,
  district text,
  image_url text,
  maps_url text,
  hours_text text,
  is_public boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.venues (coach_id);

-- ---------------------------------------------------------------- khoá học (mẫu khoá)
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  kind text not null check (kind in ('co-ban', 'sua-loi', 'nang-cao', 'luyen-cu', 'kid', 'kem-1-1')),
  cover_url text,
  summary text,
  audience text,
  goal text,
  session_count int,
  minutes_per_session int,
  max_students int,
  schedule_text text,
  venue_id uuid references public.venues (id) on delete set null,
  price_full int,
  price_single int,
  price_note text,
  -- [{ "title": "Buổi 1", "content": "Cầm vợt, tư thế" }]
  curriculum jsonb not null default '[]',
  commitments text[] not null default '{}',
  outcomes text[] not null default '{}',
  is_public boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, slug)
);
create index on public.courses (coach_id);

-- Lớp đang tuyển (một lần mở khoá có lịch cụ thể).
create table public.open_classes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  schedule_text text,
  venue_id uuid references public.venues (id) on delete set null,
  start_date date,
  seats_total int,
  seats_left int,
  is_public boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.open_classes (coach_id);

-- ---------------------------------------------------------------- kho video
create table public.video_groups (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  sort int not null default 0,
  unique (coach_id, slug)
);
create index on public.video_groups (coach_id);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  group_id uuid references public.video_groups (id) on delete set null,
  title text not null,
  -- Để trống khi clip chưa lên YouTube: trang công khai hiện "Sắp có".
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  description text,
  level text,
  course_kind text,
  -- Bản đầu chỉ dùng 'public'; 'students' và 'private' cho giai đoạn sau.
  visibility text not null default 'public' check (visibility in ('public', 'students', 'private')),
  published_on date,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.videos (coach_id, group_id);

-- ---------------------------------------------------------------- nhu cầu học (lead)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  status text not null default 'moi' check (status in (
    'moi', 'da-lien-he', 'hen-hoc-thu', 'cho-dong-tien', 'da-chot', 'danh-sach-cho', 'khong-thanh'
  )),
  -- Bước 1: về bạn
  full_name text not null check (char_length(full_name) between 2 and 80),
  gender text check (gender in ('nam', 'nu', 'khac')),
  birth_year int check (birth_year between 1930 and 2025),
  phone text not null check (phone ~ '^0[0-9]{9}$'),
  for_whom text check (for_whom in ('ban-than', 'con', 'nhom')),
  -- Bước 2: kinh nghiệm
  played_sports boolean,
  sports text[] not null default '{}',
  pickleball_duration text,
  dupr text,
  self_level text,
  -- Bước 3: mong muốn
  course_id uuid references public.courses (id) on delete set null,
  interests text[] not null default '{}',
  goal text,
  formats text[] not null default '{}',
  styles text[] not null default '{}',
  area text,
  -- { "t2": ["sang","toi"], "cn": ["chieu"] }
  availability jsonb not null default '{}',
  budget text,
  source text,
  note text check (char_length(note) <= 1000),
  -- Quản lý
  assigned_to uuid references auth.users (id) on delete set null,
  lost_reason text,
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.leads (coach_id, status, created_at desc);
create index on public.leads (coach_id, phone, created_at desc);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index on public.lead_notes (lead_id, created_at);

-- ---------------------------------------------------------------- updated_at
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger coaches_touch before update on public.coaches
  for each row execute function public.touch_updated_at();
create trigger courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- RLS
alter table public.coaches enable row level security;
alter table public.coach_members enable row level security;
alter table public.venues enable row level security;
alter table public.courses enable row level security;
alter table public.open_classes enable row level security;
alter table public.video_groups enable row level security;
alter table public.videos enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;

-- Nội dung công khai
create policy "Ai cũng xem hồ sơ coach" on public.coaches
  for select to anon, authenticated using (true);
create policy "Owner sửa hồ sơ" on public.coaches
  for update to authenticated
  using (public.is_coach_owner(id)) with check (public.is_coach_owner(id));

create policy "Thành viên xem danh sách thành viên" on public.coach_members
  for select to authenticated using (public.is_coach_member(coach_id));

create policy "Xem sân công khai" on public.venues
  for select to anon, authenticated using (is_public or public.is_coach_member(coach_id));
create policy "Owner quản lý sân" on public.venues
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

create policy "Xem khoá công khai" on public.courses
  for select to anon, authenticated using (is_public or public.is_coach_member(coach_id));
create policy "Owner quản lý khoá" on public.courses
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

create policy "Xem lớp đang tuyển" on public.open_classes
  for select to anon, authenticated using (is_public or public.is_coach_member(coach_id));
create policy "Owner quản lý lớp" on public.open_classes
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

create policy "Xem nhóm video" on public.video_groups
  for select to anon, authenticated using (true);
create policy "Owner quản lý nhóm video" on public.video_groups
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

create policy "Xem video công khai" on public.videos
  for select to anon, authenticated
  using (visibility = 'public' or public.is_coach_member(coach_id));
create policy "Owner quản lý video" on public.videos
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

-- Nhu cầu: khách không đọc được; chỉ thêm qua submit_lead.
create policy "Thành viên xem nhu cầu" on public.leads
  for select to authenticated using (public.is_coach_member(coach_id));
create policy "Thành viên cập nhật nhu cầu" on public.leads
  for update to authenticated
  using (public.is_coach_member(coach_id)) with check (public.is_coach_member(coach_id));
create policy "Thành viên thêm nhu cầu tay" on public.leads
  for insert to authenticated with check (public.is_coach_member(coach_id));

create policy "Thành viên xem ghi chú" on public.lead_notes
  for select to authenticated using (public.is_coach_member(coach_id));
create policy "Thành viên viết ghi chú" on public.lead_notes
  for insert to authenticated
  with check (public.is_coach_member(coach_id) and author_id = (select auth.uid()));

-- ---------------------------------------------------------------- gửi nhu cầu (khách)
-- Chống spam phía DB: cùng SĐT tối đa 3 lần/giờ, mỗi coach tối đa 60 nhu cầu/giờ.
create function public.submit_lead(p_coach_slug text, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coach uuid;
  v_id uuid;
  v_phone text := regexp_replace(coalesce(p ->> 'phone', ''), '[^0-9]', '', 'g');
begin
  select id into v_coach from public.coaches where slug = p_coach_slug and accepting_students;
  if v_coach is null then
    raise exception 'coach_not_found' using errcode = 'P0002';
  end if;

  if (select count(*) from public.leads
      where coach_id = v_coach and phone = v_phone and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.leads
      where coach_id = v_coach and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.leads (
    coach_id, full_name, gender, birth_year, phone, for_whom,
    played_sports, sports, pickleball_duration, dupr, self_level,
    course_id, interests, goal, formats, styles, area, availability, budget, source, note
  ) values (
    v_coach,
    trim(p ->> 'full_name'),
    nullif(p ->> 'gender', ''),
    nullif(p ->> 'birth_year', '')::int,
    v_phone,
    nullif(p ->> 'for_whom', ''),
    (p ->> 'played_sports')::boolean,
    coalesce(array(select jsonb_array_elements_text(p -> 'sports')), '{}'),
    nullif(p ->> 'pickleball_duration', ''),
    nullif(p ->> 'dupr', ''),
    nullif(p ->> 'self_level', ''),
    (select c.id from public.courses c
      where c.coach_id = v_coach and c.id::text = p ->> 'course_id'),
    coalesce(array(select jsonb_array_elements_text(p -> 'interests')), '{}'),
    nullif(p ->> 'goal', ''),
    coalesce(array(select jsonb_array_elements_text(p -> 'formats')), '{}'),
    coalesce(array(select jsonb_array_elements_text(p -> 'styles')), '{}'),
    nullif(p ->> 'area', ''),
    coalesce(p -> 'availability', '{}'),
    nullif(p ->> 'budget', ''),
    nullif(p ->> 'source', ''),
    nullif(p ->> 'note', '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_lead(text, jsonb) from public;
grant execute on function public.submit_lead(text, jsonb) to anon, authenticated;
revoke all on function public.is_coach_member(uuid) from public;
revoke all on function public.is_coach_owner(uuid) from public;
grant execute on function public.is_coach_member(uuid) to anon, authenticated;
grant execute on function public.is_coach_owner(uuid) to anon, authenticated;
