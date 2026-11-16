import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/** Client theo phiên đăng nhập của người dùng (khu quản lý, server action). */
export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Gọi từ Server Component thì không ghi cookie được; proxy.ts sẽ làm mới phiên.
        }
      },
    },
  });
}
