"use client";

import Link from "next/link";
import { useState } from "react";
import { saveProfile } from "@/app/quan-ly/cai-dat/actions";
import { Avatar } from "@/components/avatar";
import { SaveAct, SaveBar, SaveError, useSave } from "@/components/form-kit";
import { GalleryEditor, ImageUpload, RichEditor } from "@/components/settings/media";
import { SectionHead, SettingsShell } from "@/components/settings/shell";
import { Field, LinesEditor, moveItem, RowTools, SegPick, SwitchRow } from "@/components/ui-kit";
import { ageFromBirthYear, statText } from "@/lib/format";
import type { Coach } from "@/lib/types";

const GENDERS = [
  { value: "nam", label: "Nam" },
  { value: "nu", label: "Nữ" },
  { value: "", label: "Không hiện" },
] as const;

const STATS = [
  ["stat_hours", "Giờ dạy", "giờ dạy"],
  ["stat_students", "Học viên", "học viên"],
  ["stat_courses", "Khoá đã dạy", "khoá đã dạy"],
  ["stat_years", "Năm kinh nghiệm", "năm kinh nghiệm"],
] as const;

const CONTACTS = [
  ["zalo", "Zalo", "Số điện thoại Zalo hoặc link zalo.me"],
  ["facebook", "Facebook", "https://facebook.com/…"],
  ["tiktok", "TikTok", "https://tiktok.com/@…"],
  ["youtube", "YouTube", "https://youtube.com/@…"],
] as const;

function initial(c: Coach) {
  return {
    display_name: c.display_name,
    tagline: c.tagline ?? "",
    bio: c.bio ?? "",
    avatar_url: c.avatar_url ?? "",
    cover_url: c.cover_url ?? "",
    bg_url: c.bg_url ?? "",
    gallery: (c.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? "" })),
    birth_year: c.birth_year ? String(c.birth_year) : "",
    show_age: c.show_age,
    gender: (c.gender === "nam" || c.gender === "nu" ? c.gender : "") as "nam" | "nu" | "",
    area: c.area ?? "",
    dupr: c.dupr != null ? String(Number(c.dupr)) : "",
    stat_hours: c.stat_hours ?? "",
    stat_students: c.stat_students ?? "",
    stat_courses: c.stat_courses ?? "",
    stat_years: c.stat_years ?? "",
    teaching_style: [...(c.teaching_style ?? [])],
    strengths: (c.strengths ?? []).map((s) => ({ title: s.title ?? "", text: s.text ?? "" })),
    experience: (c.experience ?? []).map((e) => ({ year: e.year ?? "", title: e.title ?? "", detail: e.detail ?? "" })),
    contacts: {
      zalo: c.contacts?.zalo ?? "",
      facebook: c.contacts?.facebook ?? "",
      tiktok: c.contacts?.tiktok ?? "",
      youtube: c.contacts?.youtube ?? "",
      phone: c.contacts?.phone ?? "",
      show_phone: Boolean(c.contacts?.show_phone),
    },
    accepting_students: c.accepting_students,
  };
}
type V = ReturnType<typeof initial>;

