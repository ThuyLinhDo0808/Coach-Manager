const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Tách mã video YouTube (11 ký tự) từ link dán vào: watch?v=, youtu.be/, shorts/, embed/, live/
 * hoặc chính mã đó. Không nhận ra thì trả null.
 */
export function parseYoutubeId(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (YT_ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  if (host === "youtu.be") {
    id = parts[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = url.searchParams.get("v") ?? undefined;
    else if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) id = parts[1];
  }
  return id && YT_ID.test(id) ? id : null;
}

/** Ước lượng số phút đọc của bài viết (khoảng 200 chữ / phút, ít nhất 1 phút). */
export function estimateReadMinutes(body: string): number {
  const words = body
    .replace(/[#*_>`-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
