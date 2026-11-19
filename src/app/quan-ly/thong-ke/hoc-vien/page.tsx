import { PageHead } from "@/components/admin-shell";
import { Bar, RangeSeg } from "@/components/range-seg";
import { requirePerm } from "@/lib/auth";
import { avgDuprGain, pct, retention, statRange } from "@/lib/stats";
import { sessionsLeft } from "@/lib/teaching";
import { teachingDb } from "@/lib/teaching-data";
import { vnDate } from "@/lib/time";

export const metadata = { title: "Thống kê học viên" };

export default async function ThongKeHocVienPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("thong-ke");
  const { n, months } = statRange(sp.thang, vnDate().slice(0, 7));
  const t = await teachingDb(session.coach.id);
  const [students, enrollments, attendance, classes] = await Promise.all([t.students(), t.enrollments(), t.attendanceAll(), t.classes()]);
  const sessions = await t.sessionsOfClasses(classes.map((c) => c.id));
  const classOfSession = new Map(sessions.map((s) => [s.id, s.class_id]));
  const ret = retention(enrollments);
  const startOf = (sid: string) => students.find((s) => s.id === sid)?.dupr_start ?? null;
  const gain = avgDuprGain(enrollments.filter((e) => e.status === "tot-nghiep").map((e) => ({ final_dupr: e.final_dupr, start: startOf(e.student_id) })));
  const active = students.filter((s) => s.status === "dang-hoc");
  const perMonth = months.map((m) => ({
    m,
    added: students.filter((s) => vnDate(s.created_at).slice(0, 7) === m).length,
    graduated: enrollments.filter((e) => e.graduated_at && vnDate(e.graduated_at).slice(0, 7) === m).length,
  }));
  const max = Math.max(...perMonth.map((x) => x.added), 1);
  // Chuyên cần trong khoảng: có mặt / (có mặt + vắng + báo nghỉ)
  const firstDay = `${months[0]}-01`;
  const inRangeSessions = new Set(sessions.filter((s) => vnDate(s.starts_at) >= firstDay).map((s) => s.id));
  const att = attendance.filter((a) => inRangeSessions.has(a.session_id));
  const present = att.filter((a) => a.status === "co-mat").length;
  const lowPackages = enrollments
    .filter((e) => e.status === "dang-hoc" && e.sessions_total != null)
    .map((e) => sessionsLeft(e.sessions_total, attendance.filter((a) => a.student_id === e.student_id && classOfSession.get(a.session_id) === e.class_id)))
    .filter((left) => left != null && left <= 2).length;
  const byStatus = [
    ["Đang học", active.length],
    ["Tạm nghỉ / chờ lớp", students.filter((s) => s.status !== "dang-hoc" && s.status !== "da-nghi").length],
    ["Đã nghỉ", students.filter((s) => s.status === "da-nghi").length],
  ] as const;

  return (
    <>
      <PageHead icon="chart" color="amber" title="Thống kê học viên" sub={`${n} tháng gần nhất · ${students.length} học viên trên web`}>
        <RangeSeg path="/quan-ly/thong-ke/hoc-vien" n={n} />
      </PageHead>
      <div className="kpis">
        <div className="card kpi"><div className="l">Đang học</div><div className="v">{active.length}</div><div className="s">{lowPackages} gói còn ≤ 2 buổi</div></div>
        <div className="card kpi"><div className="l">Chuyên cần</div><div className="v">{pct(present, att.length) != null ? `${pct(present, att.length)}%` : "—"}</div><div className="s">{present} / {att.length} lượt điểm danh</div></div>
        <div className="card kpi"><div className="l">Học tiếp khoá 2</div><div className="v">{pct(ret.again, ret.base) != null ? `${pct(ret.again, ret.base)}%` : "—"}</div><div className="s">{ret.again} / {ret.base} học viên · mọi thời gian</div></div>
        <div className="card kpi"><div className="l">DUPR tăng trung bình</div><div className="v">{gain != null ? `${gain >= 0 ? "+" : ""}${String(gain).replace(".", ",")}` : "—"}</div><div className="s">sau một khoá đã tốt nghiệp</div></div>
      </div>
      <div className="grid items-start gap-4 *:min-w-0 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">Học viên mới theo tháng</h2>
          {perMonth.map((x) => (
            <div key={x.m} className="mb-2.5 grid grid-cols-[52px_1fr_auto] items-center gap-2.5 text-[13px]">
              <span className="font-semibold">T{Number(x.m.slice(5))}/{x.m.slice(2, 4)}</span>
              <Bar value={x.added} max={max} />
              <span className="num w-[90px] text-right"><b>{x.added}</b> mới{x.graduated ? ` · ${x.graduated} TN` : ""}</span>
            </div>
          ))}
          <div className="text-xs text-faint">TN = tốt nghiệp khoá trong tháng.</div>
        </div>
        <div className="card">
          <h2 className="h2">Trạng thái học viên</h2>
          {byStatus.map(([label, v]) => (
            <div key={label} className="mb-2.5 grid grid-cols-[130px_1fr_auto] items-center gap-2.5 text-[13px]">
              <span className="font-semibold">{label}</span>
              <Bar value={v} max={Math.max(students.length, 1)} />
              <span className="num w-8 text-right font-bold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
