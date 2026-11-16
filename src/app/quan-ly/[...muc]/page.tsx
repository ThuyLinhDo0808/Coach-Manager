import Link from "next/link";
import { notFound } from "next/navigation";
import { MENU } from "@/components/admin-nav";
import { PageHead } from "@/components/admin-shell";

// Các mục chưa làm xong: hiện đúng tên mục và nói rõ là đang làm.
export default async function DangLamPage({ params }: { params: Promise<{ muc: string[] }> }) {
  const { muc } = await params;
  const item = MENU.find((m) => m.href === `/quan-ly/${muc[0]}`);
  if (!item || muc.length > 1) notFound();
  return (
    <>
      <PageHead icon={item.icon} color={item.color} title={item.label} sub="Đang được làm" />
      <div className="card">
        <b className="text-base">Mục này chưa dùng được</b>
        <p className="mt-1 max-w-lg text-muted">
          {item.label} sẽ có ở đợt cập nhật sau. Hiện bạn dùng được Tổng quan và Nhu cầu &amp; chốt khoá.
        </p>
        <Link href="/quan-ly/nhu-cau" className="btn navy mt-4">
          Mở Nhu cầu &amp; chốt khoá
        </Link>
      </div>
    </>
  );
}
