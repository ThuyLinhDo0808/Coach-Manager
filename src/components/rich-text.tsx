import { parseRich, type Inline } from "@/lib/rich-text";

function Line({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        let node: React.ReactNode = p.text;
        if (p.italic) node = <em>{node}</em>;
        if (p.bold) node = <strong>{node}</strong>;
        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

const Lines = ({ lines }: { lines: Inline[][] }) =>
  lines.map((l, i) => (
    <span key={i}>
      {i > 0 && <br />}
      <Line parts={l} />
    </span>
  ));

/** Hiển thị bài giới thiệu đã định dạng; đoạn văn canh đều hai bên. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`rich ${className ?? ""}`}>
      {parseRich(text).map((b, i) => {
        switch (b.type) {
          case "h":
            return <h3 key={i}><Line parts={b.content} /></h3>;
          case "ul":
            return <ul key={i}>{b.items.map((it, j) => <li key={j}><Line parts={it} /></li>)}</ul>;
          case "ol":
            return <ol key={i}>{b.items.map((it, j) => <li key={j}><Line parts={it} /></li>)}</ol>;
          case "quote":
            return <blockquote key={i}><Lines lines={b.lines} /></blockquote>;
          case "img":
            return (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.url} alt={b.caption || "Ảnh"} loading="lazy" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          default:
            return <p key={i}><Lines lines={b.lines} /></p>;
        }
      })}
    </div>
  );
}
