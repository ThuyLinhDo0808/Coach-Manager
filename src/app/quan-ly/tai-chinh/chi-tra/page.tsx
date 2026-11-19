import Link from "next/link";
import { adjustPayout, markPayout } from "@/app/quan-ly/_actions/split";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong, isMonth, shiftMonth } from "@/lib/money";
import { payoutDb, splitDb, type Payout } from "@/lib/split-data";
import { vnDate } from "@/lib/time";

export const metadata = { title: "Chi trả" };

const PART: Record<string, string> = {
  coach: "dạy", sale: "chốt", "co-dong": "cổ đông", "tro-giang": "trợ giảng", "dieu-chinh": "điều chỉnh tháng trước", "sua-tay": "sửa tay",
  "quy-du-phong": "vào quỹ", "quy-van-hanh": "vào quỹ", "quy-phat-trien": "vào quỹ",
};
const ACTION: Record<string, string> = {
  "chot-thang": "Chốt tháng", "sua-so": "Sửa số", "dieu-chinh-thang-sau": "Điều chỉnh sang tháng sau", "da-tra": "Đánh dấu đã trả", "bo-da-tra": "Bỏ đánh dấu đã trả",
};
const when = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function ChiTraPage({ searchParams }: { searchParams: Promise<{ thang?: string; loi?: string; ok?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("tai-chinh");
  const isOwner = session.roles.includes("chu");
  const month = isMonth(sp.thang) ? sp.thang : shiftMonth(vnDate().slice(0, 7), -1);
  const [y, mm] = month.split("-");
  const p = await payoutDb(session.coach.id);
  const [payouts, audit, nextAdj, closed] = await Promise.all([p.payouts(month), p.audit(month), p.adjustmentsTo(shiftMonth(month, 1)), (await splitDb(session.coach.id)).closedMonths()]);
  const proofs = await p.proofUrls(payouts.map((x) => x.proof_path));
  const isClosed = closed.includes(month);
  const people = payouts.filter((x) => x.party_kind === "nguoi");
  const funds = payouts.filter((x) => x.party_kind === "quy");
  const unpaid = people.filter((x) => !x.paid_at && x.amount !== 0);
  const sum = (list: Payout[]) => list.reduce((n, x) => n + x.amount, 0);

  const row = (x: Payout) => {
    const parts = Object.entries(x.breakdown).filter(([, v]) => Number(v) !== 0);
    return (
      <div key={x.id} className="divide-row py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <b className="block truncate">{x.party_name}</b>
            <div className="text-[13px] text-faint">{parts.map(([k, v]) => `${PART[k] ?? k} ${dong(Number(v))}`).join(" · ")}</div>
          </div>
          <span className={`num text-base font-extrabold ${x.amount < 0 ? "text-bad" : ""}`}>{dong(x.amount)}</span>
          {x.paid_at ? <span className="pill good">Đã trả {vnDate(x.paid_at).split("-").reverse().slice(0, 2).join("/")}</span> : x.amount !== 0 && <span className="pill warn">Chưa trả</span>}
          {x.proof_path && proofs.get(x.proof_path) && <a href={proofs.get(x.proof_path)} target="_blank" rel="noopener noreferrer" className="btn sm ghost">Ảnh CK</a>}
        </div>
        {x.paid_note && <div className="mt-1 text-[13px] text-muted">Ghi chú: {x.paid_note}</div>}
        {isOwner && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[13px] text-faint">{x.paid_at ? "Sửa số / bỏ đánh dấu" : "Đánh dấu đã trả / sửa số"}</summary>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {!x.paid_at ? (
                <form action={markPayout} className="soft grid gap-2">
                  <input type="hidden" name="id" value={x.id} />
                  <input type="hidden" name="month" value={month} />
                  <input type="hidden" name="paid" value="1" />
                  <label className="text-[13px] font-semibold">Ảnh chuyển khoản <input type="file" name="proof" accept="image/*,application/pdf" className="mt-1 block w-full text-[13px]" /></label>
                  <input name="note" className="input" style={{ height: 40 }} placeholder="Ghi chú (ngân hàng, mã giao dịch…)" aria-label="Ghi chú chi trả" />
                  <button className="btn sm primary w-fit">Đã trả {dong(x.amount)}</button>
                </form>
              ) : (
                <form action={markPayout} className="soft grid gap-2">
                  <input type="hidden" name="id" value={x.id} />
                  <input type="hidden" name="month" value={month} />
                  <input type="hidden" name="paid" value="0" />
                  <input name="note" required minLength={3} className="input" style={{ height: 40 }} placeholder="Lý do bỏ đánh dấu" aria-label="Lý do bỏ đánh dấu đã trả" />
                  <button className="btn sm ghost w-fit">Bỏ đánh dấu đã trả</button>
                </form>
              )}
              <form action={adjustPayout} className="soft grid gap-2">
                <input type="hidden" name="id" value={x.id} />
                <input type="hidden" name="month" value={month} />
                <input name="amount" inputMode="numeric" required className="input num" style={{ height: 40 }} defaultValue={x.amount} aria-label="Số phải trả mới" />
                <input name="reason" required minLength={3} className="input" style={{ height: 40 }} placeholder="Lý do sửa (bắt buộc)" aria-label="Lý do sửa" />
                <button className="btn sm ghost w-fit">Sửa số</button>
                <span className="text-xs text-faint">{x.paid_at ? "Đã trả rồi: phần chênh lệch sẽ cộng / trừ vào tháng sau." : "Ghi vào nhật ký: ai sửa, lúc nào, số cũ, số mới."}</span>
              </form>
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Chi trả" sub={`Tháng ${mm}/${y} · ${isClosed ? `phải trả ${dong(sum(people))}` : "chưa chốt"}`}>
        <Link href={`?thang=${shiftMonth(month, -1)}`} className="btn sm glass" aria-label="Tháng trước">‹</Link>
        <Link href={`?thang=${shiftMonth(month, 1)}`} className="btn sm glass" aria-label="Tháng sau">›</Link>
      </PageHead>
      {sp.loi && <div className="card mb-4 text-[13px] font-semibold text-bad" role="alert">{sp.loi}</div>}
      {sp.ok && <div className="card mb-4 text-[13px] font-semibold text-good" role="status">{sp.ok === "dieu-chinh" ? "Khoản này đã trả: phần chênh lệch đã chuyển thành điều chỉnh tháng sau." : "Đã sửa số và ghi nhật ký."}</div>}

      {!isClosed ? (
        <div className="card">
          <h2 className="h2">Tháng {mm}/{y} chưa chốt</h2>
          <p className="text-muted">Số trong tháng đang là tạm tính. Chốt tháng ở trang Chia tiền tháng để lập bảng phải trả cho từng người và từng quỹ.</p>
          <Link href={`/quan-ly/tai-chinh/chia-tien?thang=${month}`} className="btn navy mt-3 w-fit">Mở Chia tiền tháng</Link>
        </div>
      ) : (
        <>
          <div className="kpis">
            <div className="card kpi"><div className="l">Phải trả người</div><div className="v">{dong(sum(people))}</div><div className="s">{people.length} người</div></div>
            <div className="card kpi"><div className="l">Chưa trả</div><div className="v">{dong(sum(unpaid))}</div><div className="s">{unpaid.length} người</div></div>
            <div className="card kpi"><div className="l">Vào các quỹ</div><div className="v">{dong(sum(funds))}</div><div className="s">xem số dư ở Các quỹ</div></div>
          </div>
          <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-[1.5fr_1fr]">
            <div className="card">
              <h2 className="h2">Từng người</h2>
              {people.length === 0 && <div className="text-muted">Không có khoản phải trả.</div>}
              {people.map(row)}
            </div>
            <div className="grid min-w-0 gap-4 *:min-w-0">
              <div className="card">
                <h2 className="h2">Các quỹ</h2>
                {funds.map((x) => (
                  <div key={x.id} className="divide-row flex items-center justify-between py-2.5"><b>{x.party_name}</b><span className="num font-bold">{dong(x.amount)}</span></div>
                ))}
                <Link href="/quan-ly/tai-chinh/quy" className="btn sm ghost mt-2">Xem số dư quỹ</Link>
              </div>
              {nextAdj.length > 0 && (
                <div className="card">
                  <h2 className="h2">Điều chỉnh sang tháng sau</h2>
                  {nextAdj.map((a) => (
                    <div key={a.id} className="divide-row py-2 text-[13px]">
                      <div className="flex justify-between gap-2"><b>{a.party_name}</b><span className="num font-bold">{a.amount > 0 ? "+" : ""}{dong(a.amount)}</span></div>
                      <div className="text-faint">{a.reason}{a.applied_payout_id ? " · đã cộng vào tháng sau" : " · chờ chốt tháng sau"}</div>
                    </div>
                  ))}
                </div>
              )}
              {isOwner && (
                <div className="card">
                  <h2 className="h2">Nhật ký</h2>
                  {audit.length === 0 && <div className="text-muted">Chưa có.</div>}
                  {audit.map((a) => (
                    <div key={a.id} className="divide-row py-2 text-[13px]">
                      <div><b>{ACTION[a.action] ?? a.action}</b>{a.party_name ? ` · ${a.party_name}` : ""}</div>
                      <div className="text-faint">
                        {when(a.at)} · {a.actor_name ?? "Thành viên"}
                        {a.action === "sua-so" || a.action === "dieu-chinh-thang-sau" ? ` · ${dong(a.old_amount ?? 0)} → ${dong(a.new_amount ?? 0)}` : a.new_amount != null && a.action === "chot-thang" ? ` · tổng ${dong(a.new_amount)}` : ""}
                      </div>
                      {a.reason && <div className="text-muted">Lý do: {a.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
