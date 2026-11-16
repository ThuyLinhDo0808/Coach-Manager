import { describe, expect, it } from "vitest";
import { estimateReadMinutes, parseYoutubeId } from "./content";

describe("parseYoutubeId", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://www.youtube.com/watch?feature=share&v=${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abcDEF123`,
    `https://www.youtube.com/shorts/${id}`,
    `https://youtube.com/shorts/${id}?feature=share`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    `https://www.youtube.com/live/${id}`,
    `youtu.be/${id}`,
    `www.youtube.com/watch?v=${id}`,
    `  ${id}  `,
  ])("nhận %s", (link) => {
    expect(parseYoutubeId(link)).toBe(id);
  });

  it.each([
    "",
    "   ",
    "khong phai link",
    "https://vimeo.com/123456789",
    "https://www.youtube.com/watch?v=ngan",
    "https://www.youtube.com/@coachtrungmuoi",
    "https://www.youtube.com/playlist?list=PL1234567890",
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/",
  ])("từ chối %s", (link) => {
    expect(parseYoutubeId(link)).toBeNull();
  });

  it("nhận null / undefined", () => {
    expect(parseYoutubeId(null)).toBeNull();
    expect(parseYoutubeId(undefined)).toBeNull();
  });
});

describe("estimateReadMinutes", () => {
  it("ít nhất 1 phút", () => {
    expect(estimateReadMinutes("")).toBe(1);
    expect(estimateReadMinutes("Vài chữ thôi")).toBe(1);
  });
  it("khoảng 200 chữ một phút", () => {
    const words = (n: number) => Array.from({ length: n }, () => "bóng").join(" ");
    expect(estimateReadMinutes(words(400))).toBe(2);
    expect(estimateReadMinutes(words(1000))).toBe(5);
    expect(estimateReadMinutes(words(290))).toBe(1);
    expect(estimateReadMinutes(words(310))).toBe(2);
  });
  it("không đếm ký hiệu markdown", () => {
    expect(estimateReadMinutes("## \n- \n- \n**")).toBe(1);
  });
});
