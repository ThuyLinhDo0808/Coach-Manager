import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { Thumb } from "@/components/thumb";
import { getCourses, getOpenClasses, getVenues } from "@/lib/data";

export const metadata: Metadata = { title: "Lịch & sân" };
export const revalidate = 60;

const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

export default async function LichSanPage() {
  const [classes, venues, courses] = await Promise.all([getOpenClasses(), getVenues(), getCourses()]);
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;

  return (
    <div className="grid gap-4">
      <section className="card">
        <h2 className="h2">Lớp đang tuyển</h2>
        {classes.length === 0 ? (
          <p className="text-muted">
            Hiện chưa có lớp mở sẵn. Bạn để lại nhu cầu, coach sẽ xếp lớp theo giờ rảnh của bạn.
          </p>
        ) : (
          classes.map((c, i) => {
            const course = courses.find((x) => x.id === c.course_id);
            const full = c.seats_left === 0;
            return (
              <div key={c.id} className={`flex flex-wrap items-center gap-3 py-3 ${i ? "divide-row" : "pt-0"}`}>
                <div className="min-w-[180px] flex-1">
                  <b>{c.title}</b>
                  <div className="text-[13px] text-faint">
                    {[c.schedule_text, venueName(c.venue_id), c.start_date ? `khai giảng ${fmtDate(c.start_date)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {c.seats_left != null && (
                  <span className={`pill ${full ? "n" : "good"}`}>
                    {full ? "Đã đủ" : `Còn ${c.seats_left}${c.seats_total ? `/${c.seats_total}` : ""} chỗ`}
                  </span>
                )}
                <Link href={course ? `/dang-ky?khoa=${course.slug}` : "/dang-ky"} className={`btn sm ${full ? "ghost" : "navy"}`}>
                  {full ? "Vào danh sách chờ" : "Đăng ký"}
                </Link>
              </div>
            );
          })
        )}
      </section>

      <section>
        <h2 className="h2 px-1">Sân coach đang dạy</h2>
        {venues.length === 0 ? (
          <div className="card text-muted">Danh sách sân sẽ được cập nhật.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {venues.map((v) => (
              <div key={v.id} className="card" style={{ padding: 10 }}>
                <Thumb src={v.image_url} alt={v.name} style={{ aspectRatio: "auto", height: 130 }} />
                <div className="px-1.5 pt-3 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <b className="text-base">{v.name}</b>
                    {v.district && <span className="pill n">{v.district}</span>}
                  </div>
                  {v.address && (
                    <div className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
                      <Icon name="map" size={15} className="mt-0.5" />
                      {v.address}
                    </div>
                  )}
                  {v.hours_text && (
                    <div className="mt-1 flex items-start gap-1.5 text-[13px] text-muted">
                      <Icon name="clock" size={15} className="mt-0.5" />
                      Giờ coach dạy: {v.hours_text}
                    </div>
                  )}
                  {v.maps_url && (
                    <a href={v.maps_url} target="_blank" rel="noopener noreferrer" className="btn sm ghost mt-3">
                      <Icon name="map" size={15} /> Mở Google Maps
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3 text-white" style={{ background: "var(--grad-navy)" }}>
        <div>
          <b className="text-base">Chưa thấy giờ phù hợp?</b>
          <div className="text-[13px] text-[#b9c5da]">Điền giờ rảnh của bạn, coach sẽ xếp lớp hoặc kèm riêng.</div>
        </div>
        <Link href="/dang-ky" className="btn primary hide-m">
          Gửi nhu cầu học
        </Link>
      </section>
    </div>
  );
}
