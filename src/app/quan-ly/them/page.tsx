import Link from "next/link";
import { MENU } from "@/components/admin-nav";
import { PageHead } from "@/components/admin-shell";
import { Icon, Tile } from "@/components/icon";
import { requireSession } from "@/lib/auth";
import { signOut } from "../../dang-nhap/actions";

export const metadata = { title: "Thêm" };

export default async function ThemPage() {
  const session = await requireSession();
  const items = MENU.filter((m) => session.role === "owner" || !m.ownerOnly);
  return (
    <>
      <PageHead icon="more" color="slate" title="Thêm" sub={`${session.memberName ?? session.email} · ${session.role === "owner" ? "Coach" : "Sale"}`} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card" style={{ padding: 10 }}>
          {items.map((m) => (
            <Link key={m.href} href={m.href} className="mi" style={{ padding: "10px 12px" }}>
              <Tile icon={m.icon} color={m.color} />
              <span className="flex-1">{m.label}</span>
              <Icon name="right" size={16} className="text-faint" />
            </Link>
          ))}
        </div>
        <div className="card grid content-start gap-3">
          <h2 className="h2 mb-0">Tài khoản</h2>
          <div className="text-muted">{session.email}</div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="btn ghost">Xem trang công khai</Link>
            <form action={signOut}>
              <button className="btn danger">
                <Icon name="out" /> Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
