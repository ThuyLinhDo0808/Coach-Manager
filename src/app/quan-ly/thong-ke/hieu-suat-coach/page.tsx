import { PageHead } from "@/components/admin-shell";
import { Bar, RangeSeg } from "@/components/range-seg";
import { requirePerm } from "@/lib/auth";
import { dong } from "@/lib/money";
import { reportDb } from "@/lib/split-data";
import { statRange } from "@/lib/stats";
import { peopleOf, teachingDb } from "@/lib/teaching-data";
import { vnDate } from "@/lib/time";

export const metadata = { title: "Hiệu suất coach" };

export default async function HieuSuatCoachPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thong-ke");
  const { n, months, first, last } = statRange(sp.thang, vnDate().slice(0, 7));
  const [perf, members] = await Promise.all([(await reportDb(session.coach.id)).performance(first, last), (await teachingDb(session.coach.id)).members()]);
  const people = peopleOf(members);
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "Thành viên";
  const byCoach = [...new Set(perf.map((p) => p.teacher_id))]
    .map((id) => {
      const rows = perf.filter((p) => p.teacher_id === id);
      const sum = (k: "sessions" | "substitute" | "student_turns" | "revenue" | "coach_amount") => rows.reduce((s, r) => s + Number(r[k]), 0);
      return { id, sessions: sum("sessions"), substitute: sum("substitute"), turns: sum("student_turns"), revenue: sum("revenue"), coach: sum("coach_amount"), rows };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const maxRev = Math.max(...byCoach.map((c) => c.revenue), 1);
  const total = byCoach.reduce((s, c) => s + c.sessions, 0);

  return (
    <>
      <PageHead icon="chart" color="amber" title="Hiệu suất coach" sub={`${n} tháng gần nhất · ${total} buổi đã dạy`}>
        <RangeSeg path="/quan-ly/thong-ke/hieu-suat-coach" n={n} />
      </PageHead>
      <div className="card mb-4">
        <h2 className="h2">Theo coach</h2>
        {byCoach.length === 0 && <div className="text-muted">Chưa có buổi nào đã dạy trong khoảng này.</div>}
        {byCoach.length > 0 && (
          <>
            <div className="hide-m overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Coach</th><th className="text-right!">Buổi dạy</th><th className="text-right!">Dạy thay</th><th className="text-right!">Lượt học viên</th><th className="text-right!">HV / buổi</th><th>Doanh thu đã dạy</th><th className="text-right!">Phần coach</th></tr></thead>
                <tbody>
                  {byCoach.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold">{name(c.id)}</td>
                      <td className="num text-right">{c.sessions}</td>
                      <td className="num text-right">{c.substitute || "—"}</td>
                      <td className="num text-right">{c.turns}</td>
                      <td className="num text-right">{c.sessions ? (c.turns / c.sessions).toFixed(1).replace(".", ",") : "—"}</td>
                      <td style={{ minWidth: 200 }}><div className="flex items-center gap-2"><div className="flex-1"><Bar value={c.revenue} max={maxRev} /></div><span className="num text-[13px] font-semibold">{dong(c.revenue)}</span></div></td>
                      <td className="num text-right font-bold">{dong(c.coach)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="only-m">
              {byCoach.map((c, i) => (
                <div key={c.id} className={`py-2.5 ${i ? "divide-row" : ""}`}>
                  <div className="flex justify-between"><b>{name(c.id)}</b><span className="num font-bold">{dong(c.coach)}</span></div>
                  <div className="text-[13px] text-faint">{c.sessions} buổi{c.substitute ? ` (${c.substitute} dạy thay)` : ""} · {c.turns} lượt HV · doanh thu {dong(c.revenue)}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-faint">Tính buổi đã hoàn tất hoặc đã điểm danh. Dạy thay = buổi do người khác coach dạy chính của lớp đứng lớp. Doanh thu đã dạy = tổng khoản đem chia của học viên bị trừ buổi.</p>
      </div>
      {byCoach.length > 0 && (
        <div className="card">
          <h2 className="h2">Buổi dạy theo tháng</h2>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Coach</th>{months.map((m) => <th key={m} className="text-right!">T{Number(m.slice(5))}</th>)}</tr></thead>
              <tbody>
                {byCoach.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{name(c.id)}</td>
                    {months.map((m) => <td key={m} className="num text-right">{c.rows.find((r) => r.month === m)?.sessions ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
