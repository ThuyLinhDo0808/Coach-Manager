import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { isMonth, monthRange, shiftMonth } from "@/lib/money";
import { roleLabel } from "@/lib/permissions";
import { peopleOf, teachingDb } from "@/lib/teaching-data";
import { vnDate, vnIso } from "@/lib/time";

export const metadata = { title: "Bảng công" };

// Số buổi đã dạy thực tế (đã hoàn tất) theo người dạy, trong tháng. Buổi huỷ không tính.
export default async function BangCongPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("bang-cong");
  const month = isMonth(sp.thang) ? sp.thang : vnDate().slice(0, 7);
  const { from, to } = monthRange(month);
  const t = await teachingDb(session.coach.id);
  const [sessions, classes, members] = await Promise.all([t.sessionsBetween(vnIso(from, "00:00"), vnIso(to, "00:00")), t.classes(), t.members()]);
  const people = peopleOf(members);
  const done = sessions.filter((s) => s.status === "da-day");
  const hours = (list: typeof done) => list.reduce((n, s) => n + (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3_600_000, 0);
  const fmt = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
  const rows = people
    .map((p) => {
      const taught = done.filter((s) => s.teacher_id === p.id);
      const assisted = done.filter((s) => s.assistant_id === p.id);
      const subs = taught.filter((s) => {
        const c = classes.find((x) => x.id === s.class_id);
        return c?.main_coach_id && c.main_coach_id !== p.id;
      });
      const byClass = new Map<string, number>();
      for (const s of taught) byClass.set(s.class_id ?? "hoc-thu", (byClass.get(s.class_id ?? "hoc-thu") ?? 0) + 1);
      return { p, taught, assisted, subs, byClass };
    })
    .filter((r) => r.taught.length || r.assisted.length);
  const [y, m] = month.split("-");

  return (
    <>
      <PageHead icon="team" color="teal" title="Bảng công" sub={`Tháng ${m}/${y} · ${done.length} buổi đã dạy · ${fmt(hours(done))} giờ`} />
      <div className="mb-3.5 flex items-center gap-2">
        <Link href={`/quan-ly/doi-ngu/bang-cong?thang=${shiftMonth(month, -1)}`} className="btn sm ghost bg-white" aria-label="Tháng trước">‹</Link>
        <b>Tháng {m}/{y}</b>
        <Link href={`/quan-ly/doi-ngu/bang-cong?thang=${shiftMonth(month, 1)}`} className="btn sm ghost bg-white" aria-label="Tháng sau">›</Link>
      </div>
      <div className="card">
        {rows.length === 0 && <div className="text-muted">Chưa có buổi nào hoàn tất trong tháng này.</div>}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead>
                <tr><th>Người</th><th className="text-right!">Buổi dạy</th><th className="text-right!">Giờ</th><th className="text-right!">Dạy thay</th><th className="text-right!">Trợ giảng</th><th>Theo lớp</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.p.id}>
                    <td><b>{r.p.name}</b><div className="text-xs text-faint">{r.p.roles.map(roleLabel).join(", ")}</div></td>
                    <td className="num text-right font-bold">{r.taught.length}</td>
                    <td className="num text-right">{fmt(hours(r.taught))}</td>
                    <td className="num text-right">{r.subs.length || "—"}</td>
                    <td className="num text-right">{r.assisted.length || "—"}</td>
                    <td className="text-[13px] text-muted">
                      {[...r.byClass].map(([cid, n]) => `${cid === "hoc-thu" ? "Học thử" : (classes.find((c) => c.id === cid)?.title ?? "Lớp")}: ${n}`).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-faint">Chỉ tính buổi đã bấm “Hoàn tất buổi”. Người dạy là người dạy thực tế của buổi, kể cả dạy thay.</p>
      </div>
    </>
  );
}
