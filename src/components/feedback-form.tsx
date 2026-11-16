"use client";

import { useActionState, useState } from "react";
import { saveFeedback } from "@/app/quan-ly/_actions/teaching";
import { Icon } from "@/components/icon";
import { FEEDBACK_CHIPS, SKILLS, type Feedback, type Scores } from "@/lib/teaching";

/** Nhận xét sau buổi cho một học viên: chấm 1–5 từng kỹ năng, chip mẫu, ô nhận xét. */
export function FeedbackForm({ sessionId, studentId, nextStudentId, existing, videos }: { sessionId: string; studentId: string; nextStudentId: string | null; existing: Feedback | null; videos: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(saveFeedback, null);
  const [scores, setScores] = useState<Scores>(existing?.scores ?? {});
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [showVideo, setShowVideo] = useState(Boolean(existing?.video_url || existing?.homework_video_id));

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="student_id" value={studentId} />
      <input type="hidden" name="next_student" value={nextStudentId ?? ""} />
      <div className="grid content-start gap-2.5">
        {SKILLS.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="font-semibold">{label}</span>
            <input type="hidden" name={`score_${key}`} value={scores[key] ?? ""} />
            <span className="flex gap-1" role="radiogroup" aria-label={`Điểm ${label}`}>
              {[1, 2, 3, 4, 5].map((x) => {
                const on = (scores[key] ?? 0) >= x;
                return (
                  <button
                    key={x}
                    type="button"
                    role="radio"
                    aria-checked={scores[key] === x}
                    onClick={() => setScores((s) => ({ ...s, [key]: s[key] === x ? undefined : x }))}
                    className={`inline-flex size-10 items-center justify-center rounded-[10px] font-bold md:size-[34px] ${on ? "bg-navy text-white" : "bg-page text-faint"}`}
                  >
                    {x}
                  </button>
                );
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="grid content-start gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_CHIPS.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => setComment((v) => (v ? `${v.replace(/\s+$/, "")} ${c}.` : `${c}.`))}>
              {c}
            </button>
          ))}
        </div>
        <textarea name="comment" className="input" maxLength={2000} aria-label="Nhận xét" placeholder="Nhận xét cho học viên…" value={comment} onChange={(e) => setComment(e.target.value)} />
        {showVideo && (
          <div className="grid gap-2 md:grid-cols-2">
            <input name="video_url" className="input" placeholder="Link video của học viên (https://…)" defaultValue={existing?.video_url ?? ""} aria-label="Link video" />
            <select name="homework_video_id" className="input" defaultValue={existing?.homework_video_id ?? ""} aria-label="Bài tập về nhà">
              <option value="">Bài tập về nhà: không</option>
              {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select>
          </div>
        )}
        {state?.message && <div className="err" role="alert">{state.message}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-[13px] font-semibold">
            <input type="checkbox" name="shared" defaultChecked={existing?.shared ?? true} className="size-5 accent-[#16284d]" />
            Cho học viên xem
          </label>
          <span className="flex gap-2">
            {!showVideo && (
              <button type="button" className="btn sm ghost" onClick={() => setShowVideo(true)}>
                <Icon name="video" size={16} /> Gắn video
              </button>
            )}
            <button className="btn sm primary" disabled={pending}>
              {pending ? "Đang lưu…" : nextStudentId ? "Lưu, sang người tiếp" : "Lưu nhận xét"}
            </button>
          </span>
        </div>
      </div>
    </form>
  );
}
