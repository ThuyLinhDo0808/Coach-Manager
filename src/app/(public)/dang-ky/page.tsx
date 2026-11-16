import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { LeadForm } from "@/components/lead-form";
import { Logo } from "@/components/public-shell";
import { getCoach, getCourses } from "@/lib/data";
import { submitLead } from "./actions";

export const metadata: Metadata = { title: "Đăng ký học" };

export default async function DangKyPage({ searchParams }: { searchParams: Promise<{ khoa?: string }> }) {
  const { khoa } = await searchParams;
  const [coach, courses] = await Promise.all([getCoach(), getCourses()]);
  if (!coach) notFound();
  const preselected = courses.find((c) => c.slug === khoa) ?? null;

  return (
    <>
      <header className="pub-top">
        <Logo name={coach.display_name} />
        <Link href={preselected ? `/khoa-hoc/${preselected.slug}` : "/"} className="btn sm ghost">
          <Icon name="left" size={16} /> Quay lại
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[760px] px-4 pt-[18px] pb-[110px] md:pt-7">
        <div className="mb-[18px] text-center">
          <h1 className="text-[21px] font-extrabold md:text-[26px]">Đăng ký học với {coach.display_name}</h1>
          <div className="mt-1 text-muted">Mất khoảng 2 phút · Coach sẽ gọi bạn trong 24 giờ</div>
        </div>
        <LeadForm
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
          preselectedCourseId={preselected?.id ?? null}
          submit={submitLead}
        />
      </main>
    </>
  );
}
