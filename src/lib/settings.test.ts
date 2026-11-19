import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, getSettings, NOTIFY_EVENTS, PERMISSIONS, rulesText } from "./settings";

describe("getSettings", () => {
  it("trả mặc định khi chưa lưu gì hoặc dữ liệu hỏng", () => {
    for (const raw of [null, undefined, "abc", 42, [], {}]) {
      expect(getSettings(raw)).toEqual(DEFAULT_SETTINGS);
    }
  });

  it("giữ nguyên các khoá payout cũ và điền phần thiếu", () => {
    const s = getSettings({ payout: { bank_bin: "970436", account_no: "0071000912345" } });
    expect(s.payout).toEqual({ bank_bin: "970436", bank_name: "", account_no: "0071000912345", account_name: "", deposit_pct: 0, offer_days: 3 });
  });

  it("gộp từng nhóm với mặc định", () => {
    const s = getSettings({ rules: { notice_hours: 24 }, lead_assign: { mode: "xoay-vong" }, collect: { accept_cash: false } });
    expect(s.rules.notice_hours).toBe(24);
    expect(s.rules.makeup_max).toBe(DEFAULT_SETTINGS.rules.makeup_max);
    expect(s.lead_assign).toEqual({ mode: "xoay-vong", alert_24h: true });
    expect(s.collect).toEqual({ accept_cash: false, require_proof: true });
  });

  it("gộp từng sự kiện thông báo và từng quyền, bỏ khoá lạ", () => {
    const s = getSettings({
      notify: { events: { lead_new: { email: false }, khong_co: { bell: true } }, quiet: { on: false } },
      permissions: { ledger: { sale: true }, la: { sale: true } },
    });
    expect(s.notify.events.lead_new).toEqual({ bell: true, email: false, zalo: true });
    expect(Object.keys(s.notify.events)).toEqual(NOTIFY_EVENTS.map((e) => e.key));
    expect(s.notify.quiet).toEqual({ on: false, from: "22:00", to: "07:00" });
    expect(s.notify.digest).toEqual(DEFAULT_SETTINGS.notify.digest);
    expect(s.permissions.ledger).toEqual({ sale: true, "tro-giang": false });
    expect(Object.keys(s.permissions)).toEqual(PERMISSIONS.map((p) => p.key));
  });

  it("giữ nhóm của đợt khác mà file này chưa biết", () => {
    const s = getSettings({ nhom_khac: { a: 1 } }) as unknown as Record<string, unknown>;
    expect(s.nhom_khac).toEqual({ a: 1 });
  });

  it("không sửa vào giá trị mặc định dùng chung", () => {
    const s = getSettings({});
    s.notify.events.lead_new.bell = false;
    s.permissions.leads.sale = false;
    expect(DEFAULT_SETTINGS.notify.events.lead_new.bell).toBe(true);
    expect(DEFAULT_SETTINGS.permissions.leads.sale).toBe(true);
  });
});

describe("rulesText", () => {
  const base = DEFAULT_SETTINGS.rules;

  it("viết quy định mặc định như bộ mẫu", () => {
    expect(rulesText(base)).toEqual([
      "Báo nghỉ trước 12 giờ: không mất buổi, được học bù.",
      "Báo trễ hoặc vắng không báo: tính 1 buổi.",
      "Học bù tối đa 2 buổi, trong 30 ngày sau khoá.",
      "Sau 2 buổi không hài lòng: hoàn 70% học phí còn lại.",
      "Trời mưa / sân đóng: dời sang cùng giờ tuần sau, không mất buổi.",
      "Học thử 200.000 đ, trừ vào học phí nếu đăng ký khoá.",
      "Đăng ký trước giờ học ít nhất 24 giờ.",
    ]);
  });

  it("đổi lời theo cách trừ buổi", () => {
    expect(rulesText({ ...base, deduct_mode: "chi-co-mat" })[0]).toBe("Chỉ tính buổi khi bạn có mặt; nghỉ không bị trừ buổi.");
    expect(rulesText({ ...base, deduct_mode: "moi-buoi", notice_hours: 6 }).slice(0, 2)).toEqual([
      "Mọi buổi đã xếp lịch đều tính vào gói, kể cả khi bạn báo nghỉ.",
      "Báo nghỉ trước 6 giờ để được xếp học bù.",
    ]);
  });

  it("không hứa học bù, hoàn phí khi coach tắt", () => {
    const t = rulesText({ ...base, makeup_max: 0, refund_pct: 0 });
    expect(t).toContain("Lớp không có buổi học bù.");
    expect(t).toContain("Học phí đã đóng không hoàn lại.");
    expect(t[0]).toBe("Báo nghỉ trước 12 giờ: không mất buổi.");
    expect(t.join(" ")).not.toContain("được học bù");
  });

  it("học thử: miễn phí, không nhận, có phí không trừ", () => {
    expect(rulesText({ ...base, trial_mode: "mien-phi" })).toContain("Học thử miễn phí 1 buổi.");
    expect(rulesText({ ...base, trial_mode: "khong-nhan" })).toContain("Hiện chưa nhận học thử.");
    expect(rulesText({ ...base, trial_deduct: false, trial_fee: 150000 })).toContain("Học thử 150.000 đ.");
  });

  it("bỏ dòng chốt đăng ký khi để 0 giờ", () => {
    expect(rulesText({ ...base, signup_cutoff_hours: 0 }).join(" ")).not.toContain("Đăng ký trước");
  });
});
