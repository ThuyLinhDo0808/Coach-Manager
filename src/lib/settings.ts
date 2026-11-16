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

/** Cách thu tiền (trang Cài đặt → Nhận tiền). Chuyển khoản luôn bật khi đã có tài khoản. */
export type CollectSettings = {
  accept_cash: boolean; // nhận tiền mặt tại sân
  require_proof: boolean; // học viên phải gửi ảnh chuyển khoản
};

export type DeductMode = "co-mat-hoac-khong-bao" | "chi-co-mat" | "moi-buoi";
export type TrialMode = "co-phi" | "mien-phi" | "khong-nhan";

/** Quy định lớp, áp dụng cho mọi lớp. */
export type RulesSettings = {
  notice_hours: number; // hạn báo nghỉ trước giờ học
  deduct_mode: DeductMode; // khi nào trừ một buổi trong gói
  makeup_max: number; // số buổi bù tối đa / khoá (0 = không học bù)
  makeup_days: number; // hạn học bù: trong bao nhiêu ngày sau khoá
  refund_after_sessions: number; // không hài lòng sau mấy buổi (0 = không hoàn phí)
  refund_pct: number; // hoàn bao nhiêu % học phí còn lại
  rain_makeup: boolean; // huỷ do mưa / sân đóng thì dời sang cùng giờ tuần sau
  trial_mode: TrialMode;
  trial_fee: number; // đồng
  trial_deduct: boolean; // trừ phí học thử khi đăng ký khoá
  signup_cutoff_hours: number; // chốt đăng ký trước giờ học
};

export const NOTIFY_CHANNELS = [
  { key: "bell", label: "Chuông" },
  { key: "email", label: "Email" },
  { key: "zalo", label: "Zalo" },
] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number]["key"];
type ChannelFlags = Record<NotifyChannel, boolean>;
const ch = (bell: boolean, email: boolean, zalo: boolean): ChannelFlags => ({ bell, email, zalo });

export const NOTIFY_EVENTS = [
  { key: "lead_new", label: "Nhu cầu mới từ form", def: ch(true, true, true) },
  { key: "lead_overdue", label: "Nhu cầu quá 24 giờ chưa gọi", def: ch(true, false, true) },
  { key: "payment_proof", label: "Học viên gửi ảnh chuyển khoản", def: ch(true, true, false) },
  { key: "absence", label: "Học viên báo nghỉ", def: ch(true, false, false) },
  { key: "attendance_missing", label: "Buổi đã qua chưa điểm danh", def: ch(true, false, false) },
  { key: "review_new", label: "Đánh giá mới", def: ch(true, true, false) },
  { key: "birthday", label: "Sinh nhật học viên (trước 3 ngày)", def: ch(true, false, true) },
  { key: "package_low", label: "Gói học viên sắp hết", def: ch(true, false, false) },
] as const;
export type NotifyEventKey = (typeof NOTIFY_EVENTS)[number]["key"];

export type NotifySettings = {
  events: Record<NotifyEventKey, ChannelFlags>;
  quiet: { on: boolean; from: string; to: string }; // "22:00" → "07:00"
  digest: { on: boolean; at: string };
};

export const PERMISSIONS = [
  { key: "leads", label: "Xem và xử lý nhu cầu", sale: true, tro: false },
  { key: "offers", label: "Gửi offer, link thanh toán", sale: true, tro: false },
  { key: "schedule", label: "Xem lịch dạy", sale: true, tro: true },
  { key: "attendance", label: "Điểm danh, nhận xét", sale: false, tro: true },
  { key: "phones", label: "Xem số điện thoại học viên", sale: true, tro: false },
  { key: "ledger", label: "Xem sổ thu chi tổng", sale: false, tro: false },
  { key: "content", label: "Đăng video, bài viết", sale: false, tro: false },
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
/** Quyền theo vai trò. Coach (owner) luôn có mọi quyền nên không nằm trong bảng. */
export type PermissionsSettings = Record<PermissionKey, { sale: boolean; "tro-giang": boolean }>;

export type LeadAssignSettings = {
  mode: "xoay-vong" | "coach-giao";
  alert_24h: boolean; // báo khi nhu cầu quá 24 giờ chưa gọi
};

export type CoachSettings = {
  payout: PayoutSettings;
  collect: CollectSettings;
  rules: RulesSettings;
  notify: NotifySettings;
  permissions: PermissionsSettings;
  lead_assign: LeadAssignSettings;
  custom_domain: string;
};

export const DEFAULT_SETTINGS: CoachSettings = {
  payout: { bank_bin: "", bank_name: "", account_no: "", account_name: "", deposit_pct: 0, offer_days: 3 },
  collect: { accept_cash: true, require_proof: true },
  rules: {
    notice_hours: 12,
    deduct_mode: "co-mat-hoac-khong-bao",
    makeup_max: 2,
    makeup_days: 30,
    refund_after_sessions: 2,
    refund_pct: 70,
    rain_makeup: true,
    trial_mode: "co-phi",
    trial_fee: 200000,
    trial_deduct: true,
    signup_cutoff_hours: 24,
  },
  notify: {
    events: Object.fromEntries(NOTIFY_EVENTS.map((e) => [e.key, { ...e.def }])) as Record<NotifyEventKey, ChannelFlags>,
    quiet: { on: true, from: "22:00", to: "07:00" },
    digest: { on: true, at: "07:00" },
  },
  permissions: Object.fromEntries(PERMISSIONS.map((p) => [p.key, { sale: p.sale, "tro-giang": p.tro }])) as PermissionsSettings,
  lead_assign: { mode: "coach-giao", alert_24h: true },
  custom_domain: "",
};

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Gộp từng khoá của một nhóm 2 tầng (events, permissions) với mặc định; bỏ qua khoá lạ. */
function mergeEach<T extends Record<string, object>>(defaults: T, raw: unknown): T {
  const r = obj(raw);
  return Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, { ...d, ...obj(r[k]) }])) as T;
}

