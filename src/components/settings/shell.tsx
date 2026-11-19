import { PageHead } from "@/components/admin-shell";
import { Icon, Tile, type IconName } from "@/components/icon";
import { SETTINGS_MENU, type SettingsSlug } from "@/lib/settings-types";

/**
 * Khung chung các mục Cài đặt: băng tiêu đề (biểu tượng, màu, mô tả riêng từng mục) + nội dung.
 * `sub` là số liệu ngắn của trang (ví dụ "3 sân"), nối sau mô tả. Menu con nằm ở menu trái.
 */
export function SettingsShell({ on, sub, act, children }: { on: SettingsSlug; sub?: string; act?: React.ReactNode; children: React.ReactNode }) {
  const m = SETTINGS_MENU.find((x) => x.slug === on)!;
  return (
    <>
      <PageHead icon={m.icon as IconName} color={m.color} title={m.label} sub={sub ? `${m.desc} · ${sub}` : m.desc}>
        {act}
      </PageHead>
      <div className="grid min-w-0 gap-4 *:min-w-0">{children}</div>
    </>
  );
}

/** Tiêu đề một khối trong thẻ: biểu tượng + tên + một dòng chú thích; bên phải có thể đặt nhãn / nút. */
export function SectionHead({ icon, color, title, caption, right }: { icon: IconName; color: string; title: string; caption?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <Tile icon={icon} color={color} />
      <div className="min-w-0 flex-1">
        <h2 className="text-[17px] leading-tight font-bold">{title}</h2>
        {caption && <p className="mt-0.5 text-[13px] text-faint">{caption}</p>}
      </div>
      {right}
    </div>
  );
}

/** Dòng ghi chú nhỏ cuối khối (có biểu tượng), thay cho đoạn chữ xám dài. */
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-page px-3 py-2.5 text-[13px] text-muted">
      <Icon name="info" size={15} className="mt-0.5 flex-none text-faint" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
