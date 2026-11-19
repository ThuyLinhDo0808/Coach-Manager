import { describe, expect, it } from "vitest";
import { monthReport, sumReports, type SummaryRow } from "./report";

// Ví dụ: một buổi 4 học viên gói 3.000.000 / 10 buổi = 1.200.000 đem chia; chi quảng cáo 25.000 từ quỹ dự phòng.
const rows: SummaryRow[] = [
  { month: "2026-10", kind: "doanh-thu", amount: 1200000 },
  { month: "2026-10", kind: "coach", amount: 600000 },
  { month: "2026-10", kind: "sale", amount: 120000 },
  { month: "2026-10", kind: "quy-du-phong", amount: 60000 },
  { month: "2026-10", kind: "quy-van-hanh", amount: 120000 },
  { month: "2026-10", kind: "quy-phat-trien", amount: 60000 },
  { month: "2026-10", kind: "co-dong", amount: 240000 },
  { month: "2026-10", kind: "chi-quy-du-phong", amount: 25000 },
  { month: "2026-10", kind: "chi-loai-quang-cao", amount: 25000 },
  { month: "2026-10", kind: "tro-giang", amount: 100000 },
  { month: "2026-10", kind: "tro-giang-hv-tra", amount: 80000 },
];

describe("báo cáo lãi / lỗ", () => {
  it("tính theo ví dụ", () => {
    const r = monthReport(rows, "2026-10");
    expect(r.revenue).toBe(1200000);
    expect(r.kept).toBe(480000); // 20% quỹ + 20% cổ đông
    expect(r.revenue - r.coach - r.sale).toBe(r.kept);
    expect(r.fundsIn - r.fundsOut).toBe(215000);
    // 240.000 cổ đông + 240.000 quỹ − 25.000 quảng cáo − 20.000 trợ giảng học viên trả thiếu
    expect(r.profit).toBe(435000);
    expect(r.adSpend).toBe(25000);
  });
  it("tháng không có số", () => {
    expect(monthReport(rows, "2026-11").profit).toBe(0);
  });
  it("cộng nhiều tháng", () => {
    const s = sumReports([monthReport(rows, "2026-10"), monthReport(rows, "2026-10")]);
    expect(s.revenue).toBe(2400000);
  });
});
