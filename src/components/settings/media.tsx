"use client";

import { useRef, useState } from "react";
import { uploadPublicImage } from "@/app/quan-ly/cai-dat/actions";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/rich-text";
import { moveItem, RowTools } from "@/components/ui-kit";
import { compressImage } from "@/lib/image-compress";

type Kind = "avatar" | "bia" | "nen" | "gioi-thieu";
const MAX_SIDE: Record<Kind, number> = { avatar: 600, bia: 2000, nen: 2000, "gioi-thieu": 1600 };

/** Nén rồi tải một ảnh lên kho công khai; trả đường dẫn hoặc ném lỗi tiếng Việt. */
async function upload(file: File, kind: Kind): Promise<string> {
  const small = await compressImage(file, MAX_SIDE[kind]);
  const fd = new FormData();
  fd.set("kind", kind);
  fd.set("file", small);
  const r = await uploadPublicImage(fd);
  if (!r.url) throw new Error(r.error ?? "Chưa tải được ảnh.");
  return r.url;
}

function useUpload(kind: Kind) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (files: File[], onDone: (urls: string[]) => void) => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const urls: string[] = [];
    try {
      for (const f of files) urls.push(await upload(f, kind));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (urls.length) onDone(urls);
    }
  };
  return { busy, error, run };
}

