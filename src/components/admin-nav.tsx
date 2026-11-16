"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Tile, type IconName } from "@/components/icon";
import type { MemberRole } from "@/lib/types";

export const MENU: { href: string; icon: IconName; label: string; short?: string; color: string; ownerOnly?: boolean }[] = [
  { href: "/quan-ly", icon: "home", label: "Tổng quan", color: "blue" },
  { href: "/quan-ly/nhu-cau", icon: "inbox", label: "Nhu cầu & chốt khoá", short: "Nhu cầu", color: "pink" },
  { href: "/quan-ly/khoa-hoc", icon: "book", label: "Khoá học & lớp", color: "indigo" },
  { href: "/quan-ly/lich-day", icon: "cal", label: "Lịch dạy", color: "cyan" },
  { href: "/quan-ly/hoc-vien", icon: "users", label: "Học viên", color: "violet" },
  { href: "/quan-ly/noi-dung", icon: "video", label: "Nội dung", color: "orange", ownerOnly: true },
  { href: "/quan-ly/thu-chi", icon: "wallet", label: "Thu chi", color: "emerald", ownerOnly: true },
  { href: "/quan-ly/thong-ke", icon: "chart", label: "Thống kê", color: "amber", ownerOnly: true },
  { href: "/quan-ly/cai-dat", icon: "gear", label: "Cài đặt", color: "slate", ownerOnly: true },
];

const isOn = (pathname: string, href: string) => (href === "/quan-ly" ? pathname === href : pathname.startsWith(href));

export function AdminMenu({ role, newLeads }: { role: MemberRole; newLeads: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu quản lý">
      {MENU.filter((m) => role === "owner" || !m.ownerOnly).map((m) => (
        <Link key={m.href} href={m.href} className={`mi ${isOn(pathname, m.href) ? "on" : ""}`}>
          <Tile icon={m.icon} color={m.color} />
          {m.label}
          {m.href === "/quan-ly/nhu-cau" && newLeads > 0 && <span className="badge">{newLeads}</span>}
        </Link>
      ))}
      <div className="mgroup">Tài khoản</div>
      <Link href="/quan-ly/them" className={`mi ${isOn(pathname, "/quan-ly/them") ? "on" : ""}`}>
        <span className="tile" style={{ background: "#ececf0", color: "var(--color-muted)" }}>
          <Icon name="out" />
        </span>
        Tài khoản & đăng xuất
      </Link>
    </nav>
  );
}

export function AdminTabs() {
  const pathname = usePathname();
  const tabs = [MENU[0], MENU[1], MENU[3], MENU[4]];
  const moreOn = !tabs.some((t) => isOn(pathname, t.href));
  return (
    <nav className="mtabs" aria-label="Menu quản lý">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={isOn(pathname, t.href) ? "on" : ""}>
          <Tile icon={t.icon} color={t.color} />
          {t.short ?? t.label}
        </Link>
      ))}
      <Link href="/quan-ly/them" className={moreOn ? "on" : ""}>
        <Tile icon="more" color="slate" />
        Thêm
      </Link>
    </nav>
  );
}
