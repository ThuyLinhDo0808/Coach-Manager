import Link from "next/link";
import { deleteAssistantRate, saveAssistantPayment, saveAssistantRate } from "@/app/quan-ly/_actions/split";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong, isMonth, shiftMonth } from "@/lib/money";
import { payoutDb } from "@/lib/split-data";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import { vnDate } from "@/lib/time";

export const metadata = { title: "Trợ giảng" };

export default async function TroGiangPage({ searchParams }: { searchParams: Promise<{ thang?: string; loi?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("tro-giang-bang");
  const isOwner = session.roles.includes("chu");
  const month = isMonth(sp.thang) ? sp.thang : vnDate().slice(0, 7);
  const [y, mm] = month.split("-");
  const p = await payoutDb(session.coach.id);
  const t = await teachingDb(session.coach.id);
  const [rates, payments, due, classes, members] = await Promise.all([p.assistantRates(), p.assistantPayments(month), p.assistantDue(month), t.classes(), t.members()]);
  const proofs = await p.proofUrls(payments.map((x) => x.proof_path));
  const people = peopleOf(members);
  const name = (id: string) => people.find((x) => x.id === id)?.name ?? "Thành viên";
  const className = (id: string) => classes.find((c) => c.id === id)?.title ?? "Lớp";
  const assistants = withRole(people, "tro-giang");

  // Một dòng cho mỗi (lớp × trợ giảng) có cơ chế, có buổi trong tháng hoặc đã ghi tiền.
  const keys = new Map<string, { class_id: string; assistant_id: string }>();
  for (const x of [...rates, ...due, ...payments]) keys.set(`${x.class_id}:${x.assistant_id}`, { class_id: x.class_id, assistant_id: x.assistant_id });
  const rows = [...keys.values()].map((k) => {
    const d = due.find((x) => x.class_id === k.class_id && x.assistant_id === k.assistant_id);
    const r = rates.find((x) => x.class_id === k.class_id && x.assistant_id === k.assistant_id);
    const pay = payments.find((x) => x.class_id === k.class_id && x.assistant_id === k.assistant_id);
    return { ...k, sessions: d?.sessions ?? 0, amount: d?.amount ?? 0, rate: r, pay };
  });
  const totalDue = rows.reduce((n, r) => n + r.amount, 0);
  const totalPaid = rows.reduce((n, r) => n + (r.pay?.paid_amount ?? 0), 0);
  const totalStudent = rows.reduce((n, r) => n + (r.pay?.student_paid ?? 0), 0);
  const rateText = (r?: { per_session: number; per_month: number }) =>
    !r ? "chưa có cơ chế" : [r.per_session ? `${dong(r.per_session)} / buổi` : null, r.per_month ? `${dong(r.per_month)} / tháng` : null].filter(Boolean).join(" + ") || "0 đ";

  return (
    <>
      <PageHead icon="team" color="teal" title="Trợ giảng" sub={`Tháng ${mm}/${y} · tính riêng, ngoài 6 phần chia`}>
        <Link href={`?thang=${shiftMonth(month, -1)}`} className="btn sm glass" aria-label="Tháng trước">‹</Link>
        <Link href={`?thang=${shiftMonth(month, 1)}`} className="btn sm glass" aria-label="Tháng sau">›</Link>
      </PageHead>
      {sp.loi && <div className="card mb-4 text-[13px] font-semibold text-bad" role="alert">{sp.loi}</div>}

      <div className="kpis">
        <div className="card kpi"><div className="l">Phải trả trợ giảng</div><div className="v">{dong(totalDue)}</div><div className="s">{rows.reduce((n, r) => n + r.sessions, 0)} buổi</div></div>
        <div className="card kpi"><div className="l">Học viên đã trả</div><div className="v">{dong(totalStudent)}</div><div className="s">tiền trợ giảng thu từ học viên</div></div>
        <div className="card kpi"><div className="l">Đã chuyển</div><div className="v">{dong(totalPaid)}</div><div className="s">{totalDue > totalPaid ? `còn ${dong(totalDue - totalPaid)}` : "đủ"}</div></div>
      </div>

      <div className="card mb-4">
        <h2 className="h2">Tháng {mm}/{y}</h2>
        {rows.length === 0 && <div className="text-muted">Chưa có buổi nào có trợ giảng. Phân trợ giảng ở trang lớp hoặc trang buổi học.</div>}
        {rows.map((r) => (
          <div key={`${r.class_id}:${r.assistant_id}`} className="divide-row py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <b className="block truncate">{name(r.assistant_id)} · {className(r.class_id)}</b>
                <div className="text-[13px] text-faint">{rateText(r.rate)} · {r.sessions} buổi trong tháng</div>
              </div>
              <div className="text-right">
                <div className="num font-extrabold">{dong(r.amount)}</div>
                <div className="text-[13px] text-faint">HV trả {dong(r.pay?.student_paid ?? 0)} · đã chuyển {dong(r.pay?.paid_amount ?? 0)}</div>
              </div>
              {r.pay?.proof_path && proofs.get(r.pay.proof_path) && <a href={proofs.get(r.pay.proof_path)} target="_blank" rel="noopener noreferrer" className="btn sm ghost">Ảnh CK</a>}
            </div>
            {isOwner && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[13px] text-faint">Ghi tiền học viên trả / đã chuyển</summary>
                <form action={saveAssistantPayment} className="soft mt-2 grid grid-cols-2 gap-2 md:grid-cols-[1fr_1fr_1.4fr_auto]">
                  <input type="hidden" name="month" value={month} />
                  <input type="hidden" name="class_id" value={r.class_id} />
                  <input type="hidden" name="assistant_id" value={r.assistant_id} />
                  <input name="student_paid" inputMode="numeric" className="input num" style={{ height: 40 }} placeholder="HV đã trả" aria-label="Học viên đã trả (đồng)" defaultValue={r.pay?.student_paid || ""} />
                  <input name="paid_amount" inputMode="numeric" className="input num" style={{ height: 40 }} placeholder="Đã chuyển" aria-label="Đã chuyển cho trợ giảng (đồng)" defaultValue={r.pay?.paid_amount || ""} />
                  <input type="file" name="proof" accept="image/*,application/pdf" className="col-span-2 self-center text-[13px] md:col-span-1" aria-label="Ảnh chuyển khoản" />
                  <button className="btn sm primary col-span-2 md:col-span-1">Lưu</button>
                </form>
              </details>
            )}
          </div>
        ))}
        <p className="mt-3 text-xs text-faint">Tính buổi đã hoàn tất hoặc đã điểm danh, không tính buổi huỷ. Tiền trợ giảng được gộp vào bảng phải trả khi chốt tháng.</p>
      </div>

      <div className={`grid items-start gap-4 *:min-w-0 ${isOwner ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
        <div className="card">
          <h2 className="h2">Cơ chế trợ giảng</h2>
          {rates.length === 0 && <div className="text-muted">Chưa có.</div>}
          {rates.map((r) => (
            <div key={r.id} className="divide-row flex items-center gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <b className="block truncate">{className(r.class_id)}</b>
                <div className="text-[13px] text-faint">{name(r.assistant_id)} · {rateText(r)}{r.note ? ` · ${r.note}` : ""}</div>
              </div>
              {isOwner && (
                <form action={deleteAssistantRate}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn sm ghost">Xoá</button>
                </form>
              )}
            </div>
          ))}
        </div>
        {isOwner && (
          <form action={saveAssistantRate} className="card grid gap-3">
            <h2 className="h2">Thêm / sửa cơ chế</h2>
            <input type="hidden" name="month" value={month} />
            <select name="class_id" required className="input" aria-label="Lớp" defaultValue="">
              <option value="" disabled>Chọn lớp…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select name="assistant_id" required className="input" aria-label="Trợ giảng" defaultValue="">
              <option value="" disabled>Chọn trợ giảng…</option>
              {assistants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="per_session" inputMode="numeric" className="input num" placeholder="Tiền / buổi" aria-label="Tiền mỗi buổi (đồng)" />
              <input name="per_month" inputMode="numeric" className="input num" placeholder="Tiền / tháng" aria-label="Tiền cố định mỗi tháng (đồng)" />
            </div>
            <input name="note" className="input" placeholder="Ghi chú (ví dụ: học viên đóng thêm 50.000 / buổi)" aria-label="Ghi chú" />
            <button className="btn primary w-fit">Lưu cơ chế</button>
          </form>
        )}
      </div>
    </>
  );
}
