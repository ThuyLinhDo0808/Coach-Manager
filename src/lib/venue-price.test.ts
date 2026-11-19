import { describe, expect, it } from "vitest";
import { courtCost, dayGroupOf, priceSummary, readRules, ruleError, type PriceRule } from "./venue-price";

// Bảng giá mẫu như Sân BCTT.
const rules: PriceRule[] = [
  { days: "t2-t6", from: "05:00", to: "12:00", price: 150000 },
  { days: "t2-t6", from: "12:00", to: "16:00", price: 250000 },
  { days: "t2-t6", from: "16:00", to: "22:00", price: 350000 },
  { days: "t7-cn", from: "05:00", to: "12:00", price: 170000 },
];

describe("giá sân theo khung giờ", () => {
  it("nhóm ngày", () => {
    expect(dayGroupOf("2026-11-16")).toBe("t2-t6"); // thứ 2
    expect(dayGroupOf("2026-11-21")).toBe("t7-cn"); // thứ 7
    expect(dayGroupOf("2026-11-22")).toBe("t7-cn"); // chủ nhật
  });
  it("buổi nằm gọn một khung", () => {
    expect(courtCost(rules, "2026-11-16", "06:00", "07:30")).toBe(225000);
    expect(courtCost(rules, "2026-11-21", "07:00", "09:00")).toBe(340000);
  });
  it("buổi vắt qua hai khung", () => {
    // 15:00–17:00: 1 giờ × 250.000 + 1 giờ × 350.000
    expect(courtCost(rules, "2026-11-17", "15:00", "17:00")).toBe(600000);
  });
  it("không có giá cho nhóm ngày thì trả null", () => {
    expect(courtCost(rules.filter((r) => r.days === "t2-t6"), "2026-11-22", "07:00", "08:00")).toBeNull();
  });
  it("kiểm tra dòng mới", () => {
    expect(ruleError({ days: "t2-t6", from: "11:00", to: "13:00", price: 1 }, rules)).toContain("Trùng");
    expect(ruleError({ days: "t7-cn", from: "12:00", to: "16:00", price: 250000 }, rules)).toBeNull();
    expect(ruleError({ days: "t7-cn", from: "16:00", to: "12:00", price: 250000 }, rules)).toContain("sau giờ bắt đầu");
  });
  it("đọc dữ liệu lưu và tóm tắt", () => {
    expect(readRules([{ days: "t7-cn", from: "05:00", to: "12:00", price: 170000 }, { days: "x" }, null])).toHaveLength(1);
    expect(priceSummary(rules)).toBe("150k–350k / giờ");
  });
});
