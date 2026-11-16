-- Cấp quyền tường minh cho API (anon / authenticated), không phụ thuộc cài đặt
-- "tự mở bảng mới" của Supabase. RLS vẫn quyết định từng dòng được thấy.

grant usage on schema public to anon, authenticated;

grant select on public.coaches, public.venues, public.courses, public.open_classes,
  public.video_groups, public.videos to anon, authenticated;

grant update on public.coaches to authenticated;
grant insert, update, delete on public.venues, public.courses, public.open_classes,
  public.video_groups, public.videos to authenticated;

grant select on public.coach_members to authenticated;
grant select, insert, update on public.leads to authenticated;
grant select, insert on public.lead_notes to authenticated;

-- Khách không đụng trực tiếp bảng nhu cầu; chỉ gửi qua hàm submit_lead.
revoke all on public.leads, public.lead_notes, public.coach_members from anon;
