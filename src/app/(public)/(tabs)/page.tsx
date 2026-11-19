import { notFound } from "next/navigation";
import { contactLinks } from "@/components/contact-links";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/rich-text";
import { getCoach } from "@/lib/data";

export const revalidate = 60;

export default async function GioiThieuPage() {
  const coach = await getCoach();
  if (!coach) notFound();
  const links = contactLinks(coach.contacts);
  const phoneHidden = coach.contacts.phone && !coach.contacts.show_phone;

  return (
    <div className="grid gap-4">
      {coach.bio && (
        <section className="card">
          <h2 className="h2">Đôi lời giới thiệu</h2>
          <RichText text={coach.bio} />
        </section>
      )}

      {(coach.gallery?.length ?? 0) > 0 && (
        <section className="card">
          <h2 className="h2">Hình ảnh</h2>
          <div className="gallery">
            {coach.gallery!.map((g, i) => (
              <a key={g.url} href={g.url} target="_blank" rel="noopener noreferrer" className={i === 0 && coach.gallery!.length % 2 === 1 ? "wide" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.caption || `Ảnh ${i + 1}`} loading="lazy" />
                {g.caption && <span>{g.caption}</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {coach.teaching_style.length > 0 && (
          <section className="card">
            <h2 className="h2">Phong cách giảng dạy</h2>
            <ul className="grid gap-2.5">
              {coach.teaching_style.map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <Icon name="check" className="text-good" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {coach.strengths.length > 0 && (
          <section className="card">
            <h2 className="h2">Điểm mạnh</h2>
            <div className="grid grid-cols-2 gap-2">
              {coach.strengths.map((s) => (
                <div key={s.title} className="soft">
                  <b>{s.title}</b>
                  <div className="text-[13px] text-faint">{s.text}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {coach.experience.length > 0 && (
        <section className="card">
          <h2 className="h2">Kinh nghiệm</h2>
          <div>
            {coach.experience.map((e, i) => (
              <div key={i} className={`flex items-start gap-3.5 py-2.5 ${i ? "divide-row" : ""}`}>
                <div className="num w-24 flex-none font-semibold text-faint">{e.year}</div>
                <div>
                  <b>{e.title}</b>
                  {e.detail && <div className="text-[13px] text-faint">{e.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(links.length > 0 || phoneHidden) && (
        <section className="card">
          <h2 className="h2">Liên hệ</h2>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" className="chip">
                {l.key === "phone" && <Icon name="phone" size={16} />}
                {l.label}
              </a>
            ))}
            {phoneHidden && (
              <span className="chip" style={{ cursor: "default" }}>
                <Icon name="phone" size={16} /> Hiện số khi đăng ký
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
