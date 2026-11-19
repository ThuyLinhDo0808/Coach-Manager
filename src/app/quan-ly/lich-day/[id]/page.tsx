import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/admin-shell";
import { Avatar } from "@/components/avatar";
import { FeedbackForm } from "@/components/feedback-form";
import { Icon } from "@/components/icon";
import { markAttendance, updateSession } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { type AttendanceStatus } from "@/lib/teaching";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import { dayLabel, vnDate, vnTime } from "@/lib/time";

export const metadata = { title: "Buổi học" };

const ATT: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "co-mat", label: "Có mặt", color: "var(--color-good)" },
  { value: "vang", label: "Vắng", color: "var(--color-bad)" },
  { value: "bao-nghi", label: "Báo nghỉ", color: "var(--color-warn)" },
];

export default async function BuoiHocPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ hv?: string; sua?: string; xong?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requirePerm("diem-danh", "lich-trung-tam");
  const t = await teachingDb(session.coach.id);
  const s = await t.sessionById(id);
  if (!s) notFound();
  const [cls, venues, attendance, feedback, videos] = await Promise.all([
    s.class_id ? t.classById(s.class_id) : null, t.venues(), t.attendanceOfSession(id), t.feedbackOfSession(id), t.videos(),
  ]);
  // Danh sách học viên qua hàm session_roster: chỉ tên + số buổi, không có SĐT / học phí / ghi chú (trợ giảng dùng được).
  const roster = s.class_id ? await t.roster(id) : [];
  const students = roster.map((r) => ({ id: r.student_id, full_name: r.full_name }));
  const classSessions = s.class_id ? await t.sessionsOfClass(s.class_id) : [];
  const people = peopleOf(await t.members());
  const personName = (uid: string | null) => people.find((p) => p.id === uid)?.name ?? null;
  const canAssign = session.perms.includes("phan-cong");
  const canReschedule = session.perms.includes("lich-trung-tam");
  const canSeeStudents = session.perms.includes("hoc-vien");
  const total = classSessions.filter((x) => x.status !== "huy").length;
  const venue = venues.find((v) => v.id === s.venue_id);
  const date = vnDate(s.starts_at);
  const present = attendance.filter((a) => a.status === "co-mat");
  const attOf = (sid: string) => attendance.find((a) => a.student_id === sid)?.status;
  const fbOf = (sid: string) => feedback.find((f) => f.student_id === sid) ?? null;
  const fbTargets = students.filter((st) => attOf(st.id) === "co-mat");
  const current = fbTargets.find((st) => st.id === sp.hv) ?? fbTargets.find((st) => !fbOf(st.id)) ?? fbTargets[0] ?? null;
  const nextStudent = current ? (fbTargets.find((st) => st.id !== current.id && !fbOf(st.id)) ?? null) : null;
  const title = s.kind === "hoc-thu" ? `Học thử${s.title ? ` · ${s.title}` : ""}` : `${cls?.title ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}/${total}` : ""}`;

  return (
    <>
      <PageHead
        icon="cal"
        color="cyan"
        title={title}
        sub={[`${dayLabel(date)} · ${vnTime(s.starts_at)} – ${vnTime(s.ends_at)}`, venue ? [venue.name, venue.address].filter(Boolean).join(", ") : null, s.status === "huy" ? "ĐÃ HUỶ" : null].filter(Boolean).join(" · ")}
      >
        {venue?.maps_url && (
          <a href={venue.maps_url} target="_blank" rel="noopener noreferrer" className="btn sm glass">
            <Icon name="map" size={16} /> Bản đồ
          </a>
        )}
        {canReschedule && <Link href={`/quan-ly/lich-day/${id}?sua=1#sua`} className="btn sm glass">Dời / sửa</Link>}
      </PageHead>

      {sp.sua && canReschedule && (
        <form action={updateSession} id="sua" className="card mb-4 grid grid-cols-2 items-end gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={id} />
          <div className="field"><label htmlFor="u_date">Ngày</label><input id="u_date" name="date" type="date" required className="input" defaultValue={date} /></div>
          <div className="field"><label htmlFor="u_time">Giờ</label><input id="u_time" name="time" type="time" required className="input" defaultValue={vnTime(s.starts_at)} /></div>
          <div className="field"><label htmlFor="u_min">Phút</label><input id="u_min" name="minutes" inputMode="numeric" className="input" defaultValue={Math.round((new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000)} /></div>
          <div className="field">
            <label htmlFor="u_venue">Sân</label>
            <select id="u_venue" name="venue_id" className="input" defaultValue={s.venue_id ?? ""}>
              <option value="">Chưa chọn</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn navy flex-1">Lưu</button>
            <Link href={`/quan-ly/lich-day/${id}`} className="btn ghost">Đóng</Link>
          </div>
        </form>
      )}

      <div className="grid items-start gap-4 md:grid-cols-[1fr_1.5fr]">
        <section className="card">
          <h2 className="h2">Nội dung buổi{s.seq ? ` ${s.seq}` : ""}</h2>
          <form action={updateSession} className="grid gap-2.5">
            <input type="hidden" name="id" value={id} />
            <input name="topic" className="input font-bold" placeholder="Chủ đề buổi học" defaultValue={s.topic ?? ""} aria-label="Chủ đề" />
            <textarea name="plan" className="input" style={{ minHeight: 120 }} placeholder={"Mỗi dòng một việc, ví dụ:\nKhởi động bước chân 10 phút\nVolley chặn bóng thấp, 3 × 20 quả"} defaultValue={s.plan ?? ""} aria-label="Giáo án buổi" />
            <button className="btn sm ghost w-fit"><Icon name="pen" size={15} /> Lưu nội dung</button>
          </form>
          <div className="divide-row mt-3 grid gap-1 pt-3 text-[13px]">
            <div>
              Người dạy: <b>{personName(s.teacher_id) ?? "chưa phân công"}</b>
              {cls && s.teacher_id && cls.main_coach_id && s.teacher_id !== cls.main_coach_id && <span className="pill warn ml-1.5">Dạy thay {personName(cls.main_coach_id)}</span>}
            </div>
            <div>Trợ giảng: <b>{personName(s.assistant_id) ?? "không có"}</b></div>
            {canAssign && (
              <form action={updateSession} className="mt-1.5 grid grid-cols-[1fr_1fr_auto] gap-2">
                <input type="hidden" name="id" value={id} />
                <select name="teacher_id" className="input" style={{ height: 36, fontSize: 13 }} defaultValue={s.teacher_id ?? ""} aria-label="Người dạy buổi này">
                  <option value="">Chưa phân công</option>
                  {withRole(people, "coach", "chu").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select name="assistant_id" className="input" style={{ height: 36, fontSize: 13 }} defaultValue={s.assistant_id ?? ""} aria-label="Trợ giảng buổi này">
                  <option value="">Không trợ giảng</option>
                  {withRole(people, "tro-giang").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="btn sm ghost">Đổi</button>
              </form>
            )}
            <p className="text-xs text-faint">Tiền dạy của buổi tính cho người dạy thực tế (kể cả dạy thay).</p>
          </div>
          <div className="divide-row mt-3 flex flex-wrap gap-2 pt-3">
            {!canReschedule ? null : s.status !== "huy" ? (
              <form action={updateSession}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="huy" />
                <button className="btn sm danger">Huỷ buổi</button>
              </form>
            ) : (
              <form action={updateSession}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="du-kien" />
                <button className="btn sm ghost">Mở lại buổi</button>
              </form>
            )}
            {s.lead_id && <Link href={`/quan-ly/nhu-cau?id=${s.lead_id}#chi-tiet`} className="btn sm ghost">Xem nhu cầu</Link>}
            {cls && <Link href={`/quan-ly/khoa-hoc/${cls.id}`} className="btn sm ghost">Xem lớp</Link>}
          </div>
        </section>

        <section className="card">
          <h2 className="h2">
            <span>Điểm danh · {present.length}/{students.length} có mặt</span>
            {s.status === "da-day" ? (
              <span className="pill good">Đã hoàn tất</span>
            ) : s.status !== "huy" && students.length > 0 ? (
              <form action={updateSession}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value="da-day" />
                <button className="btn sm primary">Hoàn tất buổi</button>
              </form>
            ) : null}
          </h2>
          {students.length === 0 && (
            <div className="text-muted">
              {s.kind === "hoc-thu" ? "Buổi học thử: không cần điểm danh. Sau buổi, mở nhu cầu để chốt hoặc ghi chú." : "Lớp chưa có học viên. Thêm học viên ở trang lớp."}
            </div>
          )}
          {students.map((st) => {
            const r = roster.find((x) => x.student_id === st.id);
            const left = r?.sessions_total != null ? Math.max(r.sessions_total - r.used, 0) : null;
            const cur = attOf(st.id);
            return (
              <div key={st.id} className="divide-row flex flex-wrap items-center gap-2.5 py-3">
                <Avatar name={st.full_name} soft />
                <Link href={canSeeStudents ? `/quan-ly/hoc-vien/${st.id}` : "#"} className="min-w-[120px] flex-1">
                  <b>{st.full_name}</b>
                  <div className="text-[13px] text-faint">{left != null ? `Còn ${left} buổi` : "Trả theo buổi"}</div>
                </Link>
                <div className="flex gap-1.5">
                  {ATT.map((a) => (
                    <form key={a.value} action={markAttendance}>
                      <input type="hidden" name="session_id" value={id} />
                      <input type="hidden" name="student_id" value={st.id} />
                      <input type="hidden" name="status" value={cur === a.value ? "" : a.value} />
                      <button className="btn sm" aria-pressed={cur === a.value} style={{ height: 40, ...(cur === a.value ? { background: a.color, color: "#fff" } : { background: "#f0f0f3", color: "var(--color-muted)" }) }}>
                        {a.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {fbTargets.length > 0 && current && (
        <section className="card mt-4" id="nhan-xet">
          <h2 className="h2">
            <span>Nhận xét sau buổi · {current.full_name}</span>
            <span className="text-[13px] font-medium text-faint">{fbTargets.filter((st) => fbOf(st.id)).length}/{fbTargets.length} đã viết</span>
          </h2>
          {fbTargets.length > 1 && (
            <div className="mb-3 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {fbTargets.map((st) => (
                <Link key={st.id} href={`/quan-ly/lich-day/${id}?hv=${st.id}#nhan-xet`} scroll={false} className={`chip ${st.id === current.id ? "on" : ""}`}>
                  {fbOf(st.id) && <Icon name="check" size={14} />}
                  {st.full_name}
                </Link>
              ))}
            </div>
          )}
          {sp.xong && <div className="mb-3 text-[13px] font-semibold text-good" role="status">Đã lưu nhận xét cho cả lớp.</div>}
          <FeedbackForm key={current.id} sessionId={id} studentId={current.id} nextStudentId={nextStudent?.id ?? null} existing={fbOf(current.id)} videos={videos} />
        </section>
      )}
    </>
  );
}
