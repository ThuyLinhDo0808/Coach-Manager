"use client";

import Link from "next/link";
import { useState } from "react";
import { deletePost, savePost } from "@/app/quan-ly/noi-dung/actions";
import { ConfirmButton, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/rich-text";
import { Field, SegPick, SwitchRow } from "@/components/ui-kit";
import { estimateReadMinutes, parseYoutubeId } from "@/lib/content";
import { POST_STATUSES, type CourseOption, type PostAdmin } from "@/lib/content-types";
import { slugify } from "@/lib/slug";
import { POST_TOPICS } from "@/lib/types";

const LIST = "/quan-ly/noi-dung?tab=bai-viet";
const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export function PostForm({ post, courses }: { post: PostAdmin | null; courses: CourseOption[] }) {
  const [v, setV] = useState({
    id: post?.id ?? "",
    title: post?.title ?? "",
    excerpt: post?.excerpt ?? "",
    topic: post?.topic ?? "ky-thuat",
    cover_url: post?.cover_url ?? "",
    youtube: post?.youtube_id ? `https://youtu.be/${post.youtube_id}` : "",
    body: post?.body ?? "",
    is_featured: post?.is_featured ?? false,
    status: post?.status ?? "nhap",
    course_id: post?.course_id ?? "",
  });
  const [view, setView] = useState<"viet" | "xem">("viet");
  const save = useSave(savePost, v);
  type V = typeof v;
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const ytId = parseYoutubeId(v.youtube);
  const slug = post?.slug ?? (slugify(v.title, 100) || "…");
  const saveLabel = v.status === "da-dang" ? (post?.status === "da-dang" ? "Lưu bài" : "Lưu và đăng") : "Lưu bài";

  return (
    <div>
      <Link href={LIST} scroll={false} className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
        <Icon name="left" size={15} /> Danh sách bài viết
      </Link>
      <form onSubmit={save.onSubmit} className="grid items-start gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" noValidate>
        <div className="card grid min-w-0 gap-3">
          <SaveError save={save} />
          <Field label="Tiêu đề" error={save.err("title")} hint={`/bai-viet/${slug}`}>
            <input className="input text-base font-bold" maxLength={160} placeholder="Ví dụ: Third shot drop: 4 lỗi làm bóng bay cao" value={v.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Tóm tắt" hint="hiện ở danh sách bài viết" error={save.err("excerpt")}>
            <textarea className="input" maxLength={300} style={{ minHeight: 64 }} value={v.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
          <div className="field">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label">
                Nội dung <span className="font-medium text-faint">· khoảng {estimateReadMinutes(v.body)} phút đọc</span>
              </span>
              <SegPick
                label="Chế độ"
                options={[
                  { value: "viet", label: "Viết" },
                  { value: "xem", label: "Xem trước" },
                ]}
                value={view}
                onChange={setView}
              />
            </div>
            {view === "viet" ? (
              <textarea
                className="input"
                style={{ minHeight: 380, lineHeight: 1.6 }}
                placeholder={"## Tiêu đề mục\n\nĐoạn văn, có thể **in đậm**.\n\n- Gạch đầu dòng 1\n- Gạch đầu dòng 2"}
                aria-label="Nội dung bài viết"
                value={v.body}
                onChange={(e) => set("body", e.target.value)}
              />
            ) : (
              <div className="min-h-[380px] rounded-[12px] border border-line p-4">
                {v.body.trim() ? <RichText text={v.body} /> : <span className="text-faint">Bài chưa có nội dung.</span>}
              </div>
            )}
            {save.err("body") && <span className="err">{save.err("body")}</span>}
            <span className="text-xs text-faint">
              Cách viết: dòng bắt đầu bằng <b>##</b> là tiêu đề mục · <b>-</b> đầu dòng là gạch đầu dòng · bọc chữ trong <b>**hai dấu sao**</b> để in đậm · cách một dòng trống để sang đoạn mới.
            </span>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="card grid gap-3">
            <div className="field">
              <span className="label">Trạng thái</span>
              <SegPick label="Trạng thái" options={POST_STATUSES} value={v.status} onChange={(s) => set("status", s)} full />
              <span className="text-xs text-faint">
                {post?.published_at ? `Đăng lần đầu ngày ${day(post.published_at)}.` : "Chưa đăng lần nào."} Chỉ bài “Đã đăng” hiện trên trang công khai.
              </span>
            </div>
            <Field label="Chủ đề" error={save.err("topic")}>
              <select className="input" value={v.topic} onChange={(e) => set("topic", e.target.value as V["topic"])}>
                {POST_TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gợi ý khoá học cuối bài" error={save.err("course_id")}>
              <select className="input" value={v.course_id} onChange={(e) => set("course_id", e.target.value)}>
                <option value="">Không gắn khoá</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Link ảnh bìa" error={save.err("cover_url")}>
              <input className="input" inputMode="url" placeholder="https://…" value={v.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </Field>
            <Field label="Video YouTube kèm bài" error={save.err("youtube")} hint={v.youtube.trim() ? (ytId ? `mã ${ytId}` : "chưa nhận ra link") : undefined}>
              <input className="input" inputMode="url" placeholder="https://youtu.be/…" value={v.youtube} onChange={(e) => set("youtube", e.target.value)} />
            </Field>
            <SwitchRow first title="Bài nổi bật" sub="Đưa lên đầu trang Bài viết" checked={v.is_featured} onChange={(b) => set("is_featured", b)} />
            <SaveBar save={save} label={saveLabel} />
          </div>
          {post && (
            <div className="card flex flex-wrap items-center justify-between gap-2">
              {post.status === "da-dang" ? (
                <Link href={`/bai-viet/${post.slug}`} target="_blank" className="btn sm ghost">
                  Xem bài trên trang công khai
                </Link>
              ) : (
                <span className="text-[13px] text-faint">Bài chưa hiện công khai.</span>
              )}
            </div>
          )}
        </div>
      </form>
      {post && (
        <form action={deletePost} className="mt-4 flex justify-end">
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton message={`Xoá bài "${post.title}"? Việc này không hoàn tác được.`}>Xoá bài viết</ConfirmButton>
        </form>
      )}
    </div>
  );
}
