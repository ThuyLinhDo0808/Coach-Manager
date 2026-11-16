import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Tham gia đội", robots: { index: false } };

export default function ThamGiaPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-4 py-10">
      <Link href="/" className="logo mb-5 justify-center">
        <b>TM</b>Coach Trung Muối
      </Link>
      <div className="card" style={{ padding: 24 }}>
        <h1 className="text-xl font-extrabold">Tham gia đội của coach</h1>
        <p className="mt-1 mb-4 text-muted">Dành cho sale và trợ giảng đã được coach mời. Dùng đúng email coach đã ghi lời mời.</p>
        <JoinForm />
        <p className="mt-4 text-center text-[13px] text-muted">
          Đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-semibold text-ink underline underline-offset-2">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
