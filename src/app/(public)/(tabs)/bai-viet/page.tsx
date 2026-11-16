import type { Metadata } from "next";
import Link from "next/link";
import { Thumb } from "@/components/thumb";
import { getPosts } from "@/lib/data";
import { postCover, postDate, topicLabel } from "@/lib/labels";
import { POST_TOPICS } from "@/lib/types";

export const metadata: Metadata = { title: "Bài viết" };
export const revalidate = 60;

export default async function BaiVietPage({ searchParams }: { searchParams: Promise<{ chu_de?: string }> }) {
  const { chu_de } = await searchParams;
  const all = await getPosts();
  const posts = chu_de ? all.filter((p) => p.topic === chu_de) : all;
  const featured = !chu_de ? (posts.find((p) => p.is_featured) ?? null) : null;
  const rest = posts.filter((p) => p !== featured);

  return (
    <>
      <div className="mb-3.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        <Link href="/bai-viet" className={`chip ${!chu_de ? "on" : ""}`}>
          Tất cả
        </Link>
        {POST_TOPICS.map((t) => (
          <Link key={t.value} href={`/bai-viet?chu_de=${t.value}`} className={`chip ${chu_de === t.value ? "on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 && <div className="card text-muted">Chưa có bài viết nào ở mục này.</div>}

      {featured && (
        <Link href={`/bai-viet/${featured.slug}`} className="card grid overflow-hidden md:grid-cols-[1.1fr_1fr]" style={{ padding: 0 }}>
          <Thumb src={postCover(featured)} play={!!featured.youtube_id} className="min-h-[170px] md:min-h-[220px]" style={{ aspectRatio: "auto", borderRadius: 0 }} />
          <div className="p-[22px]">
            <span className="pill lime">Bài nổi bật</span>
            <div className="mt-2.5 text-[22px] leading-tight font-extrabold">{featured.title}</div>
            {featured.excerpt && <p className="mt-2 text-muted">{featured.excerpt}</p>}
            <div className="mt-3 text-[13px] text-faint">
              {topicLabel(featured.topic)} · {featured.read_minutes} phút đọc · {postDate(featured, true)}
            </div>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.id} href={`/bai-viet/${p.slug}`} className="card" style={{ padding: 10 }}>
              <Thumb src={postCover(p)} style={{ aspectRatio: "auto", height: 130 }} />
              <div className="px-1.5 pt-3 pb-1">
                <span className="pill n">{topicLabel(p.topic)}</span>
                <div className="mt-2 text-base leading-snug font-bold">{p.title}</div>
                {p.excerpt && <div className="mt-1 line-clamp-2 text-[13px] text-muted">{p.excerpt}</div>}
                <div className="mt-2 text-xs text-faint">
                  {p.read_minutes} phút đọc · {postDate(p)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="card mt-4 flex flex-wrap items-center justify-between gap-3 text-white" style={{ background: "var(--grad-navy)" }}>
        <div>
          <b className="text-base">Đọc rồi vẫn chưa làm được?</b>
          <div className="text-[13px] text-[#b9c5da]">Cuối mỗi bài có gợi ý khoá học phù hợp với chủ đề.</div>
        </div>
        <Link href="/dang-ky" className="btn primary hide-m">
          Đăng ký học thử
        </Link>
      </section>
    </>
  );
}
