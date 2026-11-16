import { describe, expect, it } from "vitest";
import { avgDuprGain, countBy, funnel, lastMonths, monthlyTotals, pct, retention } from "./stats";

describe("thống kê", () => {
  it("phễu: bước sau tính cả bước trước", () => {
    const leads = [
      { id: "1", status: "moi" as const, contacted_at: null },
      { id: "2", status: "da-lien-he" as const, contacted_at: "x" },
      { id: "3", status: "hen-hoc-thu" as const, contacted_at: "x" },
      { id: "4", status: "da-chot" as const, contacted_at: "x" },
      { id: "5", status: "khong-thanh" as const, contacted_at: "x" },
    ];
    expect(funnel(leads, new Set(["5"])).map((f) => f.value)).toEqual([5, 4, 3, 1]);
  });
  it("tỷ lệ", () => {
    expect(pct(19, 46)).toBe(41);
    expect(pct(1, 0)).toBeNull();
  });
  it("chuỗi tháng và tổng theo tháng", () => {
    expect(lastMonths("2027-01", 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
    const t = monthlyTotals(
      [
        { entry_date: "2026-11-03", kind: "thu", amount: 5 },
        { entry_date: "2026-11-20", kind: "chi", amount: 2 },
        { entry_date: "2026-12-01", kind: "thu", amount: 7 },
      ],
      ["2026-11", "2026-12"],
    );
    expect(t).toEqual([{ month: "2026-11", thu: 5, chi: 2 }, { month: "2026-12", thu: 7, chi: 0 }]);
  });
  it("đếm theo nguồn", () => {
    expect(countBy(["fb", "zalo", "fb", null], (x) => x)).toEqual([{ key: "fb", count: 2 }, { key: "zalo", count: 1 }]);
  });
  it("học tiếp và DUPR", () => {
    expect(retention([{ student_id: "a", status: "tot-nghiep" }, { student_id: "a", status: "dang-hoc" }, { student_id: "b", status: "dang-hoc" }, { student_id: "c", status: "nghi" }])).toEqual({ again: 1, base: 2 });
    expect(avgDuprGain([{ final_dupr: 3.4, start: 2.8 }, { final_dupr: 3.0, start: 2.6 }, { final_dupr: null, start: 3 }])).toBe(0.5);
    expect(avgDuprGain([])).toBeNull();
  });
});
