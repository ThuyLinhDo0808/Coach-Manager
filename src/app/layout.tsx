import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Coach Trung Muối — Học pickleball cùng Coach Trung Muối",
    template: "%s · Coach Trung Muối",
  },
  description:
    "Khoá học pickleball cho người mới và người muốn nâng trình, kho video bài giảng, lịch lớp và sân dạy của Coach Trung Muối.",
};

export const viewport: Viewport = {
  themeColor: "#0f1d3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