export function getSettings(raw: unknown): CoachSettings {
  const r = obj(raw) as Partial<CoachSettings>;
  const notify = obj(r.notify) as Partial<NotifySettings>;
  return {
    ...r,
    payout: { ...DEFAULT_SETTINGS.payout, ...(r.payout ?? {}) },
    collect: { ...DEFAULT_SETTINGS.collect, ...obj(r.collect) },
    rules: { ...DEFAULT_SETTINGS.rules, ...obj(r.rules) },
    notify: {
      events: mergeEach(DEFAULT_SETTINGS.notify.events, notify.events),
      quiet: { ...DEFAULT_SETTINGS.notify.quiet, ...obj(notify.quiet) },
      digest: { ...DEFAULT_SETTINGS.notify.digest, ...obj(notify.digest) },
    },
    permissions: mergeEach(DEFAULT_SETTINGS.permissions, r.permissions),
    lead_assign: { ...DEFAULT_SETTINGS.lead_assign, ...obj(r.lead_assign) },
    custom_domain: typeof r.custom_domain === "string" ? r.custom_domain : "",
  };
}

const dong = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)} đ`;

/** Quy định viết bằng lời, đúng như học viên sẽ đọc. */
export function rulesText(r: RulesSettings): string[] {
  const out: string[] = [];
  const makeup = r.makeup_max > 0;
  if (r.deduct_mode === "co-mat-hoac-khong-bao") {
    out.push(`Báo nghỉ trước ${r.notice_hours} giờ: không mất buổi${makeup ? ", được học bù" : ""}.`);
    out.push("Báo trễ hoặc vắng không báo: tính 1 buổi.");
  } else if (r.deduct_mode === "chi-co-mat") {
    out.push("Chỉ tính buổi khi bạn có mặt; nghỉ không bị trừ buổi.");
    out.push(`Nếu nghỉ, bạn báo trước ${r.notice_hours} giờ để coach sắp xếp lớp.`);
  } else {
    out.push("Mọi buổi đã xếp lịch đều tính vào gói, kể cả khi bạn báo nghỉ.");
    if (makeup) out.push(`Báo nghỉ trước ${r.notice_hours} giờ để được xếp học bù.`);
  }
  out.push(makeup ? `Học bù tối đa ${r.makeup_max} buổi, trong ${r.makeup_days} ngày sau khoá.` : "Lớp không có buổi học bù.");
  if (r.refund_after_sessions > 0 && r.refund_pct > 0) {
    out.push(`Sau ${r.refund_after_sessions} buổi không hài lòng: hoàn ${r.refund_pct}% học phí còn lại.`);
  } else {
    out.push("Học phí đã đóng không hoàn lại.");
  }
  out.push(r.rain_makeup ? "Trời mưa / sân đóng: dời sang cùng giờ tuần sau, không mất buổi." : "Trời mưa / sân đóng: coach báo lịch bù riêng cho từng lớp.");
  if (r.trial_mode === "khong-nhan") out.push("Hiện chưa nhận học thử.");
  else if (r.trial_mode === "mien-phi" || r.trial_fee <= 0) out.push("Học thử miễn phí 1 buổi.");
  else out.push(`Học thử ${dong(r.trial_fee)}${r.trial_deduct ? ", trừ vào học phí nếu đăng ký khoá" : ""}.`);
  if (r.signup_cutoff_hours > 0) out.push(`Đăng ký trước giờ học ít nhất ${r.signup_cutoff_hours} giờ.`);
  return out;
}
