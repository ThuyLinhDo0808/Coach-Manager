import Link from "next/link";
import { PageHead } from "@/components/admin-shell";
import { SettingsTabs } from "@/components/settings/tabs";
import { SETTINGS_MENU, type SettingsSlug } from "@/lib/settings-types";

const BASE = "/quan-ly/cai-dat";

/** Khung chung của 9 mục Cài đặt: băng tiêu đề, menu con (trái trên máy tính, cuộn ngang trên điện thoại). */
export function SettingsShell({ on, sub, act, children }: { on: SettingsSlug; sub: string; act?: React.ReactNode; children: React.ReactNode }) {
  const current = SETTINGS_MENU.find((m) => m.slug === on)!;
  return (
    <>
      <PageHead icon="gear" color="slate" title="Cài đặt" sub={`${current.label} · ${sub}`}>
        {act}
      </PageHead>
      <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="card hide-m" style={{ padding: 10 }} aria-label="Các mục cài đặt">
          {SETTINGS_MENU.map((m) => (
            <Link key={m.slug} href={`${BASE}/${m.slug}`} className={`mi ${m.slug === on ? "on" : ""}`} style={{ padding: "10px 12px" }}>
              {m.label}
            </Link>
          ))}
        </nav>
        <SettingsTabs on={on} />
        <div className="grid min-w-0 gap-4 *:min-w-0">{children}</div>
      </div>
    </>
  );
}
