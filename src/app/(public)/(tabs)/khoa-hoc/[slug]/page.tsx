import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { zaloHref } from "@/components/contact-links";
import { Icon } from "@/components/icon";
import { Thumb } from "@/components/thumb";
import { getCoach, getCourse, getCourses, getOpenClasses, getVenues } from "@/lib/data";
import { COURSE_KINDS } from "@/lib/types";
import { kindLabel, priceText } from "@/lib/labels";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return { title: course?.title ?? "Khoá học", description: course?.summary ?? undefined };
}

export default async function ChiTietKhoaPage({ params }: Props) {
  const { slug } = await params;
  const [course, all, coach, venues, classes] = await Promise.all([
    getCourse(slug),
    getCourses(),
    getCoach(),
    getVenues(),
    getOpenClasses(),
  ]);
  if (!course) notFound();
  const zalo = zaloHref(coach!.contacts);
  const venue = venues.find((v) => v.id === course.venue_id);
  const price = priceText(course);
  const openClasses = classes.filter((c) => c.course_id === course.id && (c.seats_left ?? 1) > 0);
  const kinds = COURSE_KINDS.filter((k) => all.some((c) => c.kind === k.value));

  const facts = [
    course.session_count
      ? [`${course.session_count} buổi`, course.minutes_per_session ? `${course.minutes_per_session} phút / buổi` : "trọn khoá"]
      : course.minutes_per_session
        ? [`${course.minutes_per_session} phút`, "mỗi buổi"]
        : null,
    course.max_students ? [course.max_students === 1 ? "1 kèm 1" : `Tối đa ${course.max_students}`, "học viên / lớp"] : null,
    course.schedule_text ? [course.schedule_text, venue ? venue.name : "lịch học"] : null,
    price ? [price.main, price.sub] : null,
  ].filter(Boolean) as string[][];

  return (
    <>
      <div className="mb-3.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        <Link href="/khoa-hoc" className="chip">
          Tất cả
        </Link>
        {kinds.map((k) => (
          <Link key={k.value} href={`/khoa-hoc?loai=${k.value}`} className={`chip ${course.kind === k.value ? "on" : ""}`}>
            {k.label}
          </Link>
        ))}
      </div>
      <article className="card overflow-hidden" style={{ padding: 0 }}>
        <Thumb src={course.cover_url} alt="" style={{ aspectRatio: "auto", height: 150, borderRadius: 0 }}>
          <div className="absolute bottom-4 left-5 text-white">
            <span className="pill lime">{kindLabel(course.kind)}</span>
            <h1 className="mt-1.5 text-[22px] font-extrabold">{course.title}</h1>
          </div>
        </Thumb>
        <div className="p-5">
          {facts.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {facts.map(([a, b]) => (
                <div key={a + b} className="soft">
                  <div className="text-base font-extrabold">{a}</div>
                  <div className="text-xs text-faint">{b}</div>
                </div>
              ))}
            </div>
          )}
          {course.price_note && <div className="mt-2.5 text-[13px] text-muted">{course.price_note}</div>}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="grid content-start gap-4">
              {course.audience && (
                <div>
                  <h2 className="h3">Dành cho ai</h2>
                  <p className="text-muted">{course.audience}</p>
                </div>
              )}
              {course.goal && (
                <div>
                  <h2 className="h3">Mục đích</h2>
                  <p className="text-muted">{course.goal}</p>
                </div>
              )}
              {course.outcomes.length > 0 && (
                <div>
                  <h2 className="h3">Học xong bạn được</h2>
                  {course.outcomes.map((t) => (
                    <div key={t} className="mb-1.5 flex items-start gap-2.5">
                      <Icon name="check" className="text-good" />
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {course.curriculum.length > 0 && (
              <div>
                <h2 className="h3">Lộ trình {course.curriculum.length} buổi</h2>
                {course.curriculum.map((b, i) => (
                  <div key={i} className="flex gap-2.5 border-b border-[#f0f0f3] py-[7px]">
                    <span className="num w-14 flex-none font-semibold text-faint">{b.title}</span>
                    <span>{b.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {openClasses.length > 0 && (
            <div className="mt-5">
              <h2 className="h3">Lớp đang tuyển</h2>
              <div className="grid gap-2">
                {openClasses.map((c) => (
                  <div key={c.id} className="soft flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b>{c.title}</b>
                      <div className="text-[13px] text-faint">{c.schedule_text}</div>
                    </div>
                    {c.seats_left != null && <span className="pill good">Còn {c.seats_left} chỗ</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.commitments.length > 0 && (
            <div className="soft mt-5" style={{ padding: 14 }}>
              <b>Cam kết</b>
              <div className="mt-1 text-[13px] text-muted">{course.commitments.join(" ")}</div>
            </div>
          )}

          <div className="hide-m mt-[18px] flex justify-end gap-2">
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn ghost">
                Hỏi thêm qua Zalo
              </a>
            )}
            <Link href={`/dang-ky?khoa=${course.slug}`} className="btn primary">
              Đăng ký khoá này
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
