-- Nền cho đợt 2–4: cài đặt của coach (jsonb), vai trò trợ giảng, hoa hồng / lương theo thành viên.

alter table public.coaches add column if not exists settings jsonb not null default '{}';

alter table public.coach_members drop constraint if exists coach_members_role_check;
alter table public.coach_members add constraint coach_members_role_check
  check (role in ('owner', 'sale', 'tro-giang'));

-- Hoa hồng sale: % trên mỗi khoá chốt. Lương trợ giảng: đồng / buổi đã dạy.
alter table public.coach_members add column if not exists commission_pct numeric(5, 2) not null default 0
  check (commission_pct between 0 and 100);
alter table public.coach_members add column if not exists wage_per_session int not null default 0
  check (wage_per_session >= 0);
