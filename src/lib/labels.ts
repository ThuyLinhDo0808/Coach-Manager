import { formatVnd } from "@/lib/format";
import { COURSE_KINDS, POST_TOPICS, type Course, type Post } from "@/lib/types";

export const kindLabel = (k: string) => COURSE_KINDS.find((x) => x.value === k)?.label ?? k;

export function priceText(c: Course): { main: string; sub: string } | null {
  if (c.price_full != null) return { main: formatVnd(c.price_full)!.replace("đ", " đ"), sub: "trọn khoá" };
  if (c.price_single != null) return { main: formatVnd(c.price_single)!.replace("đ", " đ"), sub: "mỗi buổi" };
  return null;
}

export const topicLabel = (t: string) => POST_TOPICS.find((x) => x.value === t)?.label ?? t;

export const postDate = (p: Post, long = false) =>
  p.published_at
    ? new Date(p.published_at).toLocaleDateString(
        "vi-VN",
        long ? { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" } : { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" },
      )
    : "";

export const postCover = (p: Post) => p.cover_url ?? (p.youtube_id ? `https://i.ytimg.com/vi/${p.youtube_id}/hqdefault.jpg` : null);

// ----- form nhu cầu học -----
export const DAYS = [
  ["t2", "T2"], ["t3", "T3"], ["t4", "T4"], ["t5", "T5"], ["t6", "T6"], ["t7", "T7"], ["cn", "CN"],
] as const;
export const SLOTS = [["sang", "Sáng"], ["chieu", "Chiều"], ["toi", "Tối"]] as const;

export const GENDERS = [["nam", "Nam"], ["nu", "Nữ"], ["khac", "Khác"]] as const;
export const FOR_WHOM = [["ban-than", "Bản thân"], ["con", "Con tôi"], ["nhom", "Nhóm bạn"]] as const;
export const SPORTS = ["Tennis", "Cầu lông", "Bóng bàn", "Bóng chuyền", "Chạy bộ", "Khác"];
export const DURATIONS = ["Chưa chơi", "Dưới 3 tháng", "3–12 tháng", "1–2 năm", "Trên 2 năm"];
export const LEVELS = ["Mới cầm vợt", "Chơi được", "Đánh giải"];
export const FORMATS = ["Kèm 1-1", "Nhóm nhỏ 2–4 người", "Lớp đông"];
export const STYLES = ["Nghiêm khắc", "Vui vẻ, thoải mái"];
export const BUDGETS = ["Dưới 2 triệu", "2–4 triệu", "4–8 triệu", "Trên 8 triệu", "Chưa rõ"];
export const SOURCES = ["Facebook", "TikTok", "YouTube", "Bạn giới thiệu", "Tìm trên Google", "Khác"];

const pick = (pairs: readonly (readonly [string, string])[], v: string | null) => pairs.find((p) => p[0] === v)?.[1] ?? v ?? "";
export const genderLabel = (v: string | null) => pick(GENDERS, v);
export const forWhomLabel = (v: string | null) => pick(FOR_WHOM, v);

/** { t3: ["toi"], t5: ["toi"], t7: ["sang"] } → "Tối T3, T5 · Sáng T7" */
export function availabilityText(a: Record<string, string[]> | null | undefined): string {
  if (!a) return "";
  return SLOTS.map(([slot, label]) => {
    const days = DAYS.filter(([d]) => a[d]?.includes(slot)).map(([, l]) => l);
    return days.length ? `${label} ${days.join(", ")}` : null;
  })
    .filter(Boolean)
    .join(" · ");
}