export function ProfileForm({ coach }: { coach: Coach }) {
  const [v, setV] = useState(() => initial(coach));
  const save = useSave(saveProfile, v);
  const set = <K extends keyof V>(k: K, val: V[K]) => setV((p) => ({ ...p, [k]: val }));
  const setContact = <K extends keyof V["contacts"]>(k: K, val: V["contacts"][K]) => setV((p) => ({ ...p, contacts: { ...p.contacts, [k]: val } }));
  const txt = (k: "display_name" | "tagline" | "area" | "birth_year" | "dupr" | (typeof STATS)[number][0]) => ({
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
  });

  const year = Number(v.birth_year);
  const age = ageFromBirthYear(Number.isInteger(year) ? year : null);
  const meta = [v.gender === "nam" ? "Nam" : v.gender === "nu" ? "Nữ" : null, v.show_age && age ? `${age} tuổi` : null, v.area.trim() || null].filter(Boolean);
  const dupr = Number(v.dupr.replace(",", "."));

  return (
    <form onSubmit={save.onSubmit} noValidate>
      <SettingsShell
        on="ho-so"
        act={
          <>
            <Link href="/" target="_blank" className="btn sm glass hide-m">
              Xem trang công khai
            </Link>
            <SaveAct save={save} />
          </>
        }
      >
        <SaveError save={save} />
        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-4 *:min-w-0">
            <div className="card">
              <SectionHead icon="users" color="blue" title="Thông tin cơ bản" caption="Hiện trên thẻ hồ sơ ở trang công khai." />
              <div className="mb-4">
                <ImageUpload kind="avatar" shape="round" label="Ảnh đại diện" hint="Ảnh vuông, rõ mặt. Ảnh được nén tự động." value={v.avatar_url} onChange={(u) => set("avatar_url", u)} />
                {save.err("avatar_url") && <div className="err mt-1">{save.err("avatar_url")}</div>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Tên hiển thị" error={save.err("display_name")}>
                  <input className="input" maxLength={60} {...txt("display_name")} />
                </Field>
                <Field label="Địa chỉ trang">
                  <span className="input flex items-center bg-page text-muted">
                    <span className="text-faint">/</span>
                    <span className="truncate">{coach.slug}</span>
                  </span>
                </Field>
                <Field label="Câu giới thiệu ngắn" className="md:col-span-2" error={save.err("tagline")}>
                  <input className="input" maxLength={120} placeholder="Ví dụ: Dạy pickleball cho người mới" {...txt("tagline")} />
                </Field>
                <Field label="Năm sinh" hint={age ? `${age} tuổi` : undefined} error={save.err("birth_year")}>
                  <input className="input num" inputMode="numeric" maxLength={4} {...txt("birth_year")} />
                </Field>
                <div className="field">
                  <span className="label">Giới tính</span>
                  <SegPick label="Giới tính" options={GENDERS} value={v.gender} onChange={(g) => set("gender", g)} full />
                </div>
                <Field label="Khu vực dạy" error={save.err("area")}>
                  <input className="input" maxLength={80} placeholder="Ví dụ: Cầu Giấy, Hà Nội" {...txt("area")} />
                </Field>
                <Field label="DUPR" error={save.err("dupr")}>
                  <input className="input num" inputMode="decimal" maxLength={5} placeholder="Ví dụ: 4.5" {...txt("dupr")} />
                </Field>
              </div>
              <div className="mt-2">
                <SwitchRow first title="Hiện tuổi trên trang công khai" checked={v.show_age} onChange={(b) => set("show_age", b)} />
              </div>
            </div>

            <div className="card">
              <SectionHead icon="star" color="amber" title="Trang trí hồ sơ" caption="Ảnh bìa trên đầu trang, ảnh nền và bộ ảnh ở tab Giới thiệu." />
              <div className="grid gap-4 md:grid-cols-2">
                <ImageUpload kind="bia" label="Ảnh bìa" hint="Ảnh ngang, hiện trên dải đầu trang." value={v.cover_url} onChange={(u) => set("cover_url", u)} />
                <ImageUpload kind="nen" label="Ảnh nền trang" hint="Hiện mờ phía sau nội dung." value={v.bg_url} onChange={(u) => set("bg_url", u)} />
              </div>
              {(save.err("cover_url") || save.err("bg_url")) && <div className="err mt-1">{save.err("cover_url") ?? save.err("bg_url")}</div>}
              <div className="divide-row mt-4 pt-4">
                <div className="mb-2.5">
                  <b>Bộ ảnh giới thiệu</b>
                  <p className="text-[13px] text-faint">Ảnh lớp học, sân, học viên… hiện dạng lưới ở tab Giới thiệu. Tối đa 24 ảnh.</p>
                </div>
                <GalleryEditor items={v.gallery} onChange={(g) => set("gallery", g)} />
                {save.err("gallery") && <div className="err mt-1">{save.err("gallery")}</div>}
              </div>
            </div>

            <div className="card">
              <SectionHead icon="pen" color="indigo" title="Giới thiệu và phong cách" caption="Viết như một bài ngắn: có thể in đậm, in nghiêng, gạch đầu dòng và chèn ảnh." />
              <RichEditor label="Đôi lời giới thiệu" value={v.bio} onChange={(b) => set("bio", b)} maxLength={8000} />
              {save.err("bio") && <span className="err">{save.err("bio")}</span>}
              <div className="field mt-3.5">
                <span className="label">Phong cách giảng dạy</span>
                <LinesEditor label="Phong cách" items={v.teaching_style} onChange={(a) => set("teaching_style", a)} addLabel="Thêm ý" placeholder="Ví dụ: Sửa từng động tác qua video quay tại sân" />
                {save.err("teaching_style") && <span className="err">{save.err("teaching_style")}</span>}
              </div>
              <div className="field mt-3.5">
                <span className="label">Điểm mạnh</span>
                {v.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[150px_minmax(0,1fr)]">
                      <input
                        className="input"
                        style={{ height: 40 }}
                        value={s.title}
                        maxLength={40}
                        placeholder="Footwork"
                        aria-label={`Điểm mạnh ${i + 1}`}
                        onChange={(e) => set("strengths", v.strengths.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      />
                      <input
                        className="input"
                        style={{ height: 40 }}
                        value={s.text}
                        maxLength={200}
                        placeholder="Mô tả ngắn"
                        aria-label={`Mô tả điểm mạnh ${i + 1}`}
                        onChange={(e) => set("strengths", v.strengths.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                      />
                    </div>
                    <RowTools index={i} count={v.strengths.length} onMove={(a, d) => set("strengths", moveItem(v.strengths, a, d))} onRemove={() => set("strengths", v.strengths.filter((_, j) => j !== i))} />
                  </div>
                ))}
                {v.strengths.length < 12 && (
                  <button type="button" className="justify-self-start text-left text-[13px] font-semibold text-faint hover:text-ink" onClick={() => set("strengths", [...v.strengths, { title: "", text: "" }])}>
                    + Thêm điểm mạnh
                  </button>
                )}
                {save.err("strengths") && <span className="err">{save.err("strengths")}</span>}
              </div>
            </div>

            <div className="card">
              <h2 className="h2">
                Kinh nghiệm
                <button type="button" className="btn sm ghost" onClick={() => set("experience", [{ year: String(new Date().getFullYear()), title: "", detail: "" }, ...v.experience])}>
                  + Thêm mốc
                </button>
              </h2>
              {v.experience.length === 0 && <div className="text-[13px] text-faint">Chưa có mốc nào.</div>}
              {v.experience.map((x, i) => (
                <div key={i} className="divide-row flex items-start gap-1 py-2.5">
                  <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[96px_minmax(0,1fr)]">
                    <input
                      className="input num"
                      style={{ height: 40 }}
                      value={x.year}
                      maxLength={20}
                      placeholder="2024"
                      aria-label={`Năm của mốc ${i + 1}`}
                      onChange={(e) => set("experience", v.experience.map((y, j) => (j === i ? { ...y, year: e.target.value } : y)))}
                    />
                    <div className="grid gap-2">
                      <input
                        className="input"
                        style={{ height: 40 }}
                        value={x.title}
                        maxLength={160}
                        placeholder="Ví dụ: Chứng chỉ huấn luyện viên pickleball"
                        aria-label={`Mốc ${i + 1}`}
                        onChange={(e) => set("experience", v.experience.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))}
                      />
                      <input
                        className="input"
                        style={{ height: 40 }}
                        value={x.detail}
                        maxLength={300}
                        placeholder="Ghi thêm (không bắt buộc)"
                        aria-label={`Ghi thêm của mốc ${i + 1}`}
                        onChange={(e) => set("experience", v.experience.map((y, j) => (j === i ? { ...y, detail: e.target.value } : y)))}
                      />
                    </div>
                  </div>
                  <RowTools index={i} count={v.experience.length} onMove={(a, d) => set("experience", moveItem(v.experience, a, d))} onRemove={() => set("experience", v.experience.filter((_, j) => j !== i))} />
                </div>
              ))}
              {save.err("experience") && <div className="err">{save.err("experience")}</div>}

              <h3 className="h3 mt-4">Số liệu nổi bật</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {STATS.map(([k, label]) => (
                  <Field key={k} label={label} error={save.err(k)}>
                    <input className="input" maxLength={20} placeholder="Ví dụ ~1000" {...txt(k)} />
                  </Field>
                ))}
              </div>
              <p className="mt-2 text-xs text-faint">Nhập tự do, ví dụ “~1000”, “&gt; 100”, “3+”. Hiện đúng như bạn gõ trên thẻ hồ sơ công khai; số thuần sẽ có dấu chấm ngăn cách (1200 → 1.200).</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-4 *:min-w-0">
            <div className="card">
              <h2 className="h2">Liên hệ và hiển thị</h2>
              <div className="grid gap-3">
                {CONTACTS.map(([k, label, ph]) => (
                  <Field key={k} label={label}>
                    <input className="input" style={{ height: 40 }} maxLength={200} placeholder={ph} value={v.contacts[k]} onChange={(e) => setContact(k, e.target.value)} />
                  </Field>
                ))}
                <Field label="Số điện thoại">
                  <input className="input num" style={{ height: 40 }} inputMode="tel" maxLength={20} value={v.contacts.phone} onChange={(e) => setContact("phone", e.target.value)} />
                </Field>
                {save.err("contacts") && <div className="err">{save.err("contacts")}</div>}
              </div>
              <div className="mt-2">
                <SwitchRow first title="Hiện số điện thoại" sub="Tắt thì khách chỉ thấy Zalo và mạng xã hội" checked={v.contacts.show_phone} onChange={(b) => setContact("show_phone", b)} />
                <SwitchRow title="Đang nhận học viên" sub="Tắt thì form đăng ký học thử ngừng nhận" checked={v.accepting_students} onChange={(b) => set("accepting_students", b)} />
              </div>
            </div>

            <div className="card text-center">
              <div className="mb-2.5 text-left text-xs font-semibold text-faint">XEM TRƯỚC THẺ HỒ SƠ</div>
              <Avatar name={v.display_name || "Coach"} url={v.avatar_url.startsWith("http") ? v.avatar_url : null} size={72} />
              <div className="mt-2 text-lg font-extrabold">{v.display_name || "Tên hiển thị"}</div>
              {meta.length > 0 && <div className="text-[13px] text-muted">{meta.join(" · ")}</div>}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {dupr > 0 && <span className="pill n">DUPR {dupr.toFixed(1)}</span>}
                <span className={`pill ${v.accepting_students ? "good" : "n"}`}>{v.accepting_students ? "Đang nhận học viên" : "Tạm ngừng nhận"}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STATS.map(([k, , unit]) => (
                  <div key={k} className="stat">
                    <div className="v">{statText(v[k])}</div>
                    <div className="l">{unit}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <SaveBar save={save} />
      </SettingsShell>
    </form>
  );
}
