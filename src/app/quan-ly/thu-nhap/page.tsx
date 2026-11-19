import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong, isMonth, monthRange, shiftMonth } from "@/lib/money";
import { payoutDb, reportDb, splitDb } from "@/lib/split-data";
import { teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Thu nhập của tôi" };

const PART: Record<string, string> = { coach: "dạy", sale: "chốt", "co-dong": "cổ đông", "tro-giang": "trợ giảng", "dieu-chinh": "điều chỉnh", "sua-tay": "sửa tay" };

export default async function ThuNhapPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thu-nhap");
  const me = session.userId;
  const month = isMonth(sp.thang) ? sp.thang : vnDate().slice(0, 7);
  const [y, mm] = month.split("-");
  const { from, to } = monthRange(month);
  const r = await reportDb(session.coach.id);
  const t = await teachingDb(session.coach.id);
  const [entries, due, payouts, closed, sessions, classes] = await Promise.all([
    r.myEntries(me, month, month), (await payoutDb(session.coach.id)).assistantDue(month), r.myPayouts(me), (await splitDb(session.coach.id)).closedMonths(),
    t.sessionsBetween(vnIso(from, "00:00"), vnIso(to, "00:00")), t.classes(),
  ]);
  const mine = entries.filter((e) => e.party_kind === "coach" || e.party_kind === "sale");
  const myDue = due.filter((d) => d.assistant_id === me && d.amount > 0);
  const teach = mine.filter((e) => e.party_kind === "coach").reduce((s, e) => s + e.amount, 0);
  const close = mine.filter((e) => e.party_kind === "sale").reduce((s, e) => s + e.amount, 0);
  const assist = myDue.reduce((s, d) => s + d.amount, 0);
  const isClosed = closed.includes(month);
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title ?? "Lớp";

  // Gộp theo buổi: phần dạy và phần chốt của mỗi buổi.
  const bySession = [...new Set(mine.map((e) => e.session_id))].map((sid) => {
    const s = sessions.find((x) => x.id === sid);
    const rows = mine.filter((e) => e.session_id === sid);
    return {
      sid, s,
      teach: rows.filter((e) => e.party_kind === "coach").reduce((n, e) => n + e.amount, 0),
      teachStudents: rows.filter((e) => e.party_kind === "coach").length,
      close: rows.filter((e) => e.party_kind === "sale").reduce((n, e) => n + e.amount, 0),
      closeStudents: rows.filter((e) => e.party_kind === "sale").length,
      date: rows[0]?.entry_date ?? "",
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Thu nhập của tôi" sub={`Tháng ${mm}/${y} · ${isClosed ? "đã chốt" : "tạm tính, chưa chốt"}`}>
        <Link href={`?thang=${shiftMonth(month, -1)}`} className="btn sm glass" aria-label="Tháng trước">‹</Link>
        <Link href={`?thang=${shiftMonth(month, 1)}`} className="btn sm glass" aria-label="Tháng sau">›</Link>
      </PageHead>
      <div className="kpis">
        <div className="card kpi"><div className="l">{isClosed ? "Cả tháng" : "Tạm tính"}</div><div className="v">{dong(teach + close + assist)}</div><div className="s">{isClosed ? "dạy + chốt + trợ giảng (phần cổ đông xem ở Phần của tôi)" : "đổi theo điểm danh tới khi chốt"}</div></div>
        {teach > 0 && <div className="card kpi"><div className="l">Phần dạy</div><div className="v">{dong(teach)}</div><div className="s">{bySession.filter((x) => x.teach).length} buổi đứng lớp</div></div>}
        {close > 0 && <div className="card kpi"><div className="l">Phần chốt</div><div className="v">{dong(close)}</div><div className="s">học viên do bạn chốt đã học</div></div>}
        {assist > 0 && <div className="card kpi"><div className="l">Trợ giảng</div><div className="v">{dong(assist)}</div><div className="s">{myDue.reduce((n, d) => n + d.sessions, 0)} buổi</div></div>}
      </div>

      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <h2 className="h2">Chi tiết tháng {mm}/{y}</h2>
          {bySession.length === 0 && myDue.length === 0 && <div className="text-muted">Tháng này chưa có khoản nào. Tiền được tính khi buổi học được điểm danh hoặc hoàn tất.</div>}
          {bySession.map((x) => (
            <div key={x.sid} className="divide-row flex items-center gap-3 py-2.5">
              <div className="num w-[74px] shrink-0 text-[13px] font-semibold">{x.s ? `${dmy(vnDate(x.s.starts_at))} ${vnTime(x.s.starts_at)}` : dmy(x.date)}</div>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{className(x.s?.class_id ?? null)}{x.s?.seq ? ` · buổi ${x.s.seq}` : ""}</b>
                <div className="truncate text-[13px] text-faint">
                  {[x.teach ? `dạy ${x.teachStudents} học viên` : null, x.close ? `chốt ${x.closeStudents} học viên` : null].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="num font-bold">{dong(x.teach + x.close)}</span>
            </div>
          ))}
          {myDue.map((d) => (
            <div key={d.class_id} className="divide-row flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <b className="block truncate">Trợ giảng · {d.class_title}</b>
                <div className="text-[13px] text-faint">{d.sessions} buổi{d.per_session ? ` × ${dong(d.per_session)}` : ""}{d.per_month ? ` + ${dong(d.per_month)} / tháng` : ""}</div>
              </div>
              <span className="num font-bold">{dong(d.amount)}</span>
            </div>
          ))}
          <p className="mt-3 text-xs text-faint">Phần dạy = 50% học phí mỗi buổi bạn đứng lớp (kể cả dạy thay). Phần chốt = 10% học phí mỗi buổi của học viên do bạn chốt. Trợ giảng tính theo cơ chế của lớp.</p>
        </div>

        <div className="card">
          <h2 className="h2">Đã chốt & chi trả</h2>
          {payouts.length === 0 && <div className="text-muted">Chưa có tháng nào chốt.</div>}
          {payouts.map((p) => (
            <div key={p.id} className="divide-row py-2.5">
              <div className="flex items-center justify-between gap-2">
                <b>Tháng {p.month.slice(5)}/{p.month.slice(0, 4)}</b>
                <span className="num font-bold">{dong(p.amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[13px] text-faint">
                <span className="min-w-0 truncate">{Object.entries(p.breakdown).filter(([, v]) => Number(v)).map(([k, v]) => `${PART[k] ?? k} ${dong(Number(v))}`).join(" · ")}</span>
                {p.paid_at ? <span className="pill good">Đã trả {dmy(vnDate(p.paid_at))}</span> : <span className="pill warn">Chưa trả</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
