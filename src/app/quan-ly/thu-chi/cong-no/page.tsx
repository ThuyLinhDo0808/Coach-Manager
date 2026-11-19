import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong, studentDebts } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { teachingDb } from "@/lib/teaching-data";

export const metadata = { title: "Công nợ học viên" };

export default async function CongNoPage() {
  const session = await requirePerm("tai-chinh");
  const t = await teachingDb(session.coach.id);
  const [students, enrollments, classes, ledger] = await Promise.all([t.students(), t.enrollments(), t.classes(), (await moneyDb(session.coach.id)).ledgerAllThu()]);
  const debts = studentDebts(students, enrollments, ledger);
  const total = debts.reduce((n, d) => n + d.debt, 0);
  const classesOf = (sid: string) =>
    enrollments.filter((e) => e.student_id === sid && e.status !== "nghi").map((e) => classes.find((c) => c.id === e.class_id)?.title).filter(Boolean).join(", ");

  return (
    <>
      <PageHead icon="wallet" color="emerald" title="Công nợ học viên" sub={`${debts.length} học viên · còn nợ ${dong(total)}`} />
      <div className="card">
        {debts.length === 0 && <div className="text-muted">Không học viên nào còn nợ.</div>}
        {debts.length > 0 && (
          <>
            <table className="tbl hide-m">
              <thead>
                <tr><th>Học viên</th><th>Lớp</th><th className="text-right!">Học phí</th><th className="text-right!">Đã đóng</th><th className="text-right!">Còn nợ</th></tr>
              </thead>
              <tbody>
                {debts.map((d) => (
                  <tr key={d.s.id}>
                    <td><Link href={`/quan-ly/hoc-vien/${d.s.id}`} className="font-semibold">{d.s.full_name}</Link></td>
                    <td className="text-muted">{classesOf(d.s.id)}</td>
                    <td className="num text-right">{dong(d.owed)}</td>
                    <td className="num text-right text-muted">{dong(d.paid)}</td>
                    <td className="num text-right font-bold text-warn">{dong(d.debt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="only-m">
              {debts.map((d, i) => (
                <Link key={d.s.id} href={`/quan-ly/hoc-vien/${d.s.id}`} className={`block py-2.5 ${i ? "divide-row" : ""}`}>
                  <div className="flex items-center justify-between gap-2"><b>{d.s.full_name}</b><span className="num font-bold text-warn">{dong(d.debt)}</span></div>
                  <div className="text-[13px] text-faint">{classesOf(d.s.id)} · đã đóng {dong(d.paid)} / {dong(d.owed)}</div>
                </Link>
              ))}
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-faint">Nợ = học phí thoả thuận của các lớp (trừ lớp đã nghỉ) − số đã thu gắn với học viên trong sổ thu chi. Tiền sân / bóng không tính vào đây.</p>
      </div>
    </>
  );
}
