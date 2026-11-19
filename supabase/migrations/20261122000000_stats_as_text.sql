-- Số liệu nổi bật trên hồ sơ coach là chữ tự do (ví dụ "~1000", "> 100"), không bắt buộc là số.
alter table public.coaches alter column stat_hours drop default;
alter table public.coaches alter column stat_students drop default;
alter table public.coaches alter column stat_courses drop default;
alter table public.coaches alter column stat_years drop default;

alter table public.coaches
  alter column stat_hours type text using stat_hours::text,
  alter column stat_students type text using stat_students::text,
  alter column stat_courses type text using stat_courses::text,
  alter column stat_years type text using stat_years::text;

alter table public.coaches alter column stat_hours set default '';
alter table public.coaches alter column stat_students set default '';
alter table public.coaches alter column stat_courses set default '';
alter table public.coaches alter column stat_years set default '';

alter table public.coaches drop constraint if exists coaches_stat_text_len;
alter table public.coaches add constraint coaches_stat_text_len check (
  char_length(stat_hours) <= 20 and char_length(stat_students) <= 20
  and char_length(stat_courses) <= 20 and char_length(stat_years) <= 20
);
