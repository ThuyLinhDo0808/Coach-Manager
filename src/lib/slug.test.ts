import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("bỏ dấu tiếng Việt và chữ đ", () => {
    expect(slugify("Khoá Cơ bản cho người mới")).toBe("khoa-co-ban-cho-nguoi-moi");
    expect(slugify("Đánh đôi: ai lấy bóng giữa?")).toBe("danh-doi-ai-lay-bong-giua");
    expect(slugify("Lớp Kid 6–9 tuổi")).toBe("lop-kid-6-9-tuoi");
  });
  it("nhận cả chữ gõ kiểu tổ hợp (NFD)", () => {
    expect(slugify("Kỹ thuật".normalize("NFD"))).toBe("ky-thuat");
  });
  it("gộp ký tự lạ, bỏ gạch ở hai đầu", () => {
    expect(slugify("  --Third shot drop!!! (4 lỗi)  ")).toBe("third-shot-drop-4-loi");
    expect(slugify("???")).toBe("");
  });
  it("cắt theo độ dài tối đa, không đứt giữa từ và không kết thúc bằng gạch", () => {
    const s = slugify("Chọn vợt đầu tiên dưới hai triệu đồng cho người mới", 30);
    expect(s).toBe("chon-vot-dau-tien-duoi-hai");
    expect(s.length).toBeLessThanOrEqual(30);
    expect(slugify("abcdefghijklmnopqrstuvwxyz", 10)).toBe("abcdefghij");
  });
  it("khớp ràng buộc slug trong database", () => {
    expect(slugify("Nâng cao: chiến thuật đôi")).toMatch(/^[a-z0-9-]{2,80}$/);
  });
});

describe("uniqueSlug", () => {
  it("giữ nguyên khi chưa ai dùng", () => {
    expect(uniqueSlug("Khoá Sửa lỗi", ["khoa-co-ban"])).toBe("khoa-sua-loi");
  });
  it("thêm số khi trùng", () => {
    expect(uniqueSlug("Khoá Sửa lỗi", ["khoa-sua-loi"])).toBe("khoa-sua-loi-2");
    expect(uniqueSlug("Khoá Sửa lỗi", ["khoa-sua-loi", "khoa-sua-loi-2"])).toBe("khoa-sua-loi-3");
  });
  it("vẫn trong giới hạn độ dài khi thêm số", () => {
    expect(uniqueSlug("abcdefghij", ["abcdefghij"], 10)).toBe("abcdefgh-2");
  });
  it("tiêu đề không có chữ nào thì dùng tên dự phòng", () => {
    expect(uniqueSlug("???", [], 40, "nhom")).toBe("nhom");
    expect(uniqueSlug("!", ["nhom"], 40, "nhom")).toBe("nhom-2");
  });
});
