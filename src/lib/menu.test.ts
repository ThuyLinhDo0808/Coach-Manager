import { describe, expect, it } from "vitest";
import { activeChild, menuFor, MENU } from "./menu";
import { permsFor } from "./permissions";

describe("menu", () => {
  it("mục con đang mở: trang chi tiết và tiền tố dài nhất", () => {
    expect(activeChild("/quan-ly")?.child.label).toBe("Hôm nay");
    expect(activeChild("/quan-ly/lich-day")?.child.label).toBe("Lịch trung tâm");
    expect(activeChild("/quan-ly/lich-day/gio-ranh")?.child.label).toBe("Lịch rảnh 1-1");
    expect(activeChild("/quan-ly/lich-day/123e4567-e89b-12d3-a456-426614174000")?.child.label).toBe("Điểm danh");
    expect(activeChild("/quan-ly/cai-dat/mau-khoa")?.group.key).toBe("lop");
    expect(activeChild("/quan-ly/noi-dung")?.child.label).toBe("Giáo án");
  });
  it("trợ giảng không thấy sổ tài chính, tuyển sinh, học viên; chỉ thấy tiền của mình", () => {
    const perms = permsFor(["tro-giang"]);
    const menu = menuFor((p) => perms.includes(p));
    const keys = menu.map((g) => g.key);
    expect(keys).toContain("lich");
    expect(menu.find((g) => g.key === "tai-chinh")?.children.map((c) => c.label)).toEqual(["Thu nhập của tôi"]);
    expect(keys).not.toContain("tuyen-sinh");
    expect(keys).not.toContain("hoc-vien");
  });
  it("nhiều vai trò: quyền là hợp các vai trò", () => {
    const perms = permsFor(["sale", "coach"]);
    expect(perms).toContain("tuyen-sinh");
    expect(perms).toContain("lich-cua-toi");
    expect(perms).not.toContain("tai-chinh");
  });
  it("coach chủ thấy mọi nhóm", () => {
    const perms = permsFor(["chu"]);
    expect(menuFor((p) => perms.includes(p)).length).toBe(MENU.length);
  });
});
