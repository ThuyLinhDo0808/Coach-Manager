import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/rich-text";
import { getCourses, getPost } from "@/lib/data";
import { postCover, postDate, topicLabel } from "@/lib/labels";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Bài viết" };
  const cover = postCover(post);
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { title: post.title, description: post.excerpt ?? undefined, type: "article", images: cover ? [cover] : undefined },
  };
}

export default async function BaiVietChiTiet({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const course = post.course_id ? (await getCourses()).find((c) => c.id === post.course_id) : null;

  return (
    <div className="grid gap-4">
      <article className="card">
        <Link href="/bai-viet" className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
          <Icon name="left" size={15} /> Tất cả bài viết
        </Link>
        <div>
          <span className="pill n">{topicLabel(post.topic)}</span>
        </div>
        <h1 className="mt-2.5 text-2xl leading-tight font-extrabold md:text-[28px]">{post.title}</h1>
        <div className="mt-2 text-[13px] text-faint">
          {post.read_minutes} phút đọc · {postDate(post, true)}
        </div>
        {post.youtube_id ? (
          <div className="mt-4 aspect-video overflow-hidden rounded-[14px] bg-navy2">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${post.youtube_id}`}
              title={post.title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              className="size-full border-0"
            />
          </div>
        ) : post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" className="mt-4 w-full rounded-[14px]" />
        ) : null}
        <RichText text={post.body} className="mt-4" />
      </article>

      <section className="card flex flex-wrap items-center justify-between gap-3 text-white" style={{ background: "var(--grad-navy)" }}>
        <div>
          <b className="text-base">{course ? `Khoá phù hợp: ${course.title}` : "Muốn được sửa trực tiếp trên sân?"}</b>
          <div className="text-[13px] text-[#b9c5da]">{course?.summary ?? "Để lại nhu cầu, coach sẽ gọi lại trong 24 giờ."}</div>
        </div>
        <div className="flex gap-2">
          {course && (
            <Link href={`/khoa-hoc/${course.slug}`} className="btn glass">
              Xem khoá
            </Link>
          )}
          <Link href={course ? `/dang-ky?khoa=${course.slug}` : "/dang-ky"} className="btn primary">
            Đăng ký học thử
          </Link>
        </div>
      </section>
    </div>
  );
}
