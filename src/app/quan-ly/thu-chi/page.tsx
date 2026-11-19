import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { addLedgerEntry, cancelOffer, confirmOffer, deleteLedgerEntry } from "@/app/quan-ly/_actions/money";
import { getLeads, getMembers } from "@/lib/admin-data";
import { requireSession } from "@/lib/auth";
import { studentDebts, categoryLabel, dong, isMonth, LEDGER_CATEGORIES, monthRange, profitByClass, shiftMonth, totals, trieu } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate, vnIso } from "@/lib/time";
import { ROLE_LABEL } from "@/lib/types";

export const metadata = { title: "Sổ thu chi" };

const TABS = [["so", "Sổ thu chi"], ["cho", "Chờ xác nhận"], ["luong", "Lương & hoa hồng"]] as const;

function Amount({ kind, amount }: { kind: "thu" | "chi"; amount: number }) {
  return (
    <span className="num font-bold" style={{ color: kind === "thu" ? "var(--color-good)" : "var(--color-bad)" }}>
      {kind === "thu" ? "+" : "−"}{dong(amount)}
    </span>
  );
}

export default async function ThuChiPage({ searchParams }: { searchParams: Promise<{ thang?: string; tab?: string; loc?: string; them?: string }> }) {
  const sp = await searchParams;
  const session = await requireSession();
  if (session.role !== "owner") redirect("/quan-ly");
  const month = isMonth(sp.thang) ? sp.thang : vnDate().slice(0, 7);
  const prev = shiftMonth(month, -1);
  const tab = TABS.some(([v]) => v === sp.tab) ? sp.tab! : "so";
  const m = await moneyDb(session.coach.id);
  const t = await teachingDb(session.coach.id);
  const { from, to } = monthRange(month);
  const [rows, prevRows, open, classes, students, enrollments, allLedger, members, leads, confirmed] = await Promise.all([
    m.ledgerBetween(from, to), m.ledgerBetween(monthRange(prev).from, from), m.offersOpen(), t.classes(), t.students(), t.enrollments(),
    m.ledgerAllThu(), getMembers(session.coach.id), getLeads(session.coach.id), m.offersConfirmedBetween(vnIso(from, "00:00"), vnIso(to, "00:00")),
  ]);
  const sum = totals(rows);
  const prevNet = totals(prevRows).net;
  const change = prevNet > 0 ? Math.round(((sum.net - prevNet) / prevNet) * 100) : null;
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title;
  const memberName = (id: string | null) => {
    const x = members.find((mm) => mm.user_id === id);
    return x ? (x.display_name ?? ROLE_LABEL[x.role]) : id ? "Thành viên" : "Hệ thống";
  };
  const leadName = (id: string) => leads.find((l) => l.id === id)?.full_name ?? "—";

  const debts = studentDebts(students, enrollments, allLedger);
  const debtTotal = debts.reduce((n, d) => n + d.debt, 0);

  const filter = sp.loc === "thu" || sp.loc === "chi" ? sp.loc : null;
  const shown = filter ? rows.filter((r) => r.kind === filter) : rows;
  const profit = profitByClass(rows);
  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ thang: month, tab, loc: sp.loc, ...patch })) if (v) q.set(k, v);
    return `/quan-ly/thu-chi?${q}`;
  };
  const [y, mm] = month.split("-");

  // Hoa hồng sale: % × học phí các offer đã xác nhận trong tháng của nhu cầu do sale đó phụ trách.
  const commission = members
    .filter((x) => x.role === "sale")
    .map((x) => {
      const mine = confirmed.filter((o) => leads.find((l) => l.id === o.lead_id)?.assigned_to === x.user_id);
      const revenue = mine.reduce((n, o) => n + o.amount, 0);
      const pct = Number(x.commission_pct ?? 0);
      return { x, count: mine.length, revenue, pct, due: Math.round((revenue * pct) / 100) };
    });

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Sổ thu chi" sub={`Tháng ${mm}/${y}`}>
        <a href={`/quan-ly/thu-chi/xuat?thang=${month}`} className="btn sm glass">Xuất Excel</a>
        <Link href={href({ them: "1", tab: "so" })} className="btn primary">
          <Icon name="plus" /> Thêm khoản
        </Link>
      </PageHead>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="seg">
          {TABS.map(([v, l]) => (
            <Link key={v} href={href({ tab: v, them: undefined })} className={tab === v ? "on" : ""}>
              {l}{v === "cho" && open.length ? ` ${open.length}` : ""}
            </Link>
          ))}
          <Link href="/quan-ly/cai-dat/nhan-tien">Thanh toán</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href({ thang: prev })} className="btn sm ghost bg-white" aria-label="Tháng trước">‹</Link>
          <b>Tháng {mm}/{y}</b>
          <Link href={href({ thang: shiftMonth(month, 1) })} className="btn sm ghost bg-white" aria-label="Tháng sau">›</Link>
        </div>
      </div>

      <div className="kpis">
        <div className="card kpi"><div className="l">Thu</div><div className="v" style={{ fontSize: 24, color: "var(--color-good)" }}>{dong(sum.thu)}</div><div className="s">{rows.filter((r) => r.kind === "thu").length} khoản</div></div>
        <div className="card kpi"><div className="l">Chi</div><div className="v" style={{ fontSize: 24, color: "var(--color-bad)" }}>{dong(sum.chi)}</div><div className="s">{rows.filter((r) => r.kind === "chi").length} khoản</div></div>
        <div className="card kpi"><div className="l">Còn lại</div><div className="v" style={{ fontSize: 24 }}>{dong(sum.net)}</div><div className="s">{change != null ? `${change >= 0 ? "+" : ""}${change}% so với tháng ${prev.slice(5)}` : "chưa có số tháng trước"}</div></div>
        <Link href="/quan-ly/thu-chi/cong-no" className="card kpi"><div className="l">Học viên còn nợ</div><div className="v" style={{ fontSize: 24, color: debtTotal ? "var(--color-warn)" : undefined }}>{dong(debtTotal)}</div><div className="s">{debts.length} người · xem chi tiết</div></Link>
      </div>

      {sp.them && tab === "so" && (
        <ActionForm action={addLedgerEntry} className="card mb-4 grid gap-3.5">
          <h2 className="h2 mb-0">Thêm khoản</h2>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            <div className="field">
              <label htmlFor="l_cat">Loại</label>
              <select id="l_cat" name="category" className="input" defaultValue="thue-san">
                <optgroup label="Thu">{LEDGER_CATEGORIES.filter((c) => c.kind === "thu").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
                <optgroup label="Chi">{LEDGER_CATEGORIES.filter((c) => c.kind === "chi").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</optgroup>
              </select>
            </div>
            <div className="field"><label htmlFor="l_amount">Số tiền (đ)</label><input id="l_amount" name="amount" inputMode="numeric" required className="input num" /></div>
            <div className="field"><label htmlFor="l_date">Ngày</label><input id="l_date" name="entry_date" type="date" className="input" defaultValue={vnDate()} /></div>
            <div className="field">
              <label htmlFor="l_kind">Nếu loại “Khác”</label>
              <select id="l_kind" name="kind" className="input" defaultValue="chi"><option value="chi">Là khoản chi</option><option value="thu">Là khoản thu</option></select>
            </div>
            <div className="field col-span-2"><label htmlFor="l_desc">Nội dung</label><input id="l_desc" name="description" required maxLength={200} className="input" placeholder="Ví dụ: Thuê sân tuần 46" /></div>
            <div className="field">
              <label htmlFor="l_class">Gắn với lớp</label>
              <select id="l_class" name="class_id" className="input" defaultValue=""><option value="">Không</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            </div>
            <div className="field">
              <label htmlFor="l_student">Học viên</label>
              <select id="l_student" name="student_id" className="input" defaultValue=""><option value="">Không</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Link href={href({ them: undefined })} className="btn ghost">Đóng</Link>
            <Submit>Ghi sổ</Submit>
          </div>
        </ActionForm>
      )}

      {tab === "so" && (
        <div className="grid items-start gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="card">
            <h2 className="h2">
              Sổ thu chi
              <span className="flex gap-1.5">
                {([[undefined, "Tất cả"], ["thu", "Thu"], ["chi", "Chi"]] as const).map(([v, l]) => (
                  <Link key={l} href={href({ loc: v })} className={`chip ${filter === (v ?? null) ? "on" : ""}`} style={{ height: 32 }}>{l}</Link>
                ))}
              </span>
            </h2>
            {shown.length === 0 && <div className="text-muted">Chưa có khoản nào trong tháng này.</div>}
            {shown.length > 0 && (
              <table className="tbl hide-m">
                <thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th>Người ghi</th><th className="text-right!">Số tiền</th><th /></tr></thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td className="num text-faint">{dmy(r.entry_date)}</td>
                      <td><b className="font-semibold">{r.description}</b>{className(r.class_id) && <div className="text-xs text-faint">{className(r.class_id)}</div>}</td>
                      <td><span className="pill n">{categoryLabel(r.category)}</span></td>
                      <td className="text-muted">{memberName(r.recorded_by)}</td>
                      <td className="text-right"><Amount kind={r.kind} amount={r.amount} /></td>
                      <td className="w-8 text-right">
                        {!r.offer_id && (
                          <form action={deleteLedgerEntry}><input type="hidden" name="id" value={r.id} /><button className="text-faint hover:text-bad" aria-label={`Xoá khoản ${r.description}`}><Icon name="x" size={15} /></button></form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="only-m">
              {shown.map((r) => (
                <div key={r.id} className="divide-row py-[11px] first:border-t-0">
                  <div className="flex items-start justify-between gap-2.5"><b className="font-semibold">{r.description}</b><Amount kind={r.kind} amount={r.amount} /></div>
                  <div className="mt-0.5 text-[13px] text-faint">{[dmy(r.entry_date), categoryLabel(r.category), memberName(r.recorded_by)].join(" · ")}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="card">
              <h2 className="h2">Lãi theo lớp · tháng {mm}</h2>
              {profit.length === 0 ? (
                <div className="text-muted">Chưa có khoản nào gắn với lớp. Khi ghi thuê sân, chọn “Gắn với lớp” để thấy lãi từng lớp.</div>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Lớp</th><th className="text-right!">Thu</th><th className="text-right!">Chi</th><th className="text-right!">Lãi</th></tr></thead>
                  <tbody>
                    {profit.map((p) => (
                      <tr key={p.class_id}><td className="font-semibold">{className(p.class_id) ?? "Lớp đã xoá"}</td><td className="num text-right">{trieu(p.thu)}</td><td className="num text-right text-muted">{trieu(p.chi)}</td><td className="num text-right font-bold">{trieu(p.net)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "cho" && (
        <div className="card">
          <h2 className="h2">Chờ xác nhận <span className="pill warn">{open.length}</span></h2>
          {open.length === 0 && <div className="text-muted">Không có khoản nào chờ. Offer được tạo ở màn Nhu cầu &amp; chốt khoá.</div>}
          {open.map((o) => (
            <div key={o.id} className="divide-row py-2.5 first:border-t-0">
              <div className="flex items-center justify-between gap-2"><Link href={`/quan-ly/nhu-cau?id=${o.lead_id}#chi-tiet`} className="font-bold">{leadName(o.lead_id)}</Link><span className="num font-bold">{dong(o.pay_now)}</span></div>
              <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-faint">{o.title} · {o.memo}{o.expires_on ? ` · hạn ${dmy(o.expires_on)}` : ""}</span>
                <span className={`pill ${o.status === "da-bao" ? "good" : "n"}`}>{o.status === "da-bao" ? "Đã báo chuyển" : "Chưa chuyển"}</span>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <form action={cancelOffer}><input type="hidden" name="id" value={o.id} /><button className="btn sm ghost">Huỷ offer</button></form>
                <form action={confirmOffer}><input type="hidden" name="id" value={o.id} /><button className="btn sm primary">Xác nhận tiền</button></form>
              </div>
            </div>
          ))}
          <p className="mt-3 text-xs text-faint">Kiểm tra app ngân hàng theo nội dung chuyển khoản rồi mới bấm Xác nhận tiền. Web không tự đối soát với ngân hàng.</p>
        </div>
      )}

      {tab === "luong" && (
        <div className="card">
          <h2 className="h2">Hoa hồng sale · tháng {mm}</h2>
          {commission.length === 0 ? (
            <div className="text-muted">Chưa có sale nào trong đội.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Sale</th><th className="text-right!">Khoá chốt</th><th className="text-right!">Học phí</th><th className="text-right!">Tỷ lệ</th><th className="text-right!">Hoa hồng</th></tr></thead>
                <tbody>
                  {commission.map((c) => (
                    <tr key={c.x.user_id}><td className="font-semibold">{c.x.display_name ?? "Sale"}</td><td className="num text-right">{c.count}</td><td className="num text-right">{dong(c.revenue)}</td><td className="num text-right">{c.pct}%</td><td className="num text-right font-bold">{dong(c.due)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-faint">
            Tính trên các offer đã xác nhận tiền trong tháng của nhu cầu do sale phụ trách. Khi trả, ghi một khoản chi loại “Hoa hồng”. Lương trợ giảng theo buổi chưa tự tính vì buổi học chưa gắn trợ giảng: ghi tay khoản chi loại “Lương”.
          </p>
        </div>
      )}
    </>
  );
}
