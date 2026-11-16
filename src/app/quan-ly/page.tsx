import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Icon, Tile } from "@/components/icon";
import { LeadCard } from "@/components/lead-card";
import { getAdminCourses, getLeads } from "@/lib/admin-data";
import { requireSession } from "@/lib/auth";
import { countByStatus, isOverdue, OPEN_STATUSES } from "@/lib/leads";

export const metadata = { title: "Tổng quan" };

export default async function TongQuanPage() {
  const session = await requireSession();
  const [leads, courses] = await Promise.all([getLeads(session.coach.id), getAdminCourses(session.coach.id)]);
  const counts = countByStatus(leads);
  const overdue = leads.filter((l) => isOverdue(l));
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });
  const todayIso = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const reminders = leads.filter((l) => l.remind_on && l.remind_on <= todayIso && OPEN_STATUSES.includes(l.status));
  const monthStart = todayIso.slice(0, 8) + "01";
  const closedThisMonth = leads.filter((l) => l.status === "da-chot" && l.updated_at.slice(0, 10) >= monthStart).length;
  const open = OPEN_STATUSES.reduce((n, s) => n + counts[s], 0);
  const pipeline: [string, number][] = [
    ["Mới", counts.moi],
    ["Đã liên hệ", counts["da-lien-he"]],
    ["Học thử", counts["hen-hoc-thu"]],
    ["Chờ đóng tiền", counts["cho-dong-tien"]],
    ["Đã chốt (tháng)", closedThisMonth],
  ];
  const todo: { icon: "inbox" | "clock"; color: string; text: string; href: string }[] = [];
  if (overdue.length) todo.push({ icon: "inbox", color: "pink", text: `${overdue.length} nhu cầu quá 24 giờ chưa gọi`, href: "/quan-ly/nhu-cau" });
  if (reminders.length) todo.push({ icon: "clock", color: "amber", text: `${reminders.length} nhu cầu đến hẹn nhắc lại`, href: "/quan-ly/nhu-cau" });

  return (
    <>
      <PageHead icon="home" color="blue" title="Tổng quan" sub={today.charAt(0).toUpperCase() + today.slice(1)}>
        <Link href="/quan-ly/nhu-cau?them=1" className="btn primary">
          <Icon name="plus" /> Thêm nhu cầu
        </Link>
      </PageHead>

      <div className="kpis">
        <Link href="/quan-ly/nhu-cau" className="card kpi">
          <div className="l">Nhu cầu mới</div>
          <div className="v">{counts.moi}</div>
          <div className="s" style={overdue.length ? { color: "var(--color-bad)", fontWeight: 600 } : undefined}>
            {overdue.length ? `${overdue.length} quá 24 giờ chưa gọi` : "chưa gọi"}
          </div>
        </Link>
        <Link href="/quan-ly/nhu-cau" className="card kpi">
          <div className="l">Đang theo</div>
          <div className="v">{open}</div>
          <div className="s">nhu cầu đang mở</div>
        </Link>
        <Link href="/quan-ly/nhu-cau" className="card kpi">
          <div className="l">Chờ đóng tiền</div>
          <div className="v">{counts["cho-dong-tien"]}</div>
          <div className="s">đã nhận offer</div>
        </Link>
        <Link href="/quan-ly/nhu-cau" className="card kpi">
          <div className="l">Đã chốt tháng này</div>
          <div className="v">{closedThisMonth}</div>
          <div className="s">tổng {counts["da-chot"]} từ trước tới nay</div>
        </Link>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <div className="card">
            <h2 className="h2">
              Nhu cầu &amp; chốt khoá <span className="text-[13px] font-medium text-faint">{open} đang mở</span>
            </h2>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {pipeline.map(([t, n], i) => (
                <div key={t} className="soft" style={i === 4 ? { background: "#ecfccb" } : undefined}>
                  <div className="num text-[22px] font-extrabold">{n}</div>
                  <div className="text-xs text-faint">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="h2">
              Nhu cầu mới nhất
              <Link href="/quan-ly/nhu-cau" className="btn sm ghost">Xem tất cả</Link>
            </h2>
            {leads.length === 0 && <div className="text-muted">Chưa có nhu cầu nào.</div>}
            <div className="grid gap-x-2.5 md:grid-cols-2">
              {leads.filter((l) => l.status === "moi").slice(0, 4).map((l) => (
                <LeadCard key={l.id} lead={l} courseTitle={courses.find((c) => c.id === l.course_id)?.title} href={`/quan-ly/nhu-cau?id=${l.id}#chi-tiet`} />
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="h2">Cần làm</h2>
          {todo.length === 0 && <div className="text-muted">Không có việc tồn. Tốt lắm!</div>}
          {todo.map((t) => (
            <Link key={t.text} href={t.href} className="flex items-center gap-2.5 py-[9px]">
              <Tile icon={t.icon} color={t.color} />
              <span className="flex-1">{t.text}</span>
              <span className="text-faint">›</span>
            </Link>
          ))}
          <p className="divide-row mt-2 pt-3 text-xs text-faint">
            Lịch hôm nay, sinh nhật học viên và tiền chờ xác nhận sẽ hiện ở đây khi có phần Lịch dạy, Học viên và Thu chi.
          </p>
        </div>
      </div>
    </>
  );
}
