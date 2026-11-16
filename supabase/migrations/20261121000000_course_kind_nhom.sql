-- Thêm loại khoá "Nhóm nhỏ" (lớp 1:2, 1:3, 1:4).
alter table public.courses drop constraint if exists courses_kind_check;
alter table public.courses add constraint courses_kind_check
  check (kind in ('co-ban', 'sua-loi', 'nang-cao', 'luyen-cu', 'kid', 'kem-1-1', 'nhom'));
