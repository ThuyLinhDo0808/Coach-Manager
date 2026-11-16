import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATES, fillTemplate, mergeTemplates, sampleValues, TEMPLATE_VARS, templateVars } from "./message-templates";

describe("mẫu mặc định", () => {
  it("có đủ 5 mẫu, key không trùng và hợp với ràng buộc database", () => {
    expect(DEFAULT_TEMPLATES.map((t) => t.key)).toEqual(["sinh-nhat", "nhac-lich", "nhac-gia-han", "chao-nhu-cau", "cam-on"]);
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.key).toMatch(/^[a-z0-9-]{2,40}$/);
      expect(t.body.length).toBeLessThanOrEqual(2000);
    }
  });

  it("chỉ dùng biến có trong danh sách chèn", () => {
    const known = TEMPLATE_VARS.map((v) => v.name);
    for (const t of DEFAULT_TEMPLATES) for (const name of templateVars(t.body)) expect(known).toContain(name);
  });
});

describe("templateVars", () => {
  it("liệt kê biến theo thứ tự, không lặp", () => {
    expect(templateVars("Chào {tên gọi}, mã {mã ưu đãi}. Hẹn {tên gọi}!")).toEqual(["tên gọi", "mã ưu đãi"]);
  });
  it("bỏ qua ngoặc rỗng hoặc xuống dòng", () => {
    expect(templateVars("{} {\n} { tên gọi }")).toEqual(["tên gọi"]);
  });
});

describe("fillTemplate", () => {
  it("thay biến bằng giá trị", () => {
    expect(fillTemplate("Chào {tên gọi}, còn {buổi còn lại} buổi.", { "tên gọi": "Hà", "buổi còn lại": "2" })).toBe("Chào Hà, còn 2 buổi.");
  });
  it("biến chưa có giá trị thì giữ nguyên để coach thấy", () => {
    expect(fillTemplate("Mã {mã ưu đãi}, hạn {hạn}", { "mã ưu đãi": "  " })).toBe("Mã {mã ưu đãi}, hạn {hạn}");
  });
  it("điền được mọi mẫu mặc định bằng giá trị ví dụ", () => {
    const values = sampleValues("Coach Trung Muối");
    for (const t of DEFAULT_TEMPLATES) expect(fillTemplate(t.body, values)).not.toMatch(/[{}]/);
    expect(fillTemplate("{tên coach}", values)).toBe("Coach Trung Muối");
  });
});

describe("mergeTemplates", () => {
  it("chưa lưu gì thì trả 5 mẫu mặc định, đang bật", () => {
    const list = mergeTemplates([]);
    expect(list).toHaveLength(5);
    expect(list.every((t) => t.enabled && !t.edited)).toBe(true);
  });
  it("lấy bản đã lưu theo key, bỏ dòng lạ", () => {
    const list = mergeTemplates([
      { key: "nhac-lich", title: "Nhắc lịch (mới)", body: "Mai học nhé {tên gọi}", enabled: false },
      { key: "la", title: "x", body: "y", enabled: true },
    ]);
    expect(list).toHaveLength(5);
    expect(list[1]).toMatchObject({ key: "nhac-lich", title: "Nhắc lịch (mới)", body: "Mai học nhé {tên gọi}", enabled: false, edited: true });
    expect(list[0]!.edited).toBe(false);
  });
});
