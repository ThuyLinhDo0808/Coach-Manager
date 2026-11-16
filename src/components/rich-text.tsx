import type { ReactNode } from "react";

// Markdown đơn giản cho bài viết: "## tiêu đề", "- gạch đầu dòng", **đậm**, đoạn văn.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={`grid gap-3 text-[15px] leading-relaxed ${className ?? ""}`}>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i} className="mt-2 text-lg font-bold">{inline(b.slice(3))}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="grid list-disc gap-1.5 pl-5 text-ink/85">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^[-•]\s+/, ""))}</li>)}
            </ul>
          );
        }
        return <p key={i} className="text-ink/85">{inline(lines.join(" "))}</p>;
      })}
    </div>
  );
}
