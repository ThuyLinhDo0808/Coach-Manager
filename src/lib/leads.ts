import type { Lead, LeadStatus } from "@/lib/types";

/** Các trạng thái còn đang xử lý (chưa chốt, chưa bỏ). */
export const OPEN_STATUSES: LeadStatus[] = ["moi", "da-lien-he", "hen-hoc-thu", "cho-dong-tien"];
/** Cột trên bảng Kanban, theo thứ tự flow. */
export const BOARD_STATUSES: LeadStatus[] = ["moi", "da-lien-he", "hen-hoc-thu", "cho-dong-tien", "da-chot"];

export const LOST_REASONS = ["Giá", "Giờ học không hợp", "Xa sân", "Không liên lạc được", "Khác"];

const HOUR = 3_600_000;

/** Nhu cầu ở cột Mới quá 24 giờ chưa ai gọi. */
export function isOverdue(lead: Pick<Lead, "status" | "created_at">, now = Date.now()): boolean {
  return lead.status === "moi" && now - new Date(lead.created_at).getTime() > 24 * HOUR;
}

/** "5 giờ", "2 ngày" tính từ lúc tạo. */
export function ageText(iso: string, now = Date.now()): string {
  const h = Math.max(0, Math.floor((now - new Date(iso).getTime()) / HOUR));
  if (h < 1) return "vừa xong";
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}

export function countByStatus(leads: Pick<Lead, "status">[]): Record<LeadStatus, number> {
  const out = { moi: 0, "da-lien-he": 0, "hen-hoc-thu": 0, "cho-dong-tien": 0, "da-chot": 0, "danh-sach-cho": 0, "khong-thanh": 0 };
  for (const l of leads) out[l.status]++;
  return out;
}

/** Tỷ lệ chốt = đã chốt / (đã chốt + không thành), tính trên các nhu cầu đã có kết quả. */
export function closeRate(leads: Pick<Lead, "status">[]): number | null {
  const c = countByStatus(leads);
  const done = c["da-chot"] + c["khong-thanh"];
  return done ? Math.round((c["da-chot"] / done) * 100) : null;
}

export function maskPhone(p: string): string {
  return p.length === 10 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
}
