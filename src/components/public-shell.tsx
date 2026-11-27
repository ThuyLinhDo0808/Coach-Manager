import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { zaloHref } from "@/components/contact-links";
import { Icon } from "@/components/icon";
import { PublicTabs, StickyCta } from "@/components/public-nav";
import { ACADEMY } from "@/lib/brand";
import { ageFromBirthYear, statText } from "@/lib/format";
import type { Coach } from "@/lib/types";

const GENDER = { nam: "Nam", nu: "Nữ", khac: null } as const;

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="logo">
      <b>TM</b>
      {name}
    </Link>
  );
}

export function PublicShell({
  coach,
  rating,
  children,
}: {
  coach: Coach;
  rating: { average: number; count: number } | null;
  children: React.ReactNode;
}) {
  const zalo = zaloHref(coach.contacts);
  const age = coach.show_age ? ageFromBirthYear(coach.birth_year) : null;
  const meta = [coach.gender ? GENDER[coach.gender] : null, age ? `${age} tuổi` : null, coach.area].filter(Boolean);
  const stats = [
    [statText(coach.stat_hours), "giờ dạy"],
    [statText(coach.stat_students), "học viên"],
    [statText(coach.stat_courses), "khoá đã dạy"],
    [statText(coach.stat_years), "năm kinh nghiệm"],
  ];

  return (
    <div className="pub-root">
      <header className="pub-top">
        <Logo name={coach.display_name} />
        <div className="hide-m flex items-center gap-2.5">
          {zalo && (
            <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn sm ghost">
              <Icon name="chat" /> Nhắn Zalo
            </a>
          )}
          <Link href="/dang-ky" className="btn sm primary">
            Đăng ký học thử
          </Link>
        </div>
      </header>
      {coach.bg_url && <div className="pub-bg" style={{ backgroundImage: `url(${JSON.stringify(coach.bg_url)})` }} aria-hidden />}
      <div
        className={`pub-cover ${coach.cover_url ? "has-img" : ""}`}
        style={coach.cover_url ? { backgroundImage: `linear-gradient(180deg, rgba(15,27,51,.15), rgba(15,27,51,.55)), url(${JSON.stringify(coach.cover_url)})` } : undefined}
      />
      <div className="pub-wrap">
        <aside className="card pcard">
          <Avatar name={coach.display_name} url={coach.avatar_url} size={112} />
          <h1 className="text-[22px] font-extrabold">{coach.display_name}</h1>
          {meta.length > 0 && <div className="mt-0.5 text-muted">{meta.join(" · ")}</div>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {coach.dupr != null && <span className="pill n">DUPR {Number(coach.dupr).toFixed(1)}</span>}
            {coach.accepting_students && <span className="pill good">Đang nhận học viên</span>}
          </div>
          {rating && (
            <Link href="/danh-gia" className="mt-2 flex items-center justify-center gap-1">
              <Icon name="star" size={16} filled className="text-amber-500" />
              <b>{rating.average.toFixed(1)}</b>
              <span className="text-faint">· {rating.count} đánh giá</span>
            </Link>
          )}
          <div className="stats4">
            {stats.map(([v, l]) => (
              <div key={l} className="stat">
                <div className="v">{v}</div>
                <div className="l">{l}</div>
              </div>
            ))}
          </div>
          <div className="btns grid gap-2">
            <Link href="/dang-ky" className="btn primary" style={{ height: 48 }}>
              Đăng ký học thử
            </Link>
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn ghost">
                <Icon name="chat" /> Nhắn Zalo
              </a>
            )}
          </div>
        </aside>
        <main className="min-w-0">
          <PublicTabs />
          {children}
        </main>
      </div>
      <footer className="mx-auto flex max-w-[1200px] flex-col items-center gap-1 px-4 pb-28 text-center text-[13px] text-faint md:flex-row md:justify-between md:px-8 md:pb-8 md:text-left">
        <span>© {new Date().getFullYear()} {coach.display_name} · Pickleball cho người mới và người muốn nâng trình</span>
        <span>
          {ACADEMY.note} <b className="font-semibold text-muted">{ACADEMY.name}</b>
        </span>
      </footer>
      <StickyCta zalo={zalo} />
    </div>
  );
}
