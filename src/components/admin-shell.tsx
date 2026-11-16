import Link from "next/link";
import { AdminMenu, AdminTabs } from "@/components/admin-nav";
import { Avatar } from "@/components/avatar";
import { Tile, type IconName } from "@/components/icon";
import type { Session } from "@/lib/auth";

export function AdminShell({ session, newLeads, children }: { session: Session; newLeads: number; children: React.ReactNode }) {
  const { coach } = session;
  return (
    <div className="app">
      <aside className="side">
        <Link href="/" className="club" title="Xem trang công khai">
          <Avatar name={coach.display_name} url={coach.avatar_url} style={{ fontSize: 13 }} />
          <div className="min-w-0">
            <b className="block truncate">{coach.display_name}</b>
            <small>Khu quản lý</small>
          </div>
        </Link>
        <AdminMenu role={session.role} newLeads={newLeads} />
      </aside>
      <div className="min-w-0">
        <div className="mtop">
          <Link href="/quan-ly" className="logo">
            <b>TM</b>Quản lý
          </Link>
          <Link href="/quan-ly/them" aria-label="Tài khoản">
            <Avatar name={session.memberName ?? session.email} size={32} soft />
          </Link>
        </div>
        <main className="main">{children}</main>
      </div>
      <AdminTabs />
    </div>
  );
}

export function PageHead({ icon, color, title, sub, children }: { icon: IconName; color: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="phead">
      <div className="min-w-0">
        <h1>
          <Tile icon={icon} color={color} />
          {title}
        </h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="acts">{children}</div>}
    </div>
  );
}
