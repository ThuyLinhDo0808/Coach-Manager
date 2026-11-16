/** "Khoá Cơ bản cho người mới" → "khoa-co-ban-cho-nguoi-moi". Bỏ dấu tiếng Việt, chỉ giữ a-z 0-9 và gạch nối. */
export function slugify(text: string, max = 80): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length <= max) return base;
  // Cắt ở ranh giới từ nếu được, để không đứt giữa chữ.
  const cut = base.slice(0, max);
  const lastDash = cut.lastIndexOf("-");
  return (base[max] === "-" || lastDash < max / 2 ? cut : cut.slice(0, lastDash)).replace(/-+$/g, "");
}

/** Slug chưa ai dùng: trùng thì thêm -2, -3… Tiêu đề không ra chữ nào thì dùng `fallback`. */
export function uniqueSlug(text: string, taken: Iterable<string>, max = 80, fallback = "muc"): string {
  const used = new Set(taken);
  let base = slugify(text, max);
  if (base.length < 2) base = fallback;
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) {
    const suffix = `-${i}`;
    const candidate = base.slice(0, max - suffix.length).replace(/-+$/g, "") + suffix;
    if (!used.has(candidate)) return candidate;
  }
}
