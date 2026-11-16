import { describe, expect, it } from "vitest";
import { ageText, closeRate, countByStatus, isOverdue } from "./leads";

const now = new Date("2026-11-16T12:00:00Z").getTime();

describe("nhu cầu", () => {
  it("quá 24 giờ chỉ tính ở cột Mới", () => {
    expect(isOverdue({ status: "moi", created_at: "2026-11-15T11:00:00Z" }, now)).toBe(true);
    expect(isOverdue({ status: "moi", created_at: "2026-11-16T07:00:00Z" }, now)).toBe(false);
    expect(isOverdue({ status: "da-lien-he", created_at: "2026-11-10T07:00:00Z" }, now)).toBe(false);
  });
  it("tuổi nhu cầu", () => {
    expect(ageText("2026-11-16T07:00:00Z", now)).toBe("5 giờ");
    expect(ageText("2026-11-14T07:00:00Z", now)).toBe("2 ngày");
  });
  it("đếm và tỷ lệ chốt", () => {
    const leads = [{ status: "moi" }, { status: "da-chot" }, { status: "da-chot" }, { status: "khong-thanh" }] as const;
    expect(countByStatus([...leads])["da-chot"]).toBe(2);
    expect(closeRate([...leads])).toBe(67);
    expect(closeRate([])).toBeNull();
  });
});
