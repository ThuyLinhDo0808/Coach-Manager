import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { requirePerm } from "@/lib/auth";
import { dong } from "@/lib/money";
import { sessionsLeft } from "@/lib/teaching";
import { peopleOf, teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Gói đã mua" };

const STATUS = { "dang-hoc": ["Đang học", "warn"], "tot-nghiep": ["Tốt nghiệp", "good"], nghi: ["Đã nghỉ", "n"] } as const;

// Mỗi dòng là một đăng ký học viên × lớp / gói, kèm người chốt (sale nhận 10%).
export default async function GoiDaMuaPage({ searchParams }: { searchParams: Promise<{ tt?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("hoc-vien");
  const t = await teachingDb(session.coach.id);
  const [enrollments, students, classes, attendance, members] = await Promise.all([t.enrollments(), t.students(), t.classes(), t.attendanceAll(), t.members()]);
  const sessions = await t.sessionsOfClasses([...new Set(enrollments.map((e) => e.class_id))]);
  const classOf = new Map(sessions.map((s) => [s.id, s.class_id]));
  const people = peopleOf(members);
  const tab = sp.tt === "tot-nghiep" || sp.tt === "nghi" ? sp.tt : "dang-hoc";
  const showPrice = session.perms.includes("tai-chinh") || session.perms.includes("hoc-vien-sua");
  const rows = enrollments
    .filter((e) => e.status === tab)
    .map((e) => {
      const used = attendance.filter((a) => a.student_id === e.student_id && classOf.get(a.session_id) === e.class_id);
      return {
        e,
        student: students.find((s) => s.id === e.student_id),
        cls: classes.find((c) => c.id === e.class_id),
        left: sessionsLeft(e.sessions_total, used),
        closer: people.find((p) => p.id === e.closer_id)?.name ?? null,
      };
    })
    .filter((r) => r.student)
    .sort((a, b) => (a.left ?? 99) - (b.left ?? 99));

  return (
    <>
      <PageHead icon="users" color="violet" title="Gói đã mua" sub={`${enrollments.filter((e) => e.status === "dang-hoc").length} gói đang học`} />
      <div className="seg mb-3.5">
        {(["dang-hoc", "tot-nghiep", "nghi"] as const).map((k) => (
          <Link key={k} href={`/quan-ly/hoc-vien/goi?tt=${k}`} className={tab === k ? "on" : ""}>
            {STATUS[k][0]} {enrollments.filter((e) => e.status === k).length}
          </Link>
        ))}
      </div>
      <div className="card">
        {rows.length === 0 && <div className="text-muted">Không có gói nào ở mục này.</div>}
        {rows.map((r, i) => (
          <Link key={r.e.id} href={`/quan-ly/hoc-vien/${r.e.student_id}`} className={`flex flex-wrap items-center gap-x-4 gap-y-1 py-3 ${i ? "divide-row" : ""}`}>
            <div className="min-w-[180px] flex-1">
              <b>{r.student!.full_name}</b>
              <div className="text-[13px] text-faint">
                {[r.cls?.title, r.closer ? `người chốt: ${r.closer}` : "chưa có người chốt", r.e.graduated_at ? `tốt nghiệp ${dmy(vnDate(r.e.graduated_at))}` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
            {r.left != null && <span className={`pill ${r.left <= 2 && tab === "dang-hoc" ? "warn" : "n"}`}>Còn {r.left}/{r.e.sessions_total} buổi</span>}
            {showPrice && r.e.price != null && <span className="num w-[110px] text-right font-semibold">{dong(r.e.price)}</span>}
            <span className={`pill ${STATUS[r.e.status][1]}`}>{STATUS[r.e.status][0]}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
