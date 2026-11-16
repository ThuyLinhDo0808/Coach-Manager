-- Đợt 3: sổ thu chi, offer + trang thanh toán công khai.

-- ---------------------------------------------------------------- sổ thu chi (chỉ owner)
create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  entry_date date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  kind text not null check (kind in ('thu', 'chi')),
  category text not null check (category in (
    'tien-goi', 'phi-buoi', 'tien-coc', 'thue-san', 'dung-cu', 'hoa-hong', 'luong', 'hoan-tien', 'khac'
  )),
  amount int not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 200),
  student_id uuid references public.students (id) on delete set null,
  class_id uuid references public.classes (id) on delete set null,
  offer_id uuid,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.ledger (coach_id, entry_date desc);

alter table public.ledger enable row level security;
create policy "Owner quản lý sổ thu chi" on public.ledger
  for all to authenticated
  using (public.is_coach_owner(coach_id)) with check (public.is_coach_owner(coach_id));
grant select, insert, update, delete on public.ledger to authenticated;
revoke all on public.ledger from anon;

-- ---------------------------------------------------------------- offer
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  course_id uuid references public.courses (id) on delete set null,
  title text not null,
  list_price int not null check (list_price >= 0),
  discount_pct int not null default 0 check (discount_pct between 0 and 100),
  amount int not null check (amount >= 0),       -- học phí sau ưu đãi
  pay_now int not null check (pay_now >= 0),     -- số cần chuyển lần này (cọc hoặc đủ)
  memo text not null,                            -- nội dung chuyển khoản
  expires_on date,
  -- cho: chờ chuyển · da-bao: học viên báo đã chuyển · da-xac-nhan · huy
  status text not null default 'cho' check (status in ('cho', 'da-bao', 'da-xac-nhan', 'huy')),
  token uuid not null unique default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  reported_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.offers (coach_id, status);
create index on public.offers (lead_id);

alter table public.ledger add constraint ledger_offer_fk foreign key (offer_id) references public.offers (id) on delete set null;

alter table public.offers enable row level security;
create policy "Thành viên đọc ghi offer" on public.offers
  for all to authenticated
  using (public.is_coach_member(coach_id)) with check (public.is_coach_member(coach_id));
grant select, insert, update on public.offers to authenticated;
revoke all on public.offers from anon;

-- Trang thanh toán công khai: đọc offer theo token (không lộ dữ liệu khác).
create function public.get_offer(p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'title', o.title,
    'student_name', l.full_name,
    'list_price', o.list_price,
    'discount_pct', o.discount_pct,
    'amount', o.amount,
    'pay_now', o.pay_now,
    'memo', o.memo,
    'expires_on', o.expires_on,
    'status', o.status,
    'coach_name', c.display_name,
    'payout', coalesce(c.settings -> 'payout', '{}'::jsonb),
    'zalo', c.contacts ->> 'zalo'
  )
  from public.offers o
  join public.leads l on l.id = o.lead_id
  join public.coaches c on c.id = o.coach_id
  where o.token = p_token;
$$;
revoke all on function public.get_offer(uuid) from public;
grant execute on function public.get_offer(uuid) to anon, authenticated;

-- Học viên bấm "Tôi đã chuyển khoản".
create function public.report_offer_paid(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.offers;
begin
  update public.offers set status = 'da-bao', reported_at = now()
    where token = p_token and status = 'cho' and (expires_on is null or expires_on >= (now() at time zone 'Asia/Ho_Chi_Minh')::date)
    returning * into v;
  if v.id is null then
    return false;
  end if;
  insert into public.lead_notes (coach_id, lead_id, author_id, body, kind)
  values (v.coach_id, v.lead_id, null, 'Học viên báo đã chuyển khoản ' || v.pay_now || ' đ (' || v.memo || '). Chờ xác nhận tiền.', 'he-thong');
  return true;
end;
$$;
revoke all on function public.report_offer_paid(uuid) from public;
grant execute on function public.report_offer_paid(uuid) to anon, authenticated;

-- Owner xác nhận đã nhận tiền: ghi sổ thu, chốt nhu cầu (tạo học viên + ghi danh lớp).
create function public.confirm_offer(p_offer uuid)
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

  v_student := public.close_lead(v.lead_id, v.class_id, v.amount);
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
revoke all on function public.confirm_offer(uuid) from public;
grant execute on function public.confirm_offer(uuid) to authenticated;
