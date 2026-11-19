import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { Avatar } from "@/components/avatar";
import { Icon, Tile } from "@/components/icon";
import { markBirthdayGift } from "@/app/quan-ly/_actions/teaching";
import { getLeads } from "@/lib/admin-data";
import { can } from "@/lib/auth";
import { seesOnlyOwnTeaching, type Perm } from "@/lib/permissions";
import { getTodo } from "@/lib/todo";
import { requireSession } from "@/lib/auth";
import { countByStatus, isOverdue, OPEN_STATUSES } from "@/lib/leads";
import { monthRange, totals, trieu } from "@/lib/money";
import { moneyDb } from "@/lib/money-data";
import { teachingDb } from "@/lib/teaching-data";
import { addDays, dayLabel, daysToBirthday, dmy, vnDate, vnIso, vnTime } from "@/lib/time";

export const metadata = { title: "Tổng quan" };

export default async function TongQuanPage() {
  const session = await requireSession();
  const t = await teachingDb(session.coach.id);
  const today = vnDate();
  const [leads, students, classes, venues, enrollments, recent] = await Promise.all([
    can(session, "tuyen-sinh") ? getLeads(session.coach.id) : Promise.resolve([]), t.students(), t.classes(), t.venues(), t.enrollments(),
    t.sessionsBetween(vnIso(addDays(today, -14), "00:00"), vnIso(addDays(today, 1), "00:00")),
  ]);
  const money = await moneyDb(session.coach.id);
  const openOffers = can(session, "tuyen-sinh") ? await money.offersOpen() : [];
  const monthSum = can(session, "tai-chinh") ? totals(await money.ledgerBetween(monthRange(today.slice(0, 7)).from, monthRange(today.slice(0, 7)).to)) : null;
  const counts = countByStatus(leads);
  const overdue = leads.filter((l) => isOverdue(l));
  const monthStart = today.slice(0, 8) + "01";
  const closedThisMonth = leads.filter((l) => l.status === "da-chot" && vnDate(l.updated_at) >= monthStart).length;
  const open = OPEN_STATUSES.reduce((n, s) => n + counts[s], 0);

  // Coach / trợ giảng chỉ thấy buổi mình dạy hoặc được phân (database đã lọc; lọc lại cho chắc).
  const mine = (s: (typeof recent)[number]) => !seesOnlyOwnTeaching(session.roles) || [s.teacher_id, s.assistant_id].includes(session.userId);
  const todays = recent.filter((s) => vnDate(s.starts_at) === today && s.status !== "huy" && mine(s));
  const className = (id: string | null) => classes.find((c) => c.id === id)?.title;
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;
  const enrolledIn = (classId: string | null) => enrollments.filter((e) => e.class_id === classId && e.status === "dang-hoc").length;
  const todayStudents = todays.reduce((n, s) => n + (s.class_id ? enrolledIn(s.class_id) : 1), 0);
  const active = students.filter((s) => s.status === "dang-hoc");
  const newThisMonth = active.filter((s) => vnDate(s.created_at) >= monthStart).length;

  // Việc tồn: dùng chung với trang Cần xử lý, chỉ hiện nhóm còn việc.
  const todo = (await getTodo(session)).filter((g) => g.items.length);
  const may = (p: Perm) => can(session, p);

  const year = Number(today.slice(0, 4));
  const birthdays = students
    .filter((s) => s.birth_date && s.status !== "da-nghi")
    .map((s) => ({ s, days: daysToBirthday(s.birth_date!, today) }))
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const pipeline: [string, number][] = [
    ["Mới", counts.moi], ["Đã liên hệ", counts["da-lien-he"]], ["Học thử", counts["hen-hoc-thu"]],
    ["Chờ đóng tiền", counts["cho-dong-tien"]], ["Đã chốt (tháng)", closedThisMonth],
  ];
  const todayLabel = dayLabel(today) + "/" + year;

  return (
    <>
      <PageHead icon="home" color="blue" title="Hôm nay" sub={todayLabel}>
        <Link href="/quan-ly/khoa-hoc?them=1" className="btn primary">
          <Icon name="plus" /> Tạo lịch học
        </Link>
      </PageHead>

      <div className="kpis">
        {may("tuyen-sinh") && (
        <Link href="/quan-ly/nhu-cau" className="card kpi">
          <div className="l">Nhu cầu mới</div>
          <div className="v">{counts.moi}</div>
          <div className="s" style={overdue.length ? { color: "var(--color-bad)", fontWeight: 600 } : undefined}>
            {overdue.length ? `${overdue.length} quá 24 giờ chưa gọi` : "chưa gọi"}
          </div>
        </Link>
        )}
        <Link href={may("lich-trung-tam") ? "/quan-ly/lich-day" : "/quan-ly/lich-day/cua-toi"} className="card kpi">
          <div className="l">Buổi hôm nay</div>
          <div className="v">{todays.length}</div>
          <div className="s">{todayStudents ? `${todayStudents} học viên` : "trong lịch của bạn"}</div>
        </Link>
        {may("hoc-vien") && (
        <Link href="/quan-ly/hoc-vien" className="card kpi">
          <div className="l">Học viên đang học</div>
          <div className="v">{active.length}</div>
          <div className="s">{newThisMonth ? `+${newThisMonth} trong tháng` : "không có học viên mới tháng này"}</div>
        </Link>
        )}
        {monthSum ? (
          <Link href="/quan-ly/thu-chi" className="card kpi">
            <div className="l">Thu tháng này</div>
            <div className="v">{trieu(monthSum.thu)}</div>
            <div className="s">Còn lại {trieu(monthSum.net)}{openOffers.length ? ` · ${openOffers.length} offer đang mở` : ""}</div>
          </Link>
        ) : may("tuyen-sinh") ? (
          <Link href="/quan-ly/nhu-cau" className="card kpi">
            <div className="l">Đã chốt tháng này</div>
            <div className="v">{closedThisMonth}</div>
            <div className="s">{open} nhu cầu đang mở</div>
          </Link>
        ) : null}
      </div>

      <div className="grid items-start gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <div className="card">
            <h2 className="h2">
              Lịch hôm nay <Link href={may("lich-trung-tam") ? "/quan-ly/lich-day" : "/quan-ly/lich-day/cua-toi"} className="btn sm ghost">Xem lịch</Link>
            </h2>
            {todays.length === 0 && <div className="text-muted">Hôm nay không có buổi nào.</div>}
            {todays.map((s) => {
              const done = s.status === "da-day";
              const n = s.class_id ? enrolledIn(s.class_id) : 1;
              return (
                <div key={s.id} className="divide-row flex items-center gap-3.5 py-3">
                  <div className="num w-[52px] text-base font-extrabold">{vnTime(s.starts_at)}</div>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate">
                      {s.kind === "hoc-thu" ? `Học thử · ${s.title ?? ""}` : `${className(s.class_id) ?? "Buổi học"}${s.seq ? ` · buổi ${s.seq}` : ""}`}
                    </b>
                    <div className="truncate text-[13px] text-faint">{[venueName(s.venue_id), `${n} học viên`].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className={`pill hide-m ${done ? "good" : "warn"}`}>{done ? "Đã dạy" : "Sắp tới"}</span>
                  <Link href={`/quan-ly/lich-day/${s.id}${done ? "#nhan-xet" : ""}`} className={`btn sm ${done ? "ghost" : "navy"}`}>
                    {done ? "Nhận xét" : "Điểm danh"}
                  </Link>
                </div>
              );
            })}
          </div>
          {may("tuyen-sinh") && (
          <div className="card">
            <h2 className="h2">
              Nhu cầu &amp; chốt khoá <span className="text-[13px] font-medium text-faint">{open} đang mở</span>
            </h2>
            <Link href="/quan-ly/nhu-cau" className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {pipeline.map(([label, n], i) => (
                <div key={label} className="soft" style={i === 4 ? { background: "#ecfccb" } : undefined}>
                  <div className="num text-[22px] font-extrabold">{n}</div>
                  <div className="text-xs text-faint">{label}</div>
                </div>
              ))}
            </Link>
          </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="card">
            <h2 className="h2">
              Cần xử lý {may("can-xu-ly") && <Link href="/quan-ly/can-xu-ly" className="btn sm ghost">Xem hết</Link>}
            </h2>
            {todo.length === 0 && <div className="text-muted">Không có việc tồn.</div>}
            {todo.map((g) => (
              <Link key={g.key} href={g.items.length === 1 || !may("can-xu-ly") ? g.items[0].href : "/quan-ly/can-xu-ly"} className="flex items-center gap-2.5 py-[9px]">
                <Tile icon={g.icon} color={g.color} />
                <span className="flex-1">{g.items.length} · {g.title.toLowerCase()}</span>
                <span className="text-faint">›</span>
              </Link>
            ))}
          </div>
          {may("hoc-vien") && (
          <div className="card">
            <h2 className="h2">Sinh nhật 7 ngày tới</h2>
            {birthdays.length === 0 && <div className="text-muted">Không có sinh nhật nào trong 7 ngày tới.</div>}
            {birthdays.map(({ s, days }) => {
              const turning = year + (s.birth_date!.slice(5) < today.slice(5) ? 1 : 0) - Number(s.birth_date!.slice(0, 4));
              const gifted = s.birthday_gift_year === year;
              return (
                <div key={s.id} className="divide-row flex items-center gap-2.5 py-[9px]">
                  <Avatar name={s.full_name} soft />
                  <Link href={`/quan-ly/hoc-vien/${s.id}`} className="min-w-0 flex-1">
                    <b className="block truncate">{s.full_name}</b>
                    <div className="text-[13px] text-faint">{days === 0 ? "Hôm nay" : dmy(addDays(today, days))} · {turning} tuổi</div>
                  </Link>
                  <form action={markBirthdayGift}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="year" value={year} />
                    {gifted && <input type="hidden" name="undo" value="1" />}
                    <button className="btn sm ghost">
                      <Icon name="gift" size={15} /> {gifted ? "Đã tặng quà" : "Đánh dấu đã chúc"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </>
  );
}
