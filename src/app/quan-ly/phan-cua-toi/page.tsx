import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Bar, RangeSeg } from "@/components/range-seg";
import { requirePerm } from "@/lib/auth";
import { dong } from "@/lib/money";
import { monthReport } from "@/lib/report";
import { reportDb, splitDb } from "@/lib/split-data";
import { statRange } from "@/lib/stats";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Phần của tôi" };

export default async function PhanCuaToiPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("phan-cua-toi");
  const me = session.userId;
  const { n, months, first, last } = statRange(sp.thang, vnDate().slice(0, 7));
  const r = await reportDb(session.coach.id);
  const [entries, summary, payouts, closed, rules] = await Promise.all([
    r.myEntries(me, first, last), r.summary(first, last), r.myPayouts(me), (await splitDb(session.coach.id)).closedMonths(), (await splitDb(session.coach.id)).rules(),
  ]);
  const share = entries.filter((e) => e.party_kind === "co-dong");
  const perMonth = months.map((m) => ({ m, mine: share.filter((e) => e.month === m).reduce((s, e) => s + e.amount, 0), center: monthReport(summary, m) }));
  const total = perMonth.reduce((s, x) => s + x.mine, 0);
  const max = Math.max(...perMonth.map((x) => x.mine), 1);
  const today = vnDate();
  const rule = rules.find((x) => x.effective_from <= today);
  const myShare = rule?.shareholders.find((s) => s.user_id === me);
  const mLabel = (m: string) => `T${Number(m.slice(5))}/${m.slice(2, 4)}`;

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Phần của tôi" sub={myShare ? `Cổ đông ${myShare.name} · ${(myShare.bp / 100).toLocaleString("vi-VN")}% khoản đem chia` : "Phần cổ đông"}>
        <RangeSeg path="/quan-ly/phan-cua-toi" n={n} />
      </PageHead>
      {!myShare && (
        <div className="card mb-4" style={{ background: "#fffbeb" }}>
          Tài khoản của bạn chưa được gắn với một cổ đông trong tỉ lệ đang áp dụng, nên chưa có số ở đây. Team Leader gắn ở Cài đặt › Tỉ lệ chia &amp; cổ đông.
        </div>
      )}
      <div className="kpis">
        <div className="card kpi"><div className="l">Phần của tôi</div><div className="v">{dong(total)}</div><div className="s">{n} tháng · gồm tháng chưa chốt</div></div>
        <div className="card kpi"><div className="l">Tháng này</div><div className="v">{dong(perMonth.at(-1)?.mine ?? 0)}</div><div className="s">tạm tính</div></div>
        <div className="card kpi"><div className="l">Lãi / lỗ trung tâm</div><div className="v">{dong(perMonth.reduce((s, x) => s + x.center.profit, 0))}</div><div className="s"><Link href="/quan-ly/tai-chinh/bao-cao" className="underline">xem báo cáo</Link></div></div>
      </div>
      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-[1.3fr_1fr]">
        <div className="card">
          <h2 className="h2">Theo tháng</h2>
          {perMonth.map((x) => (
            <div key={x.m} className="mb-2.5 grid grid-cols-[56px_1fr_auto] items-center gap-2.5 text-[13px]">
              <span className="font-semibold">{mLabel(x.m)}</span>
              <Bar value={x.mine} max={max} color="var(--color-lime2)" />
              <span className="num w-[150px] text-right"><b>{dong(x.mine)}</b>{x.mine > 0 && !closed.includes(x.m) ? " · tạm" : ""}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-faint">Phần cổ đông = tỉ lệ của bạn × học phí của mọi buổi đã dạy trong tháng. Số tháng chưa chốt còn đổi theo điểm danh.</p>
        </div>
        <div className="card">
          <h2 className="h2">Đã chốt & chi trả</h2>
          {payouts.length === 0 && <div className="text-muted">Chưa có tháng nào chốt.</div>}
          {payouts.map((p) => (
            <div key={p.id} className="divide-row flex items-center justify-between gap-2 py-2.5">
              <div>
                <b>Tháng {p.month.slice(5)}/{p.month.slice(0, 4)}</b>
                <div className="text-[13px] text-faint">{Number(p.breakdown["co-dong"] ?? 0) !== p.amount ? `cổ đông ${dong(Number(p.breakdown["co-dong"] ?? 0))} + phần khác` : "phần cổ đông"}</div>
              </div>
              <div className="text-right">
                <div className="num font-bold">{dong(p.amount)}</div>
                {p.paid_at ? <span className="pill good">Đã trả {dmy(vnDate(p.paid_at))}</span> : <span className="pill warn">Chưa trả</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
