import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Tile } from "@/components/icon";
import { requirePerm } from "@/lib/auth";
import { getTodo } from "@/lib/todo";

export const metadata = { title: "Cần xử lý" };

export default async function CanXuLyPage() {
  const session = await requirePerm("can-xu-ly");
  const groups = await getTodo(session);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <PageHead icon="check" color="blue" title="Cần xử lý" sub={total ? `${total} việc đang chờ` : "Không có việc tồn"} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.key} className="card">
            <h2 className="h2">
              <span className="flex min-w-0 items-center gap-2.5">
                <Tile icon={g.icon} color={g.color} />
                <span className="truncate">{g.title}</span>
              </span>
              <span className={`pill ${g.items.length ? "warn" : "n"}`}>{g.items.length}</span>
            </h2>
            {g.items.length === 0 && <div className="text-[13px] text-faint">Không có.</div>}
            {g.items.slice(0, 12).map((it) => (
              <Link key={it.id} href={it.href} className="divide-row flex items-center justify-between gap-3 py-2.5 first:border-t-0">
                <b className="min-w-0 truncate">{it.title}</b>
                <span className="flex-none text-[13px] text-faint">{it.sub} ›</span>
              </Link>
            ))}
            {g.items.length > 12 && <div className="mt-2 text-xs text-faint">và {g.items.length - 12} việc khác</div>}
          </section>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">Tháng chưa chốt và khoản chưa trả sẽ hiện ở đây khi có phần Chia tiền tháng.</p>
    </>
  );
}
