import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { getLeads, getMembers } from "@/lib/admin-data";
import { requirePerm } from "@/lib/auth";
import { dong, monthRange, trieu } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { avgDuprGain, countBy, funnel, lastMonths, monthlyTotals, pct, retention } from "@/lib/stats";
import { teachingDb } from "@/lib/teaching-data";
import { vnDate, vnIso } from "@/lib/time";
import { LEAD_ORIGINS } from "@/lib/types";

export const metadata = { title: "Thống kê" };

const RANGES = [3, 6, 12];

export default async function ThongKePage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thong-ke");
  const n = RANGES.includes(Number(sp.thang)) ? Number(sp.thang) : 6;
  const thisMonth = vnDate().slice(0, 7);
  const months = lastMonths(thisMonth, n);
  const from = `${months[0]}-01`;
  const to = monthRange(thisMonth).to;
  const fromIso = vnIso(from, "00:00");
  const toIso = vnIso(to, "00:00");

  const m = await moneyDb(session.coach.id);
  const t = await teachingDb(session.coach.id);
  const [allLeads, members, ledger, sessions, allSessionsEver, enrollments, students, confirmed] = await Promise.all([
    getLeads(session.coach.id), getMembers(session.coach.id), m.ledgerBetween(from, to), t.sessionsBetween(fromIso, toIso),
    t.sessionsBetween("2000-01-01T00:00:00Z", toIso), t.enrollments(), t.students(), m.offersConfirmedBetween(fromIso, toIso),
  ]);
  const leads = allLeads.filter((l) => l.created_at >= new Date(fromIso).toISOString() && l.created_at < new Date(toIso).toISOString());
  const trialLeadIds = new Set(allSessionsEver.filter((s) => s.kind === "hoc-thu" && s.lead_id && s.status !== "huy").map((s) => s.lead_id!));
  const steps = funnel(leads, trialLeadIds);
  const closeRate = pct(steps[3].value, steps[0].value);
  const ret = retention(enrollments);
  const startOf = (studentId: string) => students.find((s) => s.id === studentId)?.dupr_start ?? null;
  const gain = avgDuprGain(enrollments.filter((e) => e.status === "tot-nghiep").map((e) => ({ final_dupr: e.final_dupr, start: startOf(e.student_id) })));
  const hours = (list: typeof sessions) => list.filter((s) => s.status === "da-day").reduce((h, s) => h + (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3_600_000, 0);
  const taught = Math.round(hours(sessions));
  const taughtEver = Math.round(hours(allSessionsEver));

  const series = monthlyTotals(ledger, months);
  const max = Math.max(...series.map((s) => Math.max(s.thu, s.chi)), 1);
  const drops = steps.slice(1).map((s, i) => ({ from: steps[i].label, to: s.label, lost: steps[i].value - s.value, rate: pct(steps[i].value - s.value, steps[i].value) }));
  const worst = drops.filter((d) => d.lost > 0).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];

  const sales = members.filter((x) => x.role === "sale").map((x) => {
    const mine = leads.filter((l) => l.assigned_to === x.user_id);
    const won = mine.filter((l) => l.status === "da-chot").length;
    const revenue = confirmed.filter((o) => allLeads.find((l) => l.id === o.lead_id)?.assigned_to === x.user_id).reduce((s, o) => s + o.amount, 0);
    return { name: x.display_name ?? "Sale", total: mine.length, won, rate: pct(won, mine.length), commission: Math.round((revenue * Number(x.commission_pct ?? 0)) / 100) };
  });
  const originLabel = (v: string) => LEAD_ORIGINS.find((o) => o.value === v)?.label ?? v;
  const sources = countBy(leads, (l) => (l.origin === "form" ? (l.source ? `${l.source} (form)` : "Form trên web") : originLabel(l.origin)));
  const srcMax = sources[0]?.count ?? 1;
  const bestSource = countBy(leads.filter((l) => l.status === "da-chot"), (l) => (l.origin === "form" ? (l.source ? `${l.source} (form)` : "Form trên web") : originLabel(l.origin)))[0];
  const mLabel = (mo: string) => `T${Number(mo.slice(5))}`;

  return (
    <>
      <PageHead icon="chart" color="amber" title="Thống kê" sub={`${n} tháng gần nhất · ${months[0].slice(5)}/${months[0].slice(0, 4)} – ${thisMonth.slice(5)}/${thisMonth.slice(0, 4)}`}>
        <span className="seg" style={{ background: "rgba(255,255,255,.12)" }}>
          {RANGES.map((r) => (
            <Link key={r} href={`/quan-ly/thong-ke?thang=${r}`} className={r === n ? "on" : ""} style={r === n ? { background: "#fff", color: "var(--color-navy)" } : { color: "#b9c5da" }}>
              {r} tháng
            </Link>
          ))}
        </span>
      </PageHead>

      <div className="kpis">
        <div className="card kpi"><div className="l">Tỷ lệ chốt</div><div className="v">{closeRate != null ? `${closeRate}%` : "—"}</div><div className="s">{steps[3].value} / {steps[0].value} nhu cầu</div></div>
        <div className="card kpi"><div className="l">Học tiếp khoá 2</div><div className="v">{pct(ret.again, ret.base) != null ? `${pct(ret.again, ret.base)}%` : "—"}</div><div className="s">{ret.again} / {ret.base} học viên · mọi thời gian</div></div>
        <div className="card kpi"><div className="l">DUPR tăng trung bình</div><div className="v">{gain != null ? `${gain >= 0 ? "+" : ""}${String(gain).replace(".", ",")}` : "—"}</div><div className="s">sau một khoá đã tốt nghiệp</div></div>
        <div className="card kpi"><div className="l">Giờ dạy</div><div className="v">{taught} giờ</div><div className="s">tổng {taughtEver.toLocaleString("vi-VN")} giờ trên web</div></div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">Phễu chốt sale</h2>
          {steps[0].value === 0 && <div className="text-muted">Chưa có nhu cầu nào trong khoảng này.</div>}
          {steps[0].value > 0 && steps.map((s, i) => (
            <div key={s.label} className="mb-3">
              <div className="mb-[5px] flex items-center justify-between text-[13px]">
                <b>{s.label}</b>
                <span className="num"><b>{s.value}</b>{i > 0 && pct(s.value, steps[i - 1].value) != null && <span className="text-faint"> · {pct(s.value, steps[i - 1].value)}% bước trước</span>}</span>
              </div>
              <div className="h-[26px] rounded-lg" style={{ width: `${Math.max((s.value / steps[0].value) * 100, 1.5)}%`, background: i === 3 ? "var(--color-lime)" : "var(--color-navy)", opacity: i === 3 ? 1 : 1 - i * 0.18 }} />
            </div>
          ))}
          {worst && <div className="text-xs text-faint">Rơi nhiều nhất: {worst.from} → {worst.to} ({worst.rate}% không đi tiếp)</div>}
        </div>

        <div className="card">
          <h2 className="h2">
            Thu và chi theo tháng
            <span className="flex gap-2.5 text-xs font-medium">
              <span className="flex items-center gap-[5px]"><i className="size-2.5 rounded-[3px] bg-navy" />Thu</span>
              <span className="flex items-center gap-[5px]"><i className="size-2.5 rounded-[3px] bg-[#c7cbd6]" />Chi</span>
            </span>
          </h2>
          <div className="flex h-[200px] items-end gap-2.5 border-b border-line px-1" role="img" aria-label={`Thu và chi ${n} tháng: ${series.map((s) => `${mLabel(s.month)} thu ${trieu(s.thu)}, chi ${trieu(s.chi)}`).join("; ")}`}>
            {series.map((s) => (
              <div key={s.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${mLabel(s.month)}: thu ${dong(s.thu)}, chi ${dong(s.chi)}`}>
                <div className="num mb-[3px] text-[11px] font-bold">{s.thu ? String(Math.round(s.thu / 100_000) / 10).replace(".", ",") : ""}</div>
                <div className="flex w-full items-end justify-center gap-[3px]" style={{ height: 170 }}>
                  <div className="w-[42%] rounded-t-[5px] bg-navy" style={{ height: `${(s.thu / max) * 100}%` }} />
                  <div className="w-[42%] rounded-t-[5px] bg-[#c7cbd6]" style={{ height: `${(s.chi / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2.5 px-1 pt-1.5">{series.map((s) => <div key={s.month} className="flex-1 text-center text-xs text-faint">{mLabel(s.month)}</div>)}</div>
          <div className="mt-1.5 text-xs text-faint">Triệu đồng · số trên cột là tổng thu</div>
        </div>

        <div className="card">
          <h2 className="h2">Theo sale</h2>
          {sales.length === 0 ? (
            <div className="text-muted">Chưa có sale nào trong đội.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Sale</th><th className="text-right!">Nhu cầu</th><th className="text-right!">Chốt</th><th className="text-right!">Tỷ lệ</th><th className="text-right!">Hoa hồng</th></tr></thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.name}><td className="font-semibold">{s.name}</td><td className="num text-right">{s.total}</td><td className="num text-right">{s.won}</td><td className="num text-right font-bold">{s.rate != null ? `${s.rate}%` : "—"}</td><td className="num text-right text-muted">{trieu(s.commission)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="h2">Nguồn nhu cầu</h2>
          {sources.length === 0 && <div className="text-muted">Chưa có nhu cầu nào trong khoảng này.</div>}
          {sources.map((s) => (
            <div key={s.key} className="mb-2.5 flex items-center gap-2.5">
              <span className="w-[130px] flex-none truncate text-[13px] font-semibold">{s.key}</span>
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-page"><div className="h-full rounded-full bg-navy" style={{ width: `${(s.count / srcMax) * 100}%` }} /></div>
              <span className="num w-7 text-right font-bold">{s.count}</span>
            </div>
          ))}
          {bestSource && <div className="text-xs text-faint">Chốt nhiều nhất từ: {bestSource.key} ({bestSource.count} khoá)</div>}
        </div>
      </div>
    </>
  );
}
