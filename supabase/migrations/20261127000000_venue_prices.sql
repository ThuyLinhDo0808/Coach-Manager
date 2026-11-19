-- Bảng giá sân theo khung giờ (thay cho một giá thuê / giờ duy nhất).
-- price_rules: [{ "days": "t2-t6" | "t7-cn", "from": "05:00", "to": "11:59", "price": 150000 }] — giá mỗi giờ mỗi sân.
-- Chạy lại nhiều lần cũng không sao.
alter table public.venues add column if not exists price_rules jsonb not null default '[]';
alter table public.venues drop constraint if exists venues_price_rules_array;
alter table public.venues add constraint venues_price_rules_array check (jsonb_typeof(price_rules) = 'array');

-- Sân đã có giá thuê / giờ: chuyển thành một khung cả ngày cho cả hai nhóm ngày.
update public.venues
set price_rules = jsonb_build_array(
  jsonb_build_object('days', 't2-t6', 'from', '05:00', 'to', '22:00', 'price', rent_per_hour),
  jsonb_build_object('days', 't7-cn', 'from', '05:00', 'to', '22:00', 'price', rent_per_hour)
)
where rent_per_hour is not null and rent_per_hour > 0 and price_rules = '[]'::jsonb;
