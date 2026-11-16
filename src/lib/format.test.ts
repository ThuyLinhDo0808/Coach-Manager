import { describe, expect, it } from "vitest";
import { ageFromBirthYear, formatVnd, initials, normalizePhone } from "./format";

describe("formatVnd", () => {
  it("định dạng tiền Việt", () => {
    expect(formatVnd(2400000)).toBe("2.400.000đ");
    expect(formatVnd(null)).toBeNull();
  });
});

describe("ageFromBirthYear", () => {
  it("tính tuổi theo năm", () => {
    expect(ageFromBirthYear(1995, new Date("2026-11-16"))).toBe(31);
    expect(ageFromBirthYear(null)).toBeNull();
  });
});

describe("initials", () => {
  it("bỏ chữ Coach", () => {
    expect(initials("Coach Trung Muối")).toBe("TM");
  });
});

describe("normalizePhone", () => {
  it("chấp nhận số 10 chữ số và +84", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
    expect(normalizePhone("+84912345678")).toBe("0912345678");
  });
  it("từ chối số sai", () => {
    expect(normalizePhone("12345")).toBeNull();
  });
});
