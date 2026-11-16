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
