import { IconCheck } from "@/components/icons";
import { getCoach } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const revalidate = 60;

export default async function GioiThieuPage() {
  const coach = (await getCoach())!;
  const stats = [
    { label: "Giờ dạy", value: formatNumber(coach.stat_hours) },
    { label: "Học viên", value: formatNumber(coach.stat_students) },
    { label: "Khoá đã dạy", value: formatNumber(coach.stat_courses) },
    { label: "Đánh giá", value: coach.stat_rating != null ? `${coach.stat_rating.toFixed(1)}/5` : "—" },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="grid grid-cols-4 gap-2 md:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 text-center md:p-5 md:text-left">
            <div className="text-lg font-bold tracking-tight md:text-3xl">{s.value}</div>
            <div className="mt-0.5 text-[11px] text-muted md:text-sm">{s.label}</div>
          </div>
        ))}
      </section>

      {coach.bio && (
        <section className="card space-y-3">
          <h2 className="h-section">Đôi lời giới thiệu</h2>
          {coach.bio.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="leading-relaxed text-ink/85">
              {p}
            </p>
          ))}
        </section>
      )}

      {coach.teaching_style.length > 0 && (
        <section className="card space-y-4">
          <h2 className="h-section">Phong cách giảng dạy</h2>
          <ul className="space-y-3">
            {coach.teaching_style.map((s) => (
              <li key={s} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime text-navy">
                  <IconCheck />
                </span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {coach.strengths.length > 0 && (
        <section className="space-y-3">
          <h2 className="h-section px-1">Điểm mạnh</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {coach.strengths.map((s) => (
              <div key={s.title} className="card p-5">
                <div className="font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {coach.experience.length > 0 && (
        <section className="card space-y-4">
          <h2 className="h-section">Kinh nghiệm</h2>
          <ol className="relative space-y-5 border-l-2 border-line pl-6">
            {coach.experience.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-card bg-navy ring-2 ring-lime" />
                <div className="eyebrow">{e.year}</div>
                <div className="font-semibold">{e.title}</div>
                {e.detail && <p className="text-sm text-muted">{e.detail}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
