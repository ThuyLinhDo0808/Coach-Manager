// Định dạng chữ đơn giản cho bài giới thiệu (soạn bằng thanh công cụ, lưu dạng chữ):
//   **đậm**  *nghiêng*  ## Tiêu đề  - gạch đầu dòng  1. đánh số  > trích dẫn  ![chú thích](https://ảnh)
// Đọc thành khối để hiển thị bằng React (không chèn HTML), nên không có mã lạ chạy trên trang.

export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block =
  | { type: "p"; lines: Inline[][] }
  | { type: "h"; content: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] }
  | { type: "quote"; lines: Inline[][] }
  | { type: "img"; url: string; caption: string };

const IMG = /^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/;

/** **đậm**, *nghiêng* hoặc _nghiêng_, lồng nhau một mức (***đậm nghiêng***). */
export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_)/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    if (m[2] != null) out.push({ text: m[2], bold: true, italic: true });
    else if (m[3] != null) out.push({ text: m[3], bold: true });
    else out.push({ text: (m[4] ?? m[5])!, italic: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out.filter((x) => x.text);
}

export function parseRich(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", lines: para.map(parseInline) });
    para = [];
  };
  const pushItem = (type: "ul" | "ol" | "quote", text: string) => {
    const prev = blocks[blocks.length - 1];
    if (type === "quote") {
      if (prev?.type === "quote") prev.lines.push(parseInline(text));
      else blocks.push({ type: "quote", lines: [parseInline(text)] });
    } else if (prev?.type === type) prev.items.push(parseInline(text));
    else blocks.push({ type, items: [parseInline(text)] });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const img = line.match(IMG);
    if (img) {
      flush();
      blocks.push({ type: "img", url: img[2], caption: img[1].trim() });
    } else if (/^#{1,3}\s+/.test(line)) {
      flush();
      blocks.push({ type: "h", content: parseInline(line.replace(/^#{1,3}\s+/, "")) });
    } else if (/^[-*•]\s+/.test(line)) {
      flush();
      pushItem("ul", line.replace(/^[-*•]\s+/, ""));
    } else if (/^\d+[.)]\s+/.test(line)) {
      flush();
      pushItem("ol", line.replace(/^\d+[.)]\s+/, ""));
    } else if (/^>\s?/.test(line)) {
      flush();
      pushItem("quote", line.replace(/^>\s?/, ""));
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** Bỏ định dạng, lấy chữ thuần (cho mô tả ngắn, đếm ký tự hiển thị). */
export function plainText(src: string): string {
  return parseRich(src)
    .map((b) =>
      b.type === "img" ? b.caption : b.type === "h" ? b.content.map((x) => x.text).join("") : (b.type === "p" || b.type === "quote" ? b.lines : b.items).map((l) => l.map((x) => x.text).join("")).join(" "),
    )
    .filter(Boolean)
    .join("\n");
}
