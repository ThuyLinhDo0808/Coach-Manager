import type { Contacts } from "@/lib/types";

export type ContactLink = { key: string; label: string; href: string };

/** Chỉ trả các kênh đã điền; SĐT chỉ hiện khi coach bật show_phone. */
export function contactLinks(c: Contacts): ContactLink[] {
  const out: ContactLink[] = [];
  if (c.zalo) out.push({ key: "zalo", label: "Zalo", href: c.zalo.startsWith("http") ? c.zalo : `https://zalo.me/${c.zalo}` });
  if (c.facebook) out.push({ key: "facebook", label: "Facebook", href: c.facebook });
  if (c.tiktok) out.push({ key: "tiktok", label: "TikTok", href: c.tiktok });
  if (c.youtube) out.push({ key: "youtube", label: "YouTube", href: c.youtube });
  if (c.phone && c.show_phone) out.push({ key: "phone", label: c.phone, href: `tel:${c.phone}` });
  return out;
}

export function zaloHref(c: Contacts): string | null {
  return contactLinks(c).find((l) => l.key === "zalo")?.href ?? null;
}
