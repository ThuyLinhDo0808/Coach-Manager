import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Avatar } from "@/components/avatar";
import { getLeads } from "@/lib/admin-data";
import type { Session } from "@/lib/auth";
import { monthRange } from "@/lib/money";
import { roleLabel, type Role } from "@/lib/permissions";
import { peopleOf, teachingDb, withRole } from "@/lib/teaching-data";
import { vnDate, vnIso } from "@/lib/time";

const TITLE: Record<"coach" | "sale" | "tro-giang", string> = { coach: "Coach", sale: "Sale", "tro-giang": "Trợ giảng" };

/** Danh sách người theo vai trò kèm số liệu tháng này. Thêm / sửa vai trò ở Cài đặt › Phân quyền. */
export async function TeamView({ session, role }: { session: Session; role: "coach" | "sale" | "tro-giang" }) {
  const t = await teachingDb(session.coach.id);
  const month = vnDate().slice(0, 7);
  const { from, to } = monthRange(month);
  const [members, classes, sessions, enrollments, leads] = await Promise.all([
    t.members(), t.classes(), t.sessionsBetween(vnIso(from, "00:00"), vnIso(to, "00:00")), t.enrollments(),
    role === "sale" ? getLeads(session.coach.id) : Promise.resolve([]),
  ]);
  const people = withRole(peopleOf(members), ...(role === "coach" ? (["coach"] as Role[]) : [role]));
  const done = sessions.filter((s) => s.status === "da-day");

  const stats = (id: string): string[] => {
    if (role === "coach") {
      const main = classes.filter((c) => c.main_coach_id === id && (c.status === "dang-dien-ra" || c.status === "sap-dien-ra"));
      const taught = done.filter((s) => s.teacher_id === id);
      const subs = taught.filter((s) => {
        const c = classes.find((x) => x.id === s.class_id);
        return c && c.main_coach_id && c.main_coach_id !== id;
      });
      return [`${main.length} lớp dạy chính`, `${taught.length} buổi đã dạy tháng này`, subs.length ? `${subs.length} buổi dạy thay` : ""].filter(Boolean);
    }
    if (role === "sale") {
      const open = leads.filter((l) => l.assigned_to === id && ["moi", "da-lien-he", "hen-hoc-thu", "cho-dong-tien"].includes(l.status));
      const closed = leads.filter((l) => l.closer_id === id && l.closed_at && vnDate(l.closed_at).startsWith(month));
      const regs = enrollments.filter((e) => e.closer_id === id && e.status !== "nghi");
      return [`${open.length} nhu cầu đang theo`, `${closed.length} chốt tháng này`, `${regs.length} đăng ký đang tính 10%`];
    }
    const cls = classes.filter((c) => c.assistant_id === id && (c.status === "dang-dien-ra" || c.status === "sap-dien-ra"));
    const assisted = done.filter((s) => s.assistant_id === id);
    return [`${cls.length} lớp được phân`, `${assisted.length} buổi đã phụ tháng này`];
  };

  return (
    <>
      <PageHead icon="team" color="teal" title={TITLE[role]} sub={`${people.length} người · số liệu tháng ${month.slice(5)}/${month.slice(0, 4)}`}>
        {session.perms.includes("cai-dat") && (
          <Link href="/quan-ly/cai-dat/thanh-vien#moi" className="btn primary">Mời / phân vai trò</Link>
        )}
      </PageHead>
      <div className="card">
        {people.length === 0 && (
          <div className="text-muted">Chưa có ai với vai trò {TITLE[role].toLowerCase()}. Mời người hoặc thêm vai trò ở Cài đặt › Phân quyền.</div>
        )}
        {people.map((p, i) => (
          <div key={p.id} className={`flex flex-wrap items-center gap-3 py-3 ${i ? "divide-row" : ""}`}>
            <Avatar name={p.name} soft />
            <div className="min-w-[160px] flex-1">
              <b>{p.name}</b>
              <div className="text-[13px] text-faint">{p.roles.map(roleLabel).join(", ")}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {stats(p.id).map((x) => <span key={x} className="pill n">{x}</span>)}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">
        Coach đứng lớp nhận 50% mỗi buổi đã dạy (kể cả dạy thay); sale nhận 10% theo người chốt của từng đăng ký. Trợ giảng thoả thuận riêng với học viên, ngoài học phí.
      </p>
    </>
  );
}
