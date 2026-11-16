import { describe, expect, it } from "vitest";
import { generateSessions, overlaps, sessionsLeft, skillProgress } from "./teaching";
import { addDays, daysToBirthday, dayLabel, vnDate, vnIso, vnTime, weekdayOf, weekStart } from "./time";

describe("giờ Việt Nam", () => {
  it("đổi UTC sang giờ VN", () => {
    expect(vnDate("2026-11-16T18:30:00Z")).toBe("2026-11-17");
    expect(vnTime("2026-11-17T12:00:00Z")).toBe("19:00");
    expect(vnTime(vnIso("2026-11-17", "19:00"))).toBe("19:00");
  });
  it("thứ và tuần", () => {
    expect(weekdayOf("2026-11-17")).toBe(2);
    expect(weekdayOf("2026-11-22")).toBe(7);
    expect(weekStart("2026-11-22")).toBe("2026-11-16");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(dayLabel("2026-11-17")).toBe("Thứ 3, 17/11");
  });
  it("sinh nhật", () => {
    expect(daysToBirthday("1990-11-19", "2026-11-16")).toBe(3);
    expect(daysToBirthday("1990-11-16", "2026-11-16")).toBe(0);
    expect(daysToBirthday("1990-01-02", "2026-12-30")).toBe(3);
  });
});

describe("tạo lịch lớp", () => {
  it("T3, T5 8 buổi", () => {
    const s = generateSessions({ startDate: "2026-11-16", weekdays: [2, 4], time: "18:00", minutes: 90, count: 8 });
    expect(s).toHaveLength(8);
    expect(vnDate(s[0].starts_at)).toBe("2026-11-17");
    expect(vnDate(s[1].starts_at)).toBe("2026-11-19");
    expect(vnTime(s[0].ends_at)).toBe("19:30");
    expect(s[7].seq).toBe(8);
    expect(vnDate(s[7].starts_at)).toBe("2026-12-10");
  });
  it("không chọn thứ thì không tạo", () => {
    expect(generateSessions({ startDate: "2026-11-16", weekdays: [], time: "18:00", minutes: 90, count: 8 })).toEqual([]);
  });
  it("trùng giờ", () => {
    const a = { starts_at: vnIso("2026-11-17", "18:00"), ends_at: vnIso("2026-11-17", "19:30") };
    expect(overlaps(a, { starts_at: vnIso("2026-11-17", "19:00"), ends_at: vnIso("2026-11-17", "20:00") })).toBe(true);
    expect(overlaps(a, { starts_at: vnIso("2026-11-17", "19:30"), ends_at: vnIso("2026-11-17", "20:30") })).toBe(false);
  });
});

describe("học viên", () => {
  it("tiến bộ kỹ năng", () => {
    const p = skillProgress([{ scores: { dink: 2 } }, { scores: { dink: 3, volley: 1 } }, { scores: { dink: 4 } }]);
    expect(p).toEqual([
      { key: "dink", label: "Dink", first: 2, last: 4 },
      { key: "volley", label: "Volley", first: 1, last: 1 },
    ]);
  });
  it("buổi còn lại: báo nghỉ không bị trừ", () => {
    expect(sessionsLeft(8, [{ status: "co-mat" }, { status: "vang" }, { status: "bao-nghi" }])).toBe(6);
    expect(sessionsLeft(null, [])).toBeNull();
  });
});
