export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const DEFAULT_COACH_SLUG = process.env.NEXT_PUBLIC_DEFAULT_COACH_SLUG || "trung-muoi";

/** Chưa cấu hình Supabase thì web chạy bằng nội dung mẫu (xem sample-data.ts). */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
