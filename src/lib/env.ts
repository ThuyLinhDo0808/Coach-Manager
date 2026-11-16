// Chỉ đọc ở phía server. Nhận cả tên biến tự nhập (NEXT_PUBLIC_...) lẫn tên do
// tích hợp Vercel ↔ Supabase tự thêm (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY).
// Không bao giờ đọc SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";
export const DEFAULT_COACH_SLUG = process.env.NEXT_PUBLIC_DEFAULT_COACH_SLUG || "trung-muoi";

/** Chưa cấu hình Supabase thì web chạy bằng nội dung mẫu (xem sample-data.ts). */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
