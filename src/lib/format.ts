const vnd = new Intl.NumberFormat("vi-VN");

/** 2400000 → "2.400.000đ" */
export function formatVnd(amount: number | null | undefined): string | null {
  if (amount == null) return null;
  return `${vnd.format(amount)}đ`;
}

/** 1200 → "1.200" */
export function formatNumber(n: number): string {
  return vnd.format(n);
}

export function ageFromBirthYear(birthYear: number | null, now = new Date()): number | null {
  if (!birthYear) return null;
  const age = now.getFullYear() - birthYear;
  return age > 0 && age < 120 ? age : null;
}

/** "Coach Trung Muối" → "TM" */
export function initials(name: string): string {
  const words = name.replace(/^coach\s+/i, "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
}

/** Chuẩn hoá SĐT Việt Nam về dạng 0xxxxxxxxx; trả null nếu không hợp lệ. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("84")) digits = "0" + digits.slice(2);
  return /^0\d{9}$/.test(digits) ? digits : null;
}
