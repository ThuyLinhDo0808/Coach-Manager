import Link from "next/link";
import { deleteReview, moveVideo, toggleReviewPin, toggleReviewPublic } from "@/app/quan-ly/noi-dung/actions";
import { PageHead } from "@/components/admin-shell";
import { PostForm } from "@/components/content/post-form";
import { ReviewForm } from "@/components/content/review-form";
import { VideoForm, VideoGroupsCard } from "@/components/content/video-forms";
import { ConfirmButton } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { Thumb, youtubeThumb } from "@/components/thumb";
import {
  CONTENT_TABS,
  MAX_PINNED_REVIEWS,
  POST_STATUSES,
  VIDEO_VISIBILITY,
  type ContentTab,
  type CourseOption,
  type PostAdmin,
  type ReviewAdmin,
  type VideoAdmin,
  type VideoGroupAdmin,
} from "@/lib/content-types";
import { topicLabel } from "@/lib/labels";

const BASE = "/quan-ly/noi-dung";
const iconBtn = "inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-faint hover:bg-page disabled:opacity-30";
const day = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export type ContentData = { groups: VideoGroupAdmin[]; videos: VideoAdmin[]; posts: PostAdmin[]; reviews: ReviewAdmin[]; courses: CourseOption[] };
export type ContentParams = { tab?: string; v?: string; them?: string; id?: string; moi?: string };

