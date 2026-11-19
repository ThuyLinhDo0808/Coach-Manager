import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { updateClass, updateSession } from "@/app/quan-ly/_actions/teaching";
import { requirePerm } from "@/lib/auth";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import { addDays, dayLabel, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Phân công lớp" };

// Dạy chính / trợ giảng của từng lớp, và người dạy từng buổi 14 ngày tới (dạy thay).
export default async function PhanCongPage() {
  const session = await requirePerm("phan-cong");
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const [classes, members, sessions, venues] = await Promise.all([
    t.classes(), t.members(), t.sessionsBetween(vnIso(today, "00:00"), vnIso(addDays(today, 15), "00:00")), t.venues(),
  ]);
  const people = peopleOf(members);
  const coaches = withRole(people, "coach", "chu");
  const assistants = withRole(people, "tro-giang");
  const active = classes.filter((c) => c.status === "dang-dien-ra" || c.status === "sap-dien-ra");
  const upcoming = sessions.filter((s) => s.status === "du-kien" && s.kind === "day");
  const name = (id: string | null) => people.find((p) => p.id === id)?.name;
  const sel = { height: 36, fontSize: 13 } as const;

  return (
    <>
      <PageHead icon="team" color="teal" title="Phân công lớp" sub={`${active.length} lớp đang chạy · ${upcoming.length} buổi 14 ngày tới`} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="h2">Dạy chính &amp; trợ giảng theo lớp</h2>
          {active.length === 0 && <div className="text-muted">Chưa có lớp nào đang chạy.</div>}
          {active.map((c) => (
            <form key={c.id} action={updateClass} className="divide-row grid gap-2 py-3 first:border-t-0">
              <input type="hidden" name="id" value={c.id} />
              <Link href={`/quan-ly/khoa-hoc/${c.id}`} className="font-bold">{c.title}</Link>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <select name="main_coach_id" className="input" style={sel} defaultValue={c.main_coach_id ?? ""} aria-label={`Coach dạy chính lớp ${c.title}`}>
                  <option value="">Chưa có coach</option>
                  {coaches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select name="assistant_id" className="input" style={sel} defaultValue={c.assistant_id ?? ""} aria-label={`Trợ giảng lớp ${c.title}`}>
                  <option value="">Không trợ giảng</option>
                  {assistants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="btn sm ghost">Lưu</button>
              </div>
            </form>
          ))}
          <p className="mt-2 text-xs text-faint">Đổi dạy chính áp cho các buổi chưa diễn ra; buổi đã đổi người dạy thay giữ nguyên.</p>
        </section>

        <section className="card">
          <h2 className="h2">Người dạy từng buổi (dạy thay)</h2>
          {upcoming.length === 0 && <div className="text-muted">Không có buổi nào trong 14 ngày tới.</div>}
          {upcoming.map((s) => {
            const c = classes.find((x) => x.id === s.class_id);
            const sub = c?.main_coach_id && s.teacher_id && s.teacher_id !== c.main_coach_id;
            return (
              <form key={s.id} action={updateSession} className="divide-row grid gap-2 py-3 first:border-t-0">
                <input type="hidden" name="id" value={s.id} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/quan-ly/lich-day/${s.id}`} className="min-w-0">
                    <b>{c?.title ?? "Buổi học"}{s.seq ? ` · buổi ${s.seq}` : ""}</b>
                    <span className="text-[13px] text-faint"> · {dayLabel(vnDate(s.starts_at))} {vnTime(s.starts_at)} · {venues.find((v) => v.id === s.venue_id)?.name ?? "chưa có sân"}</span>
                  </Link>
                  {sub && <span className="pill warn">Dạy thay {name(c!.main_coach_id)}</span>}
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <select name="teacher_id" className="input" style={sel} defaultValue={s.teacher_id ?? ""} aria-label="Người dạy buổi này">
                    <option value="">Chưa có người dạy</option>
                    {coaches.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select name="assistant_id" className="input" style={sel} defaultValue={s.assistant_id ?? ""} aria-label="Trợ giảng buổi này">
                    <option value="">Không trợ giảng</option>
                    {assistants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button className="btn sm ghost">Đổi</button>
                </div>
              </form>
            );
          })}
        </section>
      </div>
    </>
  );
}
