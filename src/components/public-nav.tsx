"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/icon";

const TABS = [
  { href: "/", label: "Giới thiệu" },
  { href: "/khoa-hoc", label: "Khoá học" },
  { href: "/video", label: "Video" },
  { href: "/lich-san", label: "Lịch & sân" },
  { href: "/bai-viet", label: "Bài viết" },
  { href: "/danh-gia", label: "Đánh giá" },
];

export function PublicTabs() {
  const pathname = usePathname();
  return (
    <nav className="ptabs" aria-label="Mục trang">
      {TABS.map((t) => {
        const on = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Nút dính đáy trên điện thoại. Ở trang chi tiết khoá thì thành "Đăng ký khoá này". */
function Cta({ zalo }: { zalo: string | null }) {
  const pathname = usePathname();
  useSearchParams();
  const m = pathname.match(/^\/khoa-hoc\/([a-z0-9-]+)$/);
  return (
    <div className="sticky-cta">
      {zalo && (
        <a href={zalo} target="_blank" rel="noopener noreferrer" aria-label="Nhắn Zalo" className="btn ghost">
          <Icon name="chat" />
        </a>
      )}
      <Link href={m ? `/dang-ky?khoa=${m[1]}` : "/dang-ky"} className="btn primary">
        {m ? "Đăng ký khoá này" : "Đăng ký học thử"}
      </Link>
    </div>
  );
}

export function StickyCta({ zalo }: { zalo: string | null }) {
  return (
    <Suspense>
      <Cta zalo={zalo} />
    </Suspense>
  );
}
