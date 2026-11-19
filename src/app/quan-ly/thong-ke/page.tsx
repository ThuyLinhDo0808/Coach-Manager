import { PageHead } from "@/components/admin-shell";
import { RangeSeg } from "@/components/range-seg";
import { requirePerm } from "@/lib/auth";
import { dong, monthRange, trieu } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { monthReport } from "@/lib/report";
import { reportDb } from "@/lib/split-data";
import { monthlyTotals, pct, statRange } from "@/lib/stats";
import { teachingDb } from "@/lib/teaching-data";
import { vnDate, vnIso } from "@/lib/time";

export const metadata = { title: "Thống kê doanh thu" };

export default async function ThongKePage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thong-ke");
  const thisMonth = vnDate().slice(0, 7);
  const { n, months, first, last } = statRange(sp.thang, thisMonth);
  const from = `${first}-01`;
  const to = monthRange(last).to;
  const t = await teachingDb(session.coach.id);
  const [ledger, summary, sessions] = await Promise.all([
    (await moneyDb(session.coach.id)).ledgerBetween(from, to), (await reportDb(session.coach.id)).summary(first, last),
    t.sessionsBetween(vnIso(from, "00:00"), vnIso(to, "00:00")),
  ]);
  const series = monthlyTotals(ledger, months);
  const reports = months.map((m) => monthReport(summary, m));
  const revenue = reports.reduce((s, r) => s + r.revenue, 0);
  const cashIn = series.reduce((s, x) => s + x.thu, 0);
  const cashOut = series.reduce((s, x) => s + x.chi, 0);
  const prev = reports.at(-2)?.revenue ?? 0;
  const cur = reports.at(-1)?.revenue ?? 0;
  const change = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  const max = Math.max(...series.map((s) => Math.max(s.thu, s.chi)), ...reports.map((r) => r.revenue), 1);
  const taught = Math.round(sessions.filter((s) => s.status === "da-day").reduce((h, s) => h + (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3_600_000, 0));
  const mLabel = (mo: string) => `T${Number(mo.slice(5))}`;

  return (
    <>
      <PageHead icon="chart" color="amber" title="Thống kê doanh thu" sub={`${n} tháng gần nhất · ${first.slice(5)}/${first.slice(0, 4)} – ${last.slice(5)}/${last.slice(0, 4)}`}>
        <RangeSeg path="/quan-ly/thong-ke" n={n} />
      </PageHead>

      <div className="kpis">
        <div className="card kpi"><div className="l">Doanh thu đã dạy</div><div className="v">{trieu(revenue)}</div><div className="s">học phí tính theo buổi đã dạy</div></div>
        <div className="card kpi"><div className="l">Tháng này</div><div className="v">{trieu(cur)}</div><div className="s">{change != null ? `${change >= 0 ? "+" : ""}${change}% so với tháng trước` : "chưa có tháng trước để so"}</div></div>
        <div className="card kpi"><div className="l">Tiền đã thu (sổ)</div><div className="v">{trieu(cashIn)}</div><div className="s">đã chi {trieu(cashOut)} · thu trước cho gói còn buổi</div></div>
        <div className="card kpi"><div className="l">Giờ dạy</div><div className="v">{taught} giờ</div><div className="s">{pct(revenue, cashIn) != null ? `đã dạy ${pct(revenue, cashIn)}% số tiền đã thu` : "buổi đã hoàn tất"}</div></div>
      </div>

      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">
            Doanh thu đã dạy và tiền thu theo tháng
            <span className="flex gap-2.5 text-xs font-medium">
              <span className="flex items-center gap-[5px]"><i className="size-2.5 rounded-[3px] bg-lime" />Đã dạy</span>
              <span className="flex items-center gap-[5px]"><i className="size-2.5 rounded-[3px] bg-navy" />Thu</span>
              <span className="flex items-center gap-[5px]"><i className="size-2.5 rounded-[3px] bg-[#c7cbd6]" />Chi</span>
            </span>
          </h2>
          <div className="flex h-[200px] items-end gap-2.5 border-b border-line px-1" role="img" aria-label={`Theo tháng: ${months.map((m, i) => `${mLabel(m)} đã dạy ${trieu(reports[i].revenue)}, thu ${trieu(series[i].thu)}, chi ${trieu(series[i].chi)}`).join("; ")}`}>
            {months.map((m, i) => (
              <div key={m} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${mLabel(m)}: đã dạy ${dong(reports[i].revenue)}, thu ${dong(series[i].thu)}, chi ${dong(series[i].chi)}`}>
                <div className="flex w-full items-end justify-center gap-[2px]" style={{ height: 190 }}>
                  <div className="w-[30%] rounded-t-[4px] bg-lime" style={{ height: `${(reports[i].revenue / max) * 100}%` }} />
                  <div className="w-[30%] rounded-t-[4px] bg-navy" style={{ height: `${(series[i].thu / max) * 100}%` }} />
                  <div className="w-[30%] rounded-t-[4px] bg-[#c7cbd6]" style={{ height: `${(series[i].chi / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 px-1 pt-1.5">{months.map((m) => <div key={m} className="flex-1 text-center text-xs text-faint">{mLabel(m)}</div>)}</div>
          <div className="mt-1.5 text-xs text-faint">Đã dạy = học phí của các buổi đã dạy (đem chia). Thu / chi = sổ thu chi.</div>
        </div>

        <div className="card">
          <h2 className="h2">Doanh thu đã dạy chia cho ai</h2>
          {revenue === 0 && <div className="text-muted">Chưa có buổi nào được chia trong khoảng này.</div>}
          {revenue > 0 && (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Tháng</th><th className="text-right!">Đã dạy</th><th className="text-right!">Coach</th><th className="text-right!">Sale</th><th className="text-right!">Quỹ</th><th className="text-right!">Cổ đông</th></tr></thead>
                <tbody>
                  {reports.filter((r) => r.revenue).map((r) => (
                    <tr key={r.month}>
                      <td className="font-semibold">{mLabel(r.month)}/{r.month.slice(2, 4)}</td>
                      <td className="num text-right font-bold">{trieu(r.revenue)}</td>
                      <td className="num text-right">{trieu(r.coach)}</td>
                      <td className="num text-right">{trieu(r.sale)}</td>
                      <td className="num text-right">{trieu(r.fundsIn)}</td>
                      <td className="num text-right">{trieu(r.shareholders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-faint">Lãi / lỗ chi tiết ở Tài chính › Báo cáo lãi / lỗ.</p>
        </div>
      </div>
    </>
  );
}
