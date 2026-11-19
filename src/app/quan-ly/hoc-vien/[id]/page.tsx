import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Icon } from "@/components/icon";
import { graduate, updateStudent } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { GENDERS, genderLabel } from "@/lib/labels";
import { sessionsLeft, skillProgress, STUDENT_STATUSES } from "@/lib/teaching";
import { teachingDb } from "@/lib/teaching-data";
import { dmy, vnDate } from "@/lib/time";

export const metadata = { title: "Hồ sơ học viên" };

export default async function HoSoHocVienPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tot_nghiep?: string; chung_nhan?: string; sua?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requirePerm("hoc-vien");
  const t = await teachingDb(session.coach.id);
  const st = await t.studentById(id);
  if (!st) notFound();
  const canEdit = session.perms.includes("hoc-vien-sua");
  const [enrollments, attendance, feedback, classes] = await Promise.all([t.enrollmentsOfStudent(id), t.attendanceOfStudent(id), t.feedbackOfStudent(id), t.classes()]);
  const sessions = await t.sessionsOfClasses(enrollments.map((e) => e.class_id));
  const sessionOf = (sid: string) => sessions.find((s) => s.id === sid);
  const classOf = (cid: string | null | undefined) => classes.find((c) => c.id === cid);
  const attended = attendance.filter((a) => a.status === "co-mat");
  const current = enrollments.find((e) => e.status === "dang-hoc");
  const currentSessionIds = new Set(sessions.filter((s) => s.class_id === current?.class_id).map((s) => s.id));
  const left = current ? sessionsLeft(current.sessions_total, attendance.filter((a) => currentSessionIds.has(a.session_id))) : null;
  const fbSorted = feedback
    .map((f) => ({ f, s: sessionOf(f.session_id) }))
    .filter((x) => x.s)
    .sort((a, b) => a.s!.starts_at.localeCompare(b.s!.starts_at));
  const progress = skillProgress(fbSorted.map((x) => x.f));
  const today = vnDate();
  const age = st.birth_date ? Math.floor((new Date(today).getTime() - new Date(st.birth_date).getTime()) / (365.25 * 86_400_000)) : st.birth_year ? Number(today.slice(0, 4)) - st.birth_year : null;
  const gain = st.dupr_start != null && st.dupr_current != null ? Number(st.dupr_current) - Number(st.dupr_start) : null;
  const gradTarget = enrollments.find((e) => e.id === sp.tot_nghiep && e.status === "dang-hoc");
  const cert = enrollments.find((e) => e.id === sp.chung_nhan && e.status === "tot-nghiep");
  const sub = [genderLabel(st.gender), st.birth_date ? `sinh ${dmy(st.birth_date, true)}${age != null ? ` (${age} tuổi)` : ""}` : age != null ? `${age} tuổi` : null, st.lead_id ? `từ form nhu cầu ${dmy(vnDate(st.created_at), true)}` : `thêm ngày ${dmy(vnDate(st.created_at), true)}`].filter(Boolean).join(" · ");

  return (
    <>
      <PageHead icon="users" color="violet" title={st.full_name} sub={sub}>
        {st.phone && (
          <a href={`https://zalo.me/${st.phone}`} target="_blank" rel="noopener noreferrer" className="btn sm glass">
            <Icon name="chat" size={16} /> Zalo
          </a>
        )}
        {current && canEdit && (
          <Link href={`/quan-ly/hoc-vien/${id}?tot_nghiep=${current.id}#tot-nghiep`} className="btn primary sm">Tốt nghiệp khoá</Link>
        )}
      </PageHead>

      <div className="kpis">
        <div className="card kpi"><div className="l">Buổi đã học</div><div className="v" style={{ fontSize: 24 }}>{attended.length}</div><div className="s">{enrollments.length} khoá</div></div>
        <div className="card kpi"><div className="l">Còn trong gói</div><div className="v" style={{ fontSize: 24 }}>{left ?? "—"}</div><div className="s">{current ? classOf(current.class_id)?.title : "không có lớp đang học"}</div></div>
        <div className="card kpi"><div className="l">DUPR</div><div className="v" style={{ fontSize: 24 }}>{st.dupr_start ?? "?"} → {st.dupr_current ?? "?"}</div><div className="s">{gain != null ? `${gain >= 0 ? "+" : ""}${gain.toFixed(1)} từ khi học` : "chưa có số liệu"}</div></div>
        <div className="card kpi"><div className="l">Báo nghỉ / vắng</div><div className="v" style={{ fontSize: 24 }}>{attendance.filter((a) => a.status === "bao-nghi").length} / {attendance.filter((a) => a.status === "vang").length}</div><div className="s">buổi</div></div>
      </div>

      {cert && (
        <section id="chung-nhan" className="card mb-4 text-center text-white" style={{ background: "var(--grad-navy)", padding: 28 }}>
          <span className="pill lime">Chứng nhận hoàn thành</span>
          <div className="mt-3 text-[26px] leading-tight font-extrabold">{st.full_name}</div>
          <div className="mt-1 text-[#b9c5da]">đã hoàn thành <b className="text-white">{classOf(cert.class_id)?.title}</b> cùng {session.coach.display_name}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[13px]">
            {cert.final_dupr != null && <span className="pill" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>DUPR {cert.final_dupr}</span>}
            {cert.graduated_at && <span className="pill" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{dmy(vnDate(cert.graduated_at), true)}</span>}
          </div>
          {cert.final_note && <p className="mx-auto mt-3 max-w-md text-[#dbe3f1]">“{cert.final_note}”</p>}
          <div className="mt-3 text-xs text-[#b9c5da]">Chụp màn hình thẻ này để gửi học viên.</div>
        </section>
      )}

      {gradTarget && canEdit && (
        <ActionForm action={graduate} className="card mb-4 grid gap-3.5">
          <h2 className="h2 mb-0" id="tot-nghiep">Tốt nghiệp khoá · {classOf(gradTarget.class_id)?.title}</h2>
          <input type="hidden" name="enrollment_id" value={gradTarget.id} />
          <input type="hidden" name="student_id" value={id} />
          <div className="grid gap-3.5 md:grid-cols-[160px_1fr]">
            <div className="field"><label htmlFor="g_dupr">DUPR cuối khoá</label><input id="g_dupr" name="final_dupr" inputMode="decimal" className="input" placeholder="Ví dụ 3.2" defaultValue={st.dupr_current ?? ""} /></div>
            <div className="field"><label htmlFor="g_video">Link video tổng kết</label><input id="g_video" name="final_video_url" className="input" placeholder="https://…" /></div>
          </div>
          <div className="field"><label htmlFor="g_note">Nhận xét tổng kết</label><textarea id="g_note" name="final_note" className="input" maxLength={1000} /></div>
          <div className="flex justify-end gap-2">
            <Link href={`/quan-ly/hoc-vien/${id}`} className="btn ghost">Huỷ</Link>
            <Submit>Xác nhận tốt nghiệp</Submit>
          </div>
        </ActionForm>
      )}

      <div className="grid items-start gap-4 md:grid-cols-[1.3fr_1fr]">
        <section className="card">
          <h2 className="h2">Nhận xét theo buổi</h2>
          {fbSorted.length === 0 && <div className="text-muted">Chưa có nhận xét nào. Nhận xét được viết ở trang buổi học sau khi điểm danh.</div>}
          {[...fbSorted].reverse().map(({ f, s }) => (
            <Link key={f.session_id} href={`/quan-ly/lich-day/${f.session_id}?hv=${id}#nhan-xet`} className="divide-row block py-3 first:border-t-0">
              <div className="flex items-center justify-between gap-2">
                <b>{dmy(vnDate(s!.starts_at))} · {classOf(s!.class_id)?.title}{s!.seq ? ` · buổi ${s!.seq}` : ""}</b>
                <span className={`pill ${f.shared ? "good" : "n"}`}>{f.shared ? "Cho học viên xem" : "Chỉ coach"}</span>
              </div>
              {f.comment && <div className="mt-1 text-muted">{f.comment}</div>}
            </Link>
          ))}
        </section>

        <div className="grid gap-4">
          <section className="card">
            <h2 className="h2">Kỹ năng</h2>
            {progress.length === 0 && <div className="text-muted">Chưa chấm kỹ năng buổi nào.</div>}
            {progress.map((p) => {
              const lo = Math.min(p.first, p.last);
              const hi = Math.max(p.first, p.last);
              return (
                <div key={p.key} className="mb-2.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <b>{p.label}</b>
                    <span className="num text-faint">{p.first} → {p.last} / 5</span>
                  </div>
                  <div className="relative mt-[5px] h-2 rounded-full bg-page">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-[#c7d2e6]" style={{ width: `${lo * 20}%` }} />
                    <div className="absolute inset-y-0 rounded-r-full" style={{ left: `${lo * 20}%`, width: `${(hi - lo) * 20}%`, background: p.last >= p.first ? "var(--color-navy)" : "var(--color-bad)" }} />
                  </div>
                </div>
              );
            })}
            {progress.length > 0 && <div className="text-xs text-faint">Xám: buổi đầu · navy: tăng thêm đến nay</div>}
          </section>

          <section className="card">
            <h2 className="h2">Khoá học</h2>
            {enrollments.length === 0 && <div className="text-muted">Chưa vào lớp nào.</div>}
            {enrollments.map((e, i) => {
              const ids = new Set(sessions.filter((s) => s.class_id === e.class_id).map((s) => s.id));
              const done = attendance.filter((a) => ids.has(a.session_id) && a.status === "co-mat").length;
              return (
                <div key={e.id} className={`flex items-center gap-2 py-[9px] ${i ? "divide-row" : ""}`}>
                  <Link href={`/quan-ly/khoa-hoc/${e.class_id}`} className="min-w-0 flex-1">
                    <b className="block truncate">{classOf(e.class_id)?.title ?? "Lớp đã xoá"}</b>
                    <div className="text-[13px] text-faint">{done}{e.sessions_total ? `/${e.sessions_total}` : ""} buổi</div>
                  </Link>
                  {e.status === "tot-nghiep" ? (
                    <Link href={`/quan-ly/hoc-vien/${id}?chung_nhan=${e.id}#chung-nhan`} className="pill good">Tốt nghiệp{e.final_dupr != null ? ` · DUPR ${e.final_dupr}` : ""}</Link>
                  ) : (
                    <span className={`pill ${e.status === "dang-hoc" ? "warn" : "n"}`}>{e.status === "dang-hoc" ? "Đang học" : "Đã nghỉ"}</span>
                  )}
                </div>
              );
            })}
          </section>

          {canEdit && (
          <section className="card">
            <details open={Boolean(sp.sua)}>
              <summary className="h2 mb-0 cursor-pointer">Thông tin học viên <span className="text-[13px] font-medium text-navy">Sửa</span></summary>
              <ActionForm action={updateStudent} className="mt-3 grid gap-3">
                <input type="hidden" name="id" value={id} />
                <div className="field"><label htmlFor="e_name">Họ tên</label><input id="e_name" name="full_name" required className="input" defaultValue={st.full_name} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field"><label htmlFor="e_phone">Số điện thoại</label><input id="e_phone" name="phone" type="tel" className="input" defaultValue={st.phone ?? ""} /></div>
                  <div className="field"><label htmlFor="e_birth">Ngày sinh</label><input id="e_birth" name="birth_date" type="date" className="input" defaultValue={st.birth_date ?? ""} /></div>
                  <div className="field">
                    <label htmlFor="e_gender">Giới tính</label>
                    <select id="e_gender" name="gender" className="input" defaultValue={st.gender ?? ""}>
                      <option value="">Chưa rõ</option>
                      {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="e_status">Trạng thái</label>
                    <select id="e_status" name="status" className="input" defaultValue={st.status}>
                      {STUDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="field"><label htmlFor="e_d1">DUPR đầu vào</label><input id="e_d1" name="dupr_start" inputMode="decimal" className="input" defaultValue={st.dupr_start ?? ""} /></div>
                  <div className="field"><label htmlFor="e_d2">DUPR hiện tại</label><input id="e_d2" name="dupr_current" inputMode="decimal" className="input" defaultValue={st.dupr_current ?? ""} /></div>
                </div>
                <div className="field"><label htmlFor="e_note">Ghi chú</label><textarea id="e_note" name="note" className="input" maxLength={1000} defaultValue={st.note ?? ""} /></div>
                <Submit className="btn navy w-fit">Lưu</Submit>
              </ActionForm>
            </details>
            {st.lead_id && <Link href={`/quan-ly/nhu-cau?id=${st.lead_id}#chi-tiet`} className="mt-3 inline-block text-[13px] font-semibold text-navy">Xem nhu cầu ban đầu ›</Link>}
          </section>
          )}
        </div>
      </div>
    </>
  );
}
