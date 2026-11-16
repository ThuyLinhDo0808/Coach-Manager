-- Giai đoạn 1: bài viết, đánh giá, nhật ký nhu cầu, vài cột cho trang công khai.

alter table public.coaches add column if not exists stat_years int not null default 0;
alter table public.videos add column if not exists duration_text text;
alter table public.videos add column if not exists course_id uuid references public.courses (id) on delete set null;

-- ---------------------------------------------------------------- bài viết
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,120}$'),
  title text not null,
  excerpt text,
  topic text not null default 'ky-thuat' check (topic in ('luat', 'ky-thuat', 'chien-thuat', 'the-luc', 'dung-cu')),
  cover_url text,
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  body text not null default '',
  read_minutes int not null default 3,
  is_featured boolean not null default false,
  status text not null default 'nhap' check (status in ('nhap', 'da-dang', 'an')),
  published_at timestamptz,
  course_id uuid references public.courses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, slug)
);
create index on public.posts (coach_id, status, published_at desc);
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- đánh giá
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  course_id uuid references public.courses (id) on delete set null,
  is_pinned boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.reviews (coach_id, created_at desc);

alter table public.posts enable row level security;
alter table public.reviews enable row level security;

create policy "Xem bài đã đăng" on public.posts
  for select to anon, authenticated
  using (status = 'da-dang' or public.is_coach_member(coach_id));
create policy "Owner quản lý bài viết" on public.posts
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

create policy "Xem đánh giá công khai" on public.reviews
  for select to anon, authenticated
  using (is_public or public.is_coach_member(coach_id));
create policy "Owner quản lý đánh giá" on public.reviews
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));

grant select on public.posts, public.reviews to anon, authenticated;
grant insert, update, delete on public.posts, public.reviews to authenticated;

-- ---------------------------------------------------------------- nhu cầu: nguồn + nhật ký
alter table public.leads add column if not exists origin text not null default 'form'
  check (origin in ('form', 'facebook', 'zalo', 'tiktok', 'gioi-thieu', 'truc-tiep', 'khac'));
alter table public.leads add column if not exists remind_on date;

alter table public.lead_notes add column if not exists kind text not null default 'ghi-chu'
  check (kind in ('ghi-chu', 'goi', 'nhan', 'hen', 'trang-thai', 'he-thong'));

-- Gửi nhu cầu: như cũ, thêm dòng nhật ký "Gợi ý" nếu khoá quan tâm có lớp còn chỗ.
create or replace function public.submit_lead(p_coach_slug text, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coach uuid;
  v_id uuid;
  v_course uuid;
  v_hint text;
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

  select c.id into v_course from public.courses c
    where c.coach_id = v_coach and c.id::text = p ->> 'course_id';

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
    v_course,
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

  select 'Gợi ý: ' || oc.title || coalesce(', ' || oc.schedule_text, '') || ', còn ' || oc.seats_left || ' chỗ'
    into v_hint
    from public.open_classes oc
    where oc.coach_id = v_coach and oc.is_public and coalesce(oc.seats_left, 0) > 0
      and (v_course is null or oc.course_id = v_course)
    order by (oc.course_id = v_course) desc nulls last, oc.start_date nulls last
    limit 1;
  if v_hint is not null then
    insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
    values (v_coach, v_id, null, v_hint, 'he-thong');
  end if;

  return v_id;
end;
$$;
