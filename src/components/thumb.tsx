import { Icon } from "@/components/icon";

/** Ảnh bìa: ảnh thật nếu có, không thì hình sân pickleball cách điệu. */
export function Thumb({
  src,
  alt = "",
  play,
  duration,
  className,
  style,
  children,
}: {
  src?: string | null;
  alt?: string;
  play?: boolean;
  duration?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={`thumb ${className ?? ""}`} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="court" />
      )}
      {play && (
        <div className="play">
          <Icon name="play" />
        </div>
      )}
      {duration && <div className="dur">{duration}</div>}
      {children}
    </div>
  );
}

export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