/** Ô ảnh: bấm để chọn ảnh từ máy, xem trước, đổi hoặc bỏ. `shape` quyết định khung xem trước. */
export function ImageUpload({ kind, value, onChange, label, hint, shape = "wide" }: { kind: Kind; value: string; onChange: (url: string) => void; label: string; hint?: string; shape?: "round" | "wide" }) {
  const input = useRef<HTMLInputElement>(null);
  const up = useUpload(kind);
  const round = shape === "round";
  return (
    <div className={`flex gap-3 ${round ? "items-center" : "flex-col"}`}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={`group relative grid flex-none place-items-center overflow-hidden border border-dashed border-line bg-page text-faint transition hover:border-ink/30 ${round ? "size-[88px] rounded-full" : "aspect-[3/1] w-full rounded-2xl"}`}
        aria-label={value ? `Đổi ${label.toLowerCase()}` : `Tải ${label.toLowerCase()}`}
        style={value ? { backgroundImage: `url(${JSON.stringify(value)})`, backgroundSize: "cover", backgroundPosition: "center", borderStyle: "solid" } : undefined}
      >
        {up.busy ? (
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">Đang tải…</span>
        ) : value ? (
          <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">Đổi ảnh</span>
        ) : (
          <span className="grid place-items-center gap-1 text-xs font-semibold">
            <Icon name="plus" size={20} />
            {round ? "Ảnh" : "Tải ảnh lên"}
          </span>
        )}
      </button>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        {hint && <div className="text-xs text-faint">{hint}</div>}
        <div className="mt-1.5 flex gap-2">
          <button type="button" className="btn sm ghost" onClick={() => input.current?.click()} disabled={up.busy}>
            {value ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {value && (
            <button type="button" className="btn sm ghost" onClick={() => onChange("")} disabled={up.busy}>
              Bỏ
            </button>
          )}
        </div>
        {up.error && <div className="err mt-1">{up.error}</div>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => up.run([...(e.target.files ?? [])].slice(0, 1), (u) => onChange(u[0]))} />
    </div>
  );
}

export type GalleryItem = { url: string; caption: string };

/** Bộ ảnh tab Giới thiệu: chọn nhiều ảnh một lần, ghi chú thích, đổi thứ tự. */
export function GalleryEditor({ items, onChange, max = 24 }: { items: GalleryItem[]; onChange: (g: GalleryItem[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const up = useUpload("gioi-thieu");
  return (
    <div className="grid gap-3">
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((g, i) => (
            <div key={g.url} className="overflow-hidden rounded-2xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption || `Ảnh ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-center gap-1 p-2">
                <input
                  className="input min-w-0 flex-1"
                  style={{ height: 36, fontSize: 13 }}
                  maxLength={120}
                  placeholder="Chú thích (không bắt buộc)"
                  aria-label={`Chú thích ảnh ${i + 1}`}
                  value={g.caption}
                  onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                />
                <RowTools index={i} count={items.length} onMove={(a, d) => onChange(moveItem(items, a, d))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
        </div>
      )}
      {items.length < max && (
        <button type="button" onClick={() => input.current?.click()} disabled={up.busy} className="grid place-items-center gap-1 rounded-2xl border border-dashed border-line bg-page py-6 text-[13px] font-semibold text-faint hover:border-ink/30">
          <Icon name="plus" size={20} />
          {up.busy ? "Đang tải ảnh…" : items.length ? "Thêm ảnh" : "Thêm ảnh lớp học, sân, học viên…"}
        </button>
      )}
      {up.error && <div className="err">{up.error}</div>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => up.run([...(e.target.files ?? [])].slice(0, max - items.length), (urls) => onChange([...items, ...urls.map((url) => ({ url, caption: "" }))]))}
      />
    </div>
  );
}

const TOOLS = [
  { key: "b", label: "B", title: "In đậm (chọn chữ rồi bấm)", wrap: "**", cls: "font-extrabold" },
  { key: "i", label: "I", title: "In nghiêng (chọn chữ rồi bấm)", wrap: "*", cls: "italic font-serif" },
  { key: "h", label: "H", title: "Tiêu đề mục", prefix: "## ", cls: "font-extrabold" },
  { key: "ul", label: "•", title: "Gạch đầu dòng", prefix: "- ", cls: "text-lg leading-none" },
  { key: "ol", label: "1.", title: "Danh sách đánh số", prefix: "n", cls: "font-semibold" },
  { key: "q", label: "❝", title: "Trích dẫn", prefix: "> ", cls: "" },
] as const;

/** Soạn bài giới thiệu: thanh công cụ (đậm, nghiêng, tiêu đề, danh sách, trích dẫn, chèn ảnh) + xem trước canh đều. */
export function RichEditor({ value, onChange, maxLength, label }: { value: string; onChange: (v: string) => void; maxLength: number; label: string }) {
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"soan" | "xem">("soan");
  const up = useUpload("gioi-thieu");

  const apply = (next: string, selStart: number, selEnd: number) => {
    onChange(next.slice(0, maxLength));
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(selStart, selEnd);
    });
  };

  const tool = (t: (typeof TOOLS)[number]) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if ("wrap" in t) {
      const w = t.wrap;
      const sel = value.slice(a, b) || (t.key === "b" ? "chữ đậm" : "chữ nghiêng");
      apply(value.slice(0, a) + w + sel + w + value.slice(b), a + w.length, a + w.length + sel.length);
      return;
    }
    // Áp tiền tố cho mọi dòng đang chọn (bấm lại thì bỏ).
    const start = value.lastIndexOf("\n", a - 1) + 1;
    const endIdx = value.indexOf("\n", b);
    const end = endIdx === -1 ? value.length : endIdx;
    const lines = value.slice(start, end).split("\n");
    const has = (l: string) => (t.prefix === "n" ? /^\d+[.)]\s+/.test(l) : l.startsWith(t.prefix));
    const all = lines.every(has);
    const out = lines
      .map((l, i) => {
        const bare = l.replace(/^(##\s+|[-*•]\s+|\d+[.)]\s+|>\s?)/, "");
        if (all) return bare;
        return (t.prefix === "n" ? `${i + 1}. ` : t.prefix) + bare;
      })
      .join("\n");
    apply(value.slice(0, start) + out + value.slice(end), start, start + out.length);
  };

  const insertImages = (urls: string[]) => {
    const el = area.current;
    const at = el ? el.selectionEnd : value.length;
    const before = value.slice(0, at);
    const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const block = urls.map((u) => `![](${u})`).join("\n\n");
    const next = before + pad + block + "\n\n" + value.slice(at);
    apply(next, (before + pad).length, (before + pad + block).length);
  };

  return (
    <div className="field">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <span className="seg">
          <button type="button" className={tab === "soan" ? "on" : ""} onClick={() => setTab("soan")}>Soạn</button>
          <button type="button" className={tab === "xem" ? "on" : ""} onClick={() => setTab("xem")}>Xem trước</button>
        </span>
      </div>
      {tab === "soan" ? (
        <div className="overflow-hidden rounded-xl border border-line focus-within:border-ink/30">
          <div className="flex flex-wrap items-center gap-1 border-b border-line bg-page px-2 py-1.5">
            {TOOLS.map((t) => (
              <button key={t.key} type="button" title={t.title} aria-label={t.title} onClick={() => tool(t)} className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm hover:bg-white ${t.cls}`}>
                {t.label}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-line" />
            <button type="button" title="Chèn ảnh vào bài" onClick={() => file.current?.click()} disabled={up.busy} className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold hover:bg-white">
              <Icon name="plus" size={15} /> {up.busy ? "Đang tải…" : "Ảnh"}
            </button>
          </div>
          <textarea
            ref={area}
            className="block w-full resize-y px-3.5 py-3 text-[15px] leading-relaxed outline-none"
            style={{ minHeight: 220 }}
            maxLength={maxLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
          />
        </div>
      ) : (
        <div className="min-h-[220px] rounded-xl border border-line p-4">{value.trim() ? <RichText text={value} /> : <span className="text-faint">Chưa có nội dung.</span>}</div>
      )}
      <div className="flex flex-wrap justify-between gap-2 text-xs text-faint">
        <span>Chọn chữ rồi bấm B / I. Để trống một dòng giữa hai đoạn. Trang công khai canh đều hai bên.</span>
        <span>{value.length} / {maxLength}</span>
      </div>
      {up.error && <span className="err">{up.error}</span>}
      <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => up.run([...(e.target.files ?? [])].slice(0, 6), insertImages)} />
    </div>
  );
}
