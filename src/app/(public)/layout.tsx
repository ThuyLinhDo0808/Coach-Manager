import { notFound } from "next/navigation";
import { zaloHref } from "@/components/contact-links";
import { MobileCta } from "@/components/mobile-cta";
import { ProfileCard, ProfileCompact } from "@/components/profile-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TabNav } from "@/components/tab-nav";
import { getCoach } from "@/lib/data";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const coach = await getCoach();
  if (!coach) notFound();

  return (
    <>
      <SiteHeader name={coach.display_name} />
      <div className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-4 md:px-8 md:pt-8">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-8">
          <div className="hidden lg:block">
            <ProfileCard coach={coach} />
          </div>
          <div className="min-w-0">
            <div className="lg:hidden">
              <ProfileCompact coach={coach} />
            </div>
            <TabNav />
            <main className="mt-1">{children}</main>
          </div>
        </div>
      </div>
      <SiteFooter name={coach.display_name} />
      <MobileCta zalo={zaloHref(coach.contacts)} />
    </>
  );
}
