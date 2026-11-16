import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { zaloHref } from "@/components/contact-links";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/public-shell";
import { Thumb, youtubeThumb } from "@/components/thumb";
import { getCoach, getVideos } from "@/lib/data";

export const metadata: Metadata = { title: "Đã nhận đăng ký", robots: { index: false } };
export const revalidate = 60;

export default async function CamOnPage() {
  const coach = await getCoach();
  if (!coach) notFound();
  const zalo = zaloHref(coach.contacts);
  const videos = (await getVideos()).filter((v) => v.youtube_id).slice(0, 3);

  return (
    <>
      <header className="pub-top">
        <Logo name={coach.display_name} />
      </header>
      <main className="mx-auto w-full max-w-[760px] px-4 py-7">
        <div className="card text-center" style={{ padding: 28 }}>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-lime text-navy2">
            <Icon name="check" size={28} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">Đã nhận đăng ký của bạn</h1>
          <p className="mx-auto mt-1.5 max-w-md text-[15px] text-muted">
            Cảm ơn bạn. {coach.display_name} hoặc bạn hỗ trợ sẽ gọi lại trong 24 giờ để tư vấn khoá và xếp buổi học thử.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {zalo && (
              <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn primary" style={{ height: 48 }}>
                <Icon name="chat" /> Nhắn Zalo để được trả lời ngay
              </a>
            )}
            <Link href="/" className="btn ghost" style={{ height: 48 }}>
              Về trang coach
            </Link>
          </div>
        </div>

        <h2 className="h2 mt-6 px-1">
          {videos.length > 0 ? "Trong lúc chờ, xem trước vài bài cho người mới" : "Trong lúc chờ"}
        </h2>
        {videos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {videos.map((v) => (
              <Link key={v.id} href="/video" className="card" style={{ padding: 10 }}>
                <Thumb src={youtubeThumb(v.youtube_id!)} play duration={v.duration_text} />
                <div className="px-1 pt-2.5 pb-1 font-bold">{v.title}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <span className="text-muted">Xem các khoá học và kho video bài giảng của coach.</span>
            <span className="flex gap-2">
              <Link href="/khoa-hoc" className="btn sm ghost">Khoá học</Link>
              <Link href="/video" className="btn sm ghost">Kho video</Link>
            </span>
          </div>
        )}
      </main>
    </>
  );
}
