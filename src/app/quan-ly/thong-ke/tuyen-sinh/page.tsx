import { PageHead } from "@/components/admin-shell";
import { RangeSeg } from "@/components/range-seg";
import { getLeads, getMembers } from "@/lib/admin-data";
import { requirePerm } from "@/lib/auth";
import { dong, monthRange } from "@/lib/money";
import { reportDb } from "@/lib/split-data";
import { countBy, funnel, pct, statRange } from "@/lib/stats";
import { teachingDb } from "@/lib/teaching-data";
import { vnDate, vnIso } from "@/lib/time";
import { LEAD_ORIGINS } from "@/lib/types";

export const metadata = { title: "Thống kê tuyển sinh" };

export default async function ThongKeTuyenSinhPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thong-ke");
  const { n, first, last } = statRange(sp.thang, vnDate().slice(0, 7));
  const fromIso = vnIso(`${first}-01`, "00:00");
  const toIso = vnIso(monthRange(last).to, "00:00");
  const t = await teachingDb(session.coach.id);
  const [allLeads, members, allSessionsEver, enrollments, saleEntries] = await Promise.all([
    getLeads(session.coach.id), getMembers(session.coach.id), t.sessionsBetween("2000-01-01T00:00:00Z", toIso), t.enrollments(),
    (await reportDb(session.coach.id)).entriesOfKind("sale", first, last),
  ]);
  const inRange = (iso: string | null) => Boolean(iso) && iso! >= new Date(fromIso).toISOString() && iso! < new Date(toIso).toISOString();
  const leads = allLeads.filter((l) => inRange(l.created_at));
  const trialLeadIds = new Set(allSessionsEver.filter((s) => s.kind === "hoc-thu" && s.lead_id && s.status !== "huy").map((s) => s.lead_id!));
  const steps = funnel(leads, trialLeadIds);
  const drops = steps.slice(1).map((s, i) => ({ from: steps[i].label, to: s.label, lost: steps[i].value - s.value, rate: pct(steps[i].value - s.value, steps[i].value) }));
  const worst = drops.filter((d) => d.lost > 0).sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];
  const originLabel = (v: string) => LEAD_ORIGINS.find((o) => o.value === v)?.label ?? v;
  const srcOf = (l: (typeof leads)[number]) => (l.origin === "form" ? (l.source ? `${l.source} (form)` : "Form trên web") : originLabel(l.origin));
  const sources = countBy(leads, srcOf);
  const srcMax = sources[0]?.count ?? 1;
  const bestSource = countBy(leads.filter((l) => l.status === "da-chot"), srcOf)[0];

  // Theo người chốt: nhu cầu phụ trách, số khoá chốt (đăng ký có người chốt, tạo trong khoảng), tiền chốt đã chia (10%).
  const closers = members.filter((x) => (x.roles ?? [x.role]).some((r) => r === "sale" || r === "chu" || r === "owner" || r === "quan-ly"));
  const enrolledInRange = enrollments.filter((e) => inRange(e.created_at ?? null));
  const sales = closers
    .map((x) => {
      const mine = leads.filter((l) => l.assigned_to === x.user_id);
      const closed = enrolledInRange.filter((e) => e.closer_id === x.user_id).length;
      const earned = saleEntries.filter((e) => e.party_user_id === x.user_id).reduce((s, e) => s + e.amount, 0);
      return { id: x.user_id, name: x.display_name ?? "Thành viên", total: mine.length, closed, rate: pct(mine.filter((l) => l.status === "da-chot").length, mine.length), earned };
    })
    .filter((s) => s.total || s.closed || s.earned);

  return (
    <>
      <PageHead icon="chart" color="amber" title="Thống kê tuyển sinh" sub={`${n} tháng gần nhất · ${leads.length} nhu cầu`}>
        <RangeSeg path="/quan-ly/thong-ke/tuyen-sinh" n={n} />
      </PageHead>
      <div className="kpis">
        <div className="card kpi"><div className="l">Nhu cầu mới</div><div className="v">{steps[0].value}</div><div className="s">{n} tháng</div></div>
        <div className="card kpi"><div className="l">Tỷ lệ chốt</div><div className="v">{pct(steps[3].value, steps[0].value) != null ? `${pct(steps[3].value, steps[0].value)}%` : "—"}</div><div className="s">{steps[3].value} / {steps[0].value} nhu cầu</div></div>
        <div className="card kpi"><div className="l">Khoá đã chốt</div><div className="v">{enrolledInRange.length}</div><div className="s">đăng ký học viên × lớp</div></div>
        <div className="card kpi"><div className="l">Tiền chốt đã chia</div><div className="v">{dong(saleEntries.reduce((s, e) => s + e.amount, 0))}</div><div className="s">10% các buổi đã dạy</div></div>
      </div>
      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-2">
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
        <div className="card md:col-span-2">
          <h2 className="h2">Theo người chốt</h2>
          {sales.length === 0 ? (
            <div className="text-muted">Chưa có số liệu.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Người chốt</th><th className="text-right!">Nhu cầu phụ trách</th><th className="text-right!">Tỷ lệ chốt</th><th className="text-right!">Khoá chốt</th><th className="text-right!">Tiền chốt đã chia</th></tr></thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}><td className="font-semibold">{s.name}</td><td className="num text-right">{s.total}</td><td className="num text-right">{s.rate != null ? `${s.rate}%` : "—"}</td><td className="num text-right">{s.closed}</td><td className="num text-right font-bold">{dong(s.earned)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-faint">Tiền chốt = 10% khoản đem chia của các buổi học viên đã học, cho người chốt đăng ký đó (không còn tính hoa hồng theo % offer).</p>
        </div>
      </div>
    </>
  );
}
