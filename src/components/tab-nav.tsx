"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Giới thiệu" },
  { href: "/khoa-hoc", label: "Khoá học" },
  { href: "/video", label: "Video" },
  { href: "/lich-san", label: "Lịch & sân" },
];

export function TabNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Mục trang"
      className="sticky top-0 z-20 -mx-4 bg-page/90 px-4 py-3 backdrop-blur md:mx-0 md:px-0"
    >
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={active ? "chip chip-active" : "chip"}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
