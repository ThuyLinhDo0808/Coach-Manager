"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Tile } from "@/components/icon";
import { activeChild, groupHref, menuFor, SECTIONS, type MenuGroup } from "@/lib/menu";
import type { Perm } from "@/lib/permissions";

function useMenu(perms: Perm[]) {
  const pathname = usePathname();
  const menu = useMemo(() => menuFor((p) => perms.includes(p)), [perms]);
  const active = activeChild(pathname, menu);
  return { pathname, menu, active };
}

function Soon({ label }: { label: string }) {
  return (
    <span className="mi" aria-disabled="true" style={{ color: "var(--color-faint)", cursor: "default" }}>
      {label}
      <span className="pill n ml-auto" style={{ fontSize: 10, padding: "0 6px" }}>Sắp có</span>
    </span>
  );
}

/** Menu trái: nhóm theo 3 nhãn; bấm nhóm để mở mục con; nhóm chứa trang đang mở tự mở sẵn. */
export function AdminMenu({ perms, newLeads }: { perms: Perm[]; newLeads: number }) {
  const { pathname, menu, active } = useMenu(perms);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (g: MenuGroup) => open[g.key] ?? g.key === active?.group.key;

  return (
    <nav aria-label="Menu quản lý">
      {SECTIONS.map((s) => {
        const groups = menu.filter((g) => g.section === s.key);
        if (!groups.length) return null;
        return (
          <div key={s.key}>
            <div className="mgroup">{s.label}</div>
            {groups.map((g) => {
              const expanded = isOpen(g);
              const here = g.key === active?.group.key;
              return (
                <div key={g.key}>
                  <button
                    type="button"
                    className={`mi w-full text-left ${here && !expanded ? "on" : ""}`}
                    aria-expanded={expanded}
                    aria-controls={`menu-${g.key}`}
                    onClick={() => setOpen((o) => ({ ...o, [g.key]: !expanded }))}
                  >
                    <Tile icon={g.icon} color={g.color} />
                    <span className="flex-1">{g.label}</span>
                    {g.key === "tuyen-sinh" && newLeads > 0 && <span className="badge" style={{ marginLeft: 0 }}>{newLeads}</span>}
                    <Icon name="chevron" size={14} className={`text-faint transition-transform ${expanded ? "rotate-90" : ""}`} />
                  </button>
                  {expanded && (
                    <div id={`menu-${g.key}`} className="mb-1 ml-[22px] border-l border-line pl-[17px]">
                      {g.children.map((c) =>
                        c.href ? (
                          <Link
                            key={c.label}
                            href={c.href}
                            className={`mi ${active?.child === c ? "on" : ""}`}
                            aria-current={active?.child === c ? "page" : undefined}
                            style={{ padding: "6px 10px", fontSize: 13.5 }}
                          >
                            {c.label}
                          </Link>
                        ) : (
                          <Soon key={c.label} label={c.label} />
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="mgroup">Tài khoản</div>
      <Link href="/quan-ly/them" className={`mi ${pathname.startsWith("/quan-ly/them") ? "on" : ""}`}>
        <span className="tile" style={{ background: "#ececf0", color: "var(--color-muted)" }}>
          <Icon name="out" />
        </span>
        Tài khoản & đăng xuất
      </Link>
    </nav>
  );
}

/** Điện thoại: mục con của nhóm đang mở thành dải tab ngang ở đầu trang. */
export function SubTabs({ perms }: { perms: Perm[] }) {
  const { active } = useMenu(perms);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const box = ref.current;
    const on = box?.querySelector<HTMLElement>(".on");
    if (box && on) box.scrollLeft = on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2;
  }, [active?.child]);
  if (!active || active.group.children.length < 2) return null;
  return (
    <div className="only-m mb-3 min-w-0">
      <nav ref={ref} className="seg" aria-label={`Mục con của ${active.group.label}`} style={{ maxWidth: "100%" }}>
        {active.group.children.map((c) =>
          c.href ? (
            <Link key={c.label} href={c.href} className={active.child === c ? "on" : ""} aria-current={active.child === c ? "page" : undefined}>
              {c.label}
            </Link>
          ) : (
            <span key={c.label} aria-disabled="true" style={{ opacity: 0.55 }}>
              {c.label} · Sắp có
            </span>
          ),
        )}
      </nav>
    </div>
  );
}

/** Thanh tab đáy trên điện thoại: 4 nhóm hay dùng + "Thêm". */
export function AdminTabs({ perms }: { perms: Perm[] }) {
  const { pathname, menu, active } = useMenu(perms);
  const pick = ["tong-quan", "tuyen-sinh", "lich", "hoc-vien", "lop", "tai-chinh"];
  const tabs = pick.map((k) => menu.find((g) => g.key === k)).filter((g): g is MenuGroup => Boolean(g)).slice(0, 4);
  const moreOn = pathname.startsWith("/quan-ly/them") || !tabs.some((t) => t.key === active?.group.key);
  return (
    <nav className="mtabs" aria-label="Menu quản lý">
      {tabs.map((t) => (
        <Link key={t.key} href={groupHref(t)} className={t.key === active?.group.key ? "on" : ""}>
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
