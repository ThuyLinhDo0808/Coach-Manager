import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập quản lý", robots: { index: false } };

export default async function DangNhapPage({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const { loi } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-4 py-10">
      <Link href="/" className="logo mb-5 justify-center">
        <b>TM</b>Coach Trung Muối
      </Link>
      <div className="card" style={{ padding: 24 }}>
        <h1 className="text-xl font-extrabold">Đăng nhập khu quản lý</h1>
        <p className="mt-1 mb-4 text-muted">Dành cho coach và sale.</p>
        {loi === "chua-co-quyen" && (
          <div className="mb-3 rounded-[14px] bg-warnbg px-4 py-3 text-[13px] font-medium text-warn" role="alert">
            Tài khoản này chưa được thêm vào đội của coach. Nhờ coach thêm rồi đăng nhập lại.
          </div>
        )}
        <LoginForm />
        <p className="mt-4 text-center text-[13px] text-muted">
          Được mời vào đội?{" "}
          <Link href="/tham-gia" className="font-semibold text-ink underline underline-offset-2">
            Tạo mật khẩu
          </Link>
        </p>
      </div>
    </main>
  );
}
