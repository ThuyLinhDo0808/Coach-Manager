import { describe, expect, it } from "vitest";
import { parseInline, parseRich, plainText } from "./rich-text";

describe("định dạng bài giới thiệu", () => {
  it("in đậm, in nghiêng", () => {
    expect(parseInline("Mình là **Trung**, *coach* pickleball")).toEqual([
      { text: "Mình là " },
      { text: "Trung", bold: true },
      { text: ", " },
      { text: "coach", italic: true },
      { text: " pickleball" },
    ]);
    expect(parseInline("***cả hai***")).toEqual([{ text: "cả hai", bold: true, italic: true }]);
  });
  it("đoạn, tiêu đề, danh sách, ảnh", () => {
    const b = parseRich("Đoạn một\ndòng hai\n\n## Mục tiêu\n- Kỹ thuật\n- Bộ chân\n1. Một\n2. Hai\n![Lớp sáng](https://x.supabase.co/a.webp)\n> Trích dẫn");
    expect(b.map((x) => x.type)).toEqual(["p", "h", "ul", "ol", "img", "quote"]);
    expect(b[0]).toMatchObject({ type: "p", lines: [[{ text: "Đoạn một" }], [{ text: "dòng hai" }]] });
    expect(b[2]).toMatchObject({ type: "ul", items: [[{ text: "Kỹ thuật" }], [{ text: "Bộ chân" }]] });
    expect(b[4]).toEqual({ type: "img", url: "https://x.supabase.co/a.webp", caption: "Lớp sáng" });
  });
  it("chỉ nhận ảnh https, không nhận javascript:", () => {
    expect(parseRich("![x](javascript:alert(1))")[0].type).toBe("p");
    expect(parseRich("![x](http://a.com/b.png)")[0].type).toBe("p");
  });
  it("chữ cũ không định dạng vẫn hiện như đoạn văn", () => {
    expect(parseRich("Mình là Trung.\n\nPhương châm của mình.").length).toBe(2);
  });
  it("lấy chữ thuần", () => {
    expect(plainText("## Chào\n**Đậm** và *nghiêng*\n- a")).toBe("Chào\nĐậm và nghiêng\na");
  });
});
