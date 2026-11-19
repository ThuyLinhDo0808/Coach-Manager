import "server-only";
import { getLeads } from "@/lib/admin-data";
import { can, type Session } from "@/lib/auth";
import { isOverdue, OPEN_STATUSES } from "@/lib/leads";
import { moneyDb } from "@/lib/money-data";
import { sessionsLeft } from "@/lib/teaching";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, nowMs, vnDate, vnIso } from "@/lib/time";
import type { IconName } from "@/components/icon";

export type TodoItem = { id: string; title: string; sub?: string; href: string };
export type TodoGroup = { key: string; icon: IconName; color: string; title: string; items: TodoItem[] };

/** Việc cần xử lý của người đang đăng nhập (chỉ các nhóm họ có quyền; dữ liệu đã lọc theo RLS). */
export async function getTodo(session: Session): Promise<TodoGroup[]> {
  const coachId = session.coach.id;
  const t = await teachingDb(coachId);
  const today = vnDate();
  const groups: TodoGroup[] = [];

  if (can(session, "tuyen-sinh") || can(session, "xac-nhan-xep-lop")) {
    const leads = await getLeads(coachId);
    if (can(session, "xac-nhan-xep-lop")) {
      const waiting = leads.filter((l) => l.status === "da-chot" && !l.ops_confirmed_at);
      groups.push({
        key: "cho-duyet", icon: "inbox", color: "indigo", title: "Đăng ký chờ xác nhận xếp lớp",
        items: waiting.map((l) => ({ id: l.id, title: l.full_name, sub: l.interests.join(", ") || undefined, href: `/quan-ly/nhu-cau?id=${l.id}#chi-tiet` })),
      });
    }
    if (can(session, "tuyen-sinh")) {
      groups.push({
        key: "qua-24h", icon: "inbox", color: "pink", title: "Nhu cầu quá 24 giờ chưa gọi",
        items: leads.filter((l) => isOverdue(l)).map((l) => ({ id: l.id, title: l.full_name, sub: l.phone, href: `/quan-ly/nhu-cau?id=${l.id}#chi-tiet` })),
      });
      groups.push({
        key: "nhac-lai", icon: "clock", color: "amber", title: "Nhu cầu đến hẹn nhắc lại",
        items: leads
          .filter((l) => l.remind_on && l.remind_on <= today && OPEN_STATUSES.includes(l.status))
          .map((l) => ({ id: l.id, title: l.full_name, sub: `Hẹn ${l.remind_on!.split("-").reverse().join("/")}`, href: `/quan-ly/nhu-cau?id=${l.id}#chi-tiet` })),
      });
    }
  }

  if (can(session, "tai-chinh")) {
    const offers = await (await moneyDb(coachId)).offersOpen();
    groups.push({
      key: "bao-chuyen", icon: "wallet", color: "emerald", title: "Học viên báo đã chuyển khoản, chờ xác nhận",
      items: offers.filter((o) => o.status === "da-bao").map((o) => ({ id: o.id, title: o.title, sub: o.memo, href: "/quan-ly/thu-chi?tab=cho" })),
    });
  }

  if (can(session, "diem-danh")) {
    const recent = await t.sessionsBetween(vnIso(addDays(today, -14), "00:00"), vnIso(addDays(today, 1), "00:00"));
    const past = recent.filter((s) => s.kind === "day" && s.status !== "huy" && new Date(s.ends_at).getTime() < nowMs());
    const feedback = await t.feedbackOfSessions(past.map((s) => s.id));
    const attendance = past.length ? await t.attendanceOfSessions(past.map((s) => s.id)) : [];
    const label = (s: (typeof past)[number]) => `${s.title ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}` : ""}`;
    const when = (iso: string) => vnDate(iso).split("-").reverse().slice(0, 2).join("/");
    groups.push({
      key: "chua-diem-danh", icon: "check", color: "cyan", title: "Buổi đã qua chưa điểm danh",
      items: past.filter((s) => s.status !== "da-day").map((s) => ({ id: s.id, title: label(s), sub: when(s.starts_at), href: `/quan-ly/lich-day/${s.id}` })),
    });
    groups.push({
      key: "chua-nhan-xet", icon: "pen", color: "indigo", title: "Buổi đã dạy chưa nhận xét đủ",
      items: past
        .filter((s) => {
          const present = attendance.filter((a) => a.session_id === s.id && a.status === "co-mat");
          return present.some((a) => !feedback.some((f) => f.session_id === s.id && f.student_id === a.student_id));
        })
        .map((s) => ({ id: s.id, title: label(s), sub: when(s.starts_at), href: `/quan-ly/lich-day/${s.id}#nhan-xet` })),
    });
  }

  if (can(session, "hoc-vien-sua")) {
    const [enrollments, students, attendance] = await Promise.all([t.enrollments(), t.students(), t.attendanceAll()]);
    const active = enrollments.filter((e) => e.status === "dang-hoc" && e.sessions_total != null);
    const classOfSession = new Map((await t.sessionsOfClasses([...new Set(active.map((e) => e.class_id))])).map((s) => [s.id, s.class_id]));
    groups.push({
      key: "goi-sap-het", icon: "clock", color: "amber", title: "Gói sắp hết buổi (còn ≤ 2)",
      items: active
        .map((e) => ({ e, left: sessionsLeft(e.sessions_total, attendance.filter((a) => a.student_id === e.student_id && classOfSession.get(a.session_id) === e.class_id)) }))
        .filter((x) => x.left != null && x.left <= 2)
        .map(({ e, left }) => ({ id: e.id, title: students.find((s) => s.id === e.student_id)?.full_name ?? "Học viên", sub: `Còn ${left} buổi`, href: `/quan-ly/hoc-vien/${e.student_id}` })),
    });
  }

  return groups;
}
