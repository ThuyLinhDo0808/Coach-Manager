import { initials } from "@/lib/format";

export function Avatar({ name, url, size = 36, soft, style }: { name: string; url?: string | null; size?: number; soft?: boolean; style?: React.CSSProperties }) {
  const box = { width: size, height: size, fontSize: Math.round(size * 0.36), ...style };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="avatar" style={box} />;
  }
  return (
    <span aria-hidden className={soft ? "avatar soft" : "avatar"} style={box}>
      {initials(name)}
    </span>
  );
}
