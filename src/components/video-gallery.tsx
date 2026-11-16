"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Thumb, youtubeThumb } from "@/components/thumb";
import type { Video, VideoGroup } from "@/lib/types";

export function VideoGallery({ groups, videos }: { groups: VideoGroup[]; videos: Video[] }) {
  const usedGroups = groups.filter((g) => videos.some((v) => v.group_id === g.id));
  const [group, setGroup] = useState<string | null>(usedGroups[0]?.id ?? null);
  const [playing, setPlaying] = useState<Video | null>(null);
  const list = group ? videos.filter((v) => v.group_id === group) : videos;
  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name;

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [playing]);

  if (videos.length === 0) return <div className="card text-muted">Kho video đang được cập nhật.</div>;

  return (
    <>
      {usedGroups.length > 1 && (
        <div className="seg mb-3.5" role="tablist">
          {usedGroups.map((g) => (
            <button key={g.id} role="tab" aria-selected={group === g.id} className={group === g.id ? "on" : ""} onClick={() => setGroup(g.id)}>
              {g.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => {
          const ready = !!v.youtube_id;
          const body = (
            <>
              <Thumb src={ready ? youtubeThumb(v.youtube_id!) : null} alt="" play={ready} duration={v.duration_text}>
                {!ready && <span className="pill absolute top-2 left-2 bg-white/90 text-navy">Sắp có</span>}
              </Thumb>
              <div className="px-1 pt-2.5 pb-1">
                <b>{v.title}</b>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-faint">
                  {groupName(v.group_id) && <span className="pill n">{groupName(v.group_id)}</span>}
                  {v.level}
                </div>
              </div>
            </>
          );
          return ready ? (
            <button key={v.id} className="card cursor-pointer text-left" style={{ padding: 10 }} onClick={() => setPlaying(v)}>
              {body}
            </button>
          ) : (
            <div key={v.id} className="card opacity-80" style={{ padding: 10 }}>
              {body}
            </div>
          );
        })}
      </div>
      <div className="card mt-4 flex items-center gap-3">
        <Icon name="info" className="text-[var(--indigo)]" />
        <div className="text-[13px] text-muted">
          <b className="text-ink">Bài tập ở nhà</b> và <b className="text-ink">video sửa lỗi riêng</b> chỉ dành cho học viên của lớp.
        </div>
      </div>

      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPlaying(null)}
        >
          <div className="w-full max-w-[920px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between gap-3 text-white">
              <b className="truncate text-base">{playing.title}</b>
              <button className="btn sm glass" onClick={() => setPlaying(null)} aria-label="Đóng">
                <Icon name="x" size={16} /> Đóng
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-[14px] bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.youtube_id}?autoplay=1&rel=0`}
                title={playing.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                className="size-full border-0"
              />
            </div>
            {playing.description && <p className="mt-2 text-sm text-white/80">{playing.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}
