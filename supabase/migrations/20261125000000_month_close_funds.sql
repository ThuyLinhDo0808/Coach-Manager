-- Chốt tháng, chi trả, nhật ký sửa, điều chỉnh tháng sau, các quỹ, trợ giảng.
-- Cần chạy sau 20261124000000_split_engine.sql. Chạy lại nhiều lần cũng không sao.

-- ================================================================ trợ giảng (ngoài 6 phần chia)
-- Cơ chế theo lớp: tiền mỗi buổi trợ giảng và / hoặc tiền cố định mỗi tháng có buổi.
create table if not exists public.assistant_rates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  assistant_id uuid not null references auth.users (id) on delete cascade,
  per_session int not null default 0 check (per_session >= 0),
  per_month int not null default 0 check (per_month >= 0),
  note text,
  created_at timestamptz not null default now(),
  unique (class_id, assistant_id)
);

-- Theo tháng: học viên đã trả tiền trợ giảng bao nhiêu, đã chuyển cho trợ giảng bao nhiêu (+ ảnh).
create table if not exists public.assistant_payments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  class_id uuid not null references public.classes (id) on delete cascade,
  assistant_id uuid not null references auth.users (id) on delete cascade,
  student_paid int not null default 0 check (student_paid >= 0),
  paid_amount int not null default 0 check (paid_amount >= 0),
  paid_at timestamptz,
  proof_path text,
  note text,
  updated_at timestamptz not null default now(),
  unique (coach_id, month, class_id, assistant_id)
);

-- Tiền trợ giảng phải trả trong tháng: buổi (không huỷ, đã hoàn tất hoặc đã điểm danh) có người đó làm trợ giảng.
-- Coach chủ / quản lý thấy hết; trợ giảng thấy của mình; coach thấy các lớp mình dạy chính.
drop function if exists public.assistant_due(uuid, text);
create function public.assistant_due(p_coach uuid, p_month text)
returns table (class_id uuid, assistant_id uuid, sessions int, per_session int, per_month int, amount int, class_title text)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select cs.class_id, cs.assistant_id, count(*)::int as n
    from public.class_sessions cs
    where cs.coach_id = p_coach and cs.assistant_id is not null and cs.class_id is not null and cs.status <> 'huy'
      and to_char((cs.starts_at at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM') = p_month
      and (cs.status = 'da-day' or exists (select 1 from public.attendance a where a.session_id = cs.id))
    group by 1, 2
  )
  select s.class_id, s.assistant_id, s.n, coalesce(r.per_session, 0), coalesce(r.per_month, 0),
    coalesce(r.per_session, 0) * s.n + coalesce(r.per_month, 0), c.title
  from s
  join public.classes c on c.id = s.class_id
  left join public.assistant_rates r on r.class_id = s.class_id and r.assistant_id = s.assistant_id
  where public.has_any_role(p_coach, array['chu', 'quan-ly'])
     or s.assistant_id = (select auth.uid())
     or exists (select 1 from public.classes c where c.id = s.class_id and c.main_coach_id = (select auth.uid()))
     or (select auth.uid()) is null;
$$;
revoke all on function public.assistant_due(uuid, text) from public, anon;
grant execute on function public.assistant_due(uuid, text) to authenticated;

-- ================================================================ chi trả sau chốt tháng
-- Mỗi người (gộp coach + sale + cổ đông + trợ giảng + điều chỉnh) và mỗi quỹ một dòng.
create table if not exists public.split_payouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  month text not null,
  party_key text not null, -- 'u:<user_id>' | 'n:<tên>' | 'quy-du-phong' | 'quy-van-hanh' | 'quy-phat-trien'
  party_kind text not null check (party_kind in ('nguoi', 'quy')),
  party_user_id uuid references auth.users (id) on delete set null,
  party_name text not null,
  -- {"coach": .., "sale": .., "co-dong": .., "tro-giang": .., "dieu-chinh": .., "sua-tay": ..}
  breakdown jsonb not null default '{}',
  amount int not null,
  paid_at timestamptz,
  paid_by uuid references auth.users (id) on delete set null,
  proof_path text,
  paid_note text,
  created_at timestamptz not null default now(),
  unique (coach_id, month, party_key)
);
create index if not exists split_payouts_user on public.split_payouts (party_user_id);

