import { PageHead } from "@/components/admin-shell";
import { RangeSeg } from "@/components/range-seg";
import { requirePerm } from "@/lib/auth";
import { dong, trieu } from "@/lib/money";
import { monthReport, sumReports } from "@/lib/report";
import { reportDb, splitDb } from "@/lib/split-data";
import { statRange } from "@/lib/stats";
import { vnDate } from "@/lib/time";

export const metadata = { title: "Báo cáo lãi / lỗ" };

export default async function BaoCaoPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("bao-cao");
  const { n, months, first, last } = statRange(sp.thang, vnDate().slice(0, 7));
  const [summary, closed] = await Promise.all([(await reportDb(session.coach.id)).summary(first, last), (await splitDb(session.coach.id)).closedMonths()]);
  const reports = months.map((m) => monthReport(summary, m));
  const total = sumReports(reports);
  const mLabel = (m: string) => `T${Number(m.slice(5))}/${m.slice(2, 4)}`;
  const sign = (v: number) => (v < 0 ? "text-bad" : "");

  const lines: { label: string; value: number; minus?: boolean; strong?: boolean; hint?: string }[] = [
    { label: "Doanh thu đã dạy", value: total.revenue, strong: true, hint: "học phí của các buổi đã dạy" },
    { label: "Coach đứng lớp", value: total.coach, minus: true },
    { label: "Sale (người chốt)", value: total.sale, minus: true },
    { label: "Phần trung tâm giữ", value: total.kept, strong: true, hint: "trích quỹ + cổ đông" },
    { label: "Chi từ các quỹ", value: total.fundsOut, minus: true, hint: total.adSpend ? `gồm quảng cáo ${dong(total.adSpend)}` : undefined },
    { label: "Trợ giảng: học viên trả − phải trả", value: total.assistantPaidByStudents - total.assistantDue, hint: "trợ giảng tính riêng, ngoài 6 phần" },
    { label: "Lãi / lỗ trung tâm", value: total.profit, strong: true, hint: "cổ đông nhận + quỹ tăng thêm" },
  ];

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Báo cáo lãi / lỗ" sub={`${n} tháng gần nhất · theo buổi đã dạy`}>
        <RangeSeg path="/quan-ly/tai-chinh/bao-cao" n={n} />
      </PageHead>

      <div className="kpis">
        <div className="card kpi"><div className="l">Doanh thu đã dạy</div><div className="v">{trieu(total.revenue)}</div><div className="s">{n} tháng</div></div>
        <div className="card kpi"><div className="l">Lãi / lỗ trung tâm</div><div className={`v ${sign(total.profit)}`}>{trieu(total.profit)}</div><div className="s">{total.revenue ? `${Math.round((total.profit / total.revenue) * 100)}% doanh thu` : "—"}</div></div>
        <div className="card kpi"><div className="l">Cổ đông nhận</div><div className="v">{trieu(total.shareholders)}</div><div className="s">chia theo tỉ lệ cổ đông</div></div>
        <div className="card kpi"><div className="l">Quỹ tăng thêm</div><div className={`v ${sign(total.fundsIn - total.fundsOut)}`}>{trieu(total.fundsIn - total.fundsOut)}</div><div className="s">vào {trieu(total.fundsIn)} · chi {trieu(total.fundsOut)}</div></div>
      </div>

      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-[1fr_1.5fr]">
        <div className="card">
          <h2 className="h2">Cả {n} tháng</h2>
          {lines.map((l) => (
            <div key={l.label} className={`divide-row flex items-center gap-3 py-2.5 ${l.strong ? "font-extrabold" : ""}`}>
              <div className="min-w-0 flex-1">
                <div>{l.minus ? "− " : ""}{l.label}</div>
                {l.hint && <div className="text-[12px] font-normal text-faint">{l.hint}</div>}
              </div>
              <span className={`num ${sign(l.minus ? -l.value : l.value)}`}>{l.minus && l.value ? "−" : ""}{dong(l.value)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="h2">Theo tháng</h2>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Tháng</th><th className="text-right!">Đã dạy</th><th className="text-right!">Coach + sale</th><th className="text-right!">Chi quỹ</th><th className="text-right!">Trợ giảng</th><th className="text-right!">Lãi / lỗ</th></tr></thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.month}>
                    <td className="font-semibold">{mLabel(r.month)} {!closed.includes(r.month) && r.revenue > 0 && <span className="pill warn ml-1">tạm tính</span>}</td>
                    <td className="num text-right">{dong(r.revenue)}</td>
                    <td className="num text-right text-muted">{dong(r.coach + r.sale)}</td>
                    <td className="num text-right text-muted">{dong(r.fundsOut)}</td>
                    <td className="num text-right text-muted">{dong(r.assistantPaidByStudents - r.assistantDue)}</td>
                    <td className={`num text-right font-bold ${sign(r.profit)}`}>{dong(r.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-faint">
            Tính theo buổi đã dạy (không theo ngày thu tiền). Tiền sân / bóng học viên tự chịu không nằm trong báo cáo; sân / bóng lớp đặc thù do trung tâm chịu nằm trong “Chi quỹ” (quỹ vận hành). Tháng chưa chốt là tạm tính.
          </p>
        </div>
      </div>
    </>
  );
}
