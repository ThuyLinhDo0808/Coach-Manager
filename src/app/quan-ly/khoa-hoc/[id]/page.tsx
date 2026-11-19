import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Submit } from "@/components/action-form";
import { PageHead } from "@/components/admin-shell";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { addSession, createStudent, enrollStudent, unenroll, updateClass } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { formatVnd } from "@/lib/format";
import { CLASS_STATUSES, sessionsLeft } from "@/lib/teaching";
import { CloserSelect } from "@/components/closer-select";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import type { Member } from "@/lib/types";
import { dayLabel, vnDate, vnTime } from "@/lib/time";

export const metadata = { title: "Lớp học" };

export default async function LopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePerm("lop");
  const t = await teachingDb(session.coach.id);
  const cls = await t.classById(id);
  if (!cls) notFound();
  const [sessions, enrollments, venues, courses, allStudents, attendance, members] = await Promise.all([
    t.sessionsOfClass(id), t.enrollmentsOfClass(id), t.venues(), t.courses(), t.students(), t.attendanceAll(), t.members(),
  ]);
  const people = peopleOf(members);
  const personName = (uid: string | null) => people.find((p) => p.id === uid)?.name ?? null;
  const canEdit = session.perms.includes("lop-sua");
  const closerMembers = members.map((m) => ({ ...m, role: m.role as Member["role"], roles: m.roles ?? undefined }));
  const active = enrollments.filter((e) => e.status !== "nghi");
  const studentOf = (sid: string) => allStudents.find((s) => s.id === sid);
  const notEnrolled = allStudents.filter((s) => !active.some((e) => e.student_id === s.id));
  const live = sessions.filter((s) => s.status !== "huy");
  const done = live.filter((s) => s.status === "da-day").length;
  const venue = venues.find((v) => v.id === cls.venue_id);
  const course = courses.find((c) => c.id === cls.course_id);
  const sessionIds = new Set(sessions.map((s) => s.id));
  const today = vnDate();

  return (
    <>
      <PageHead
        icon="book"
        color="indigo"
        title={cls.title}
        sub={[course?.title, personName(cls.main_coach_id) ? `coach ${personName(cls.main_coach_id)}` : null, venue?.name, cls.schedule_text, `buổi ${done}/${live.length}`, cls.center_pays_court ? "trung tâm chịu tiền sân" : null].filter(Boolean).join(" · ")}
      >
        <Link href="/quan-ly/khoa-hoc" className="btn sm glass">
          <Icon name="left" size={16} /> Danh sách lớp
        </Link>
      </PageHead>

      <div className="grid items-start gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-4">
          <section className="card">
            <h2 className="h2">
              Các buổi học <span className="text-[13px] font-medium text-faint">{live.length} buổi</span>
            </h2>
            {sessions.length === 0 && <div className="mb-3 text-muted">Lớp chưa có buổi nào.</div>}
            {sessions.map((s, i) => {
              const d = vnDate(s.starts_at);
              const past = d < today;
              return (
                <Link key={s.id} href={`/quan-ly/lich-day/${s.id}`} className={`flex items-center gap-3 py-2.5 ${i ? "divide-row" : ""} ${s.status === "huy" ? "opacity-50" : ""}`}>
                  <span className="num w-[52px] flex-none font-semibold text-faint">{s.seq ? `Buổi ${s.seq}` : "—"}</span>
                  <div className="min-w-0 flex-1">
                    <b className={s.status === "huy" ? "line-through" : ""}>{dayLabel(d)} · {vnTime(s.starts_at)}–{vnTime(s.ends_at)}</b>
                    {(s.topic || (s.teacher_id && s.teacher_id !== cls.main_coach_id)) && (
                      <div className="truncate text-[13px] text-faint">
                        {[s.teacher_id && s.teacher_id !== cls.main_coach_id ? `Dạy thay: ${personName(s.teacher_id) ?? "?"}` : null, s.topic].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                  <span className={`pill ${s.status === "da-day" ? "good" : s.status === "huy" ? "n" : past ? "bad" : "warn"}`}>
                    {s.status === "da-day" ? "Đã dạy" : s.status === "huy" ? "Đã huỷ" : past ? "Chưa điểm danh" : "Sắp tới"}
                  </span>
                </Link>
              );
            })}
            {canEdit && (
            <details className="divide-row mt-2 pt-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-navy">+ Thêm buổi</summary>
              <ActionForm action={addSession} resetOnOk className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <input type="hidden" name="class_id" value={cls.id} />
                <input type="hidden" name="venue_id" value={cls.venue_id ?? ""} />
                <div className="field"><label htmlFor="s_date">Ngày</label><input id="s_date" name="date" type="date" required className="input" defaultValue={today} /></div>
                <div className="field"><label htmlFor="s_time">Giờ</label><input id="s_time" name="time" type="time" required className="input" defaultValue="18:00" /></div>
                <div className="field"><label htmlFor="s_min">Phút</label><input id="s_min" name="minutes" inputMode="numeric" className="input" defaultValue={course?.minutes_per_session ?? 90} /></div>
                <div className="field"><label htmlFor="s_topic">Nội dung</label><input id="s_topic" name="topic" className="input" /></div>
                <div className="col-span-2 md:col-span-4"><Submit className="btn sm navy">Thêm buổi</Submit></div>
              </ActionForm>
            </details>
            )}
          </section>
        </div>

        <div className="grid gap-4">
          <section className="card">
            <h2 className="h2">
              Học viên <span className="text-[13px] font-medium text-faint">{active.filter((e) => e.status === "dang-hoc").length}{cls.max_students ? `/${cls.max_students}` : ""}</span>
            </h2>
            {active.length === 0 && <div className="text-muted">Chưa có học viên.</div>}
            {active.map((e, i) => {
              const st = studentOf(e.student_id);
              if (!st) return null;
              const left = sessionsLeft(e.sessions_total, attendance.filter((a) => a.student_id === st.id && sessionIds.has(a.session_id)));
              return (
                <div key={e.id} className={`flex items-center gap-2.5 py-2.5 ${i ? "divide-row" : ""}`}>
                  <Avatar name={st.full_name} soft />
                  <Link href={`/quan-ly/hoc-vien/${st.id}`} className="min-w-0 flex-1">
                    <b className="block truncate">{st.full_name}</b>
                    <div className="text-[13px] text-faint">{e.status === "tot-nghiep" ? "Đã tốt nghiệp" : left != null ? `Còn ${left} buổi` : "Trả theo buổi"}</div>
                  </Link>
                  {e.closer_id && <span className="pill n hide-m">Chốt: {personName(e.closer_id) ?? "?"}</span>}
                  {e.status === "dang-hoc" && canEdit && (
                    <form action={unenroll}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="btn sm ghost" aria-label={`Cho ${st.full_name} nghỉ lớp`}>Nghỉ</button>
                    </form>
                  )}
                </div>
              );
            })}
            {canEdit && (
            <div className="divide-row mt-2 grid gap-3 pt-3">
              {notEnrolled.length > 0 && (
                <form action={enrollStudent} className="grid gap-2">
                  <CloserSelect members={closerMembers} defaultValue={session.userId} />
                  <div className="flex gap-2">
                  <input type="hidden" name="class_id" value={cls.id} />
                  <select name="student_id" required className="input" style={{ height: 40 }} aria-label="Chọn học viên có sẵn" defaultValue="">
                    <option value="" disabled>Thêm học viên có sẵn…</option>
                    {notEnrolled.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <button className="btn navy">Thêm</button>
                  </div>
                </form>
              )}
              <details>
                <summary className="cursor-pointer text-[13px] font-semibold text-navy">+ Học viên mới</summary>
                <ActionForm action={createStudent} className="mt-3 grid gap-3">
                  <input type="hidden" name="class_id" value={cls.id} />
                  <CloserSelect members={closerMembers} defaultValue={session.userId} />
                  <div className="field"><label htmlFor="n_name">Họ tên *</label><input id="n_name" name="full_name" required className="input" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field"><label htmlFor="n_phone">Số điện thoại</label><input id="n_phone" name="phone" type="tel" className="input" /></div>
                    <div className="field"><label htmlFor="n_birth">Ngày sinh</label><input id="n_birth" name="birth_date" type="date" className="input" /></div>
                  </div>
                  <Submit className="btn sm navy w-fit">Lưu và thêm vào lớp</Submit>
                </ActionForm>
              </details>
              <p className="text-xs text-faint">Mọi đăng ký đều cần người chốt: người này nhận 10% mỗi buổi học viên học.</p>
            </div>
            )}
          </section>

          {canEdit && (
          <section className="card">
            <h2 className="h2">Thông tin lớp</h2>
            <form action={updateClass} className="grid gap-3">
              <input type="hidden" name="id" value={cls.id} />
              <input type="hidden" name="recruiting_flag" value="1" />
              <div className="field"><label htmlFor="e_title">Tên lớp</label><input id="e_title" name="title" required className="input" defaultValue={cls.title} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label htmlFor="e_status">Trạng thái</label>
                  <select id="e_status" name="status" className="input" defaultValue={cls.status}>
                    {CLASS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="e_venue">Sân</label>
                  <select id="e_venue" name="venue_id" className="input" defaultValue={cls.venue_id ?? ""}>
                    <option value="">Chưa chọn</option>
                    {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="field"><label htmlFor="e_max">Sĩ số tối đa</label><input id="e_max" name="max_students" inputMode="numeric" className="input" defaultValue={cls.max_students ?? ""} /></div>
                <div className="field"><label htmlFor="e_price">Học phí (đ)</label><input id="e_price" name="price" inputMode="numeric" className="input" defaultValue={cls.price ?? ""} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label htmlFor="e_coach">Coach dạy chính</label>
                  <select id="e_coach" name="main_coach_id" className="input" defaultValue={cls.main_coach_id ?? ""}>
                    <option value="">Chưa phân công</option>
                    {withRole(people, "coach", "chu").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="e_tg">Trợ giảng</label>
                  <select id="e_tg" name="assistant_id" className="input" defaultValue={cls.assistant_id ?? ""}>
                    <option value="">Không có</option>
                    {withRole(people, "tro-giang").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field"><label htmlFor="e_sched">Lịch (hiện cho học viên)</label><input id="e_sched" name="schedule_text" className="input" defaultValue={cls.schedule_text ?? ""} placeholder="Ví dụ T3, T5 18:00" /></div>
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="checkbox" name="is_recruiting" defaultChecked={cls.is_recruiting} className="size-4 accent-[#16284d]" />
                Hiện ở “Lớp đang tuyển” trên trang công khai
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="checkbox" name="center_pays_court" defaultChecked={cls.center_pays_court} className="size-4 accent-[#16284d]" />
                Lớp đặc thù: trung tâm chịu tiền sân / bóng
              </label>
              <p className="text-xs text-faint">Đổi coach dạy chính chỉ áp cho buổi chưa diễn ra. Dạy thay một buổi: đổi ở trang buổi học hoặc Đội ngũ › Phân công lớp.</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-faint">{cls.price != null ? `Học phí ${formatVnd(cls.price)}` : ""}</span>
                <button className="btn navy">Lưu</button>
              </div>
            </form>
          </section>
          )}
        </div>
      </div>
    </>
  );
}