-- Sửa sau khi đã trả: phần chênh lệch đưa vào tháng sau.
create table if not exists public.split_adjustments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  from_month text not null,
  to_month text not null,
  party_key text not null,
  party_kind text not null check (party_kind in ('nguoi', 'quy')),
  party_user_id uuid references auth.users (id) on delete set null,
  party_name text not null,
  amount int not null,
  reason text not null check (length(trim(reason)) >= 3),
  applied_payout_id uuid references public.split_payouts (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Nhật ký: ai sửa, lúc nào, số cũ, số mới, lý do.
create table if not exists public.split_audit (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  month text not null,
  payout_id uuid references public.split_payouts (id) on delete set null,
  party_name text,
  action text not null, -- chot-thang | sua-so | dieu-chinh-thang-sau | da-tra | bo-da-tra
  old_amount int,
  new_amount int,
  reason text,
  actor uuid references auth.users (id) on delete set null,
  actor_name text,
  at timestamptz not null default now()
);
create index if not exists split_audit_month on public.split_audit (coach_id, month, at desc);

create or replace function public.next_month(m text)
returns text
language sql
immutable
set search_path = ''
as $$
  select to_char((m || '-01')::date + interval '1 month', 'YYYY-MM');
$$;

create or replace function public.actor_name(cid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select display_name from public.coach_members where coach_id = cid and user_id = (select auth.uid());
$$;

-- Chốt tháng: tính lại bút toán, khoá tháng, lập bảng phải trả. Chỉ coach chủ.
create or replace function public.close_split_month(p_coach uuid, p_month text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.has_any_role(p_coach, array['chu']) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  if p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' or p_month > to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM') then
    raise exception 'month_invalid';
  end if;
  if public.month_closed(p_coach, p_month) then
    raise exception 'month_already_closed';
  end if;
  perform public.regen_month_split(p_coach, p_month);
  insert into public.split_months (coach_id, month, closed_by) values (p_coach, p_month, (select auth.uid()));

  with parts as (
    -- người: coach / sale / cổ đông
    select case when e.party_user_id is not null then 'u:' || e.party_user_id else 'n:' || coalesce(e.party_name, '?') end as key,
      'nguoi' as pk, e.party_user_id as uid, coalesce(m.display_name, e.party_name, 'Thành viên') as name, e.party_kind as comp, e.amount::bigint as amt
    from public.split_entries e
    left join public.coach_members m on m.coach_id = e.coach_id and m.user_id = e.party_user_id
    where e.coach_id = p_coach and e.month = p_month and e.party_kind in ('sale', 'coach', 'co-dong')
    union all
    -- quỹ
    select e.party_kind, 'quy', null, case e.party_kind when 'quy-du-phong' then 'Quỹ dự phòng' when 'quy-van-hanh' then 'Quỹ vận hành' else 'Quỹ phát triển' end,
      e.party_kind, e.amount::bigint
    from public.split_entries e
    where e.coach_id = p_coach and e.month = p_month and e.party_kind like 'quy-%'
    union all
    -- trợ giảng
    select 'u:' || d.assistant_id, 'nguoi', d.assistant_id, coalesce(m.display_name, 'Trợ giảng'), 'tro-giang', d.amount::bigint
    from public.assistant_due(p_coach, p_month) d
    left join public.coach_members m on m.coach_id = p_coach and m.user_id = d.assistant_id
    where d.amount > 0
    union all
    -- điều chỉnh từ tháng trước
    select a.party_key, a.party_kind, a.party_user_id, a.party_name, 'dieu-chinh', a.amount::bigint
    from public.split_adjustments a
    where a.coach_id = p_coach and a.to_month = p_month and a.applied_payout_id is null
  ), comp as (
    select key, pk, (array_agg(uid) filter (where uid is not null))[1] as uid, max(name) as name, comp, sum(amt) as amt
    from parts group by key, pk, comp
  )
  insert into public.split_payouts (coach_id, month, party_key, party_kind, party_user_id, party_name, breakdown, amount)
  select p_coach, p_month, key, pk, (array_agg(uid) filter (where uid is not null))[1], max(name), jsonb_object_agg(comp, amt), sum(amt)::int
  from comp group by key, pk;
  get diagnostics v_count = row_count;

  update public.split_adjustments a set applied_payout_id = p.id
  from public.split_payouts p
  where a.coach_id = p_coach and a.to_month = p_month and a.applied_payout_id is null
    and p.coach_id = p_coach and p.month = p_month and p.party_key = a.party_key;

  insert into public.split_audit (coach_id, month, action, new_amount, actor, actor_name)
  values (p_coach, p_month, 'chot-thang',
    (select coalesce(sum(amount), 0) from public.split_payouts where coach_id = p_coach and month = p_month),
    (select auth.uid()), public.actor_name(p_coach));
  return v_count;
end;
$$;

-- Sửa số phải trả sau khi chốt. Bắt buộc lý do. Đã trả rồi thì chênh lệch chuyển sang tháng sau.
create or replace function public.adjust_payout(p_payout uuid, p_amount int, p_reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.split_payouts;
  v_diff int;
begin
  select * into p from public.split_payouts where id = p_payout;
  if p.id is null or not public.has_any_role(p.coach_id, array['chu']) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'reason_required';
  end if;
  v_diff := p_amount - p.amount;
  if v_diff = 0 then
    return 'khong-doi';
  end if;
  if p.paid_at is null then
    update public.split_payouts
      set amount = p_amount,
          breakdown = breakdown || jsonb_build_object('sua-tay', coalesce((breakdown ->> 'sua-tay')::bigint, 0) + v_diff)
      where id = p.id;
    insert into public.split_audit (coach_id, month, payout_id, party_name, action, old_amount, new_amount, reason, actor, actor_name)
    values (p.coach_id, p.month, p.id, p.party_name, 'sua-so', p.amount, p_amount, trim(p_reason), (select auth.uid()), public.actor_name(p.coach_id));
    return 'da-sua';
  end if;
  insert into public.split_adjustments (coach_id, from_month, to_month, party_key, party_kind, party_user_id, party_name, amount, reason, created_by)
  values (p.coach_id, p.month, public.next_month(p.month), p.party_key, p.party_kind, p.party_user_id, p.party_name, v_diff, trim(p_reason), (select auth.uid()));
  insert into public.split_audit (coach_id, month, payout_id, party_name, action, old_amount, new_amount, reason, actor, actor_name)
  values (p.coach_id, p.month, p.id, p.party_name, 'dieu-chinh-thang-sau', p.amount, p_amount, trim(p_reason), (select auth.uid()), public.actor_name(p.coach_id));
  return 'dieu-chinh-thang-sau';
end;
$$;

-- Đánh dấu đã trả (kèm đường dẫn ảnh chuyển khoản trong kho chung-tu) hoặc bỏ đánh dấu (cần lý do).
create or replace function public.mark_payout(p_payout uuid, p_paid boolean, p_proof text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.split_payouts;
begin
  select * into p from public.split_payouts where id = p_payout;
  if p.id is null or not public.has_any_role(p.coach_id, array['chu']) then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  if p_paid then
    update public.split_payouts
      set paid_at = now(), paid_by = (select auth.uid()), proof_path = coalesce(nullif(p_proof, ''), proof_path), paid_note = nullif(trim(coalesce(p_note, '')), '')
      where id = p.id;
    insert into public.split_audit (coach_id, month, payout_id, party_name, action, old_amount, new_amount, reason, actor, actor_name)
    values (p.coach_id, p.month, p.id, p.party_name, 'da-tra', p.amount, p.amount, nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()), public.actor_name(p.coach_id));
  else
    if p_note is null or length(trim(p_note)) < 3 then
      raise exception 'reason_required';
    end if;
    update public.split_payouts set paid_at = null, paid_by = null where id = p.id;
    insert into public.split_audit (coach_id, month, payout_id, party_name, action, old_amount, new_amount, reason, actor, actor_name)
    values (p.coach_id, p.month, p.id, p.party_name, 'bo-da-tra', p.amount, p.amount, trim(p_note), (select auth.uid()), public.actor_name(p.coach_id));
  end if;
end;
$$;

revoke all on function public.close_split_month(uuid, text) from public, anon;
revoke all on function public.adjust_payout(uuid, int, text) from public, anon;
revoke all on function public.mark_payout(uuid, boolean, text, text) from public, anon;
grant execute on function public.close_split_month(uuid, text) to authenticated;
grant execute on function public.adjust_payout(uuid, int, text) to authenticated;
grant execute on function public.mark_payout(uuid, boolean, text, text) to authenticated;

-- ================================================================ các quỹ
create table if not exists public.fund_expenses (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  fund text not null check (fund in ('quy-du-phong', 'quy-van-hanh', 'quy-phat-trien')),
  category text not null check (category in ('quang-cao', 'san-bong', 'phan-mem', 'van-hanh', 'khac')),
  amount int not null check (amount > 0),
  spent_on date not null,
  note text,
  proof_path text,
  class_id uuid references public.classes (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Quảng cáo chi từ quỹ dự phòng; tiền sân / bóng lớp đặc thù chi từ quỹ vận hành.
  constraint fund_expense_quang_cao check (category <> 'quang-cao' or fund = 'quy-du-phong'),
  constraint fund_expense_san_bong check (category <> 'san-bong' or fund = 'quy-van-hanh')
);
create index if not exists fund_expenses_coach on public.fund_expenses (coach_id, spent_on desc);

-- Số dư quỹ = vào (bút toán chia) − chi. "vao_da_chot" chỉ tính tháng đã chốt.
create or replace function public.fund_balances(p_coach uuid)
returns table (fund text, vao bigint, vao_da_chot bigint, chi bigint, so_du bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with f(fund) as (values ('quy-du-phong'), ('quy-van-hanh'), ('quy-phat-trien'))
  select f.fund,
    coalesce((select sum(e.amount) from public.split_entries e where e.coach_id = p_coach and e.party_kind = f.fund), 0)::bigint,
    coalesce((select sum(e.amount) from public.split_entries e where e.coach_id = p_coach and e.party_kind = f.fund and public.month_closed(p_coach, e.month)), 0)::bigint,
    coalesce((select sum(x.amount) from public.fund_expenses x where x.coach_id = p_coach and x.fund = f.fund), 0)::bigint,
    (coalesce((select sum(e.amount) from public.split_entries e where e.coach_id = p_coach and e.party_kind = f.fund), 0)
      - coalesce((select sum(x.amount) from public.fund_expenses x where x.coach_id = p_coach and x.fund = f.fund), 0))::bigint
  from f
  where public.has_any_role(p_coach, array['chu', 'quan-ly', 'co-dong']);
$$;
revoke all on function public.fund_balances(uuid) from public, anon;
grant execute on function public.fund_balances(uuid) to authenticated;

-- ================================================================ quyền
alter table public.assistant_rates enable row level security;
alter table public.assistant_payments enable row level security;
alter table public.split_payouts enable row level security;
alter table public.split_adjustments enable row level security;
alter table public.split_audit enable row level security;
alter table public.fund_expenses enable row level security;

drop policy if exists "Xem cơ chế trợ giảng" on public.assistant_rates;
drop policy if exists "Coach chủ sửa cơ chế trợ giảng" on public.assistant_rates;
create policy "Xem cơ chế trợ giảng" on public.assistant_rates for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']) or assistant_id = (select auth.uid())
    or exists (select 1 from public.classes c where c.id = class_id and c.main_coach_id = (select auth.uid())));
create policy "Coach chủ sửa cơ chế trợ giảng" on public.assistant_rates for all to authenticated
  using (public.has_any_role(coach_id, array['chu'])) with check (public.has_any_role(coach_id, array['chu']));

drop policy if exists "Xem tiền trợ giảng" on public.assistant_payments;
drop policy if exists "Coach chủ ghi tiền trợ giảng" on public.assistant_payments;
create policy "Xem tiền trợ giảng" on public.assistant_payments for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly']) or assistant_id = (select auth.uid())
    or exists (select 1 from public.classes c where c.id = class_id and c.main_coach_id = (select auth.uid())));
create policy "Coach chủ ghi tiền trợ giảng" on public.assistant_payments for all to authenticated
  using (public.has_any_role(coach_id, array['chu'])) with check (public.has_any_role(coach_id, array['chu']));

-- Bảng phải trả: coach chủ thấy hết; người nhận thấy dòng của mình; quản lý / cổ đông thấy dòng quỹ.
drop policy if exists "Xem phải trả" on public.split_payouts;
create policy "Xem phải trả" on public.split_payouts for select to authenticated
  using (public.has_any_role(coach_id, array['chu']) or party_user_id = (select auth.uid())
    or (party_kind = 'quy' and public.has_any_role(coach_id, array['quan-ly', 'co-dong'])));
drop policy if exists "Xem điều chỉnh" on public.split_adjustments;
create policy "Xem điều chỉnh" on public.split_adjustments for select to authenticated
  using (public.has_any_role(coach_id, array['chu']) or party_user_id = (select auth.uid()));
drop policy if exists "Xem nhật ký chia tiền" on public.split_audit;
create policy "Xem nhật ký chia tiền" on public.split_audit for select to authenticated
  using (public.has_any_role(coach_id, array['chu']));

drop policy if exists "Xem chi quỹ" on public.fund_expenses;
drop policy if exists "Coach chủ ghi chi quỹ" on public.fund_expenses;
create policy "Xem chi quỹ" on public.fund_expenses for select to authenticated
  using (public.has_any_role(coach_id, array['chu', 'quan-ly', 'co-dong']));
create policy "Coach chủ ghi chi quỹ" on public.fund_expenses for all to authenticated
  using (public.has_any_role(coach_id, array['chu'])) with check (public.has_any_role(coach_id, array['chu']));

revoke all on public.assistant_rates, public.assistant_payments, public.split_payouts, public.split_adjustments, public.split_audit, public.fund_expenses from anon;
grant select, insert, update, delete on public.assistant_rates, public.assistant_payments, public.fund_expenses to authenticated;
-- Bảng phải trả / điều chỉnh / nhật ký chỉ đổi qua các hàm ở trên (có kiểm tra quyền + ghi nhật ký).
grant select on public.split_payouts, public.split_adjustments, public.split_audit to authenticated;
revoke insert, update, delete on public.split_payouts, public.split_adjustments, public.split_audit from authenticated;

-- ================================================================ kho ảnh chứng từ (riêng tư)
-- Đường dẫn: <coach_id>/<loại>/<tên tệp>. Coach chủ tải lên; coach chủ, quản lý, cổ đông xem.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('chung-tu', 'chung-tu', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
    on conflict (id) do nothing;

    drop policy if exists "Coach chủ tải chứng từ" on storage.objects;
    drop policy if exists "Xem chứng từ" on storage.objects;
    create policy "Coach chủ tải chứng từ" on storage.objects for insert to authenticated
      with check (bucket_id = 'chung-tu' and public.has_any_role(((storage.foldername(name))[1])::uuid, array['chu']));
    create policy "Xem chứng từ" on storage.objects for select to authenticated
      using (bucket_id = 'chung-tu' and public.has_any_role(((storage.foldername(name))[1])::uuid, array['chu', 'quan-ly', 'co-dong']));
  end if;
end $$;
