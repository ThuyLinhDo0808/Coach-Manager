import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { getCourses, getReviews, ratingSummary } from "@/lib/data";

export const metadata: Metadata = { title: "Đánh giá" };
export const revalidate = 60;

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={15} filled className={i <= n ? "text-amber-500" : "text-[#dcdce1]"} />
      ))}
    </span>
  );
}

export default async function DanhGiaPage({ searchParams }: { searchParams: Promise<{ khoa?: string }> }) {
  const { khoa } = await searchParams;
  const [all, courses] = await Promise.all([getReviews(), getCourses()]);
  const summary = ratingSummary(all);
  const reviewedCourses = courses.filter((c) => all.some((r) => r.course_id === c.id));
  const reviews = khoa ? all.filter((r) => r.course_id === khoa) : all;

  if (!summary) {
    return (
      <div className="card text-center">
        <div className="text-base font-bold">Chưa có đánh giá</div>
        <p className="mx-auto mt-1 max-w-sm text-muted">Đánh giá của học viên đã học ít nhất một buổi sẽ hiện ở đây.</p>
        <Link href="/dang-ky" className="btn primary mt-4">
          Đăng ký học thử
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="card flex flex-wrap items-center gap-5">
        <div className="text-[40px] leading-none font-extrabold">{summary.average.toFixed(1)}</div>
        <div>
          <Stars n={Math.round(summary.average)} />
          <div className="text-[13px] text-faint">{summary.count} đánh giá từ học viên đã học</div>
        </div>
        <div className="grid min-w-[200px] flex-1 gap-1">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = all.filter((r) => r.rating === s).length;
            return (
              <div key={s} className="flex items-center gap-2 text-xs">
                <span className="num w-3 text-faint">{s}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-page">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(n / summary.count) * 100}%` }} />
                </div>
                <span className="num w-5 text-right text-faint">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      {reviewedCourses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          <Link href="/danh-gia" className={`chip ${!khoa ? "on" : ""}`}>
            Tất cả
          </Link>
          {reviewedCourses.map((c) => (
            <Link key={c.id} href={`/danh-gia?khoa=${c.id}`} className={`chip ${khoa === c.id ? "on" : ""}`}>
              {c.title}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center gap-2.5">
              <Avatar name={r.author_name} soft />
              <div className="min-w-0 flex-1">
                <b>{r.author_name}</b>
                <div className="text-xs text-faint">
                  {[courses.find((c) => c.id === r.course_id)?.title, new Date(r.created_at).toLocaleDateString("vi-VN")].filter(Boolean).join(" · ")}
                </div>
              </div>
              {r.is_pinned && <span className="pill lime">Nổi bật</span>}
            </div>
            <div className="mt-2.5">
              <Stars n={r.rating} />
            </div>
            {r.body && <p className="mt-1.5 text-muted">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