/** Giáo án (Video, Bài viết) ở mục Lớp & khoá học; Đánh giá ở mục Học viên. */
export function ContentView({ data, params, only }: { data: ContentData; params: ContentParams; only?: "danh-gia" }) {
  if (only === "danh-gia") {
    const shown = data.reviews.filter((r) => r.is_public).length;
    return (
      <>
        <PageHead icon="star" color="violet" title="Đánh giá" sub={`${data.reviews.length} đánh giá · ${shown} đang hiện trên trang công khai`}>
          <a href="#form-danh-gia" className="btn primary">
            <Icon name="plus" /> Thêm đánh giá
          </a>
        </PageHead>
        <ReviewTab data={data} />
      </>
    );
  }
  const tabs = CONTENT_TABS.filter((t) => t.value !== "danh-gia");
  const tab: ContentTab = tabs.some((t) => t.value === params.tab) ? (params.tab as ContentTab) : "video";
  const published = data.posts.filter((p) => p.status === "da-dang").length;
  const sub = `${data.videos.length} video · ${published} bài đã đăng`;
  const act =
    tab === "video" ? (
      <Link href={`${BASE}?them=1#form-video`} className="btn primary">
        <Icon name="plus" /> Thêm video
      </Link>
    ) : (
      <Link href={`${BASE}?tab=bai-viet&moi=1`} className="btn primary">
        <Icon name="pen" /> Viết bài
      </Link>
    );

  return (
    <>
      <PageHead icon="video" color="orange" title="Giáo án" sub={sub}>
        {act}
      </PageHead>
      <div className="mb-4">
        <nav className="seg" aria-label="Loại nội dung">
          {tabs.map((t) => (
            <Link key={t.value} href={t.value === "video" ? BASE : `${BASE}?tab=${t.value}`} className={t.value === tab ? "on" : ""}>
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {tab === "video" && <VideoTab data={data} editId={params.v} adding={Boolean(params.them)} />}
      {tab === "bai-viet" && <PostTab data={data} editId={params.id} writing={Boolean(params.moi)} />}
    </>
  );
}

// ---------------------------------------------------------------- video
function VideoTab({ data, editId, adding }: { data: ContentData; editId?: string; adding: boolean }) {
  const { groups, videos, courses } = data;
  const editing = videos.find((v) => v.id === editId) ?? null;
  const formOpenOnMobile = adding || Boolean(editing);
  const counts: Record<string, number> = {};
  for (const v of videos) if (v.group_id) counts[v.group_id] = (counts[v.group_id] ?? 0) + 1;
  const knownGroup = (id: string | null) => (id && groups.some((g) => g.id === id) ? id : null);
  const sections = [...groups.map((g) => ({ id: g.id as string | null, name: g.name })), { id: null, name: "Chưa xếp nhóm" }]
    .map((s) => ({ ...s, items: videos.filter((v) => knownGroup(v.group_id) === s.id) }))
    .filter((s) => s.items.length > 0);
  const visibility = (v: VideoAdmin) => VIDEO_VISIBILITY.find((x) => x.value === v.visibility)?.label ?? v.visibility;
  const move = (v: VideoAdmin, dir: -1 | 1, disabled: boolean) => (
    <form action={moveVideo}>
      <input type="hidden" name="id" value={v.id} />
      <input type="hidden" name="dir" value={dir} />
      <button className={iconBtn} disabled={disabled} aria-label={dir < 0 ? `Đưa "${v.title}" lên` : `Đưa "${v.title}" xuống`}>
        <Icon name={dir < 0 ? "left" : "right"} size={15} className="rotate-90" />
      </button>
    </form>
  );

  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className={`grid min-w-0 gap-4 *:min-w-0 ${formOpenOnMobile ? "hide-m" : ""}`}>
        {videos.length === 0 && <div className="card text-muted">Chưa có video nào. Dán link YouTube vào khung “Thêm video” để bắt đầu.</div>}
        {sections.map((s) => (
          <div key={s.id ?? "khac"} className="card">
            <h2 className="h2">
              <span className="min-w-0 truncate">{s.name}</span>
              <span className="pill n">{s.items.length} video</span>
            </h2>
            {s.items.map((v, i) => (
              <div key={v.id} className={`divide-row flex items-center gap-2.5 py-2.5 ${v.id === editId ? "md:-mx-2.5 md:rounded-[14px] md:bg-[#ececf0] md:px-2.5" : ""}`}>
                <Link href={`${BASE}?v=${v.id}#form-video`} className="w-[88px] flex-none md:w-[112px]" aria-label={`Sửa ${v.title}`}>
                  <Thumb src={v.youtube_id ? youtubeThumb(v.youtube_id) : null} alt="" duration={v.duration_text} style={{ borderRadius: 10 }} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`${BASE}?v=${v.id}#form-video`} className="block truncate font-bold">
                    {v.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-faint">
                    <span className={`pill ${v.visibility === "public" ? "good" : "n"}`}>{visibility(v)}</span>
                    {v.level && <span>{v.level}</span>}
                    {v.course_id && <span className="hide-m truncate">· {courses.find((c) => c.id === v.course_id)?.title}</span>}
                  </div>
                </div>
                <div className="flex flex-none items-center">
                  {move(v, -1, i === 0)}
                  {move(v, 1, i === s.items.length - 1)}
                  <Link href={`${BASE}?v=${v.id}#form-video`} className={`${iconBtn} hide-m`} aria-label={`Sửa ${v.title}`}>
                    <Icon name="pen" size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 *:min-w-0">
        <div className={formOpenOnMobile ? "" : "hide-m"}>
          <Link href={BASE} scroll={false} className="only-m mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-faint">
            <Icon name="left" size={15} /> Danh sách video
          </Link>
          <VideoForm key={editing?.id ?? `moi-${videos.length}`} video={editing} groups={groups} courses={courses} />
        </div>
        <div className={formOpenOnMobile ? "hide-m" : ""}>
          <VideoGroupsCard groups={groups} counts={counts} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- bài viết
function PostTab({ data, editId, writing }: { data: ContentData; editId?: string; writing: boolean }) {
  const { posts, courses } = data;
  const editing = posts.find((p) => p.id === editId) ?? null;
  if (writing || editing) return <PostForm key={editing?.id ?? "moi"} post={editing} courses={courses} />;

  const statusPill = (p: PostAdmin) => (
    <span className={`pill ${p.status === "da-dang" ? "good" : p.status === "an" ? "warn" : "n"}`}>{POST_STATUSES.find((s) => s.value === p.status)?.label}</span>
  );
  return (
    <div className="card">
      <h2 className="h2">Bài viết</h2>
      {posts.length === 0 && <div className="text-muted">Chưa có bài nào. Bấm “Viết bài” để viết bài đầu tiên.</div>}
      {posts.map((p) => (
        <Link key={p.id} href={`${BASE}?tab=bai-viet&id=${p.id}`} className="divide-row flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <b className="block truncate">{p.title}</b>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-faint">
              {statusPill(p)}
              <span>{topicLabel(p.topic)}</span>
              <span>· {p.read_minutes} phút đọc</span>
              {p.published_at && <span className="num">· đăng {day(p.published_at)}</span>}
              {p.is_featured && <span className="pill lime">Nổi bật</span>}
            </div>
          </div>
          <Icon name="right" size={16} className="text-faint" />
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- đánh giá
function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={15} filled className={n <= rating ? "text-amber-500" : "text-[#d2d2d7]"} />
      ))}
    </span>
  );
}

function ReviewTab({ data }: { data: ContentData }) {
  const { reviews, courses } = data;
  const pinned = reviews.filter((r) => r.is_pinned).length;
  const shown = reviews.filter((r) => r.is_public);
  const average = shown.length ? shown.reduce((s, r) => s + r.rating, 0) / shown.length : null;
  return (
    <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="card min-w-0">
        <h2 className="h2">
          Đánh giá
          <span className="text-[13px] font-medium text-faint">
            {average != null ? `${average.toFixed(1).replace(".", ",")} sao · ` : ""}
            ghim {pinned}/{MAX_PINNED_REVIEWS}
          </span>
        </h2>
        {reviews.length === 0 && <div className="text-muted">Chưa có đánh giá nào. Thêm đánh giá của học viên ở khung bên cạnh.</div>}
        {reviews.map((r) => {
          const course = courses.find((c) => c.id === r.course_id)?.title;
          const canPin = r.is_pinned || (pinned < MAX_PINNED_REVIEWS && r.is_public);
          return (
            <div key={r.id} className={`divide-row py-3 ${r.is_public ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <b>{r.author_name}</b>
                <Stars rating={r.rating} />
                {r.is_pinned && <span className="pill lime">Đã ghim</span>}
                {!r.is_public && <span className="pill n">Đang ẩn</span>}
                <span className="num ml-auto text-[13px] text-faint">{day(r.created_at)}</span>
              </div>
              {r.body && <p className="mt-1 text-muted">{r.body}</p>}
              {course && <div className="mt-1 text-[13px] text-faint">Đã học: {course}</div>}
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={toggleReviewPin}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="pin" value={r.is_pinned ? "0" : "1"} />
                  <button className="btn sm ghost" disabled={!canPin} title={canPin ? undefined : r.is_public ? `Chỉ ghim được ${MAX_PINNED_REVIEWS} đánh giá` : "Đánh giá đang ẩn"}>
                    {r.is_pinned ? "Bỏ ghim" : "Ghim"}
                  </button>
                </form>
                <form action={toggleReviewPublic}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="show" value={r.is_public ? "0" : "1"} />
                  <button className="btn sm ghost">{r.is_public ? "Ẩn" : "Hiện lại"}</button>
                </form>
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message={`Xoá đánh giá của ${r.author_name}? Việc này không hoàn tác được.`}>Xoá</ConfirmButton>
                </form>
              </div>
            </div>
          );
        })}
        {reviews.length > 0 && <p className="divide-row pt-3 text-xs text-faint">Ghim tối đa {MAX_PINNED_REVIEWS} đánh giá lên đầu trang Đánh giá. Đánh giá đang ẩn thì khách không thấy.</p>}
      </div>
      <ReviewForm key={`moi-${reviews.length}`} courses={courses} />
    </div>
  );
}
