import { PageHead } from "@/components/admin-shell";
import { SETTINGS_MENU, type SettingsSlug } from "@/lib/settings-types";

/** Khung chung các mục Cài đặt: băng tiêu đề + nội dung. Menu con nằm ở menu trái (điện thoại: dải tab đầu trang). */
export function SettingsShell({ on, sub, act, children }: { on: SettingsSlug; sub: string; act?: React.ReactNode; children: React.ReactNode }) {
  const current = SETTINGS_MENU.find((m) => m.slug === on)!;
  const isPackage = on === "mau-khoa";
  return (
    <>
      <PageHead icon={isPackage ? "book" : "gear"} color={isPackage ? "indigo" : "slate"} title={current.label} sub={sub}>
        {act}
      </PageHead>
      <div className="grid min-w-0 gap-4 *:min-w-0">{children}</div>
    </>
  );
}
