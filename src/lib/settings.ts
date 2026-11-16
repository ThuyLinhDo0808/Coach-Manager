// Cài đặt của coach, lưu trong cột coaches.settings (jsonb). Mọi nhóm đều tuỳ chọn;
// luôn đọc qua getSettings() để có giá trị mặc định.

export type PayoutSettings = {
  bank_bin: string; // mã BIN ngân hàng theo NAPAS, ví dụ 970436 (Vietcombank)
  bank_name: string;
  account_no: string;
  account_name: string; // tên chủ tài khoản, viết hoa không dấu
  deposit_pct: number; // % đặt cọc khi chốt khoá (0 = đóng đủ)
  offer_days: number; // offer có hạn mấy ngày
};

export type CoachSettings = {
  payout: PayoutSettings;
};

export const DEFAULT_SETTINGS: CoachSettings = {
  payout: { bank_bin: "", bank_name: "", account_no: "", account_name: "", deposit_pct: 0, offer_days: 3 },
};

export function getSettings(raw: unknown): CoachSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CoachSettings>;
  return { ...r, payout: { ...DEFAULT_SETTINGS.payout, ...(r.payout ?? {}) } };
}
