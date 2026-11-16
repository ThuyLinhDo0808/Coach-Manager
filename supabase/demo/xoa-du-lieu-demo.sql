-- Xoá toàn bộ DỮ LIỆU DEMO (các dòng có id bắt đầu bằng "dddddddd"). Không đụng tới dữ liệu thật.
delete from public.ledger where id::text like 'dddddddd%';
delete from public.offers where id::text like 'dddddddd%';
delete from public.session_feedback where session_id::text like 'dddddddd%';
delete from public.attendance where session_id::text like 'dddddddd%';
delete from public.class_sessions where id::text like 'dddddddd%';
delete from public.enrollments where id::text like 'dddddddd%';
delete from public.lead_notes where id::text like 'dddddddd%' or lead_id::text like 'dddddddd%';
delete from public.students where id::text like 'dddddddd%';
delete from public.classes where id::text like 'dddddddd%';
delete from public.leads where id::text like 'dddddddd%';
delete from public.free_slots where id::text like 'dddddddd%';
