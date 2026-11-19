import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { ClassForm } from "@/components/class-form";
import { Icon } from "@/components/icon";
import { requireSession } from "@/lib/auth";
import { formatVnd } from "@/lib/format";
import { CLASS_STATUSES, type ClassStatus } from "@/lib/teaching";
import { teachingDb } from "@/lib/teaching-data";

export const metadata = { title: "Lớp" };

export default async function KhoaHocLopPage({ searchParams }: { searchParams: Promise<{ tt?: string; them?: string }> }) {
  const sp = await searchParams;
  const session = await requireSession();
  const t = await teachingDb(session.coach.id);
  const [classes, venues, courses, enrollments] = await Promise.all([t.classes(), t.venues(), t.courses(), t.enrollments()]);
  const sessions = await t.sessionsOfClasses(classes.map((c) => c.id));
  const tab = (CLASS_STATUSES.some((s) => s.value === sp.tt) ? sp.tt : "dang-dien-ra") as ClassStatus | "tuyen";
  const isRecruitTab = sp.tt === "tuyen";
  const list = isRecruitTab ? classes.filter((c) => c.is_recruiting && c.status !== "huy" && c.status !== "da-ket-thuc") : classes.filter((c) => c.status === tab);
  const count = (s: ClassStatus) => classes.filter((c) => c.status === s).length;
  const tabs: [string, string, number][] = [
    ["dang-dien-ra", "Đang diễn ra", count("dang-dien-ra")],
    ["sap-dien-ra", "Sắp diễn ra", count("sap-dien-ra")],
    ["tuyen", "Đang tuyển", classes.filter((c) => c.is_recruiting && c.status !== "huy" && c.status !== "da-ket-thuc").length],
    ["da-ket-thuc", "Đã kết thúc", count("da-ket-thuc")],
    ["huy", "Đã huỷ", count("huy")],
  ];

  return (
    <>
      <PageHead icon="book" color="indigo" title="Lớp" sub={`${count("dang-dien-ra")} lớp đang diễn ra · ${count("sap-dien-ra")} sắp diễn ra`}>
        <Link href="/quan-ly/khoa-hoc?them=1" className="btn primary">
          <Icon name="plus" /> Tạo lịch học
        </Link>
      </PageHead>

      {sp.them && <ClassForm courses={courses} venues={venues.map((v) => ({ id: v.id, name: v.name }))} />}

      <div className="seg mb-3.5">
        {tabs.map(([v, l, n]) => (
          <Link key={v} href={`/quan-ly/khoa-hoc?tt=${v}`} className={(isRecruitTab ? "tuyen" : tab) === v ? "on" : ""}>
            {l} {n}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card text-muted">
          Chưa có lớp nào ở mục này. Bấm <b>Tạo lịch học</b> để mở lớp từ một mẫu khoá.
        </div>
      ) : (
        <div className="card" style={{ padding: 8 }}>
          {list.map((c, i) => {
            const ss = sessions.filter((s) => s.class_id === c.id && s.status !== "huy");
            const done = ss.filter((s) => s.status === "da-day").length;
            const enrolled = enrollments.filter((e) => e.class_id === c.id && e.status === "dang-hoc").length;
            const venue = venues.find((v) => v.id === c.venue_id)?.name;
            return (
              <Link key={c.id} href={`/quan-ly/khoa-hoc/${c.id}`} className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[14px] px-3 py-3 hover:bg-page ${i ? "divide-row" : ""}`}>
                <div className="min-w-[180px] flex-1">
                  <b>{c.title}</b>
                  <div className="text-[13px] text-faint">
                    {[courses.find((x) => x.id === c.course_id)?.title, venue, c.schedule_text].filter(Boolean).join(" · ") || "Chưa có lịch"}
                  </div>
                </div>
                {c.is_recruiting && <span className="pill good">Đang tuyển</span>}
                <span className="pill n">Buổi {done}/{ss.length}</span>
                <span className="pill n">
                  {enrolled}{c.max_students ? `/${c.max_students}` : ""} học viên
                </span>
                {c.price != null && <span className="num hide-m w-[110px] text-right font-semibold">{formatVnd(c.price)}</span>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
