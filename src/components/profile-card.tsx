import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { contactLinks, zaloHref } from "@/components/contact-links";
import { IconChat, IconPin, IconStar } from "@/components/icons";
import { ageFromBirthYear } from "@/lib/format";
import type { Coach } from "@/lib/types";

function Meta({ coach }: { coach: Coach }) {
  const age = coach.show_age ? ageFromBirthYear(coach.birth_year) : null;
  const parts = [age ? `${age} tuổi` : null, coach.dupr ? `DUPR ${coach.dupr.toFixed(2)}` : null].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      {coach.area && (
        <span className="inline-flex items-center gap-1">
          <IconPin className="size-4" />
          {coach.area}
        </span>
      )}
      {parts.map((p) => (
        <span key={p}>{p}</span>
      ))}
      {coach.stat_rating != null && (
        <span className="inline-flex items-center gap-1 font-semibold text-ink">
          <IconStar className="size-4 text-amber-400" />
          {coach.stat_rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

/** Thẻ hồ sơ dính cột trái (1440px). */
export function ProfileCard({ coach }: { coach: Coach }) {
  const zalo = zaloHref(coach.contacts);
  const links = contactLinks(coach.contacts).filter((l) => l.key !== "zalo");
  return (
    <aside className="card sticky top-6 flex flex-col items-center gap-4 text-center">
      <Avatar name={coach.display_name} url={coach.avatar_url} size={112} />
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{coach.display_name}</h1>
        {coach.tagline && <p className="text-[15px] text-muted">{coach.tagline}</p>}
      </div>
      <Meta coach={coach} />
      {coach.accepting_students && (
        <span className="rounded-full bg-lime-soft px-3 py-1 text-xs font-semibold text-navy">Đang nhận học viên</span>
      )}
      <div className="flex w-full flex-col gap-2 pt-1">
        <Link href="/dang-ky" className="btn-primary w-full">
          Đăng ký học thử
        </Link>
        {zalo && (
          <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full">
            <IconChat />
            Nhắn Zalo
          </a>
        )}
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-medium">
          {links.map((l) => (
            <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </aside>
  );
}

/** Hồ sơ thu gọn trên đầu (390px). */
export function ProfileCompact({ coach }: { coach: Coach }) {
  return (
    <section className="card flex items-center gap-4 p-4">
      <Avatar name={coach.display_name} url={coach.avatar_url} size={64} />
      <div className="min-w-0 space-y-1">
        <h1 className="text-lg leading-tight font-bold">{coach.display_name}</h1>
        <Meta coach={coach} />
      </div>
    </section>
  );
}
