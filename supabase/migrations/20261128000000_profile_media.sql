-- Ảnh hồ sơ: tải ảnh lên (đại diện, bìa, nền trang, bộ ảnh giới thiệu, ảnh chèn trong bài giới thiệu).
-- Chạy lại nhiều lần cũng không sao.

-- Ảnh nền trang công khai và bộ ảnh ở tab Giới thiệu: [{ "url": "...", "caption": "..." }]
alter table public.coaches add column if not exists bg_url text;
alter table public.coaches add column if not exists gallery jsonb not null default '[]';
alter table public.coaches drop constraint if exists coaches_gallery_array;
alter table public.coaches add constraint coaches_gallery_array check (jsonb_typeof(gallery) = 'array' and jsonb_array_length(gallery) <= 24);

-- Kho ảnh công khai (ai cũng xem được qua đường dẫn). Đường dẫn: <coach_id>/<loại>/<tên tệp>.
-- Chỉ Team Leader của coach đó tải lên / xoá.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('anh-cong-khai', 'anh-cong-khai', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

    drop policy if exists "Team Leader tải ảnh công khai" on storage.objects;
    drop policy if exists "Team Leader xoá ảnh công khai" on storage.objects;
    create policy "Team Leader tải ảnh công khai" on storage.objects for insert to authenticated
      with check (bucket_id = 'anh-cong-khai' and public.has_any_role(((storage.foldername(name))[1])::uuid, array['chu']));
    create policy "Team Leader xoá ảnh công khai" on storage.objects for delete to authenticated
      using (bucket_id = 'anh-cong-khai' and public.has_any_role(((storage.foldername(name))[1])::uuid, array['chu']));
  end if;
end $$;
