import Link from "next/link";
import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { createStudent } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { GENDERS } from "@/lib/labels";
import { sessionsLeft, STUDENT_STATUSES, type StudentStatus } from "@/lib/teaching";
import { CloserSelect } from "@/components/closer-select";
import { teachingDb } from "@/lib/teaching-data";
import type { Member } from "@/lib/types";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Học viên" };

export default async function HocVienPage({ searchParams }: { searchParams: Promise<{ tt?: string; them?: string; q?: string }> }) {
  const sp = await searchParams;
  const session = await requirePerm("hoc-vien");
  const t = await teachingDb(session.coach.id);
  const [students, enrollments, classes, attendance, members] = await Promise.all([t.students(), t.enrollments(), t.classes(), t.attendanceAll(), t.members()]);
  const canEdit = session.perms.includes("hoc-vien-sua");
  const sessions = await t.sessionsOfClasses(classes.map((c) => c.id));
  const tab = (STUDENT_STATUSES.some((s) => s.value === sp.tt) ? sp.tt : "dang-hoc") as StudentStatus;
  const q = (sp.q ?? "").trim().toLowerCase();
  const list = students.filter((s) => s.status === tab && (!q || s.full_name.toLowerCase().includes(q) || (s.phone ?? "").includes(q)));
  const year = Number(vnDate().slice(0, 4));

  const rows = list.map((st) => {
    const mine = enrollments.filter((e) => e.student_id === st.id);
    const current = mine.find((e) => e.status === "dang-hoc");
    const att = attendance.filter((a) => a.student_id === st.id);
    const attended = att.filter((a) => a.status === "co-mat");
    const classSessionIds = new Set(sessions.filter((s) => s.class_id === current?.class_id).map((s) => s.id));
    const left = current ? sessionsLeft(current.sessions_total, att.filter((a) => classSessionIds.has(a.session_id))) : null;
    const lastId = attended.map((a) => sessions.find((s) => s.id === a.session_id)?.starts_at).filter(Boolean).sort().pop();
    return {
      st,
      className: classes.find((c) => c.id === current?.class_id)?.title ?? (mine.length ? "—" : "Chưa vào lớp"),
      done: attended.length,
      left,
      last: lastId ? dmy(vnDate(lastId)) : "—",
      age: st.birth_year ? year - st.birth_year : null,
      dupr: st.dupr_start != null || st.dupr_current != null ? `${st.dupr_start ?? "?"} → ${st.dupr_current ?? "?"}` : "—",
    };
  });

  return (
    <>
      <PageHead icon="users" color="violet" title="Học viên" sub={`${students.filter((s) => s.status === "dang-hoc").length} đang học · ${students.length} tất cả`}>
        {canEdit && (
          <Link href="/quan-ly/hoc-vien?them=1" className="btn primary">
            <Icon name="plus" /> Thêm học viên
          </Link>
        )}
      </PageHead>

      {sp.them && canEdit && (
        <ActionForm action={createStudent} className="card mb-4 grid gap-3.5">
          <h2 className="h2 mb-0">Thêm học viên</h2>
          <div className="grid gap-3.5 md:grid-cols-3">
            <div className="field"><label htmlFor="n_name">Họ tên *</label><input id="n_name" name="full_name" required className="input" /></div>
            <div className="field"><label htmlFor="n_phone">Số điện thoại</label><input id="n_phone" name="phone" type="tel" className="input" /></div>
            <div className="field"><label htmlFor="n_birth">Ngày sinh</label><input id="n_birth" name="birth_date" type="date" className="input" /></div>
            <div className="field">
              <label htmlFor="n_gender">Giới tính</label>
              <select id="n_gender" name="gender" className="input" defaultValue="">
                <option value="">Chưa rõ</option>
                {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="n_dupr">DUPR đầu vào</label><input id="n_dupr" name="dupr" inputMode="decimal" className="input" placeholder="Ví dụ 2.8" /></div>
            <div className="field">
              <label htmlFor="n_class">Vào lớp</label>
              <select id="n_class" name="class_id" className="input" defaultValue="">
                <option value="">Chưa xếp lớp</option>
                {classes.filter((c) => c.status === "dang-dien-ra" || c.status === "sap-dien-ra").map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="n_closer">Người chốt (khi vào lớp)</label>
              <CloserSelect members={members.map((m) => ({ ...m, role: m.role as Member["role"], roles: m.roles ?? undefined }))} defaultValue={session.userId} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Link href="/quan-ly/hoc-vien" className="btn ghost">Huỷ</Link>
            <Submit>Lưu học viên</Submit>
          </div>
        </ActionForm>
      )}

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="seg">
          {STUDENT_STATUSES.map((s) => (
            <Link key={s.value} href={`/quan-ly/hoc-vien?tt=${s.value}`} className={tab === s.value ? "on" : ""}>
              {s.label} {students.filter((x) => x.status === s.value).length}
            </Link>
          ))}
        </div>
        <form className="w-full md:w-[260px]">
          <input type="hidden" name="tt" value={tab} />
          <input name="q" className="input" style={{ height: 40 }} placeholder="Tìm tên hoặc số điện thoại" defaultValue={sp.q ?? ""} aria-label="Tìm học viên" />
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="card text-muted">Chưa có học viên nào ở mục này. Học viên được tạo khi bạn chốt một nhu cầu, hoặc thêm tay.</div>
      ) : (
        <div className="card">
          <table className="tbl hide-m">
            <thead>
              <tr><th>Học viên</th><th>Tuổi</th><th>Lớp đang học</th><th className="text-right!">Đã học</th><th className="text-right!">Còn lại</th><th>DUPR</th><th>Học gần nhất</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.st.id}>
                  <td>
                    <Link href={`/quan-ly/hoc-vien/${r.st.id}`} className="flex items-center gap-2.5">
                      <Avatar name={r.st.full_name} size={32} soft />
                      <b>{r.st.full_name}</b>
                    </Link>
                  </td>
                  <td className="num text-muted">{r.age ?? "—"}</td>
                  <td className="text-muted">{r.className}</td>
                  <td className="num text-right">{r.done}</td>
                  <td className="num text-right font-bold" style={r.left != null && r.left <= 2 ? { color: "var(--color-warn)" } : undefined}>{r.left ?? "—"}</td>
                  <td className="num text-muted">{r.dupr}</td>
                  <td className="num text-muted">{r.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="only-m">
            {rows.map((r, i) => (
              <Link key={r.st.id} href={`/quan-ly/hoc-vien/${r.st.id}`} className={`flex items-center gap-2.5 py-[11px] ${i ? "divide-row" : ""}`}>
                <Avatar name={r.st.full_name} soft />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <b className="truncate">{r.st.full_name}</b>
                    {r.left != null && <span className={`pill ${r.left <= 2 ? "warn" : "n"}`}>Còn {r.left} buổi</span>}
                  </div>
                  <div className="truncate text-[13px] text-faint">{[r.className, `đã học ${r.done} buổi`, r.dupr !== "—" ? `DUPR ${r.dupr}` : null].filter(Boolean).join(" · ")}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
