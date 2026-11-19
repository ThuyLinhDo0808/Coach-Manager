import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Icon, Tile } from "@/components/icon";
import { requireSession } from "@/lib/auth";
import { menuFor, SECTIONS } from "@/lib/menu";
import { roleLabel } from "@/lib/permissions";
import { signOut } from "../../dang-nhap/actions";

export const metadata = { title: "Thêm" };

export default async function ThemPage() {
  const session = await requireSession();
  const menu = menuFor((p) => session.perms.includes(p));
  return (
    <>
      <PageHead icon="more" color="slate" title="Thêm" sub={`${session.memberName ?? session.email} · ${session.roles.map(roleLabel).join(", ")}`} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="grid gap-4">
          {SECTIONS.map((s) => {
            const groups = menu.filter((g) => g.section === s.key);
            if (!groups.length) return null;
            return (
              <div key={s.key} className="card" style={{ padding: 10 }}>
                <div className="mgroup" style={{ paddingTop: 4 }}>{s.label}</div>
                {groups.map((g) => (
                  <details key={g.key} className="group">
                    <summary className="mi cursor-pointer list-none" style={{ padding: "10px 12px" }}>
                      <Tile icon={g.icon} color={g.color} />
                      <span className="flex-1">{g.label}</span>
                      <Icon name="chevron" size={16} className="text-faint transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mb-1 ml-[26px] border-l border-line pl-[17px]">
                      {g.children.map((c) =>
                        c.href ? (
                          <Link key={c.label} href={c.href} className="mi" style={{ padding: "9px 10px" }}>
                            {c.label}
                          </Link>
                        ) : (
                          <span key={c.label} className="mi" aria-disabled="true" style={{ padding: "9px 10px", color: "var(--color-faint)" }}>
                            {c.label}
                            <span className="pill n ml-auto" style={{ fontSize: 10 }}>Sắp có</span>
                          </span>
                        ),
                      )}
                    </div>
                  </details>
                ))}
              </div>
            );
          })}
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
