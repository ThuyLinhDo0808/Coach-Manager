import { initials } from "@/lib/format";

export function Avatar({ name, url, size = 96 }: { name: string; url: string | null; size?: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-navy font-bold text-lime"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
