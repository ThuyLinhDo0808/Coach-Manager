import { addFundExpense, deleteFundExpense } from "@/app/quan-ly/_actions/split";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong } from "@/lib/money";
import { EXPENSE_FUND, EXPENSE_LABEL, FUND_HINT, FUND_LABEL, payoutDb, type ExpenseCategory, type FundKey } from "@/lib/split-data";
import { teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Các quỹ" };

const FUNDS: FundKey[] = ["quy-du-phong", "quy-van-hanh", "quy-phat-trien"];
const COLOR: Record<FundKey, string> = { "quy-du-phong": "#fef3c7", "quy-van-hanh": "#dbeafe", "quy-phat-trien": "#ede9fe" };

export default async function QuyPage({ searchParams }: { searchParams: Promise<{ loi?: string; ok?: string; quy?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("quy-xem");
  const isOwner = session.roles.includes("chu");
  const p = await payoutDb(session.coach.id);
  const [balances, expenses] = await Promise.all([p.fundBalances(), p.fundExpenses()]);
  const classes = isOwner ? await (await teachingDb(session.coach.id)).classes() : [];
  const proofs = await p.proofUrls(expenses.map((e) => e.proof_path));
  const filter = FUNDS.includes(sp.quy as FundKey) ? (sp.quy as FundKey) : null;
  const shown = filter ? expenses.filter((e) => e.fund === filter) : expenses;
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title;
  const total = balances.reduce((n, b) => n + b.so_du, 0);

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Các quỹ" sub={`Tổng số dư ${dong(total)} · vào từ chia tiền buổi, ra theo khoản chi`} />
      {sp.loi && <div className="card mb-4 text-[13px] font-semibold text-bad" role="alert">{sp.loi}</div>}
      {sp.ok && <div className="card mb-4 text-[13px] font-semibold text-good" role="status">Đã ghi khoản chi.</div>}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {FUNDS.map((f) => {
          const b = balances.find((x) => x.fund === f) ?? { vao: 0, vao_da_chot: 0, chi: 0, so_du: 0 };
          return (
            <a key={f} href={filter === f ? "?" : `?quy=${f}`} className="card" style={filter === f ? { outline: "2px solid var(--color-navy, #0f1b3d)" } : undefined}>
              <div className="flex items-center justify-between">
                <b>{FUND_LABEL[f]}</b>
                <span className="pill" style={{ background: COLOR[f] }}>{FUND_HINT[f]}</span>
              </div>
              <div className={`num mt-2 text-[26px] font-extrabold ${b.so_du < 0 ? "text-bad" : ""}`}>{dong(b.so_du)}</div>
              <div className="mt-1 grid grid-cols-2 gap-1 text-[13px] text-muted">
                <span>Vào: <b className="num">{dong(b.vao)}</b></span>
                <span>Chi: <b className="num">{dong(b.chi)}</b></span>
              </div>
              {b.vao !== b.vao_da_chot && <div className="mt-1 text-xs text-faint">gồm {dong(b.vao - b.vao_da_chot)} tạm tính của tháng chưa chốt</div>}
            </a>
          );
        })}
      </div>

      <div className={`grid items-start gap-4 *:min-w-0 ${isOwner ? "md:grid-cols-[1fr_1.4fr]" : ""}`}>
        {isOwner && (
          <form action={addFundExpense} className="card grid gap-3">
            <h2 className="h2">Ghi khoản chi từ quỹ</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label htmlFor="fund">Quỹ</label>
                <select id="fund" name="fund" className="input" defaultValue={filter ?? "quy-du-phong"}>
                  {FUNDS.map((f) => <option key={f} value={f}>{FUND_LABEL[f]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="category">Loại chi</label>
                <select id="category" name="category" className="input" defaultValue="quang-cao">
                  {(Object.keys(EXPENSE_LABEL) as ExpenseCategory[]).map((c) => (
                    <option key={c} value={c}>{EXPENSE_LABEL[c]}{EXPENSE_FUND[c] ? ` (${FUND_LABEL[EXPENSE_FUND[c]!].toLowerCase()})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="amount">Số tiền (đ)</label>
                <input id="amount" name="amount" inputMode="numeric" required className="input num" placeholder="500000" />
              </div>
              <div className="field">
                <label htmlFor="spent_on">Ngày chi</label>
                <input id="spent_on" name="spent_on" type="date" required className="input" defaultValue={vnDate()} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="class_id">Lớp (nếu là tiền sân / bóng lớp đặc thù)</label>
              <select id="class_id" name="class_id" className="input" defaultValue="">
                <option value="">Không gắn lớp</option>
                {classes.filter((c) => c.center_pays_court).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="note">Ghi chú</label>
              <input id="note" name="note" className="input" placeholder="Ví dụ: Quảng cáo Facebook tuần 3" />
            </div>
            <label className="text-[13px] font-semibold">Ảnh chứng từ <input type="file" name="proof" accept="image/*,application/pdf" className="mt-1 block w-full text-[13px]" /></label>
            <p className="text-xs text-faint">Quảng cáo chi từ quỹ dự phòng. Tiền sân / bóng của lớp đặc thù (trung tâm chịu) chi từ quỹ vận hành.</p>
            <button className="btn primary w-fit">Ghi khoản chi</button>
          </form>
        )}
        <div className="card">
          <h2 className="h2">Khoản đã chi {filter ? `· ${FUND_LABEL[filter]}` : ""}</h2>
          {shown.length === 0 && <div className="text-muted">Chưa có khoản chi.</div>}
          {shown.map((e) => (
            <div key={e.id} className="divide-row flex flex-wrap items-center gap-2.5 py-2.5">
              <div className="num w-[52px] text-[13px] font-semibold">{dmy(e.spent_on)}</div>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{EXPENSE_LABEL[e.category]}{className(e.class_id) ? ` · ${className(e.class_id)}` : ""}</b>
                <div className="truncate text-[13px] text-faint">{FUND_LABEL[e.fund]}{e.note ? ` · ${e.note}` : ""}</div>
              </div>
              <span className="num font-bold text-bad">−{dong(e.amount)}</span>
              {e.proof_path && proofs.get(e.proof_path) && <a href={proofs.get(e.proof_path)} target="_blank" rel="noopener noreferrer" className="btn sm ghost">Chứng từ</a>}
              {isOwner && (
                <form action={deleteFundExpense}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="btn sm ghost" aria-label="Xoá khoản chi">Xoá</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
