import type { NextConfig } from "next";

// Không bật cacheComponents: trang công khai dùng `revalidate` theo route,
// khu quản lý luôn động (đọc cookie đăng nhập).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Ảnh tải lên qua server action (đã nén ở trình duyệt; ảnh chứng từ tối đa 4 MB).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
