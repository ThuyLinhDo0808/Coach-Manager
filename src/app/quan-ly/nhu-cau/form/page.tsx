import { headers } from "next/headers";
import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { CopyButton } from "@/components/copy-button";
import { requireSession } from "@/lib/auth";

export const metadata = { title: "Form & trang công khai" };

const PAGES = [
  { path: "/dang-ky", title: "Form đăng ký học thử", note: "Gửi cho người muốn học. Mỗi lần gửi tạo một nhu cầu ở cột Mới." },
  { path: "/", title: "Trang giới thiệu coach", note: "Trang chủ công khai." },
  { path: "/khoa-hoc", title: "Khoá học & học phí", note: "Các gói buổi đang công khai." },
  { path: "/lich-san", title: "Lịch & sân", note: "Lớp đang tuyển, giờ rảnh, sân dạy." },
  { path: "/video", title: "Kho video", note: "Video bài giảng công khai." },
  { path: "/bai-viet", title: "Bài viết", note: "Bài viết đã đăng." },
];

export default async function FormPage() {
  await requireSession();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host") ?? ""}`;
  return (
    <>
      <PageHead icon="inbox" color="pink" title="Form & trang công khai" sub="Link để gửi cho học viên, gắn lên fanpage, TikTok, Zalo" />
      <div className="card">
        {PAGES.map((p, i) => (
          <div key={p.path} className={`flex flex-wrap items-center gap-3 py-3 ${i ? "divide-row" : ""}`}>
            <div className="min-w-[200px] flex-1">
              <b>{p.title}</b>
              <div className="text-[13px] text-faint">{p.note}</div>
              <div className="num mt-0.5 truncate text-[13px] text-navy">{origin}{p.path}</div>
            </div>
            <div className="flex gap-2">
              <Link href={p.path} target="_blank" className="btn sm ghost">Mở</Link>
              <CopyButton text={`${origin}${p.path}`} label="Sao chép link" />
            </div>
          </div>
        ))}
        <p className="mt-3 text-xs text-faint">Gắn link form với một khoá cụ thể bằng cách thêm <span className="num">?khoa=&lt;mã khoá&gt;</span>, ví dụ <span className="num">/dang-ky?khoa=lop-1-1</span>. Nội dung trang công khai sửa ở Cài đặt › Hồ sơ trung tâm và Lớp &amp; khoá học.</p>
      </div>
    </>
  );
}
