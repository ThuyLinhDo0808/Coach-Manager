-- Đợt 2: lớp học, buổi học, giờ rảnh, học viên, đăng ký lớp, điểm danh, nhận xét.
-- Thành viên của coach (owner / sale / trợ giảng) đọc ghi; khách chỉ đọc lớp đang tuyển
-- và giờ rảnh qua hàm công khai (không lộ tên học viên).

-- ---------------------------------------------------------------- lớp
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  kind text not null default 'lop' check (kind in ('lop', 'kem-1-1', 'buoi-le')),
  venue_id uuid references public.venues (id) on delete set null,
  schedule_text text,
  start_date date,
  max_students int check (max_students between 1 and 100),
  price int check (price >= 0),
  is_recruiting boolean not null default false,
  status text not null default 'sap-dien-ra' check (status in ('sap-dien-ra', 'dang-dien-ra', 'da-ket-thuc', 'huy')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.classes (coach_id, status);
create trigger classes_touch before update on public.classes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- học viên
create table public.students (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text check (phone ~ '^0[0-9]{9}$'),
  gender text check (gender in ('nam', 'nu', 'khac')),
  birth_date date,
  birth_year int check (birth_year between 1930 and 2025),
  status text not null default 'dang-hoc' check (status in ('dang-hoc', 'da-hoc', 'da-nghi')),
  dupr_start numeric(4, 2),
  dupr_current numeric(4, 2),
  note text,
  birthday_gift_year int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.students (coach_id, status);
create unique index students_lead_once on public.students (lead_id) where lead_id is not null;
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- đăng ký lớp
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'dang-hoc' check (status in ('dang-hoc', 'tot-nghiep', 'nghi')),
  sessions_total int check (sessions_total >= 0),
  price int check (price >= 0),
  final_dupr numeric(4, 2),
  final_note text,
  final_video_url text,
  graduated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);
create index on public.enrollments (coach_id, student_id);

-- ---------------------------------------------------------------- buổi học
create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  kind text not null default 'day' check (kind in ('day', 'hoc-thu')),
  seq int,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue_id uuid references public.venues (id) on delete set null,
  topic text,
  plan text,
  status text not null default 'du-kien' check (status in ('du-kien', 'da-day', 'huy')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (class_id is not null or kind = 'hoc-thu')
);
create index on public.class_sessions (coach_id, starts_at);
create index on public.class_sessions (class_id, starts_at);

create table public.attendance (
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete cascade,
  status text not null check (status in ('co-mat', 'vang', 'bao-nghi')),
  marked_by uuid references auth.users (id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index on public.attendance (coach_id, student_id);

create table public.session_feedback (
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  coach_id uuid not null references public.coaches (id) on delete cascade,
  -- { "giao_bong": 4, "dink": 3, "volley": 3, "footwork": 4 } (1–5)
  scores jsonb not null default '{}',
  comment text check (char_length(comment) <= 2000),
  video_url text,
  homework_video_id uuid references public.videos (id) on delete set null,
  shared boolean not null default true,
  author_id uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (session_id, student_id)
);
create index on public.session_feedback (coach_id, student_id);

-- ---------------------------------------------------------------- giờ rảnh (lặp theo tuần)
create table public.free_slots (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  weekday int not null check (weekday between 1 and 7), -- 1 = Thứ 2 … 7 = Chủ nhật
  start_time time not null,
  end_time time not null,
  venue_id uuid references public.venues (id) on delete set null,
  is_public boolean not null default true,
  check (end_time > start_time)
);
create index on public.free_slots (coach_id, weekday);

-- ---------------------------------------------------------------- RLS + quyền
do $$
declare t text;
begin
  foreach t in array array['classes', 'students', 'enrollments', 'class_sessions', 'attendance', 'session_feedback', 'free_slots'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Thành viên đọc ghi" on public.%I for all to authenticated
         using (public.is_coach_member(coach_id)) with check (public.is_coach_member(coach_id))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

create policy "Xem giờ rảnh công khai" on public.free_slots
  for select to anon using (is_public);
grant select on public.free_slots to anon;

-- ---------------------------------------------------------------- lớp đang tuyển (công khai)
-- Thay bảng open_classes nhập tay: số chỗ còn lại tính từ đăng ký thật.
insert into public.classes (id, coach_id, course_id, title, venue_id, schedule_text, start_date, max_students, is_recruiting)
select id, coach_id, course_id, title, venue_id, schedule_text, start_date, seats_total, is_public
from public.open_classes
on conflict (id) do nothing;

drop table public.open_classes;

create function public.list_open_classes(p_coach uuid)
returns table (
  id uuid, course_id uuid, title text, schedule_text text, venue_id uuid,
  start_date date, seats_total int, seats_left int
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.course_id, c.title, c.schedule_text, c.venue_id, c.start_date, c.max_students,
    case when c.max_students is null then null
      else greatest(c.max_students - (
        select count(*)::int from public.enrollments e where e.class_id = c.id and e.status = 'dang-hoc'
      ), 0) end
  from public.classes c
  where c.coach_id = p_coach and c.is_recruiting and c.status in ('sap-dien-ra', 'dang-dien-ra')
  order by c.start_date nulls last, c.created_at;
$$;
revoke all on function public.list_open_classes(uuid) from public;
grant execute on function public.list_open_classes(uuid) to anon, authenticated;

-- Khung giờ đã có buổi dạy trong một khoảng ngày (không kèm tên lớp hay học viên).
create function public.list_busy_times(p_coach uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.starts_at, s.ends_at
  from public.class_sessions s
  where s.coach_id = p_coach and s.status <> 'huy'
    and s.starts_at < p_to and s.ends_at > p_from
    and p_to - p_from <= interval '31 days';
$$;
revoke all on function public.list_busy_times(uuid, timestamptz, timestamptz) from public;
grant execute on function public.list_busy_times(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------- gửi nhu cầu: gợi ý lấy từ lớp đang tuyển
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
    from public.list_open_classes(v_coach) oc
    where coalesce(oc.seats_left, 1) > 0 and oc.seats_left is not null
      and (v_course is null or oc.course_id = v_course)
    limit 1;
  if v_hint is not null then
    insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
    values (v_coach, v_id, null, v_hint, 'he-thong');
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------- chốt nhu cầu → học viên + đăng ký lớp
-- Tạo học viên từ nhu cầu (nếu chưa có), ghi danh vào lớp (nếu chọn), chuyển nhu cầu sang Đã chốt.
create function public.close_lead(p_lead uuid, p_class uuid default null, p_price int default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.leads;
  v_student uuid;
  v_sessions int;
begin
  select * into v_lead from public.leads where id = p_lead for update;
  if v_lead.id is null then
    raise exception 'lead_not_found';
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
    insert into public.enrollments (coach_id, class_id, student_id, sessions_total, price)
    values (v_lead.coach_id, p_class, v_student, v_sessions, p_price)
    on conflict (class_id, student_id) do nothing;
  end if;

  update public.leads set status = 'da-chot', lost_reason = null, contacted_at = coalesce(contacted_at, now())
    where id = p_lead;
  insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
  values (v_lead.coach_id, p_lead, (select auth.uid()),
    'Chốt' || coalesce(' vào lớp ' || (select title from public.classes where id = p_class), ''), 'trang-thai');

  return v_student;
end;
$$;
revoke all on function public.close_lead(uuid, uuid, int) from public;
grant execute on function public.close_lead(uuid, uuid, int) to authenticated;
