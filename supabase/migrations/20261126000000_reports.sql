-- Báo cáo lãi / lỗ và thống kê theo bút toán chia tiền. Cần chạy sau 20261125000000_month_close_funds.sql.
-- Quản lý và cổ đông không đọc từng bút toán (có học phí từng học viên); họ xem số tổng qua hàm này.

-- Tổng theo tháng: doanh thu đã dạy (khoản đem chia), từng phần, trợ giảng, chi quỹ. Tiền tính bằng đồng.
create or replace function public.split_summary(p_coach uuid, p_from text, p_to text)
returns table (month text, kind text, amount bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  m text;
begin
  if not public.has_any_role(p_coach, array['chu', 'quan-ly', 'co-dong']) then
    return;
  end if;
  return query
    -- doanh thu đã dạy: mỗi (buổi × học viên) tính một lần
    select x.month, 'doanh-thu'::text, sum(x.base)::bigint
    from (select distinct e.month, e.session_id, e.student_id, e.base_amount as base
          from public.split_entries e where e.coach_id = p_coach and e.month between p_from and p_to) x
    group by x.month
    union all
    select e.month, e.party_kind, sum(e.amount)::bigint
    from public.split_entries e where e.coach_id = p_coach and e.month between p_from and p_to
    group by e.month, e.party_kind
    union all
    select to_char(f.spent_on, 'YYYY-MM'), 'chi-' || f.fund, sum(f.amount)::bigint
    from public.fund_expenses f where f.coach_id = p_coach and to_char(f.spent_on, 'YYYY-MM') between p_from and p_to
    group by 1, f.fund
    union all
    select to_char(f.spent_on, 'YYYY-MM'), 'chi-loai-' || f.category, sum(f.amount)::bigint
    from public.fund_expenses f where f.coach_id = p_coach and to_char(f.spent_on, 'YYYY-MM') between p_from and p_to
    group by 1, f.category;
  -- trợ giảng (ngoài 6 phần) và tiền học viên trả cho trợ giảng
  m := p_from;
  while m <= p_to loop
    return query select m, 'tro-giang'::text, coalesce(sum(d.amount), 0)::bigint from public.assistant_due(p_coach, m) d having coalesce(sum(d.amount), 0) > 0;
    m := public.next_month(m);
  end loop;
  return query
    select a.month, 'tro-giang-hv-tra'::text, sum(a.student_paid)::bigint
    from public.assistant_payments a where a.coach_id = p_coach and a.month between p_from and p_to
    group by a.month having sum(a.student_paid) > 0;
end;
$$;
revoke all on function public.split_summary(uuid, text, text) from public, anon;
grant execute on function public.split_summary(uuid, text, text) to authenticated;

-- Hiệu suất coach (chỉ coach chủ): mỗi người dạy, mỗi tháng: số buổi, số buổi dạy thay, lượt học viên, khoản đem chia, phần coach.
create or replace function public.coach_performance(p_coach uuid, p_from text, p_to text)
returns table (month text, teacher_id uuid, sessions int, substitute int, student_turns int, revenue bigint, coach_amount bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select cs.id, cs.teacher_id, to_char((cs.starts_at at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM') as month,
      (c.main_coach_id is not null and cs.teacher_id is distinct from c.main_coach_id) as sub
    from public.class_sessions cs join public.classes c on c.id = cs.class_id
    where cs.coach_id = p_coach and cs.kind = 'day' and cs.status <> 'huy' and cs.teacher_id is not null
      and (cs.status = 'da-day' or exists (select 1 from public.attendance a where a.session_id = cs.id))
  )
  select s.month, s.teacher_id, count(*)::int, count(*) filter (where s.sub)::int,
    coalesce(sum((select count(distinct e.student_id) from public.split_entries e where e.session_id = s.id)), 0)::int,
    coalesce(sum((select sum(x.base_amount) from (select distinct e.student_id, e.base_amount from public.split_entries e where e.session_id = s.id) x)), 0)::bigint,
    coalesce(sum((select sum(e.amount) from public.split_entries e where e.session_id = s.id and e.party_kind = 'coach')), 0)::bigint
  from s
  where s.month between p_from and p_to and public.has_any_role(p_coach, array['chu'])
  group by s.month, s.teacher_id;
$$;
revoke all on function public.coach_performance(uuid, text, text) from public, anon;
grant execute on function public.coach_performance(uuid, text, text) to authenticated;
