# Coach Trung Muối

Web của Coach Trung Muối: giới thiệu, khoá học, kho video, lịch & sân, form nhu cầu học và trang quản lý nhu cầu.

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # điền URL + publishable key của Supabase; để trống thì dùng nội dung mẫu
npm run dev
```

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy thử ở http://localhost:3000 |
| `npm run lint` / `npm run typecheck` / `npm test` | Kiểm tra |
| `npm run build` | Build bản production |

## Database

Migration nằm trong `supabase/migrations/`. Biến môi trường trên Vercel: xem `.env.example`.

Quy ước dự án: [CLAUDE.md](CLAUDE.md).

### Chạy migration bằng tay (SQL Editor của Supabase)

Chạy theo thứ tự, mỗi file một lần:

1. `supabase/migrations/20261116000000_init.sql` — bảng, RLS, hàm `submit_lead`
2. `supabase/migrations/20261116000100_grants.sql` — quyền cho API
3. `supabase/seed.sql` — nội dung mẫu (chạy lại nhiều lần cũng không sao). Sinh lại bằng `npm run seed:gen`.
