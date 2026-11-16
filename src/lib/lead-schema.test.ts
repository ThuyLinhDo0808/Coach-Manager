import { describe, expect, it } from "vitest";
import { fieldErrors, leadSchema } from "./lead-schema";

const ok = { full_name: "Nguyễn Văn A", gender: "nam", birth_year: "1992", phone: "+84 912 345 678" };

describe("leadSchema", () => {
  it("chuẩn hoá SĐT và đặt mặc định", () => {
    const r = leadSchema.parse(ok);
    expect(r.phone).toBe("0912345678");
    expect(r.birth_year).toBe(1992);
    expect(r.sports).toEqual([]);
    expect(r.for_whom).toBe("ban-than");
  });
  it("báo lỗi theo trường", () => {
    const r = leadSchema.safeParse({ ...ok, full_name: "A", phone: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["full_name", "phone"]);
  });
});
