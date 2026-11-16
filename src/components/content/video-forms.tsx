"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteVideo, deleteVideoGroup, moveVideoGroup, saveVideo, saveVideoGroup } from "@/app/quan-ly/noi-dung/actions";
import { ConfirmButton, SaveBar, useSave } from "@/components/form-kit";
import { Icon } from "@/components/icon";
import { Thumb, youtubeThumb } from "@/components/thumb";
import { Field, SegPick } from "@/components/ui-kit";
import { parseYoutubeId } from "@/lib/content";
import { VIDEO_LEVELS, VIDEO_VISIBILITY, type CourseOption, type VideoAdmin, type VideoGroupAdmin } from "@/lib/content-types";

const BASE = "/quan-ly/noi-dung";
const iconBtn = "inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-faint hover:bg-page disabled:opacity-30";

export function VideoForm({ video, groups, courses }: { video: VideoAdmin | null; groups: VideoGroupAdmin[]; courses: CourseOption[] }) {
  const [v, setV] = useState({
    id: video?.id ?? "",
    title: video?.title ?? "",
    youtube: video?.youtube_id ? `https://youtu.be/${video.youtube_id}` : "",
    description: video?.description ?? "",
    level: video?.level ?? "",
    duration_text: video?.duration_text ?? "",
    group_id: video?.group_id ?? "",
    course_id: video?.course_id ?? "",
    visibility: video?.visibility ?? "public",
  });
  const save = useSave(saveVideo, v);
  type V = typeof v;
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const ytId = parseYoutubeId(v.youtube);
  const levels = v.level && !VIDEO_LEVELS.includes(v.level) ? [...VIDEO_LEVELS, v.level] : VIDEO_LEVELS;

  return (
    <div className="card" id="form-video">
      <form onSubmit={save.onSubmit} noValidate>
        <h2 className="h2">
          <span className="min-w-0 truncate">{video ? "Sửa video" : "Thêm video"}</span>
        </h2>
        <div className="grid gap-3">
          <Field label="Link YouTube" error={save.err("youtube")} hint={v.youtube.trim() ? (ytId ? `mã ${ytId}` : "chưa nhận ra link") : undefined}>
            <input className="input" inputMode="url" autoComplete="off" placeholder="https://www.youtube.com/watch?v=…" value={v.youtube} onChange={(e) => set("youtube", e.target.value)} />
          </Field>
          {ytId && <Thumb src={youtubeThumb(ytId)} alt="Ảnh xem trước video" play duration={v.duration_text || null} />}
          <Field label="Tên video" error={save.err("title")}>
            <input className="input" maxLength={120} value={v.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Mô tả" error={save.err("description")}>
            <textarea className="input" maxLength={1000} style={{ minHeight: 64 }} value={v.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trình độ" error={save.err("level")}>
              <select className="input" value={v.level} onChange={(e) => set("level", e.target.value)}>
                <option value="">Mọi trình độ</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thời lượng" error={save.err("duration_text")}>
              <input className="input num" maxLength={8} placeholder="4:30" value={v.duration_text} onChange={(e) => set("duration_text", e.target.value)} />
            </Field>
            <Field label="Nhóm" error={save.err("group_id")}>
              <select className="input" value={v.group_id} onChange={(e) => set("group_id", e.target.value)}>
                <option value="">Chưa xếp nhóm</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thuộc khoá" error={save.err("course_id")}>
              <select className="input" value={v.course_id} onChange={(e) => set("course_id", e.target.value)}>
                <option value="">Không gắn khoá</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="field">
            <span className="label">Ai xem được</span>
            <SegPick label="Ai xem được" options={VIDEO_VISIBILITY} value={v.visibility} onChange={(x) => set("visibility", x)} full />
            <span className="text-xs text-faint">
              Trang công khai chỉ hiện video “Công khai”. “Chỉ học viên” và “Riêng tư” hiện mới ẩn khỏi trang công khai; khu dành cho học viên chưa có.
            </span>
          </div>
          <SaveBar save={save} label={video ? "Lưu video" : "Thêm video"}>
            {video && (
              <Link href={BASE} scroll={false} className="btn ghost">
                Đóng
              </Link>
            )}
          </SaveBar>
        </div>
      </form>
      {video && (
        <form action={deleteVideo} className="divide-row mt-3.5 flex items-center justify-between gap-2 pt-3.5">
          <input type="hidden" name="id" value={video.id} />
          <span className="min-w-0 text-[13px] text-faint">Chỉ gỡ khỏi web, video trên YouTube vẫn còn.</span>
          <ConfirmButton message={`Xoá video "${video.title}" khỏi web?`}>Xoá video</ConfirmButton>
        </form>
      )}
    </div>
  );
}

function GroupName({ group, onDone }: { group: VideoGroupAdmin | null; onDone?: () => void }) {
  const [v, setV] = useState({ id: group?.id ?? "", name: group?.name ?? "" });
  const save = useSave(saveVideoGroup, v);
  return (
    <form onSubmit={save.onSubmit} className="grid gap-1.5" noValidate>
      <div className="flex gap-2">
        <input className="input min-w-0 flex-1" style={{ height: 40 }} maxLength={40} placeholder={group ? undefined : "Tên nhóm mới, ví dụ: Dink"} aria-label={group ? `Tên nhóm ${group.name}` : "Tên nhóm mới"} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <button className="btn navy" disabled={save.pending}>
          {save.pending ? "Đang lưu…" : group ? "Lưu" : "Thêm"}
        </button>
        {onDone && (
          <button type="button" className="btn ghost" onClick={onDone}>
            {save.saved ? "Xong" : "Huỷ"}
          </button>
        )}
      </div>
      {(save.err("name") ?? save.message) && (
        <div className="err" role="alert">
          {save.err("name") ?? save.message}
        </div>
      )}
      {save.saved && (
        <div className="text-[13px] font-semibold text-good" role="status">
          {save.okMessage}
        </div>
      )}
    </form>
  );
}

export function VideoGroupsCard({ groups, counts }: { groups: VideoGroupAdmin[]; counts: Record<string, number> }) {
  const [renaming, setRenaming] = useState<string | null>(null);
  return (
    <div className="card">
      <h2 className="h2">Nhóm video</h2>
      {groups.length === 0 && <div className="pb-2 text-[13px] text-faint">Chưa có nhóm nào. Nhóm giúp khách lọc video theo chủ đề.</div>}
      {groups.map((g, i) =>
        renaming === g.id ? (
          <div key={g.id} className="divide-row py-2">
            <GroupName group={g} onDone={() => setRenaming(null)} />
          </div>
        ) : (
          <div key={g.id} className="divide-row flex items-center gap-1 py-1.5">
            <div className="min-w-0 flex-1">
              <b className="block truncate">{g.name}</b>
              <span className="text-[13px] text-faint">{counts[g.id] ?? 0} video</span>
            </div>
            <form action={moveVideoGroup}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="dir" value="-1" />
              <button className={iconBtn} disabled={i === 0} aria-label={`Đưa nhóm ${g.name} lên`}>
                <Icon name="left" size={15} className="rotate-90" />
              </button>
            </form>
            <form action={moveVideoGroup}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="dir" value="1" />
              <button className={iconBtn} disabled={i === groups.length - 1} aria-label={`Đưa nhóm ${g.name} xuống`}>
                <Icon name="right" size={15} className="rotate-90" />
              </button>
            </form>
            <button type="button" className={iconBtn} onClick={() => setRenaming(g.id)} aria-label={`Đổi tên nhóm ${g.name}`}>
              <Icon name="pen" size={15} />
            </button>
            <form action={deleteVideoGroup}>
              <input type="hidden" name="id" value={g.id} />
              <ConfirmButton className={iconBtn} message={`Xoá nhóm "${g.name}"? Video trong nhóm không bị xoá, chỉ chuyển về "Chưa xếp nhóm".`}>
                <Icon name="x" size={15} />
                <span className="sr-only">Xoá nhóm {g.name}</span>
              </ConfirmButton>
            </form>
          </div>
        ),
      )}
      <div className="divide-row mt-1 pt-3">
        <GroupName key={`moi-${groups.length}`} group={null} />
      </div>
    </div>
  );
}
