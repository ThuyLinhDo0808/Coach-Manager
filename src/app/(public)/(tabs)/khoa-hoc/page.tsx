import type { Metadata } from "next";
import Link from "next/link";
import { Thumb } from "@/components/thumb";
import { getCourses } from "@/lib/data";
import { kindLabel, priceText } from "@/lib/labels";
import { COURSE_KINDS } from "@/lib/types";

export const metadata: Metadata = { title: "Khoá học" };
export const revalidate = 60;



export default async function KhoaHocPage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const { loai } = await searchParams;
  const all = await getCourses();
  const kinds = COURSE_KINDS.filter((k) => all.some((c) => c.kind === k.value));
  const courses = loai ? all.filter((c) => c.kind === loai) : all;

  return (
    <>
      <div className="mb-3.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        <Link href="/khoa-hoc" className={`chip ${!loai ? "on" : ""}`}>
          Tất cả
        </Link>
        {kinds.map((k) => (
          <Link key={k.value} href={`/khoa-hoc?loai=${k.value}`} className={`chip ${loai === k.value ? "on" : ""}`}>
            {k.label}
          </Link>
        ))}
      </div>
      {courses.length === 0 ? (
        <div className="card text-muted">Chưa có khoá học nào ở mục này.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const price = priceText(c);
            const facts = [
              c.session_count ? `${c.session_count} buổi` : null,
              c.minutes_per_session ? `${c.minutes_per_session} phút` : null,
              c.max_students ? (c.max_students === 1 ? "1 kèm 1" : `Tối đa ${c.max_students} người`) : null,
            ].filter(Boolean);
            return (
              <Link key={c.id} href={`/khoa-hoc/${c.slug}`} className="card flex flex-col" style={{ padding: 10 }}>
                <Thumb src={c.cover_url} alt={c.title} style={{ aspectRatio: "auto", height: 130 }}>
                  <span className="pill lime absolute bottom-2.5 left-2.5">{kindLabel(c.kind)}</span>
                </Thumb>
                <div className="flex flex-1 flex-col px-1.5 pt-3 pb-1">
                  <div className="text-base leading-snug font-bold">{c.title}</div>
                  {c.summary && <div className="mt-1 text-[13px] text-muted">{c.summary}</div>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {facts.map((f) => (
                      <span key={f} className="pill n">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    {price ? (
                      <div>
                        <span className="num text-base font-extrabold">{price.main}</span>{" "}
                        <span className="text-xs text-faint">{price.sub}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-faint">Liên hệ để biết học phí</span>
                    )}
                    <span className="text-[13px] font-semibold text-navy">Xem chi tiết ›</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
